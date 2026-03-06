import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // ── Categories ──────────────────────────────────────────────────
    const categories = [
        { slug: 'politica', name: 'Política', icon: '🏛️', color: '#6366f1', order: 1 },
        { slug: 'economia', name: 'Economia', icon: '💹', color: '#10b981', order: 2 },
        { slug: 'esportes', name: 'Esportes', icon: '⚽', color: '#f59e0b', order: 3 },
        { slug: 'tecnologia', name: 'Tecnologia', icon: '💻', color: '#0099ff', order: 4 },
        { slug: 'entretenimento', name: 'Entretenimento', icon: '🎬', color: '#a855f7', order: 5 },
        { slug: 'ciencia', name: 'Ciência', icon: '🔬', color: '#14b8a6', order: 6 },
        { slug: 'saude', name: 'Saúde', icon: '🏥', color: '#f43f5e', order: 7 },
        { slug: 'internacional', name: 'Internacional', icon: '🌍', color: '#64748b', order: 8 },
        { slug: 'crypto', name: 'Crypto & Web3', icon: '₿', color: '#ffca28', order: 9 },
        { slug: 'outros', name: 'Outros', icon: '📌', color: '#94a3b8', order: 10 },
    ];

    for (const cat of categories) {
        await prisma.category.upsert({
            where: { slug: cat.slug },
            create: cat,
            update: cat,
        });
    }
    console.log('✅ Categories seeded');

    // ── Admin user ──────────────────────────────────────────────────
    const adminPasswordHash = await bcrypt.hash('Admin@123456', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@multmarkets.com' },
        create: {
            email: 'admin@multmarkets.com',
            username: 'admin',
            name: 'Admin MultMarkets',
            passwordHash: adminPasswordHash,
            emailVerified: true,
            role: 'ADMIN',
        },
        update: {},
    });
    // await prisma.wallet.upsert({
    //     where: { userId: admin.id },
    //     create: { userId: admin.id, balance: 10000 },
    //     update: {},
    // });
    console.log('✅ Admin user created: admin@multmarkets.com / Admin@123456');

    // ── Demo user ──────────────────────────────────────────────────
    const demoPasswordHash = await bcrypt.hash('Demo@123456', 12);
    const demo = await prisma.user.upsert({
        where: { email: 'demo@multmarkets.com' },
        create: {
            email: 'demo@multmarkets.com',
            username: 'demoplayer',
            name: 'Demo Player',
            passwordHash: demoPasswordHash,
            emailVerified: true,
            role: 'USER',
        },
        update: {},
    });
    await prisma.wallet.upsert({
        where: { userId: demo.id },
        create: { userId: demo.id, balance: 500 },
        update: {},
    });
    console.log('✅ Demo user: demo@multmarkets.com / Demo@123456 (R$ 500 saldo)');

    // ── Operator user ───────────────────────────────────────────────
    const operatorPasswordHash = await bcrypt.hash('Op@123456', 12);
    const operator = await prisma.user.upsert({
        where: { email: 'operator@multmarkets.com' },
        create: {
            email: 'operator@multmarkets.com',
            username: 'operator',
            name: 'Operator MultMarkets',
            passwordHash: operatorPasswordHash,
            emailVerified: true,
            role: 'OPERATOR',
        },
        update: {},
    });
    await prisma.wallet.upsert({
        where: { userId: operator.id },
        create: { userId: operator.id, balance: 2000 },
        update: {},
    });
    console.log('✅ Operator user created: operator@multmarkets.com / Op@123456');

    // ── Sample markets ──────────────────────────────────────────────
    const politica = await prisma.category.findUnique({ where: { slug: 'politica' } });
    const economia = await prisma.category.findUnique({ where: { slug: 'economia' } });
    const esportes = await prisma.category.findUnique({ where: { slug: 'esportes' } });

    const sampleMarkets = [
        {
            slug: 'lula-aprovacao-50-pct-2025',
            title: 'A aprovação do governo Lula vai superar 50% em algum mês de 2025?',
            description: 'Este mercado resolverá SIM se qualquer pesquisa de aprovação do governo Lula publicada em 2025 registrar índice de aprovação acima de 50%.',
            resolutionCriteria: 'Resolverá SIM se qualquer pesquisa nacional (Datafolha, Ipec, Atlas, etc.) publicada entre 01/01/2025 e 31/12/2025 registrar aprovação > 50%. Caso contrário, NÃO.',
            categoryId: politica?.id,
            yesPrice: 0.38,
            noPrice: 0.62,
            yesShares: 620,
            noShares: 1380,
            totalVolume: 48500,
            uniqueTraders: 234,
            resolutionDate: new Date('2025-12-31'),
            status: 'ACTIVE',
            createdByBot: false,
        },
        {
            slug: 'real-dolar-620-2025',
            title: 'O dólar vai atingir R$ 6,20 antes de junho de 2025?',
            description: 'Mercado sobre a taxa de câmbio BRL/USD atingindo R$ 6,20 antes de 01/06/2025.',
            resolutionCriteria: 'Resolverá SIM se a taxa PTAX do Banco Central registrar BRL/USD ≥ 6,20 em qualquer dia útil antes de 01/06/2025.',
            categoryId: economia?.id,
            yesPrice: 0.62,
            noPrice: 0.38,
            yesShares: 380,
            noShares: 1620,
            totalVolume: 125000,
            uniqueTraders: 891,
            resolutionDate: new Date('2025-06-01'),
            status: 'ACTIVE',
            createdByBot: false,
        },
        {
            slug: 'brasil-copa-2026',
            title: 'O Brasil vai ganhar a Copa do Mundo de 2026?',
            description: 'Este mercado resolverá SIM se a seleção brasileira de futebol masculino vencer a Copa do Mundo FIFA 2026.',
            resolutionCriteria: 'Resolverá SIM se o Brasil for campeão da Copa do Mundo FIFA 2026. NÃO em qualquer outro resultado.',
            categoryId: esportes?.id,
            yesPrice: 0.18,
            noPrice: 0.82,
            yesShares: 820,
            noShares: 1180,
            totalVolume: 320000,
            uniqueTraders: 2341,
            resolutionDate: new Date('2026-07-20'),
            status: 'ACTIVE',
            createdByBot: false,
        },
    ];

    for (const market of sampleMarkets) {
        await prisma.market.upsert({
            where: { slug: market.slug },
            create: { ...market, liquidityPool: 100, createdByUserId: admin.id } as any,
            update: {},
        });
    }
    console.log('✅ Sample markets seeded (3 markets)');

    // ── Price History for Charts ──────────────────────────────────────
    const markets = await prisma.market.findMany({ where: { status: 'ACTIVE' } });
    for (const market of markets) {
        const count = await prisma.marketPricePoint.count({ where: { marketId: market.id } });
        if (count > 0) continue; // don't duplicate

        // Generate 30 days of hourly-ish price history simulating market movement
        const points = [];
        const baseYes = Number(market.yesPrice);
        let currentYes = baseYes * 0.7 + (Math.random() * 0.1); // start lower
        const now = new Date();

        for (let h = 720; h >= 0; h -= 6) { // every 6 hours, 30 days back
            const noise = (Math.random() - 0.5) * 0.04;
            const drift = (baseYes - currentYes) * 0.015; // mean-reversion
            currentYes = Math.max(0.05, Math.min(0.95, currentYes + noise + drift));
            points.push({
                marketId: market.id,
                yesPrice: currentYes,
                noPrice: 1 - currentYes,
                volume: Math.random() * 5000,
                timestamp: new Date(now.getTime() - h * 3600 * 1000),
            });
        }

        await prisma.marketPricePoint.createMany({ data: points });
    }
    console.log('✅ Price history seeded for all active markets');

    // ── Bot sources ──────────────────────────────────────────────────
    const botSources = [
        { name: 'G1 Brasil', type: 'RSS', url: 'https://g1.globo.com/rss/g1/', active: true },
        { name: 'Agência Brasil', type: 'RSS', url: 'https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml', active: true },
        { name: 'Reddit Brasil', type: 'REDDIT', url: 'brasil', active: true },
        { name: 'Reddit WorldNews', type: 'REDDIT', url: 'worldnews', active: true },
    ];

    for (const source of botSources) {
        await prisma.botSource.upsert({
            where: { id: source.url },
            create: { id: source.url, ...source } as any,
            update: {},
        });
    }
    console.log('✅ Bot sources seeded (4 sources)');

    console.log('\n🎉 Seed complete! You can now start the app.\n');
    console.log('  Admin: admin@multmarkets.com / Admin@123456');
    console.log('  Demo:  demo@multmarkets.com  / Demo@123456');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
