import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionStatus, PixTransactionStatus } from '@prisma/client';

@Injectable()
export class FinancialService {
  private readonly logger = new Logger(FinancialService.name);

  constructor(private prisma: PrismaService) {}

  async listTransactions(page = 1, limit = 20, filters: { status?: PixTransactionStatus; type?: 'CASH_IN' | 'CASH_OUT' } = {}) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.pixTransaction.findMany({
        where: {
          ...(filters.status && { status: filters.status }),
          ...(filters.type && { type: filters.type as any }),
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

      // Update WalletTransaction if exists
      const walletTx = await tx.walletTransaction.findFirst({
        where: {
          walletId: pixTx.walletId,
          metadata: { path: ['txId'], equals: txId },
        },
      });

      if (walletTx) {
        await tx.walletTransaction.update({
          where: { id: walletTx.id },
          data: { status: 'COMPLETED' },
        });
      }
    });

    this.logger.log(`Withdrawal ${txId} manually approved by admin`);
    return { success: true, message: 'Saque aprovado com sucesso' };
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

      // Update WalletTransaction
      const walletTx = await tx.walletTransaction.findFirst({
        where: {
          walletId: pixTx.walletId,
          metadata: { path: ['txId'], equals: txId },
        },
      });

      if (walletTx) {
        await tx.walletTransaction.update({
          where: { id: walletTx.id },
          data: {
            status: 'FAILED',
            description: `Rejeitado: ${reason || 'Sem motivo informado'}`,
          },
        });
      }
    });

    this.logger.log(`Withdrawal ${txId} manually rejected by admin. Reason: ${reason}`);
    return { success: true, message: 'Saque rejeitado e saldo estornado' };
  }
}
