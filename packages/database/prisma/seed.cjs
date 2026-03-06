const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database (CommonJS)...');

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
    console.log('✅ Admin user created');

    // ── Sample markets ──────────────────────────────────────────────
    const politica = await prisma.category.findUnique({ where: { slug: 'politica' } });
    const economia = await prisma.category.findUnique({ where: { slug: 'economia' } });
    const esportes = await prisma.category.findUnique({ where: { slug: 'esportes' } });
    const crypto = await prisma.category.findUnique({ where: { slug: 'crypto' } });
    const tecnologia = await prisma.category.findUnique({ where: { slug: 'tecnologia' } });
    const entretenimento = await prisma.category.findUnique({ where: { slug: 'entretenimento' } });

    const sampleMarkets = [
        {
            slug: 'lula-aprovacao-50-pct-2025',
            title: 'A aprovação do governo Lula vai superar 50% em algum mês de 2025?',
            description: 'Este mercado resolverá SIM se qualquer pesquisa de aprovação do governo Lula publicada em 2025 registrar índice de aprovação acima de 50%.',
            resolutionCriteria: '... (Datafolha, Ipec, Atlas, etc.) ...',
            categoryId: politica ? politica.id : undefined,
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
            slug: 'bitcoin-110k-2025',
            title: 'O Bitcoin (BTC) vai ultrapassar US$ 110.000 em 2025?',
            description: 'Mercado sobre o preço do Bitcoin atingindo a marca de 110 mil dólares na Binance.',
            resolutionCriteria: '... Binance atingir ou superar 110.000,00 ...',
            categoryId: crypto ? crypto.id : undefined,
            yesPrice: 0.45,
            noPrice: 0.55,
            yesShares: 550,
            noShares: 450,
            totalVolume: 950000,
            uniqueTraders: 4120,
            resolutionDate: new Date('2025-12-31'),
            status: 'ACTIVE',
            createdByBot: false,
        },
        {
            slug: 'spacex-mars-2026',
            title: 'A SpaceX vai pousar uma Starship em Marte em 2026?',
            description: 'Este mercado foca no primeiro pouso (mesmo não tripulado) da Starship em solo marciano.',
            resolutionCriteria: '... soft landing de uma Starship em Marte até 31/12/2026.',
            categoryId: tecnologia ? tecnologia.id : undefined,
            yesPrice: 0.22,
            noPrice: 0.78,
            yesShares: 780,
            noShares: 220,
            totalVolume: 120000,
            uniqueTraders: 1540,
            resolutionDate: new Date('2026-12-31'),
            status: 'ACTIVE',
            createdByBot: false,
        },
        {
            slug: 'gta-vi-release-2025',
            title: 'Grand Theft Auto VI será lançado antes de Outubro de 2025?',
            description: 'Mercado sobre a data de lançamento oficial do aguardado jogo GTA VI.',
            resolutionCriteria: '... GTA VI para qualquer plataforma antes de 01/10/2025.',
            categoryId: entretenimento ? entretenimento.id : undefined,
            yesPrice: 0.35,
            noPrice: 0.65,
            yesShares: 650,
            noShares: 350,
            totalVolume: 450000,
            uniqueTraders: 3200,
            resolutionDate: new Date('2025-10-01'),
            status: 'ACTIVE',
            createdByBot: false,
        }
    ];

    for (const market of sampleMarkets) {
        await prisma.market.upsert({
            where: { slug: market.slug },
            create: Object.assign({}, market, { liquidityPool: 100, createdByUserId: admin.id }),
            update: {},
        });
    }
    console.log('✅ Diversified markets seeded');

    // ── Price History ────────────────────────────────────────────────
    const markets = await prisma.market.findMany({ where: { status: 'ACTIVE' } });
    for (const market of markets) {
        const count = await prisma.marketPricePoint.count({ where: { marketId: market.id } });
        if (count > 0) continue;

        const points = [];
        const baseYes = Number(market.yesPrice);
        let currentYes = baseYes * 0.7 + (Math.random() * 0.1);
        const now = new Date();

        for (let h = 720; h >= 0; h -= 12) {
            const noise = (Math.random() - 0.5) * 0.04;
            currentYes = Math.max(0.05, Math.min(0.95, currentYes + noise));
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
    console.log('✅ Price history seeded');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
