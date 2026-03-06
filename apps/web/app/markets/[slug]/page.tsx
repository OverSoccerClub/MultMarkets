'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketsApi, tradingApi } from '@/lib/api';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Clock } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useToast } from '@/components/ui/Toast';

const PERIOD_OPTIONS = ['24h', '7d', '30d', 'all'] as const;

export default function MarketDetailPage() {
    const { slug } = useParams();
    const { isAuthenticated } = useAuthStore();
    const queryClient = useQueryClient();
    const { success, error: toastError } = useToast();
    const [period, setPeriod] = useState<'24h' | '7d' | '30d' | 'all'>('24h');
    const [side, setSide] = useState<'YES' | 'NO'>('YES');
    const [amount, setAmount] = useState('');

    const { data: market, isLoading } = useQuery({
        queryKey: ['market', slug],
        queryFn: () => marketsApi.detail(slug as string),
    });

    const { data: history = [] } = useQuery({
        queryKey: ['market-history', market?.id, period],
        queryFn: () => marketsApi.history(market?.id, period),
        enabled: !!market?.id,
    });

    const { data: preview } = useQuery({
        queryKey: ['trade-preview', market?.id, side, amount],
        queryFn: () => tradingApi.preview({ marketId: market?.id, side, type: 'BUY', amount: parseFloat(amount) }),
        enabled: !!market?.id && !!amount && parseFloat(amount) >= 1,
        staleTime: 2000,
    });

    const tradeMutation = useMutation({
        mutationFn: () => tradingApi.execute({ marketId: market?.id, side, type: 'BUY', amount: parseFloat(amount) }),
        onSuccess: (data) => {
            setAmount('');
            queryClient.invalidateQueries({ queryKey: ['market', slug] });
            queryClient.invalidateQueries({ queryKey: ['market-history'] });
            queryClient.invalidateQueries({ queryKey: ['wallet'] });
            success(
                'Posição Executada!',
                `Você comprou ${data?.preview?.shares?.toFixed(2) ?? ''} cotas de ${side === 'YES' ? 'SIM' : 'NÃO'} com sucesso.`
            );
        },
        onError: (err: any) => {
            toastError(
                'Falha na Ordem',
                err?.response?.data?.message ?? 'Não foi possível executar a posição. Verifique seu saldo.'
            );
        },
    });

    if (isLoading) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
                <div className="skeleton h-8 w-96 rounded" />
                <div className="skeleton h-64 w-full rounded-xl" />
            </div>
        );
    }

    if (!market) return <div className="text-center py-20 text-text-muted">Mercado não encontrado</div>;

    const yesPercent = Math.round(market.yesPrice * 100);
    const noPercent = Math.round(market.noPrice * 100);

    const chartData = history.map((p: any) => ({
        time: new Date(p.timestamp).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        sim: Math.round(p.yesPrice * 100),
        nao: Math.round(p.noPrice * 100),
    }));

    return (
        <div className="max-w-[1400px] mx-auto px-6 pt-36 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

                {/* ── Left (Analytical Panel) ─────────────────────────────────── */}
                <div className="lg:col-span-8 space-y-10">

                    <div className="space-y-6">
                        {/* Title & Info */}
                        <div className="space-y-4">
                            {market.category && (
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-accent-500">
                                    {market.category.icon} {market.category.name}
                                </span>
                            )}
                            <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tighter leading-[1] text-glow-accent">
                                {market.title}
                            </h1>
                        </div>

                        {/* High Density Stats */}
                        <div className="flex flex-wrap items-center gap-8 py-6 border-y border-white/[0.05]">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Volume Total</span>
                                <span className="text-xl font-bold text-white tabular-nums">R$ {market.totalVolume.toLocaleString('pt-BR')}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Participantes</span>
                                <span className="text-xl font-bold text-white tabular-nums">{market.uniqueTraders?.toLocaleString()}</span>
                            </div>
                            {market.resolutionDate && (
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Data Limite</span>
                                    <span className="text-xl font-bold text-white tabular-nums">{new Date(market.resolutionDate).toLocaleDateString('pt-BR')}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chart Section - Premium Tooling */}
                    <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-[32px] p-8 space-y-8 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                    <span className="text-3xl font-black text-yes-400 tabular-nums leading-none">{yesPercent}%</span>
                                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-1">Chance de SIM</span>
                                </div>
                                <div className="w-[1px] h-8 bg-white/10 mx-2" />
                                <div className="flex flex-col">
                                    <span className="text-3xl font-black text-no-400 tabular-nums leading-none">{noPercent}%</span>
                                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-1">Chance de NÃO</span>
                                </div>
                            </div>

                            <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/5 rounded-xl">
                                {PERIOD_OPTIONS.map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriod(p)}
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-white/10 text-white shadow-inner-surface' : 'text-text-muted hover:text-white'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chart Header with Live Stats */}
                        <div className="flex items-center justify-between mb-8 px-2">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent-500/10 border border-accent-500/20">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-500 opacity-40"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-500"></span>
                                    </span>
                                    <span className="text-[10px] font-black text-accent-500 uppercase tracking-widest">Tempo Real</span>
                                </div>
                                <div className="text-white font-black text-xl tabular-nums">
                                    {yesPercent}% <span className="text-[10px] text-text-muted font-bold ml-1">VOLATILIDADE 0.8%</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {['1H', '1D', '1W', 'ALL'].map(t => (
                                    <button key={t} className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest transition-all ${t === '1D' ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white'}`}>{t}</button>
                                ))}
                            </div>
                        </div>

                        <div className="h-[350px] w-full mt-4">
                            {chartData && chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 20, right: 0, bottom: 0, left: -20 }}>
                                        <defs>
                                            <linearGradient id="colorSim" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis
                                            dataKey="time"
                                            hide
                                        />
                                        <YAxis
                                            domain={[0, 100]}
                                            hide
                                        />
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-[#050505] border border-white/10 p-3 rounded-lg shadow-2xl backdrop-blur-xl">
                                                            <div className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">PROBABILIDADE</div>
                                                            <div className="text-xl font-black text-white tabular-nums">
                                                                {payload[0].value}% <span className="text-[10px] text-accent-500 ml-1">SIM</span>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Line
                                            type="stepAfter"
                                            dataKey="sim"
                                            stroke="#10b981"
                                            strokeWidth={3}
                                            dot={false}
                                            activeDot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                                            name="SIM %"
                                            animationDuration={1000}
                                            animationEasing="ease-in-out"
                                            isAnimationActive={true}
                                        />
                                        <Line
                                            type="stepAfter"
                                            dataKey="sim"
                                            stroke="#10b981"
                                            strokeWidth={0}
                                            dot={({ cx, cy, index }) => {
                                                if (index === chartData.length - 1) {
                                                    return (
                                                        <g>
                                                            <circle cx={cx} cy={cy} r={6} fill="#10b981" fillOpacity={0.2}>
                                                                <animate attributeName="r" from="6" to="12" dur="1.5s" begin="0s" repeatCount="indefinite" />
                                                                <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" begin="0s" repeatCount="indefinite" />
                                                            </circle>
                                                            <circle cx={cx} cy={cy} r={3} fill="#10b981" />
                                                        </g>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Line
                                            type="stepAfter"
                                            dataKey="nao"
                                            stroke="#1a1a1a"
                                            strokeWidth={1}
                                            dot={false}
                                            opacity={0.5}
                                            animationDuration={1000}
                                            animationEasing="ease-in-out"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-text-muted text-xs font-black uppercase tracking-[0.2em]">
                                    Aguardando Fluxo de Operações...
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-12 border-t border-white/[0.05]">
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Contexto Estratégico</h3>
                            <p className="text-base text-white/50 leading-relaxed font-medium">{market.description}</p>
                        </div>
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Resolução Final</h3>
                            <p className="text-base text-white/50 leading-relaxed font-medium whitespace-pre-line">{market.resolutionCriteria}</p>
                        </div>
                    </div>

                    {/* 📦 COMIMENT SECTION (Market Analysis) */}
                    <div className="pt-12 border-t border-white/[0.05] space-y-10">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Análise da Comunidade (34)</h3>
                            <button className="text-[10px] font-black text-accent-500 uppercase tracking-widest hover:text-accent-400 transition-colors">Ordernar por Relevance</button>
                        </div>

                        <div className="bg-white/[0.02] border border-white/[0.05] rounded-[32px] p-8 space-y-8">
                            {/* Input Area */}
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500/20 to-accent-800/20 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-bold text-accent-500">U</span>
                                </div>
                                <div className="flex-1 space-y-3">
                                    <textarea
                                        placeholder="Adicione sua análise estratégica..."
                                        className="w-full bg-transparent border-b border-white/10 outline-none text-white text-sm py-2 focus:border-accent-500/50 transition-all resize-none min-h-[40px]"
                                    />
                                    <div className="flex justify-end">
                                        <button className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all">Publicar Análise</button>
                                    </div>
                                </div>
                            </div>

                            {/* Sample Comments */}
                            <div className="space-y-8">
                                {[1, 2].map(i => (
                                    <div key={i} className="flex gap-4 group/comment">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                            <span className="text-xs font-bold text-white/40">A</span>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black text-white">AlphaTrader_{i}</span>
                                                <span className="text-[9px] font-bold text-text-muted uppercase">Há 2 horas</span>
                                                <div className="px-2 py-0.5 rounded bg-yes-500/10 border border-yes-500/20 text-[8px] font-black text-yes-400 uppercase">Aposta em SIM</div>
                                            </div>
                                            <p className="text-sm text-white/60 leading-relaxed font-medium">Considerando os dados macroeconômicos recentes e o fluxo de ordens institucional, acredito que este mercado está subvalorizado em 12%. O desfecho parece cristalino.</p>
                                            <div className="flex items-center gap-4 pt-2">
                                                <button className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted hover:text-white transition-colors">🔥 12</button>
                                                <button className="text-[10px] font-bold text-text-muted hover:text-white transition-colors">Responder</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right (Trading Terminal Widget) ────────────────────────── */}
                <div className="lg:col-span-4 sticky top-36">
                    <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-[32px] p-8 space-y-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)]">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Terminal de Ordem</h3>
                            <div className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
                        </div>

                        {/* YES / NO Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setSide('YES')}
                                className={`group relative p-4 rounded-2xl border-2 transition-all duration-500 overflow-hidden ${side === 'YES'
                                    ? 'bg-yes-500/10 border-yes-500 shadow-glow-yes'
                                    : 'bg-white/[0.03] border-white/5 hover:border-white/20'
                                    }`}
                            >
                                <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${side === 'YES' ? 'text-yes-400' : 'text-text-muted'}`}>COMPRAR SIM</span>
                                <span className={`text-2xl font-black tabular-nums ${side === 'YES' ? 'text-white' : 'text-white/40'}`}>{yesPercent}%</span>
                            </button>
                            <button
                                onClick={() => setSide('NO')}
                                className={`group relative p-4 rounded-2xl border-2 transition-all duration-500 overflow-hidden ${side === 'NO'
                                    ? 'bg-no-500/10 border-no-500 shadow-glow-no'
                                    : 'bg-white/[0.03] border-white/5 hover:border-white/20'
                                    }`}
                            >
                                <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${side === 'NO' ? 'text-no-400' : 'text-text-muted'}`}>COMPRAR NÃO</span>
                                <span className={`text-2xl font-black tabular-nums ${side === 'NO' ? 'text-white' : 'text-white/40'}`}>{noPercent}%</span>
                            </button>
                        </div>

                        {/* Amount Input Block */}
                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-accent-500/20 to-accent-800/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-700"></div>
                                <div className="relative bg-[#050505] border border-white/5 rounded-2xl px-6 py-5 flex items-center justify-between shadow-2xl">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Valor do Aporte</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-xl font-black text-white/50">R$</span>
                                            <input
                                                className="bg-transparent text-2xl font-black text-white outline-none w-full tabular-nums"
                                                type="number"
                                                placeholder="0"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {[10, 50, 100].map(v => (
                                            <button key={v} onClick={() => setAmount(String(v))} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black text-white hover:bg-white/10 transition-all">+{v}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dynamic Preview Analytics */}
                        {preview && (
                            <motion.div
                                className="space-y-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6"
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Cotas Estimadas</span>
                                    <span className="text-sm font-black text-white tabular-nums">{preview.shares?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Retorno Máximo</span>
                                    <span className={`text-sm font-black tabular-nums ${side === 'YES' ? 'text-yes-400' : 'text-no-400'}`}>R$ {preview.shares?.toFixed(2)}</span>
                                </div>
                                <div className="h-[1px] bg-white/[0.05]" />
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest text-[#EBECE6]">Ganho Potencial</span>
                                    <span className="text-sm font-black text-yes-400 tabular-nums">
                                        +{(((preview.shares - parseFloat(amount)) / parseFloat(amount)) * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </motion.div>
                        )}

                        {/* Execute Button */}
                        {isAuthenticated ? (
                            <button
                                onClick={() => tradeMutation.mutate()}
                                disabled={!amount || parseFloat(amount) < 1 || tradeMutation.isPending}
                                className={`group relative w-full py-5 rounded-2xl overflow-hidden font-black uppercase tracking-[0.2em] text-sm transition-all duration-500 ${tradeMutation.isPending ? 'opacity-50' : 'btn-primary'
                                    }`}
                            >
                                <span className="relative z-10">{tradeMutation.isPending ? 'Validando Ordem...' : 'Executar Posição'}</span>
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-700" />
                            </button>
                        ) : (
                            <a href="/auth/login" className="btn-primary w-full text-center block py-5 text-sm tracking-widest uppercase font-black rounded-2xl">
                                Acessar Terminal
                            </a>
                        )}

                        {tradeMutation.isError && (
                            <div className="p-4 rounded-xl bg-no-500/5 border border-no-500/20 text-no-400 text-[10px] font-black uppercase tracking-widest text-center">
                                {(tradeMutation.error as any)?.response?.data?.message ?? 'Falha na Transação'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
