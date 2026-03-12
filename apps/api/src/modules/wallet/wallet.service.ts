import {
    Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, TransactionType, TransactionStatus } from '@prisma/client';
import { GatewaysService } from '../gateways/gateways.service';

@Injectable()
export class WalletService {
    private readonly logger = new Logger(WalletService.name);

    constructor(
        private prisma: PrismaService,
        private eventEmitter: EventEmitter2,
    ) { }

    async getWallet(userId: string) {
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: { role: true },
        });

        if (user.role === 'ADMIN') {
            throw new ForbiddenException('Administradores não possuem carteira financeira.');
        }

        const wallet = await this.prisma.wallet.findUnique({
            where: { userId },
        });
        if (!wallet) throw new NotFoundException('Carteira não encontrada');

        return {
            id: wallet.id,
            balance: Number(wallet.balance),
            lockedBalance: Number(wallet.lockedBalance),
            available: Number(wallet.balance) - Number(wallet.lockedBalance),
            currency: wallet.currency,
        };
    }

    // ── DEPOSIT (MVP: virtual — instant credit) ───────────────────────
    async deposit(userId: string, amount: number) {
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: { role: true },
        });

        if (user.role === 'ADMIN') {
            throw new ForbiddenException('Administradores não podem realizar depósitos.');
        }

        if (amount < 10) throw new BadRequestException('Depósito mínimo: R$ 10,00');
        if (amount > 50000) throw new BadRequestException('Depósito máximo: R$ 50.000,00');

        const result = await this.prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId } });
            const newBalance = Number(wallet.balance) + amount;

            const updated = await tx.wallet.update({
                where: { userId },
                data: { balance: newBalance },
            });

            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: TransactionType.DEPOSIT,
                    status: TransactionStatus.COMPLETED,
                    amount,
                    balanceBefore: Number(wallet.balance),
                    balanceAfter: newBalance,
                    description: 'Depósito via PIX',
                },
            });

            return updated;
        });

        this.logger.log(`Deposit: user=${userId} amount=${amount}`);

        // Emit real-time update
        this.eventEmitter.emit('wallet.updated', {
            userId,
            balance: Number(result.balance),
            available: Number(result.balance) - Number(result.lockedBalance),
        });

        return { message: `R$ ${amount.toFixed(2)} creditado com sucesso!`, balance: Number(result.balance) };
    }

    // ── WITHDRAW ──────────────────────────────────────────────────────
    async withdraw(userId: string, amount: number, pixKey: string) {
        if (amount < 10) throw new BadRequestException('Saque mínimo: R$ 10,00');

        // Check active gateway environment
        const gatewaysService = new GatewaysService(this.prisma);
        let status: TransactionStatus = TransactionStatus.PENDING;
        
        try {
            const activeGateway = await gatewaysService.getActiveGateway('PIX' as any);
            if (activeGateway.environment === 'SANDBOX') {
                status = TransactionStatus.COMPLETED;
            }
        } catch (e) {
            this.logger.warn('No active PIX gateway found. Defaulting to PENDING withdrawal.');
        }

        await this.prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId } });
            const available = Number(wallet.balance) - Number(wallet.lockedBalance);

            if (available < amount) {
                throw new BadRequestException(`Saldo insuficiente. Disponível: R$ ${available.toFixed(2)}`);
            }

            const newBalance = Number(wallet.balance) - amount;
            await tx.wallet.update({ where: { userId }, data: { balance: newBalance } });

            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: TransactionType.WITHDRAWAL,
                    status: status, // Auto-complete if SANDBOX
                    amount,
                    balanceBefore: Number(wallet.balance),
                    balanceAfter: newBalance,
                    description: status === TransactionStatus.COMPLETED 
                        ? `Saque PIX Automático (Sandbox) → ${pixKey}`
                        : `Saque PIX → ${pixKey}`,
                    metadata: { pixKey },
                },
            });
        });

        return { 
            message: status === TransactionStatus.COMPLETED 
                ? 'Saque realizado com sucesso (Simulação Sandbox).' 
                : 'Solicitação de saque registrada. Processamento em até 24h.' 
        };
    }

    // ── LOCK / UNLOCK (called by TradingService) ──────────────────────
    async lockFunds(walletId: string, amount: number, tx?: Prisma.TransactionClient) {
        const db = tx || this.prisma;
        const wallet = await db.wallet.findUniqueOrThrow({ where: { id: walletId } });
        const available = Number(wallet.balance) - Number(wallet.lockedBalance);

        if (available < amount) {
            throw new BadRequestException(`Saldo insuficiente. Disponível: R$ ${available.toFixed(2)}`);
        }

        await db.wallet.update({
            where: { id: walletId },
            data: { lockedBalance: { increment: amount } },
        });
    }

    async unlockFunds(walletId: string, amount: number, tx?: Prisma.TransactionClient) {
        const db = tx || this.prisma;
        await db.wallet.update({
            where: { id: walletId },
            data: { lockedBalance: { decrement: amount } },
        });
    }

    async debitFunds(walletId: string, amount: number, description: string, referenceId: string, tx: Prisma.TransactionClient) {
        const wallet = await tx.wallet.findUniqueOrThrow({ where: { id: walletId } });
        const newBalance = Number(wallet.balance) - amount;
        const newLocked = Math.max(0, Number(wallet.lockedBalance) - amount);

        await tx.wallet.update({ where: { id: walletId }, data: { balance: newBalance, lockedBalance: newLocked } });
        await tx.walletTransaction.create({
            data: {
                walletId,
                type: TransactionType.BET_DEBIT,
                status: TransactionStatus.COMPLETED,
                amount,
                balanceBefore: Number(wallet.balance),
                balanceAfter: newBalance,
                description,
                referenceId,
            },
        });

        // Emit real-time update
        this.eventEmitter.emit('wallet.updated', {
            userId: wallet.userId,
            balance: Number(newBalance),
            available: Number(newBalance) - Number(newLocked),
        });
    }

    async creditPayout(walletId: string, amount: number, description: string, referenceId: string, tx: Prisma.TransactionClient) {
        const wallet = await tx.wallet.findUniqueOrThrow({ where: { id: walletId } });
        const newBalance = Number(wallet.balance) + amount;

        await tx.wallet.update({ where: { id: walletId }, data: { balance: newBalance } });
        await tx.walletTransaction.create({
            data: {
                walletId,
                type: TransactionType.PAYOUT,
                status: TransactionStatus.COMPLETED,
                amount,
                balanceBefore: Number(wallet.balance),
                balanceAfter: newBalance,
                description,
                referenceId,
            },
        });

        // Emit real-time update
        this.eventEmitter.emit('wallet.updated', {
            userId: wallet.userId,
            balance: Number(newBalance),
            available: Number(newBalance) - Number(wallet.lockedBalance),
        });
    }

    async getTransactions(userId: string, page = 1, limit = 20) {
        const wallet = await this.prisma.wallet.findUniqueOrThrow({ where: { userId } });
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            this.prisma.walletTransaction.findMany({
                where: { walletId: wallet.id },
                orderBy: { createdAt: 'desc' },
                skip, take: limit,
            }),
            this.prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
        ]);

        return {
            items: items.map((t) => ({ ...t, amount: Number(t.amount) })),
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
}
