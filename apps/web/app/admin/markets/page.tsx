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
    Plus,
    Edit3,
    Trash2,
    Play,
    Pause,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { MarketFormModal } from './components/MarketFormModal';
import { ResolveMarketModal } from './components/ResolveMarketModal';

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
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [cancelId, setCancelId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isResolveOpen, setIsResolveOpen] = useState(false);
    const [selectedMarket, setSelectedMarket] = useState<any>(null);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['admin-markets', statusFilter, page, limit],
        queryFn: () =>
            marketsApi.list({
                status: statusFilter === 'Todos' ? 'ALL' : statusFilter,
                page,
                limit,
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

    const pauseMutation = useMutation({
        mutationFn: (id: string) => api.patch(`/markets/${id}`, { status: 'PENDING' }).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-markets'] });
            success('Mercado Pausado', 'O mercado foi colocado em revisão e as apostas suspensas.');
        },
        onError: () => toastError('Erro', 'Não foi possível pausar o mercado.'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => marketsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-markets'] });
            setDeleteId(null);
            success('Excluído', 'Mercado removido permanentemente.');
        },
        onError: (err: any) => toastError('Erro', err?.response?.data?.message || 'Não é possível excluir este mercado.'),
    });

    const markets: any[] = data?.items ?? [];
    const filtered = search
        ? markets.filter((m: any) => m.title.toLowerCase().includes(search.toLowerCase()))
        : markets;

    return (
        <div className="space-y-8 pb-20">
            {/* 🚀 Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight">Gestão de <span className="text-accent-500">Mercados</span></h1>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Gerencie todos os mercados preditivos da plataforma</p>
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

                    <button
                        onClick={() => {
                            setSelectedMarket(null);
                            setIsFormOpen(true);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-accent-500 hover:text-white transition-all shadow-glow-accent"
                    >
                        <Plus size={16} />
                        Nova Predição
                    </button>
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
                                            className="p-2 rounded-xl bg-yes-400/10 border border-yes-400/20 text-yes-400 hover:bg-yes-400/20 transition-colors"
                                            title="Ativar"
                                        >
                                            <Play size={14} />
                                        </button>
                                    )}
                                    {isActive && (
                                        <>
                                            <button
                                                onClick={() => pauseMutation.mutate(market.id)}
                                                disabled={pauseMutation.isPending}
                                                className="p-2 rounded-xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 hover:bg-yellow-400/20 transition-colors"
                                                title="Pausar"
                                            >
                                                <Pause size={14} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedMarket(market);
                                                    setIsResolveOpen(true);
                                                }}
                                                className="px-4 py-2 rounded-xl bg-accent-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-accent-600 transition-colors shadow-glow-accent"
                                            >
                                                Resolver
                                            </button>
                                            <button
                                                onClick={() => setCancelId(market.id)}
                                                className="p-2 rounded-xl bg-no-400/10 border border-no-400/20 text-no-400 hover:bg-no-400/20 transition-colors"
                                                title="Anular/Estornar"
                                            >
                                                <XCircle size={14} />
                                            </button>
                                        </>
                                    )}

                                    <button
                                        onClick={() => {
                                            setSelectedMarket(market);
                                            setIsFormOpen(true);
                                        }}
                                        className="p-2 rounded-xl border border-white/5 text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                                        title="Editar"
                                    >
                                        <Edit3 size={14} />
                                    </button>

                                    {Number(market.totalVolume) === 0 && (
                                        <button
                                            onClick={() => setDeleteId(market.id)}
                                            className="p-2 rounded-xl border border-white/5 text-no-400/40 hover:text-no-400 hover:bg-no-400/5 transition-colors"
                                            title="Excluir Permanentemente"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}

                                    <a
                                        href={`/markets/${market.slug}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-2 rounded-xl border border-white/5 text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                                        title="Ver no Site"
                                    >
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {data?.meta && (
                <div className="p-6 bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                            Página {data.meta.page} de {data.meta.totalPages} ({data.meta.total} mercados)
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Exibir</span>
                            <select
                                value={limit}
                                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                                className="bg-[#0a0e17] border border-white/10 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-accent-500 transition-all text-white cursor-pointer"
                            >
                                <option value={5} className="bg-[#0a0e17] text-white">5</option>
                                <option value={10} className="bg-[#0a0e17] text-white">10</option>
                                <option value={20} className="bg-[#0a0e17] text-white">20</option>
                                <option value={50} className="bg-[#0a0e17] text-white">50</option>
                                <option value={100} className="bg-[#0a0e17] text-white">100</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 hover:bg-white/10 transition-all"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button 
                            onClick={() => setPage(p => Math.min(data.meta.totalPages, p + 1))}
                            disabled={page === data.meta.totalPages}
                            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 hover:bg-white/10 transition-all"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* 🗑️ Anular Confirmation */}
            <ConfirmationModal
                isOpen={!!cancelId}
                onClose={() => setCancelId(null)}
                onConfirm={() => cancelId && cancelMutation.mutate(cancelId)}
                title="Anular Mercado"
                message="Ao anular o mercado, TODAS as apostas serão devolvidas integralmente às carteiras dos usuários. Esta ação é drástica e não pode ser desfeita."
                confirmText="Anular e Estornar"
                variant="danger"
                isLoading={cancelMutation.isPending}
            />

            {/* 🗑️ Excluir Confirmation */}
            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
                title="Excluir Mercado"
                message="Você tem certeza que deseja excluir permanentemente este mercado? Esta ação só é permitida porque não há apostas ativas."
                confirmText="Excluir Para Sempre"
                variant="danger"
                isLoading={deleteMutation.isPending}
            />

            {/* 📝 Create/Edit Modal */}
            <MarketFormModal
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setSelectedMarket(null);
                }}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['admin-markets'] });
                }}
                initialData={selectedMarket}
            />

            {/* 🏁 Resolve Modal */}
            <ResolveMarketModal
                isOpen={isResolveOpen}
                onClose={() => {
                    setIsResolveOpen(false);
                    setSelectedMarket(null);
                }}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['admin-markets'] });
                }}
                market={selectedMarket}
            />
        </div>
    );
}
