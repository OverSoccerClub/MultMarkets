'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    TrendingUp,
    AlertCircle,
    Receipt,
} from 'lucide-react';
import { motion } from 'framer-motion';

const SIDE_CONFIG = {
    YES: { label: 'SIM', color: 'text-yes-400', bg: 'bg-yes-400/10 border-yes-400/20' },
    NO: { label: 'NÃO', color: 'text-no-400', bg: 'bg-no-400/10 border-no-400/20' },
};

const TYPE_CONFIG = {
    BUY: { label: 'Compra', icon: ArrowUpRight, color: 'text-yes-400' },
    SELL: { label: 'Venda', icon: ArrowDownRight, color: 'text-no-400' },
};

export default function OrdersPage() {
    const { isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    React.useEffect(() => {
        if (mounted && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [mounted, isAuthenticated, router]);

    const { data, isLoading } = useQuery({
        queryKey: ['my-trades'],
        queryFn: () => api.get('/trading/positions').then(r => r.data),
        enabled: mounted && isAuthenticated,
    });

    const positions: any[] = data ?? [];

    if (!mounted || !isAuthenticated) return null;

    return (
        <div className="max-w-[1100px] mx-auto px-6 pt-36 pb-20 space-y-10">
            {/* Header */}
            <div>
                <p className="text-[10px] font-black text-accent-500 uppercase tracking-widest mb-1">Histórico</p>
                <h1 className="text-4xl font-black tracking-tight">Minhas Operações</h1>
                <p className="text-white/30 mt-2 text-sm">Todas as suas posições abertas nos mercados preditivos.</p>
            </div>

            {/* Summary pills */}
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                    <Receipt size={14} className="text-accent-400" />
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
                        {positions.length} posições abertas
                    </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-yes-400/10 border border-yes-400/20 rounded-xl">
                    <TrendingUp size={14} className="text-yes-400" />
                    <span className="text-[10px] font-black text-yes-400 uppercase tracking-widest">
                        P&L: R$ {positions.reduce((s: number, p: any) => s + (p.unrealizedPnl ?? 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                </div>
                <Link href="/dashboard" className="ml-auto text-[10px] font-black text-accent-400 uppercase tracking-widest hover:text-accent-300 transition-colors">
                    Ver Portfólio →
                </Link>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : positions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white/[0.01] border border-dashed border-white/5 rounded-[3rem]">
                    <AlertCircle size={48} className="text-white/10 mb-4" />
                    <p className="text-white/40 font-bold text-lg">Nenhuma operação encontrada</p>
                    <p className="text-white/20 text-sm mt-2">Explore os mercados e faça sua primeira aposta para ver o histórico aqui.</p>
                    <Link href="/" className="mt-6 px-6 py-3 rounded-xl bg-accent-500/10 border border-accent-500/30 text-accent-400 text-sm font-black uppercase tracking-widest hover:bg-accent-500/20 transition-colors">
                        Explorar Mercados
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {positions.map((pos: any, i: number) => {
                        const side = SIDE_CONFIG[pos.side as keyof typeof SIDE_CONFIG] ?? SIDE_CONFIG.YES;
                        const isProfitable = (pos.unrealizedPnl ?? 0) >= 0;

                        return (
                            <motion.div
                                key={pos.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex flex-col sm:flex-row sm:items-center gap-4 bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all group"
                            >
                                {/* Side / Type */}
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${side.bg} ${side.color}`}>
                                        📈 {side.label}
                                    </div>
                                </div>

                                {/* Market info */}
                                <div className="flex-1 min-w-0">
                                    <Link
                                        href={`/markets/${pos.market?.slug}`}
                                        className="text-sm font-black truncate block hover:text-accent-400 transition-colors"
                                    >
                                        {pos.market?.title}
                                    </Link>
                                    <div className="flex items-center gap-4 mt-1 text-white/30 text-[10px] font-bold flex-wrap">
                                        <span className="flex items-center gap-1">
                                            <Clock size={10} />
                                            {new Date(pos.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                        <span>{Number(pos.shares).toFixed(2)} cotas</span>
                                        <span>Preço médio: R$ {Number(pos.avgPrice).toFixed(4)}</span>
                                    </div>
                                </div>

                                {/* Values */}
                                <div className="shrink-0 flex items-center gap-8 sm:text-right">
                                    <div>
                                        <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Investido</div>
                                        <div className="text-sm font-black tabular-nums">
                                            R$ {Number(pos.totalCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">P&L</div>
                                        <div className={`text-sm font-black tabular-nums flex items-center gap-0.5 ${isProfitable ? 'text-yes-400' : 'text-no-400'}`}>
                                            {isProfitable ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                            R$ {Math.abs(pos.unrealizedPnl ?? 0).toFixed(2)}
                                        </div>
                                    </div>
                                    <Link
                                        href={`/markets/${pos.market?.slug}`}
                                        className="p-2 rounded-xl border border-white/5 text-white/20 hover:text-white hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <ArrowUpRight size={14} />
                                    </Link>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
