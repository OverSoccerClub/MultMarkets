import {
    Injectable, BadRequestException, NotFoundException, Logger,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GatewaysService } from '../gateways/gateways.service';
import { GatewayProviderFactory } from '../gateways/gateway-provider.factory';
import { WalletService } from '../wallet/wallet.service';
import { TransactionType, TransactionStatus, GatewayType, PixTransactionStatus } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class PixService {
    private readonly logger = new Logger(PixService.name);

    constructor(
        private prisma: PrismaService,
        private gatewaysService: GatewaysService,
        private providerFactory: GatewayProviderFactory,
        private walletService: WalletService,
    ) { }

    private async getProviderInfo() {
        const gateway = await this.gatewaysService.getActiveGateway(GatewayType.PIX);
        const provider = this.providerFactory.getProvider(gateway.provider);
        
        // Merge environment into config for the provider to know
        const config = { 
            ...(gateway.config as any), 
            environment: gateway.environment 
        };
        
        return { provider, config };
    }

    // ── Generate unique txId ───────────────────────────────────────────
    private generateTxId(): string {
        return `MM${Date.now()}${randomBytes(5).toString('hex').toUpperCase()}`;
    }

    // ── DEPOSIT (Cash-In) ──────────────────────────────────────────────
    async createDeposit(userId: string, amount: number) {
        // Validate user
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: { role: true, name: true, id: true },
        });

        if (user.role === 'ADMIN') {
            throw new ForbiddenException('Administradores não podem realizar depósitos.');
        }

        if (amount < 10) throw new BadRequestException('Depósito mínimo: R$ 10,00');
        if (amount > 50000) throw new BadRequestException('Depósito máximo: R$ 50.000,00');

        // Get wallet
        const wallet = await this.prisma.wallet.findUniqueOrThrow({
            where: { userId },
        });

        const txId = this.generateTxId();
        const amountCents = Math.round(amount * 100);

        // Call active gateway provider
        const { provider, config } = await this.getProviderInfo();
        const response = await provider.createDeposit({
            amount: amountCents,
            txId,
            expiration: 3600, // 1 hour
        }, config);

        const expiresAt = new Date(Date.now() + 3600 * 1000);

        // Save PixTransaction
        const pixTx = await this.prisma.pixTransaction.create({
            data: {
                walletId: wallet.id,
                type: 'CASH_IN',
                status: 'PENDING',
                amount,
                amountCents,
                txId,
                bankiziTxId: response.transactionId || null,
                qrCodePayload: response.qrCode,
                expiresAt,
                metadata: response.metadata as any,
            },
        });

        this.logger.log(`Deposit QR created: userId=${userId}, txId=${txId}, amount=R$${amount}`);

        return {
            txId: pixTx.txId,
            qrCode: pixTx.qrCodePayload,
            amount,
            amountCents,
            expiresAt: pixTx.expiresAt,
            status: pixTx.status,
        };
    }

    // ── WITHDRAW (Cash-Out) ────────────────────────────────────────────
    async createWithdrawal(userId: string, amount: number) {
        if (amount < 10) throw new BadRequestException('Saque mínimo: R$ 10,00');

        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: { role: true, cpf: true },
        });

        if (user.role === 'ADMIN') {
            throw new ForbiddenException('Administradores não podem realizar saques.');
        }

        if (!user.cpf) {
            throw new BadRequestException('Você precisa cadastrar seu CPF no seu Perfil para realizar saques.');
        }
        
        // Destino obrigatório é o CPF do titular
        const pixKey = user.cpf.replace(/\D/g, ''); // Remove non-digits just in case
        if (pixKey.length !== 11) {
            throw new BadRequestException('CPF cadastrado inválido.');
        }

        const wallet = await this.prisma.wallet.findUniqueOrThrow({
            where: { userId },
        });

        const available = Number(wallet.balance) - Number(wallet.lockedBalance);
        if (available < amount) {
            throw new BadRequestException(`Saldo insuficiente. Disponível: R$ ${available.toFixed(2)}`);
        }

        // Check environment
        const gateway = await this.gatewaysService.getActiveGateway(GatewayType.PIX);
        const isSandbox = gateway.environment === 'SANDBOX';
        const initialStatus = isSandbox ? TransactionStatus.COMPLETED : TransactionStatus.PENDING;
        const initialPixStatus = isSandbox ? PixTransactionStatus.PAID : PixTransactionStatus.PENDING;

        const txId = this.generateTxId();
        const amountCents = Math.round(amount * 100);

        // Debit wallet first (pessimistic — funds leave immediately)
        const result = await this.prisma.$transaction(async (tx) => {
            const currentWallet = await tx.wallet.findUniqueOrThrow({ where: { userId } });
            const availableNow = Number(currentWallet.balance) - Number(currentWallet.lockedBalance);
            if (availableNow < amount) {
                throw new BadRequestException(`Saldo insuficiente. Disponível: R$ ${availableNow.toFixed(2)}`);
            }

            const newBalance = Number(currentWallet.balance) - amount;
            await tx.wallet.update({
                where: { userId },
                data: { balance: newBalance },
            });

            // Create wallet transaction
            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: TransactionType.WITHDRAWAL,
                    status: initialStatus,
                    amount,
                    balanceBefore: Number(currentWallet.balance),
                    balanceAfter: newBalance,
                    description: isSandbox ? `Saque PIX Automático (Sandbox) → ${pixKey}` : `Saque PIX → ${pixKey}`,
                    metadata: { pixKey, txId },
                },
            });

            // Create PIX transaction record
            const pixTx = await tx.pixTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'CASH_OUT',
                    status: initialPixStatus,
                    amount,
                    amountCents,
                    txId,
                    pixKey,
                    paidAt: isSandbox ? new Date() : null,
                },
            });

            return pixTx;
        });

        // If sandbox, return success immediately without calling provider if preferred, 
        // or call provider in sandbox mode. The current provider implementation handle SANDBOX internally.
        if (isSandbox) {
            this.logger.log(`Sandbox Withdrawal Auto-Completed: userId=${userId}, txId=${txId}, amount=R$${amount}`);
            return {
                txId,
                amount,
                pixKey,
                status: 'PAID',
                message: 'Saque realizado com sucesso (Simulação Sandbox).',
            };
        }

        // Call active gateway provider (PRODUCTION)
        try {
            const { provider, config } = await this.getProviderInfo();
            const initiateResponse = await provider.initiateWithdrawal(amountCents, txId, pixKey, config);

            await this.prisma.pixTransaction.update({
                where: { txId },
                data: {
                    bankiziTxId: initiateResponse.transactionId || null,
                    status: 'CONFIRMED',
                    metadata: initiateResponse.metadata as any,
                },
            });

            // Step 2: Confirm withdrawal
            const confirmResponse = await provider.confirmWithdrawal(txId, config);

            await this.prisma.pixTransaction.update({
                where: { txId },
                data: {
                    status: confirmResponse.status === 'PAID' ? 'PAID' : 'CONFIRMED',
                    metadata: confirmResponse.metadata as any,
                },
            });

            this.logger.log(`Withdrawal processed: userId=${userId}, txId=${txId}, amount=R$${amount}`);

            return {
                txId,
                amount,
                pixKey,
                status: 'PROCESSING',
                message: 'Solicitação de saque registrada. Processamento em até 24h.',
            };
        } catch (error) {
            // If Bankizi call fails, refund the user
            this.logger.error(`Withdrawal failed for txId=${txId}: ${error.message}`);

            await this.prisma.$transaction(async (tx) => {
                // Refund balance
                await tx.wallet.update({
                    where: { userId },
                    data: { balance: { increment: amount } },
                });

                // Mark PIX transaction as failed
                await tx.pixTransaction.update({
                    where: { txId },
                    data: { status: 'FAILED' },
                });

                // Update wallet transaction status
                const walletTx = await tx.walletTransaction.findFirst({
                    where: {
                        walletId: wallet.id,
                        type: TransactionType.WITHDRAWAL,
                        metadata: { path: ['txId'], equals: txId },
                    },
                });
                if (walletTx) {
                    await tx.walletTransaction.update({
                        where: { id: walletTx.id },
                        data: { status: TransactionStatus.FAILED },
                    });
                }
            });

            throw new BadRequestException(
                'Falha ao processar o saque. O valor foi estornado para sua carteira. Tente novamente.',
            );
        }
    }

    // ── Check Status ───────────────────────────────────────────────────
    async getTransactionStatus(userId: string, txId: string) {
        const wallet = await this.prisma.wallet.findUniqueOrThrow({
            where: { userId },
        });

        const pixTx = await this.prisma.pixTransaction.findUnique({
            where: { txId },
        });

        if (!pixTx) throw new NotFoundException('Transação não encontrada');
        if (pixTx.walletId !== wallet.id) throw new ForbiddenException('Acesso negado');

        // Optionally sync status with active gateway
        if (pixTx.status === PixTransactionStatus.PENDING || pixTx.status === PixTransactionStatus.CONFIRMED) {
            try {
                const { provider, config } = await this.getProviderInfo();
                this.logger.debug(`Polling PIX status for userId=${userId}, txId=${txId}, bankiziTxId=${pixTx.bankiziTxId}`);
                const statusRes = await provider.getStatus(txId, pixTx.type as 'CASH_IN' | 'CASH_OUT', { 
                    ...config, 
                    bankiziTxId: pixTx.bankiziTxId 
                });

                if (statusRes.status === 'PAID') {
                    // Update if gateway says it's paid
                    await this.handlePaymentConfirmation(txId, pixTx.type as 'CASH_IN' | 'CASH_OUT');
                    return this.prisma.pixTransaction.findUnique({ where: { txId } });
                }
            } catch (e) {
                this.logger.warn(`Could not sync status from gateway for txId=${txId}: ${e.message}`);
            }
        }

        return {
            txId: pixTx.txId,
            type: pixTx.type,
            status: pixTx.status,
            amount: Number(pixTx.amount),
            qrCode: pixTx.qrCodePayload,
            pixKey: pixTx.pixKey,
            expiresAt: pixTx.expiresAt,
            paidAt: pixTx.paidAt,
            createdAt: pixTx.createdAt,
        };
    }

    // ── Webhook Handler ────────────────────────────────────────────────
    async handleWebhook(event: string, data: any) {
        this.logger.log(`Webhook received: event=${event}, txId=${data?.txId}`);

        const txId = data?.txId;
        if (!txId) {
            this.logger.warn('Webhook missing txId');
            return;
        }

        const status = data?.status ? String(data.status).toUpperCase() : '';
        const isPaid = ['PAID', 'APPROVED', 'COMPLETED', 'SUCCESS', 'CONCLUDED'].includes(status);

        if ((event === 'PIX_IN' || event === 'CASH_IN' || event === 'CASHIN' || event === 'DEPOSIT') && isPaid) {
            await this.handlePaymentConfirmation(txId, 'CASH_IN');
        } else if ((event === 'PIX_OUT' || event === 'CASH_OUT' || event === 'CASHOUT' || event === 'WITHDRAW') && isPaid) {
            await this.handlePaymentConfirmation(txId, 'CASH_OUT');
        } else {
            this.logger.log(`Webhook event not actionable: event=${event}, status=${data.status}`);
        }
    }

    private async handlePaymentConfirmation(txId: string, type: 'CASH_IN' | 'CASH_OUT') {
        const pixTx = await this.prisma.pixTransaction.findUnique({ where: { txId } });
        if (!pixTx) {
            this.logger.warn(`PixTransaction not found for txId=${txId}`);
            return;
        }

        if (pixTx.status === 'PAID') {
            this.logger.log(`PixTransaction already PAID: txId=${txId}`);
            return; // Idempotent
        }

        if (type === 'CASH_IN') {
            // Credit the wallet
            await this.prisma.$transaction(async (tx) => {
                const wallet = await tx.wallet.findUniqueOrThrow({ where: { id: pixTx.walletId } });
                const amount = Number(pixTx.amount);
                const newBalance = Number(wallet.balance) + amount;

                await tx.wallet.update({
                    where: { id: pixTx.walletId },
                    data: { balance: newBalance },
                });

                await tx.walletTransaction.create({
                    data: {
                        walletId: pixTx.walletId,
                        type: TransactionType.DEPOSIT,
                        status: TransactionStatus.COMPLETED,
                        amount,
                        balanceBefore: Number(wallet.balance),
                        balanceAfter: newBalance,
                        description: 'Depósito via PIX',
                        referenceId: txId,
                    },
                });

                await tx.pixTransaction.update({
                    where: { txId },
                    data: { status: 'PAID', paidAt: new Date() },
                });
            });

            this.logger.log(`Deposit confirmed: txId=${txId}, amount=R$${pixTx.amount}`);
        } else {
            // Cash-out confirmed — just update the PIX transaction status
            await this.prisma.$transaction(async (tx) => {
                await tx.pixTransaction.update({
                    where: { txId },
                    data: { status: 'PAID', paidAt: new Date() },
                });

                // Update wallet transaction to completed
                const walletTx = await tx.walletTransaction.findFirst({
                    where: {
                        walletId: pixTx.walletId,
                        type: TransactionType.WITHDRAWAL,
                        metadata: { path: ['txId'], equals: txId },
                    },
                });
                if (walletTx) {
                    await tx.walletTransaction.update({
                        where: { id: walletTx.id },
                        data: { status: TransactionStatus.COMPLETED },
                    });
                }
            });

            this.logger.log(`Withdrawal confirmed: txId=${txId}, amount=R$${pixTx.amount}`);
        }
    }

    // ── List PIX Transactions ──────────────────────────────────────────
    async getPixTransactions(userId: string, page = 1, limit = 20) {
        const wallet = await this.prisma.wallet.findUniqueOrThrow({ where: { userId } });
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            this.prisma.pixTransaction.findMany({
                where: { walletId: wallet.id },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.pixTransaction.count({ where: { walletId: wallet.id } }),
        ]);

        return {
            items: items.map((t) => ({
                ...t,
                amount: Number(t.amount),
            })),
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
}
