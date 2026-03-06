import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { TopicStatus, BotSourceType } from '@prisma/client';
import axios from 'axios';
import RssParser from 'rss-parser';

interface DiscoveredTopic {
    title: string;
    summary?: string;
    url?: string;
    imageUrl?: string;
    publishedAt?: Date;
    language: string;
}

@Injectable()
export class BotService {
    private readonly logger = new Logger(BotService.name);
    private readonly rssParser = new RssParser();

    constructor(
        private prisma: PrismaService,
        private config: ConfigService,
    ) { }

    // ── CRON: Fetch topics every 30 minutes ──────────────────────────
    @Cron(CronExpression.EVERY_30_MINUTES)
    async fetchTopics() {
        this.logger.log('🤖 Bot: Starting topic discovery cycle...');
        const sources = await this.prisma.botSource.findMany({ where: { active: true } });

        const executionLog: { source: string; type: string; topicsFound: number; ingested: number; status: 'ok' | 'error'; error?: string }[] = [];

        for (const source of sources) {
            try {
                let topics: DiscoveredTopic[] = [];

                if (source.type === BotSourceType.RSS) {
                    this.logger.log(`📡 Fetching RSS: ${source.url}`);
                    topics = await this.fetchRss(source.url);
                } else if (source.type === BotSourceType.NEWS_API) {
                    this.logger.log(`📡 Fetching NewsAPI: ${source.url}`);
                    topics = await this.fetchNewsApi(source.url);
                } else if (source.type === BotSourceType.REDDIT) {
                    this.logger.log(`📡 Fetching Reddit: ${source.url}`);
                    topics = await this.fetchReddit(source.url);
                }

                this.logger.log(`✅ Source ${source.name} returned ${topics.length} potential topics.`);

                // Dedup & score
                let createdCount = 0;
                for (const topic of topics) {
                    const existing = await this.prisma.botTopic.findFirst({
                        where: { url: topic.url ?? undefined, status: { not: TopicStatus.REJECTED } },
                    });
                    if (existing) continue;

                    const viralityScore = this.computeViralityScore(topic);
                    const finalScore = viralityScore;

                    // Only save if it has a minimum score to avoid junk
                    if (finalScore < 10) {
                        this.logger.debug(`Skipping topic with low score (${finalScore}): ${topic.title}`);
                        continue;
                    }

                    await this.prisma.botTopic.create({
                        data: {
                            sourceId: source.id,
                            title: topic.title,
                            summary: topic.summary,
                            url: topic.url,
                            imageUrl: topic.imageUrl,
                            publishedAt: topic.publishedAt,
                            language: topic.language,
                            viralityScore,
                            finalScore,
                            status: TopicStatus.SCORED,
                        },
                    });
                    createdCount++;
                }

                this.logger.log(`📥 Ingested ${createdCount} new topics from ${source.name}.`);
                executionLog.push({ source: source.name, type: source.type, topicsFound: topics.length, ingested: createdCount, status: 'ok' });

                await this.prisma.botSource.update({
                    where: { id: source.id },
                    data: { lastFetchedAt: new Date(), errorCount: 0 },
                });
            } catch (err) {
                this.logger.error(`Failed to fetch source ${source.name}: ${err}`);
                executionLog.push({ source: source.name, type: source.type, topicsFound: 0, ingested: 0, status: 'error', error: String(err) });
                await this.prisma.botSource.update({
                    where: { id: source.id },
                    data: { errorCount: { increment: 1 } },
                });
            }
        }

        // Auto-generate drafts for top scored topics
        const draftsGenerated = await this.generateDraftsForTopTopics();

        const totalIngested = executionLog.reduce((s, l) => s + l.ingested, 0);
        const totalFound = executionLog.reduce((s, l) => s + l.topicsFound, 0);
        this.logger.log(`🏁 Cycle complete: ${totalFound} found, ${totalIngested} ingested, ${draftsGenerated} drafts generated.`);

        return {
            sourcesProcessed: sources.length,
            totalTopicsFound: totalFound,
            totalTopicsIngested: totalIngested,
            draftsGenerated,
            executionLog,
            completedAt: new Date().toISOString(),
        };
    }

    // ── CRON: Generate AI drafts every hour ──────────────────────────
    @Cron(CronExpression.EVERY_HOUR)
    async generateDraftsForTopTopics(): Promise<number> {
        const cutoff = new Date(Date.now() - 48 * 3600000); // topics from last 48h
        const topTopics = await this.prisma.botTopic.findMany({
            where: {
                status: TopicStatus.SCORED,
                finalScore: { gte: 50 },
                createdAt: { gte: cutoff },
                draft: null,
            },
            orderBy: { finalScore: 'desc' },
            take: 5,
        });

        for (const topic of topTopics) {
            await this.generateMarketDraft(topic.id);
        }
        return topTopics.length;
    }

    async generateMarketDraft(topicId: string) {
        const topic = await this.prisma.botTopic.findUniqueOrThrow({ where: { id: topicId } });
        const aiKey = this.config.get<string>('OPENAI_API_KEY');

        if (!aiKey) {
            this.logger.warn('No OpenAI key — generating template market draft');
            return this.generateTemplateDraft(topic);
        }

        try {
            const prompt = `Você é um analista sênior de mercados preditivos e geopolítica. 
Sua tarefa é transformar a notícia abaixo em um mercado de previsão (prediction market) altamente engajador, focado em temas polêmicos, incertezas futuras e grandes apostas.

DIRETRIZES:
1. FOCO NO CONFLITO: Priorize o ângulo de disputa, incerteza e validade futura (ex: "Trump será preso?" em vez de "Trump depõe hoje").
2. TEMAS QUENTES: Política (Lula, Bolsonaro, Trump, Elon Musk), Economia (Bitcoin, Taxa Selic), Conflitos (Ucrânia, Oriente Médio, Invasões) e Cultura Pop (Cancelamentos polêmicos).
3. OBJETIVIDADE: Os critérios de resolução devem ser 100% claros para evitar disputas.

Notícia: "${topic.title}"
Resumo: "${topic.summary || ''}"

Responda SOMENTE em JSON válido com esta estrutura:
{
  "title": "Pergunta provocativa de sim/não (ex: 'Donald Trump vencerá as eleições de 2024?')",
  "description": "Explicação do contexto da aposta, as tensões envolvidas e por que isso importa agora.",
  "resolutionCriteria": "Critério específico de vitória. Ex: 'Resolvido como SIM se o TSE declarar vitória oficial até 31/12/2024.'",
  "suggestedCategory": "politica|economia|esportes|tecnologia|entretenimento|ciencia|saude|internacional|crypto|outros",
  "suggestedEndDate": "ISO date string (baseie-se na natureza do evento, geralmente 15-60 dias)"
}`;

            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'system', content: 'Você é um especialista em mercados de apostas e geopolítica.' }, { role: 'user', content: prompt }],
                    response_format: { type: 'json_object' },
                    max_tokens: 1000,
                },
                { headers: { Authorization: `Bearer ${aiKey}`, 'Content-Type': 'application/json' } },
            );

            const generated = JSON.parse(response.data.choices[0].message.content);

            await this.prisma.$transaction([
                this.prisma.botMarketDraft.create({
                    data: {
                        topicId,
                        generatedTitle: generated.title,
                        generatedDescription: generated.description,
                        resolutionCriteria: generated.resolutionCriteria,
                        suggestedCategory: generated.suggestedCategory,
                        suggestedEndDate: generated.suggestedEndDate ? new Date(generated.suggestedEndDate) : null,
                        aiModel: 'gpt-4o-mini',
                        status: TopicStatus.PENDING_REVIEW,
                    },
                }),
                this.prisma.botTopic.update({ where: { id: topicId }, data: { status: TopicStatus.DRAFT_GENERATED } }),
            ]);

            this.logger.log(`✅ Draft polêmico gerado: ${topic.title.substring(0, 50)}...`);
        } catch (err) {
            this.logger.error(`Failed to generate draft: ${err}`);
            return this.generateTemplateDraft(topic);
        }
    }

    async approveDraft(draftId: string, adminUserId: string, overrides?: any) {
        const draft = await this.prisma.botMarketDraft.findUniqueOrThrow({
            where: { id: draftId },
            include: { topic: true },
        });

        // Find or match category
        const category = await this.prisma.category.findFirst({
            where: { slug: overrides?.categorySlug ?? draft.suggestedCategory ?? 'outros' },
        });

        // Create market from draft
        const slugBase = require('slugify')(draft.generatedTitle, { lower: true, strict: true, locale: 'pt' });
        const slug = `${slugBase}-${Math.random().toString(36).substring(2, 7)}`;

        const market = await this.prisma.$transaction(async (tx) => {
            const m = await tx.market.create({
                data: {
                    slug,
                    title: overrides?.title ?? draft.generatedTitle,
                    description: overrides?.description ?? draft.generatedDescription,
                    resolutionCriteria: overrides?.resolutionCriteria ?? draft.resolutionCriteria,
                    categoryId: category?.id,
                    imageUrl: draft.topic?.imageUrl,
                    sourceUrl: draft.topic?.url,
                    resolutionDate: overrides?.resolutionDate ? new Date(overrides.resolutionDate) : draft.suggestedEndDate,
                    status: 'ACTIVE',
                    createdByBot: true,
                    yesPrice: 0.5,
                    noPrice: 0.5,
                    yesShares: 1000,
                    noShares: 1000,
                    liquidityPool: 100,
                },
            });

            await tx.botMarketDraft.update({
                where: { id: draftId },
                data: {
                    status: TopicStatus.MARKET_CREATED,
                    marketId: m.id,
                    reviewedByUserId: adminUserId,
                    reviewedAt: new Date(),
                },
            });

            if (draft.topicId) {
                await tx.botTopic.update({ where: { id: draft.topicId }, data: { status: TopicStatus.MARKET_CREATED } });
            }

            return m;
        });

        this.logger.log(`✅ Draft ${draftId} approved → Market ${market.id} created`);
        return market;
    }

    async rejectDraft(draftId: string, adminUserId: string, reason?: string) {
        await this.prisma.botMarketDraft.update({
            where: { id: draftId },
            data: {
                status: TopicStatus.REJECTED,
                reviewedByUserId: adminUserId,
                reviewedAt: new Date(),
                reviewNotes: reason,
            },
        });
        return { message: 'Draft rejeitado' };
    }

    async getDrafts(status?: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const where = status
            ? { status: status as TopicStatus }
            : { status: { in: [TopicStatus.PENDING_REVIEW, TopicStatus.DRAFT_GENERATED] } };

        const [items, total] = await Promise.all([
            this.prisma.botMarketDraft.findMany({
                where, skip, take: limit,
                include: { topic: { select: { title: true, url: true, viralityScore: true, finalScore: true } } },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.botMarketDraft.count({ where }),
        ]);

        return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }

    async getSources() {
        return this.prisma.botSource.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async createSource(data: any) {
        return this.prisma.botSource.create({
            data: {
                name: data.name,
                type: data.type,
                url: data.url,
                active: data.active ?? true,
                fetchInterval: data.fetchInterval ?? 30,
            },
        });
    }

    async updateSource(id: string, data: any) {
        return this.prisma.botSource.update({
            where: { id },
            data,
        });
    }

    async deleteSource(id: string) {
        return this.prisma.botSource.delete({
            where: { id },
        });
    }

    async getTopics(status?: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const where = status ? { status: status as TopicStatus } : {};

        const [items, total] = await Promise.all([
            this.prisma.botTopic.findMany({
                where,
                skip,
                take: limit,
                include: { source: { select: { name: true, type: true } } },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.botTopic.count({ where }),
        ]);

        return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }

    // ── RSS FETCHER ───────────────────────────────────────────────────
    private async fetchRss(url: string): Promise<DiscoveredTopic[]> {
        const feed = await this.rssParser.parseURL(url);
        return (feed.items ?? []).slice(0, 20).map((item: any) => ({
            title: item.title?.trim() ?? '',
            summary: item.contentSnippet?.substring(0, 500),
            url: item.link,
            publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
            language: 'pt',
        }));
    }

    // ── NEWS API FETCHER ──────────────────────────────────────────────
    private async fetchNewsApi(url: string): Promise<DiscoveredTopic[]> {
        const apiKey = this.config.get('NEWS_API_KEY');
        const response = await axios.get('https://newsapi.org/v2/top-headlines', {
            params: { country: 'br', language: 'pt', pageSize: 20, apiKey },
        });
        return (response.data.articles ?? []).map((a: any) => ({
            title: a.title,
            summary: a.description,
            url: a.url,
            imageUrl: a.urlToImage,
            publishedAt: new Date(a.publishedAt),
            language: 'pt',
        }));
    }

    // ── REDDIT FETCHER ────────────────────────────────────────────────
    private async fetchReddit(subreddit: string): Promise<DiscoveredTopic[]> {
        const response = await axios.get(`https://www.reddit.com/r/${subreddit}/hot.json?limit=20`, {
            headers: { 'User-Agent': 'MultMarkets/1.0' },
        });
        return (response.data.data.children ?? []).map((c: any) => ({
            title: c.data.title,
            summary: c.data.selftext?.substring(0, 500),
            url: `https://reddit.com${c.data.permalink}`,
            imageUrl: c.data.thumbnail?.startsWith('http') ? c.data.thumbnail : undefined,
            publishedAt: new Date(c.data.created_utc * 1000),
            language: 'pt',
            score: c.data.score,
        }));
    }

    private computeViralityScore(topic: any): number {
        let score = 50;
        if (topic.score) score = Math.min(100, 50 + Math.log10(topic.score + 1) * 10);

        // Keyword Weighted Boost (Focus on controversy and high-stakes)
        const hotKeywords = [
            { terms: ['trump', 'biden', 'lula', 'bolsonaro', 'eleição', 'presidente', 'stf', 'alexandre de moraes'], weight: 40 },
            { terms: ['guerra', 'invasão', 'míssil', 'conflito', 'israel', 'palestina', 'ucrânia', 'rússia', 'irã'], weight: 35 },
            { terms: ['bitcoin', 'crypto', 'cripto', 'etf', 'halving', 'elon musk', 'x.com', 'tesla'], weight: 25 },
            { terms: ['polêmica', 'prisão', 'crime', 'corrupção', 'escândalo', 'investigação'], weight: 20 },
            { terms: ['copom', 'selic', 'inflação', 'dólar', 'crise', 'recessão'], weight: 15 },
        ];

        const fullText = (topic.title + ' ' + (topic.summary || '')).toLowerCase();
        let boost = 0;

        for (const category of hotKeywords) {
            if (category.terms.some(term => fullText.includes(term))) {
                boost += category.weight;
            }
        }

        score += boost;

        if (topic.publishedAt) {
            const hoursOld = (Date.now() - topic.publishedAt.getTime()) / 3600000;
            score = score * Math.max(0.3, 1 - hoursOld / 48);
        }

        return Math.min(100, Math.round(score));
    }

    private async generateTemplateDraft(topic: any) {
        await this.prisma.$transaction([
            this.prisma.botMarketDraft.create({
                data: {
                    topicId: topic.id,
                    generatedTitle: `${topic.title.substring(0, 120)} — isso vai acontecer?`,
                    generatedDescription: `Baseado na notícia: "${topic.title}". ${topic.summary ?? ''}`,
                    resolutionCriteria: 'A ser definido pelo administrador na revisão.',
                    suggestedEndDate: new Date(Date.now() + 30 * 86400000),
                    aiModel: 'template',
                    status: TopicStatus.PENDING_REVIEW,
                },
            }),
            this.prisma.botTopic.update({ where: { id: topic.id }, data: { status: TopicStatus.DRAFT_GENERATED } }),
        ]);
    }

    async seedDefaultSources() {
        const sources = [
            { name: 'G1 Política', type: BotSourceType.RSS, url: 'https://g1.globo.com/rss/g1/politica/' },
            { name: 'UOL Notícias (Guerra)', type: BotSourceType.RSS, url: 'https://noticias.uol.com.br/internacional/rss.xml' },
            { name: 'Agência Brasil', type: BotSourceType.RSS, url: 'https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml' },
            { name: 'Reddit WorldNews', type: BotSourceType.REDDIT, url: 'worldnews' },
            { name: 'Reddit Politics', type: BotSourceType.REDDIT, url: 'politics' },
            { name: 'Reddit Brasil', type: BotSourceType.REDDIT, url: 'brasil' },
            { name: 'CoinTelegraph Brasil', type: BotSourceType.RSS, url: 'https://br.cointelegraph.com/rss' },
        ];

        for (const source of sources) {
            await this.prisma.botSource.upsert({
                where: { id: source.url },
                create: { ...source, id: source.url },
                update: {},
            });
        }
        this.logger.log('✅ Default bot sources seeded');
    }
}
