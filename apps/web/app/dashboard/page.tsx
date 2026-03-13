'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { walletApi, tradingApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight,
    BarChart2,
    Clock,
    ShieldCheck,
    AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
    const { isAuthenticated, user } = useAuthStore();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    React.useEffect(() => {
        if (mounted && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [mounted, isAuthenticated, router]);

    const { data: wallet, isLoading: walletLoading } = useQuery({
        queryKey: ['wallet'],
        queryFn: () => walletApi.get(),
        enabled: mounted && isAuthenticated,
    });

    const { data: positions = [], isLoading: posLoading } = useQuery({
        queryKey: ['positions'],
        queryFn: () => tradingApi.positions(),
        enabled: isAuthenticated,
    });

    const { data: transactions = [], isLoading: txLoading } = useQuery({
        queryKey: ['transactions'],
        queryFn: () => walletApi.transactions({ page: 1, limit: 10 }),
        enabled: isAuthenticated,
        select: (d: any) => d?.items ?? [],
    });

    if (!isAuthenticated) return null;

    const totalPnl = positions.reduce((sum: number, p: any) => sum + (p.unrealizedPnl ?? 0), 0);
    const totalInvested = positions.reduce((sum: number, p: any) => sum + (p.totalCost ?? 0), 0);

    return (
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 pb-20 space-y-10">
            {/* Header */}
            <div>
                <p className="text-[10px] font-black text-accent-500 uppercase tracking-widest mb-1">Seu Portfólio</p>
                <h1 className="text-4xl font-black tracking-tight">
                    Olá, {user?.name?.split(' ')[0] ?? 'Trader'} 👋
                </h1>
            </div>

            {/* Wallet Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Balance */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden bg-gradient-to-br from-accent-900/40 to-black/40 backdrop-blur-xl border border-accent-500/20 rounded-[2.5rem] p-8"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/10 rounded-full blur-[60px]" />
                    <div className="flex items-center justify-between mb-6">
                        <div className="p-3 rounded-xl bg-accent-500/10 border border-accent-500/20">
                            <Wallet size={18} className="text-accent-400" />
                        </div>
                        <span className="text-[9px] font-black text-accent-500/60 uppercase tracking-widest">Saldo Disponível</span>
                    </div>
                    <div className="text-4xl font-black tabular-nums">
                        {walletLoading ? (
                            <div className="h-10 w-40 bg-white/5 rounded animate-pulse" />
                        ) : (
                            `R$ ${Number(wallet?.available ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        )}
                    </div>
                    <p className="text-xs text-white/30 mt-2 font-medium">
                        Total: R$ {Number(wallet?.balance ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </motion.div>

                {/* P&L */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className={`relative overflow-hidden backdrop-blur-xl border rounded-[2.5rem] p-8 ${totalPnl >= 0 ? 'bg-yes-900/20 border-yes-500/20' : 'bg-no-900/20 border-no-500/20'}`}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className={`p-3 rounded-xl border ${totalPnl >= 0 ? 'bg-yes-500/10 border-yes-500/20' : 'bg-no-500/10 border-no-500/20'}`}>
                            {totalPnl >= 0 ? <TrendingUp size={18} className="text-yes-400" /> : <TrendingDown size={18} className="text-no-400" />}
                        </div>
                        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">P&L Não Realizado</span>
                    </div>
                    <div className={`text-4xl font-black tabular-nums ${totalPnl >= 0 ? 'text-yes-400' : 'text-no-400'}`}>
                        {posLoading ? (
                            <div className="h-10 w-40 bg-white/5 rounded animate-pulse" />
                        ) : (
                            `${totalPnl >= 0 ? '+' : ''}R$ ${Math.abs(totalPnl).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        )}
                    </div>
                    <p className="text-xs text-white/30 mt-2 font-medium">
                        Em {positions.length} posições abertas
                    </p>
                </motion.div>

                {/* Invested */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="relative overflow-hidden bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                            <BarChart2 size={18} className="text-white/60" />
                        </div>
                        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Total Investido</span>
                    </div>
                    <div className="text-4xl font-black tabular-nums text-white">
                        {posLoading ? (
                            <div className="h-10 w-40 bg-white/5 rounded animate-pulse" />
                        ) : (
                            `R$ ${totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        )}
                    </div>
                    <p className="text-xs text-white/30 mt-2 font-medium">em {positions.length} mercados</p>
                </motion.div>
            </div>

            {/* Positions */}
            <div>
                <h2 className="text-xl font-black uppercase tracking-tight mb-6">Suas Posições Abertas</h2>
                {posLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}
                    </div>
                ) : positions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white/[0.01] border border-dashed border-white/5 rounded-[3rem]">
                        <AlertCircle size={40} className="text-white/10 mb-4" />
                        <p className="text-white/40 font-bold">Nenhuma posição aberta</p>
                        <p className="text-white/20 text-sm mt-2">Explore os mercados e faça sua primeira aposta.</p>
                        <Link href="/" className="mt-6 px-6 py-3 rounded-2xl bg-accent-500/10 border border-accent-500/30 text-accent-400 text-sm font-black uppercase tracking-widest hover:bg-accent-500/20 transition-colors">
                            Ver Mercados
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {(positions as any[]).map((pos: any, i: number) => {
                            const isProfitable = pos.unrealizedPnl >= 0;
                            return (
                                <motion.div
                                    key={pos.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="flex flex-col sm:flex-row sm:items-center gap-4 bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all"
                                >
                                    {/* Side badge */}
                                    <div className={`shrink-0 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest w-fit ${pos.side === 'YES' ? 'bg-yes-400/10 text-yes-400 border border-yes-400/20' : 'bg-no-400/10 text-no-400 border border-no-400/20'}`}>
                                        {pos.side === 'YES' ? '📈 SIM' : '📉 NÃO'}
                                    </div>

                                    {/* Market title */}
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/markets/${pos.market?.slug}`} className="text-sm font-black hover:text-accent-400 transition-colors line-clamp-1">
                                            {pos.market?.title}
                                        </Link>
                                        <div className="flex items-center gap-4 mt-1 text-white/30 text-[10px] font-bold">
                                            <span>{pos.shares?.toFixed(2)} cotas</span>
                                            <span>Preço médio: R$ {pos.avgPrice?.toFixed(3)}</span>
                                        </div>
                                    </div>

                                    {/* Financials */}
                                    <div className="shrink-0 flex items-center gap-6 text-right">
                                        <div>
                                            <div className="text-[9px] font-black text-white/20 uppercase tracking-widest">Investido</div>
                                            <div className="text-sm font-black">R$ {pos.totalCost?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                        </div>
                                        <div>
                                            <div className="text-[9px] font-black text-white/20 uppercase tracking-widest">P&L</div>
                                            <div className={`text-sm font-black flex items-center gap-0.5 ${isProfitable ? 'text-yes-400' : 'text-no-400'}`}>
                                                {isProfitable ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                                R$ {Math.abs(pos.unrealizedPnl)?.toFixed(2)}
                                            </div>
                                        </div>
                                        <Link href={`/markets/${pos.market?.slug}`} className="p-2 rounded-xl border border-white/5 text-white/30 hover:text-white hover:bg-white/5 transition-colors">
                                            <ArrowUpRight size={14} />
                                        </Link>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Recent Transactions */}
            <div>
                <h2 className="text-xl font-black uppercase tracking-tight mb-6">Últimas Transações</h2>
                {txLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />)}
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="py-12 text-center text-white/30 text-sm font-medium">Nenhuma transação encontrada.</div>
                ) : (
                    <div className="bg-black/30 border border-white/5 rounded-[2rem] overflow-hidden">
                        {(transactions as any[]).map((tx: any, i: number) => {
                            const isCredit = tx.amount > 0 || ['DEPOSIT', 'PAYOUT', 'BONUS', 'BET_REFUND'].includes(tx.type);
                            return (
                                <div key={tx.id} className={`flex items-center justify-between px-6 py-4 ${i !== 0 ? 'border-t border-white/5' : ''}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-xl ${isCredit ? 'bg-yes-400/10' : 'bg-no-400/10'}`}>
                                            {isCredit ? <ArrowUpRight size={14} className="text-yes-400" /> : <ArrowDownRight size={14} className="text-no-400" />}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold">{tx.description ?? tx.type}</div>
                                            <div className="text-[10px] text-white/30">
                                                <Clock size={10} className="inline mr-1" />
                                                {new Date(tx.createdAt).toLocaleDateString('pt-BR')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`text-sm font-black tabular-nums ${isCredit ? 'text-yes-400' : 'text-no-400'}`}>
                                        {isCredit ? '+' : '-'}R$ {Math.abs(Number(tx.amount)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
