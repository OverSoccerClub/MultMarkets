import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionStatus, TransactionType, PixTransactionStatus } from '@prisma/client';

import { TimeUtils } from 'src/common/utils/time.utils';

@Injectable()
export class FinancialService {
  private readonly logger = new Logger(FinancialService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Robustly synchronizes PixTransaction status to its corresponding WalletTransaction.
   * Uses dual lookup: referenceId OR metadata.path(['txId']).
   */
  private async syncWalletStatus(tx: any, txId: string, walletId: string, status: TransactionStatus) {
    // Try primary lookup by referenceId
    let walletTx = await tx.walletTransaction.findFirst({
      where: { referenceId: txId, walletId }
    });

    // Fallback: lookup by metadata.txId
    if (!walletTx) {
      walletTx = await tx.walletTransaction.findFirst({
        where: { 
          walletId,
          metadata: { path: ['txId'], equals: txId }
        }
      });
    }

    if (walletTx) {
      await tx.walletTransaction.update({
        where: { id: walletTx.id },
        data: { status }
      });
      this.logger.log(`Synced WalletTransaction: id=${walletTx.id}, txId=${txId}, status=${status}`);
    } else {
      this.logger.warn(`Could not find WalletTransaction for sync: txId=${txId}`);
    }
  }

  async listTransactions(
    page = 1, 
    limit = 20, 
    filters: { 
      status?: PixTransactionStatus; 
      type?: 'CASH_IN' | 'CASH_OUT';
      startDate?: string;
      endDate?: string;
      txId?: string;
    } = {}
  ) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.pixTransaction.findMany({
        where: {
          ...(filters.status && { status: filters.status }),
          ...(filters.type && { type: filters.type as any }),
          ...(filters.txId && {
            OR: [
              { txId: { contains: filters.txId } },
              { bankiziTxId: { contains: filters.txId } },
            ]
          }),
          ...((filters.startDate || filters.endDate) && {
            createdAt: {
              ...(filters.startDate && { gte: TimeUtils.getStartOfDayBR(filters.startDate) }),
              ...(filters.endDate && { lte: TimeUtils.getEndOfDayBR(filters.endDate) }),
            },
          }),
        },
        include: {
          wallet: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  username: true,
                  cpf: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.pixTransaction.count({
        where: {
          ...(filters.status && { status: filters.status }),
          ...(filters.type && { type: filters.type as any }),
          ...(filters.txId && {
            OR: [
              { txId: { contains: filters.txId } },
              { bankiziTxId: { contains: filters.txId } },
            ]
          }),
          ...((filters.startDate || filters.endDate) && {
            createdAt: {
              ...(filters.startDate && { gte: new Date(filters.startDate) }),
              ...(filters.endDate && { lte: new Date(filters.endDate) }),
            },
          }),
        },
      }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        amount: Number(item.amount),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async approveWithdrawal(txId: string) {
    const pixTx = await this.prisma.pixTransaction.findUnique({
      where: { txId },
      include: { wallet: true },
    });

    if (!pixTx) throw new BadRequestException('Transação não encontrada');
    if (pixTx.type !== 'CASH_OUT') throw new BadRequestException('Apenas saques podem ser aprovados manualmente');
    if (pixTx.status !== 'PENDING' && pixTx.status !== 'CONFIRMED') {
      throw new BadRequestException('Transação já processada ou em estado inválido');
    }

    await this.prisma.$transaction(async (tx) => {
      // Update PIX transaction
      await tx.pixTransaction.update({
        where: { txId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      // Sync WalletTransaction status using helper
      await this.syncWalletStatus(tx, txId, pixTx.walletId, TransactionStatus.COMPLETED);
    });

    this.logger.log(`Withdrawal ${txId} manually approved by admin`);
    return { success: true, message: 'Saque aprovado com sucesso' };
  }

  async approveDeposit(txId: string) {
    const pixTx = await this.prisma.pixTransaction.findUnique({
      where: { txId },
      include: { wallet: true },
    });

    if (!pixTx) throw new BadRequestException('Transação não encontrada');
    if (pixTx.type !== 'CASH_IN') throw new BadRequestException('Apenas depósitos podem ser confirmados por esta ação');
    if (pixTx.status === 'PAID') {
      return { success: true, message: 'Depósito já foi confirmado anteriormente' };
    }
    if (pixTx.status !== 'PENDING' && pixTx.status !== 'CONFIRMED') {
      throw new BadRequestException('Transação em estado inválido para confirmação');
    }

    const amount = Number(pixTx.amount);

    await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUniqueOrThrow({ where: { id: pixTx.walletId } });
      const newBalance = Number(wallet.balance) + amount;

      // Credit the wallet
      await tx.wallet.update({
        where: { id: pixTx.walletId },
        data: { balance: newBalance },
      });

      // Update or Create WalletTransaction record
      await this.syncWalletStatus(tx, txId, pixTx.walletId, TransactionStatus.COMPLETED);
      
      // Update balance fields for COMPLETED status
      const completedTx = await tx.walletTransaction.findFirst({
        where: { referenceId: txId, walletId: pixTx.walletId }
      });
      if (completedTx) {
        await tx.walletTransaction.update({
            where: { id: completedTx.id },
            data: {
                balanceBefore: Number(wallet.balance),
                balanceAfter: newBalance,
                description: 'Depósito via PIX (Confirmado Admin)',
            }
        });
      } else {
        // Fallback create if not found even with helper lookup
        await tx.walletTransaction.create({
            data: {
                walletId: pixTx.walletId,
                type: TransactionType.DEPOSIT,
                status: TransactionStatus.COMPLETED,
                amount,
                balanceBefore: Number(wallet.balance),
                balanceAfter: newBalance,
                description: 'Depósito via PIX (Manual)',
                referenceId: txId,
                metadata: { txId },
            },
        });
      }

      // Update PIX transaction status
      await tx.pixTransaction.update({
        where: { txId },
        data: { status: 'PAID', paidAt: new Date() },
      });
    });

    this.logger.log(`Deposit ${txId} manually approved by admin, amount=${amount}`);
    return { success: true, message: 'Depósito confirmado e saldo creditado com sucesso' };
  }

  async rejectWithdrawal(txId: string, reason?: string) {
    const pixTx = await this.prisma.pixTransaction.findUnique({
      where: { txId },
      include: { wallet: true },
    });

    if (!pixTx) throw new BadRequestException('Transação não encontrada');
    if (pixTx.type !== 'CASH_OUT') throw new BadRequestException('Apenas saques podem ser rejeitados');
    if (pixTx.status !== 'PENDING' && pixTx.status !== 'CONFIRMED') {
      throw new BadRequestException('Transação já processada');
    }

    await this.prisma.$transaction(async (tx) => {
      // Update PIX transaction
      await tx.pixTransaction.update({
        where: { txId },
        data: {
          status: 'FAILED',
          metadata: { ...(pixTx.metadata as any || {}), rejectionReason: reason },
        },
      });

      // Refund the user balance
      await tx.wallet.update({
        where: { id: pixTx.walletId },
        data: { balance: { increment: pixTx.amount } },
      });

      // Update WalletTransaction status using helper
      await this.syncWalletStatus(tx, txId, pixTx.walletId, TransactionStatus.FAILED);
      
      // Update description with reason
      const failedTx = await tx.walletTransaction.findFirst({
        where: { referenceId: txId, walletId: pixTx.walletId }
      });
      if (failedTx) {
        await tx.walletTransaction.update({
          where: { id: failedTx.id },
          data: {
            description: `Rejeitado: ${reason || 'Sem motivo informado'}`,
          },
        });
      }
    });

    this.logger.log(`Withdrawal ${txId} manually rejected by admin. Reason: ${reason}`);
    return { success: true, message: 'Saque rejeitado e saldo estornado' };
  }
}
