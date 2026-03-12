import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const prisma = new PrismaClient();

async function backfill() {
  console.log('🚀 Iniciando Backfill de Histórico de Preços...');

  const markets = await prisma.market.findMany({
    where: { status: 'ACTIVE' },
    include: {
        _count: {
            select: { priceHistory: true }
        }
    }
  });

  console.log(`📊 Encontrados ${markets.length} mercados ativos.`);

  for (const market of markets) {
    console.log(`📝 Gerando histórico para: ${market.title}`);
    
    // Limpar histórico antigo para garantir visibilidade no "24h"
    await prisma.marketPricePoint.deleteMany({ where: { marketId: market.id } });
    
    const points = [];
    const baseYes = Number(market.yesPrice);
    const now = new Date();
    
    // Gerar 72 horas de dados (um ponto a cada 4 horas = 18 pontos)
    let currentYes = baseYes;
    
    for (let h = 72; h >= 0; h -= 4) {
      const noise = (Math.random() - 0.5) * 0.05;
      currentYes = Math.max(0.1, Math.min(0.9, currentYes + noise));
      
      points.push({
        marketId: market.id,
        yesPrice: currentYes,
        noPrice: 1 - currentYes,
        volume: Math.random() * 1000,
        timestamp: new Date(now.getTime() - h * 3600 * 1000),
      });
    }

    // Adicionar ponto atual
    points.push({
        marketId: market.id,
        yesPrice: baseYes,
        noPrice: 1 - Number(market.yesPrice),
        volume: 0,
        timestamp: now,
    });

    await prisma.marketPricePoint.createMany({
      data: points,
    });
    
    console.log(`✅ ${points.length} pontos gerados para "${market.title}"`);
  }

  console.log('✨ Backfill finalizado com sucesso!');
}

backfill()
  .catch((e) => {
    console.error('❌ Erro no backfill:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
