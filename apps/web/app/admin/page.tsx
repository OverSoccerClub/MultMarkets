'use client';

import React from 'react';
import {
    BarChart3,
    Activity,
    Bot,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { marketsApi, botApi } from '@/lib/api';

export default function AdminDashboardPage() {
    const { data: markets = [] } = useQuery({
        queryKey: ['admin-markets'],
        queryFn: () => marketsApi.list(),
    });

    const { data: draftsData } = useQuery({
        queryKey: ['admin-drafts'],
        queryFn: () => botApi.getDrafts(),
    });

    const drafts = draftsData?.data || [];
    const marketsArray = Array.isArray(markets) ? markets : (markets?.items || []);

    const stats = [
        { label: 'Mercados Abertos', value: marketsArray.length, icon: BarChart3, color: 'text-white' },
        { label: 'Predições do Bot (Rascunhos)', value: drafts.length, icon: Bot, color: 'text-accent-500' },
    ];

    return (
        <div className="space-y-8 pb-20">
            {/* 🚀 Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight">Dashboard <span className="text-accent-500">Visão Geral</span></h1>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Bem-vindo ao centro de comando MultMarkets</p>
                </div>
            </div>

            {/* 📊 Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={stat.label}
                        className="group relative overflow-hidden bg-black/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 hover:border-accent-500/30 transition-all duration-500"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-accent-500/5 rounded-full blur-[40px] group-hover:bg-accent-500/10 transition-colors duration-500" />

                        <div className="flex items-start justify-between mb-6">
                            <div className={`h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center ${stat.color} shadow-inner-surface group-hover:scale-110 transition-transform`}>
                                <stat.icon size={22} />
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{stat.label}</span>
                            <div className="text-2xl font-black tabular-nums mt-1">{stat.value}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* 📈 System Activity (Placeholder for Chart) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-black/40 backdrop-blur-xl border border-white/5 rounded-[3rem] p-10 h-96 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-3">
                            <Activity size={18} className="text-accent-500" />
                            Atividade da Plataforma
                        </h3>
                    </div>
                    <div className="flex-1 flex items-center justify-center border border-dashed border-white/5 rounded-[2rem] bg-white/[0.01]">
                        <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em]">Gráfico indisponível (Desenvolvimento)</p>
                    </div>
                </div>

                <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-[3rem] p-10 h-96 flex flex-col">
                    <h3 className="text-lg font-black uppercase tracking-tight mb-8">Próximos Fechamentos</h3>
                    <div className="space-y-6 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                        {marketsArray.slice(0, 5).map((m: any) => (
                            <div key={m.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                <div className="h-2 w-2 rounded-full bg-accent-500 animate-pulse" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-bold truncate">{m.title}</div>
                                    <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-0.5">
                                        Fim em {new Date(m.endDate).toLocaleDateString('pt-BR')}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {markets.length === 0 && (
                            <div className="text-sm font-bold text-white/30 text-center py-8">Nenhum mercado aberto no momento.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
