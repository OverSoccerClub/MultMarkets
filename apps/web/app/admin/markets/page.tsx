'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketsApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import {
    Search,
    TrendingUp,
    Clock,
    CheckCircle2,
    XCircle,
    BarChart2,
    Filter,
    ExternalLink,
    RefreshCw,
    Globe,
    Bot,
    AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    ACTIVE: { label: 'Ativo', color: 'text-yes-400', bg: 'bg-yes-400/10', icon: CheckCircle2 },
    DRAFT: { label: 'Rascunho', color: 'text-white/40', bg: 'bg-white/5', icon: Clock },
    PENDING: { label: 'Revisão', color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: Clock },
    CLOSED: { label: 'Fechado', color: 'text-white/20', bg: 'bg-white/5', icon: XCircle },
    RESOLVED: { label: 'Resolvido', color: 'text-accent-400', bg: 'bg-accent-400/10', icon: CheckCircle2 },
    CANCELLED: { label: 'Cancelado', color: 'text-no-400', bg: 'bg-no-400/10', icon: XCircle },
};

const STATUS_FILTERS = ['Todos', 'ACTIVE', 'DRAFT', 'PENDING', 'CLOSED', 'RESOLVED'];

export default function AdminMarketsPage() {
    const queryClient = useQueryClient();
    const { success, error: toastError } = useToast();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [cancelId, setCancelId] = useState<string | null>(null);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['admin-markets', statusFilter],
        queryFn: () =>
            marketsApi.list({
                status: statusFilter === 'Todos' ? 'ALL' : statusFilter,
                limit: 50,
            }),
    });

    const cancelMutation = useMutation({
        mutationFn: (id: string) => api.patch(`/markets/${id}`, { status: 'CANCELLED' }).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-markets'] });
            setCancelId(null);
            success('Mercado Cancelado', 'O mercado foi encerrado e não aceitará mais apostas.');
        },
        onError: () => toastError('Erro', 'Não foi possível cancelar o mercado.'),
    });

    const activateMutation = useMutation({
        mutationFn: (id: string) => api.patch(`/markets/${id}`, { status: 'ACTIVE' }).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-markets'] });
            success('Mercado Ativado', 'O mercado agora está visível e aceitando apostas.');
        },
        onError: () => toastError('Erro', 'Não foi possível ativar o mercado.'),
    });

    const markets: any[] = data?.items ?? [];
    const filtered = search
        ? markets.filter((m: any) => m.title.toLowerCase().includes(search.toLowerCase()))
        : markets;

    return (
        <div className="space-y-8">
            {/* 🚀 Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black tracking-tight uppercase">Gestão de Mercados</h2>
                    <p className="text-white/40 text-sm mt-1">Gerencie todos os mercados preditivos da plataforma.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => refetch()}
                        className="p-3 rounded-xl border border-white/5 text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <RefreshCw size={16} />
                    </button>
                    <div className="flex items-center gap-3 px-5 py-3 bg-accent-500/10 border border-accent-500/20 rounded-2xl">
                        <BarChart2 size={16} className="text-accent-400" />
                        <span className="text-[10px] font-black text-accent-400 uppercase tracking-widest">
                            {filtered.length} mercados
                        </span>
                    </div>
                </div>
            </div>

            {/* 🔍 Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar mercado..."
                        className="w-full bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:outline-none focus:border-accent-500/50 transition-colors placeholder:text-white/20"
                    />
                </div>

                {/* Status Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    <Filter size={16} className="text-white/20 shrink-0 ml-1" />
                    {STATUS_FILTERS.map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === s
                                ? 'bg-accent-500 text-white shadow-glow-accent'
                                : 'bg-white/5 text-white/40 hover:text-white border border-white/5'
                                }`}
                        >
                            {STATUS_CONFIG[s]?.label ?? s}
                        </button>
                    ))}
                </div>
            </div>

            {/* 📊 Markets Table */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white/[0.01] border border-dashed border-white/5 rounded-[4rem]">
                    <AlertCircle size={48} className="text-white/10 mb-4" />
                    <p className="text-white/40 font-bold">Nenhum mercado encontrado</p>
                    <p className="text-white/20 text-xs mt-2">Ajuste os filtros ou crie mercados aprovando os rascunhos da IA.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((market: any, i: number) => {
                        const cfg = STATUS_CONFIG[market.status] ?? STATUS_CONFIG.DRAFT;
                        const StatusIcon = cfg.icon;
                        const isActive = market.status === 'ACTIVE';
                        const isDraft = market.status === 'DRAFT' || market.status === 'PENDING';

                        return (
                            <motion.div
                                key={market.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="group flex flex-col md:flex-row md:items-center gap-4 bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-all duration-300"
                            >
                                {/* Status badge */}
                                <div className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl ${cfg.bg} w-fit`}>
                                    <StatusIcon size={12} className={cfg.color} />
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
                                </div>

                                {/* Title */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-black truncate">{market.title}</h4>
                                    <div className="flex items-center gap-4 mt-1 text-white/30">
                                        <span className="text-[10px] font-bold flex items-center gap-1">
                                            {market.createdByBot ? <Bot size={10} /> : <Globe size={10} />}
                                            {market.createdByBot ? 'Bot AI' : 'Admin'}
                                        </span>
                                        <span className="text-[10px] font-bold flex items-center gap-1">
                                            <TrendingUp size={10} />
                                            R$ {Number(market.totalVolume ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                        {market.resolutionDate && (
                                            <span className="text-[10px] font-bold flex items-center gap-1">
                                                <Clock size={10} />
                                                {new Date(market.resolutionDate).toLocaleDateString('pt-BR')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Prices */}
                                <div className="shrink-0 flex items-center gap-4">
                                    <div className="text-center">
                                        <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-0.5">SIM</div>
                                        <div className="text-sm font-black text-yes-400 tabular-nums">
                                            {(Number(market.yesPrice ?? 0.5) * 100).toFixed(0)}%
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-0.5">NÃO</div>
                                        <div className="text-sm font-black text-no-400 tabular-nums">
                                            {(Number(market.noPrice ?? 0.5) * 100).toFixed(0)}%
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="shrink-0 flex items-center gap-2">
                                    {isDraft && (
                                        <button
                                            onClick={() => activateMutation.mutate(market.id)}
                                            disabled={activateMutation.isPending}
                                            className="px-4 py-2 rounded-xl bg-yes-400/10 border border-yes-400/20 text-yes-400 text-[10px] font-black uppercase tracking-widest hover:bg-yes-400/20 transition-colors"
                                        >
                                            Ativar
                                        </button>
                                    )}
                                    {isActive && (
                                        <button
                                            onClick={() => setCancelId(market.id)}
                                            className="px-4 py-2 rounded-xl bg-no-400/10 border border-no-400/20 text-no-400 text-[10px] font-black uppercase tracking-widest hover:bg-no-400/20 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                    <a
                                        href={`/markets/${market.slug}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-2 rounded-xl border border-white/5 text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* 🗑️ Cancel Confirmation */}
            <ConfirmationModal
                isOpen={!!cancelId}
                onClose={() => setCancelId(null)}
                onConfirm={() => cancelId && cancelMutation.mutate(cancelId)}
                title="Cancelar Mercado"
                message="Ao cancelar o mercado, as apostas serão devolvidas e ele não aceitará mais participações. Esta ação não pode ser desfeita."
                confirmText="Cancelar Mercado"
                variant="danger"
                isLoading={cancelMutation.isPending}
            />
        </div>
    );
}
