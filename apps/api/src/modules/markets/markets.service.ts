import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MarketStatus } from '@prisma/client';
import slugify from 'slugify';

@Injectable()
export class MarketsService {
    private readonly logger = new Logger(MarketsService.name);

    constructor(private prisma: PrismaService) { }

    async findAll(query: {
        page?: number; limit?: number; categorySlug?: string;
        status?: MarketStatus | string; sortBy?: string; search?: string;
    }) {
        const { page = 1, limit = 20, categorySlug, sortBy = 'totalVolume', search } = query;

        // If status is 'ALL', we don't filter by status
        // Otherwise, if no status is provided, default to ACTIVE
        const status = query.status === 'ALL' ? undefined : (query.status || MarketStatus.ACTIVE) as MarketStatus;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) where.status = status;
        if (categorySlug) where.category = { slug: categorySlug };
        if (search) where.title = { contains: search, mode: 'insensitive' };

        const [items, total] = await Promise.all([
            this.prisma.market.findMany({
                where, skip, take: limit,
                orderBy: { [sortBy === 'ending_soon' ? 'resolutionDate' : sortBy === 'newest' ? 'createdAt' : 'totalVolume']: sortBy === 'ending_soon' ? 'asc' : 'desc' },
                include: { category: { select: { id: true, name: true, slug: true, icon: true, color: true } } },
            }),
            this.prisma.market.count({ where }),
        ]);

        return {
            items: items.map(m => this.formatMarket(m)),
            meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: skip + limit < total, hasPrev: page > 1 },
        };
    }

    async findOne(slug: string) {
        const market = await this.prisma.market.findUnique({
            where: { slug },
            include: { category: { select: { id: true, name: true, slug: true, icon: true, color: true } } },
        });
        if (!market) throw new NotFoundException('Mercado não encontrado');
        return this.formatMarket(market, true);
    }

    async getPriceHistory(marketId: string, period: '1h' | '24h' | '7d' | '30d' | 'all' = '24h') {
        const since: Date = {
            '1h': new Date(Date.now() - 3600000),
            '24h': new Date(Date.now() - 86400000),
            '7d': new Date(Date.now() - 604800000),
            '30d': new Date(Date.now() - 2592000000),
            'all': new Date(0),
        }[period];

        const points = await this.prisma.marketPricePoint.findMany({
            where: { marketId, timestamp: { gte: since } },
            orderBy: { timestamp: 'asc' },
        });

        return points.map((p) => ({
            timestamp: p.timestamp.toISOString(),
            yesPrice: Number(p.yesPrice),
            noPrice: Number(p.noPrice),
            volume: Number(p.volume),
        }));
    }

    async getTrending(limit = 10) {
        const markets = await this.prisma.market.findMany({
            where: { status: MarketStatus.ACTIVE },
            orderBy: [
                { totalVolume: 'desc' },
                { uniqueTraders: 'desc' },
            ],
            take: limit,
            include: { category: { select: { id: true, name: true, slug: true, icon: true, color: true } } },
        });
        return markets.map(m => this.formatMarket(m));
    }

    async update(id: string, data: any) {
        const market = await this.prisma.market.update({
            where: { id },
            data,
            include: { category: { select: { id: true, name: true, slug: true, icon: true, color: true } } },
        });
        return this.formatMarket(market, true);
    }

    async create(data: any) {
        const slug = this.generateSlug(data.title);
        const market = await this.prisma.market.create({
            data: {
                ...data,
                slug,
                status: MarketStatus.ACTIVE,
                yesPrice: 0.5,
                noPrice: 0.5,
                yesShares: 1000,
                noShares: 1000,
            },
            include: { category: { select: { id: true, name: true, slug: true, icon: true, color: true } } },
        });
        return this.formatMarket(market, true);
    }

    private formatMarket(market: any, detailed = false) {
        const base = {
            id: market.id,
            slug: market.slug,
            title: market.title,
            imageUrl: market.imageUrl,
            status: market.status,
            yesPrice: Number(market.yesPrice),
            noPrice: Number(market.noPrice),
            totalVolume: Number(market.totalVolume),
            uniqueTraders: market.uniqueTraders,
            resolutionDate: market.resolutionDate?.toISOString() ?? null,
            category: market.category,
            createdAt: market.createdAt.toISOString(),
        };

        if (!detailed) return base;

        return {
            ...base,
            description: market.description,
            resolutionCriteria: market.resolutionCriteria,
            sourceUrl: market.sourceUrl,
            yesShares: Number(market.yesShares),
            noShares: Number(market.noShares),
            liquidityPool: Number(market.liquidityPool),
            outcome: market.outcome,
            resolvedAt: market.resolvedAt?.toISOString() ?? null,
        };
    }

    private generateSlug(title: string): string {
        const base = slugify(title, { lower: true, strict: true, locale: 'pt' });
        const suffix = Math.random().toString(36).substring(2, 7);
        return `${base}-${suffix}`;
    }
}
