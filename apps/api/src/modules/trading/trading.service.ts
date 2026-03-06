import {
    Injectable, BadRequestException, NotFoundException,
    ForbiddenException, Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { TradeSide, TradeType, MarketStatus } from '@prisma/client';
import { PLATFORM } from '@multmarkets/shared';
import { EventEmitter2 } from '@nestjs/event-emitter';

// ── LMSR Automated Market Maker ───────────────────────────────────────
// Logarithmic Market Scoring Rule: cost(q) = b * ln(e^(q1/b) + e^(q2/b))
// Price of YES share = e^(q1/b) / (e^(q1/b) + e^(q2/b))

export class AmmEngine {
    private readonly b: number; // liquidity parameter

    constructor(b = PLATFORM.AMM_ALPHA) {
        this.b = b;
    }

    // Cost function C(yesShares, noShares)
    cost(yesShares: number, noShares: number): number {
        return this.b * Math.log(Math.exp(yesShares / this.b) + Math.exp(noShares / this.b));
    }

    // Price of YES (probability estimate)
    yesPrice(yesShares: number, noShares: number): number {
        const expYes = Math.exp(yesShares / this.b);
        const expNo = Math.exp(noShares / this.b);
        return expYes / (expYes + expNo);
    }

    noPrice(yesShares: number, noShares: number): number {
        return 1 - this.yesPrice(yesShares, noShares);
    }

    // Cost to buy `shares` of the given side
    costToBuy(
        currentYesShares: number,
        currentNoShares: number,
        side: TradeSide,
        shares: number,
    ): number {
        const before = this.cost(currentYesShares, currentNoShares);
        const after =
            side === TradeSide.YES
                ? this.cost(currentYesShares + shares, currentNoShares)
                : this.cost(currentYesShares, currentNoShares + shares);
        return after - before;
    }

    // Shares returned when selling `amount` of the given side
    sharesToSellForAmount(
        currentYesShares: number,
        currentNoShares: number,
        side: TradeSide,
        amount: number,
        tolerance = 0.0001,
    ): number {
        // Binary search: find shares s.t. sell proceeds ≈ amount
        let lo = 0, hi = side === TradeSide.YES ? currentYesShares : currentNoShares;
        for (let i = 0; i < 50; i++) {
            const mid = (lo + hi) / 2;
            const proceeds = this.sellProceeds(currentYesShares, currentNoShares, side, mid);
            if (Math.abs(proceeds - amount) < tolerance) return mid;
            if (proceeds < amount) lo = mid;
            else hi = mid;
        }
        return (lo + hi) / 2;
    }

    sellProceeds(
        currentYesShares: number,
        currentNoShares: number,
        side: TradeSide,
        shares: number,
    ): number {
        const before = this.cost(currentYesShares, currentNoShares);
        const after =
            side === TradeSide.YES
                ? this.cost(currentYesShares - shares, currentNoShares)
                : this.cost(currentYesShares, currentNoShares - shares);
        return before - after;
    }

    priceImpact(
        currentYesShares: number,
        currentNoShares: number,
        side: TradeSide,
        shares: number,
    ): number {
        const priceBefore = side === TradeSide.YES
            ? this.yesPrice(currentYesShares, currentNoShares)
            : this.noPrice(currentYesShares, currentNoShares);

        const newYes = side === TradeSide.YES ? currentYesShares + shares : currentYesShares;
        const newNo = side === TradeSide.NO ? currentNoShares + shares : currentNoShares;

        const priceAfter = side === TradeSide.YES
            ? this.yesPrice(newYes, newNo)
            : this.noPrice(newYes, newNo);

        return Math.abs((priceAfter - priceBefore) / priceBefore);
    }
}

@Injectable()
export class TradingService {
    private readonly logger = new Logger(TradingService.name);
    private readonly amm = new AmmEngine();
    private readonly FEE_RATE = PLATFORM.TRADE_FEE_PERCENT;

    constructor(
        private prisma: PrismaService,
        private walletService: WalletService,
        private eventEmitter: EventEmitter2,
    ) { }

    // ── PREVIEW TRADE ─────────────────────────────────────────────────
    async previewTrade(marketId: string, side: TradeSide, type: TradeType, amount: number) {
        const market = await this.prisma.market.findUnique({ where: { id: marketId } });
        if (!market) throw new NotFoundException('Mercado não encontrado');
        if (market.status !== MarketStatus.ACTIVE) {
            throw new BadRequestException('Mercado não está ativo para negociação');
        }

        const yesShares = Number(market.yesShares);
        const noShares = Number(market.noShares);
        const fee = amount * this.FEE_RATE;
        const netAmount = amount - fee;

        if (type === TradeType.BUY) {
            // Cost → shares
            // Binary search for shares given cost
            const shares = this.sharesForCost(yesShares, noShares, side, netAmount);
            const pricePerShare = netAmount / shares;
            const newYes = side === TradeSide.YES ? yesShares + shares : yesShares;
            const newNo = side === TradeSide.NO ? noShares + shares : noShares;

            return {
                side, type, shares, pricePerShare,
                totalCost: amount, fee,
                newYesPrice: this.amm.yesPrice(newYes, newNo),
                newNoPrice: this.amm.noPrice(newYes, newNo),
                priceImpact: this.amm.priceImpact(yesShares, noShares, side, shares) * 100,
            };
        } else {
            // SELL: amount = shares held
            const proceeds = this.amm.sellProceeds(yesShares, noShares, side, amount);
            const netProceeds = proceeds * (1 - this.FEE_RATE);
            const newYes = side === TradeSide.YES ? yesShares - amount : yesShares;
            const newNo = side === TradeSide.NO ? noShares - amount : noShares;

            return {
                side, type, shares: amount, pricePerShare: proceeds / amount,
                totalCost: -netProceeds, fee: proceeds * this.FEE_RATE,
                newYesPrice: this.amm.yesPrice(newYes, newNo),
                newNoPrice: this.amm.noPrice(newYes, newNo),
                priceImpact: 0,
            };
        }
    }

    // ── EXECUTE TRADE ─────────────────────────────────────────────────
    async executeTrade(userId: string, marketId: string, side: TradeSide, type: TradeType, amount: number) {
        // Fetch user once to check role and wallet
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: { id: true, role: true },
        });

        if (user.role === 'ADMIN') {
            throw new ForbiddenException('Administradores não podem realizar operações financeiras.');
        }

        const preview = await this.previewTrade(marketId, side, type, amount);

        const result = await this.prisma.$transaction(async (tx) => {
            const market = await tx.market.findUniqueOrThrow({ where: { id: marketId } });
            const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId } });

            if (type === TradeType.BUY) {
                // Check balance
                const available = Number(wallet.balance) - Number(wallet.lockedBalance);
                if (available < amount) {
                    throw new BadRequestException(`Saldo insuficiente. Disponível: R$ ${available.toFixed(2)}`);
                }

                // Debit wallet
                await this.walletService.debitFunds(
                    wallet.id, amount,
                    `Compra ${side} em "${market.title}"`,
                    marketId, tx as any,
                );

                // Update AMM state
                const newYesShares = side === TradeSide.YES
                    ? Number(market.yesShares) + preview.shares
                    : Number(market.yesShares);
                const newNoShares = side === TradeSide.NO
                    ? Number(market.noShares) + preview.shares
                    : Number(market.noShares);

                await tx.market.update({
                    where: { id: marketId },
                    data: {
                        yesShares: newYesShares,
                        noShares: newNoShares,
                        yesPrice: this.amm.yesPrice(newYesShares, newNoShares),
                        noPrice: this.amm.noPrice(newYesShares, newNoShares),
                        totalVolume: { increment: amount },
                    },
                });

                // Upsert position
                const existing = await tx.position.findUnique({
                    where: { userId_marketId_side: { userId, marketId, side } },
                });

                if (existing) {
                    const totalShares = Number(existing.shares) + preview.shares;
                    const totalCost = Number(existing.totalCost) + amount;
                    await tx.position.update({
                        where: { id: existing.id },
                        data: {
                            shares: totalShares,
                            totalCost,
                            avgPrice: totalCost / totalShares,
                        },
                    });
                } else {
                    await tx.position.create({
                        data: {
                            userId, marketId, side,
                            shares: preview.shares,
                            totalCost: amount,
                            avgPrice: preview.pricePerShare,
                        },
                    });
                    // Only increment uniqueTraders on first position for this market
                    await tx.market.update({ where: { id: marketId }, data: { uniqueTraders: { increment: 1 } } });
                }

                // Record trade
                const trade = await tx.trade.create({
                    data: {
                        userId, marketId,
                        type: TradeType.BUY, side,
                        shares: preview.shares,
                        price: preview.pricePerShare,
                        totalCost: amount,
                        fee: preview.fee,
                        yesPriceAfter: preview.newYesPrice,
                        noPriceAfter: preview.newNoPrice,
                    },
                });

                // Record price snapshot
                await tx.marketPricePoint.create({
                    data: {
                        marketId,
                        yesPrice: preview.newYesPrice,
                        noPrice: preview.newNoPrice,
                        volume: amount,
                    },
                });

                return trade;
            }
            // SELL logic (symmetric — omitted for brevity, same pattern reversed)
        });

        // Emit WebSocket event
        this.eventEmitter.emit('market.price_update', {
            marketId,
            yesPrice: preview.newYesPrice,
            noPrice: preview.newNoPrice,
            timestamp: new Date().toISOString(),
        });

        this.logger.log(`Trade: user=${userId} market=${marketId} ${type} ${side} $${amount}`);
        return { success: true, trade: result, preview };
    }

    // ── RESOLVE & PAY OUT ─────────────────────────────────────────────
    async resolveMarket(marketId: string, outcome: 'YES' | 'NO' | 'CANCELLED', resolvedByUserId: string) {
        const market = await this.prisma.market.findUniqueOrThrow({ where: { id: marketId } });
        if (market.status === MarketStatus.RESOLVED) throw new BadRequestException('Mercado já resolvido');

        await this.prisma.market.update({
            where: { id: marketId },
            data: {
                status: MarketStatus.RESOLVED,
                outcome: outcome as any,
                resolvedAt: new Date(),
                resolvedByUserId,
            },
        });

        if (outcome === 'CANCELLED') {
            await this.processRefunds(marketId);
        } else {
            await this.processPayouts(marketId, outcome as TradeSide);
        }

        this.logger.log(`Market ${marketId} resolved: ${outcome}`);
        return { message: `Mercado resolvido como ${outcome}` };
    }

    private async processPayouts(marketId: string, winningSide: TradeSide) {
        const positions = await this.prisma.position.findMany({
            where: { marketId, side: winningSide, isSettled: false },
            include: { user: { include: { wallet: true } } },
        });

        for (const position of positions) {
            const payout = Number(position.shares); // 1 share = R$1 on win
            await this.prisma.$transaction(async (tx) => {
                await this.walletService.creditPayout(
                    position.user.wallet!.id,
                    payout,
                    `Ganho no mercado: ${marketId}`,
                    marketId,
                    tx as any,
                );
                await tx.position.update({
                    where: { id: position.id },
                    data: {
                        isSettled: true,
                        settledAt: new Date(),
                        realizedPnl: payout - Number(position.totalCost),
                    },
                });
            });
        }

        // Mark losing side as settled with 0 payout
        await this.prisma.position.updateMany({
            where: { marketId, side: winningSide === TradeSide.YES ? TradeSide.NO : TradeSide.YES, isSettled: false },
            data: { isSettled: true, settledAt: new Date(), realizedPnl: 0 },
        });
    }

    private async processRefunds(marketId: string) {
        const positions = await this.prisma.position.findMany({
            where: { marketId, isSettled: false },
            include: { user: { include: { wallet: true } } },
        });

        for (const position of positions) {
            await this.prisma.$transaction(async (tx) => {
                await this.walletService.creditPayout(
                    position.user.wallet!.id,
                    Number(position.totalCost),
                    `Reembolso — mercado cancelado`,
                    marketId,
                    tx as any,
                );
                await tx.position.update({ where: { id: position.id }, data: { isSettled: true, settledAt: new Date(), realizedPnl: 0 } });
            });
        }
    }

    async getPositions(userId: string) {
        const positions = await this.prisma.position.findMany({
            where: { userId, isSettled: false },
            include: { market: { select: { id: true, slug: true, title: true, yesPrice: true, noPrice: true, status: true, imageUrl: true, category: true } } },
            orderBy: { createdAt: 'desc' },
        });

        return positions.map((p) => {
            const currentPrice = p.side === TradeSide.YES ? Number(p.market.yesPrice) : Number(p.market.noPrice);
            const currentValue = Number(p.shares) * currentPrice;
            const unrealizedPnl = currentValue - Number(p.totalCost);
            return {
                ...p,
                shares: Number(p.shares),
                avgPrice: Number(p.avgPrice),
                totalCost: Number(p.totalCost),
                currentPrice,
                currentValue,
                unrealizedPnl,
                unrealizedPnlPercent: (unrealizedPnl / Number(p.totalCost)) * 100,
                realizedPnl: Number(p.realizedPnl),
            };
        });
    }

    private sharesForCost(yesShares: number, noShares: number, side: TradeSide, cost: number, tolerance = 0.0001): number {
        let lo = 0, hi = cost / 0.01; // max shares at min price
        for (let i = 0; i < 60; i++) {
            const mid = (lo + hi) / 2;
            const c = this.amm.costToBuy(yesShares, noShares, side, mid);
            if (Math.abs(c - cost) < tolerance) return mid;
            if (c < cost) lo = mid;
            else hi = mid;
        }
        return (lo + hi) / 2;
    }
}
