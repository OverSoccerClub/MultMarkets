'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialApi } from '@/lib/api';
import { 
    Search, 
    Filter, 
    ArrowUpRight, 
    ArrowDownLeft, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    MoreHorizontal,
    Eye,
    ChevronLeft,
    ChevronRight,
    Loader2,
    DollarSign,
    AlertCircle,
    Edit2,
    ShieldAlert
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
    PENDING: { label: 'Pendente', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', icon: Clock },
    CONFIRMED: { label: 'Confirmado', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', icon: CheckCircle2 },
    PAID: { label: 'Pago', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle2 },
    COMPLETED: { label: 'Concluído', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle2 },
    FAILED: { label: 'Falhou', color: 'text-rose-400 bg-rose-400/10 border-rose-400/20', icon: XCircle },
    CANCELLED: { label: 'Cancelado', color: 'text-white/40 bg-white/5 border-white/10', icon: XCircle },
};

export default function AdminTransactionsPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedTx, setSelectedTx] = useState<any>(null);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

    const { _hasHydrated, isAuthenticated } = useAuthStore();

    const { data, isLoading } = useQuery({
        queryKey: ['admin-transactions', page, limit, statusFilter, typeFilter],
        queryFn: () => financialApi.getTransactions({ 
            page, 
            limit, 
            status: statusFilter || undefined, 
            type: typeFilter || undefined 
        }),
        enabled: !!_hasHydrated && isAuthenticated,
    });

    const approveMutation = useMutation({
        mutationFn: (txId: string) => financialApi.approveWithdrawal(txId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
            setSelectedTx(null);
        }
    });

    const approveDepositMutation = useMutation({
        mutationFn: (txId: string) => financialApi.approveDeposit(txId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
            setSelectedTx(null);
        }
    });

    const rejectMutation = useMutation({
        mutationFn: ({ txId, reason }: { txId: string, reason: string }) => 
            financialApi.rejectWithdrawal(txId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
            setIsRejectModalOpen(false);
            setRejectionReason('');
            setSelectedTx(null);
        }
    });

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString('pt-BR');
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight">Gestão <span className="text-accent-500">Financeira</span></h1>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Monitoramento de depósitos e saques</p>
                </div>

                <div className="flex items-center gap-3">
                    <select 
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest outline-none focus:border-accent-500 transition-all"
                    >
                        <option value="">Todos os Tipos</option>
                        <option value="CASH_IN">Depósitos</option>
                        <option value="CASH_OUT">Saques</option>
                    </select>

                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest outline-none focus:border-accent-500 transition-all"
                    >
                        <option value="">Todos os Status</option>
                        <option value="PENDING">Pendentes</option>
                        <option value="PAID">Pagos</option>
                        <option value="FAILED">Falhas</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Data</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Usuário</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Tipo</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Valor</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="animate-spin text-accent-500" size={32} />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Carregando Transações...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : data?.items?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-20">
                                            <AlertCircle size={40} />
                                            <span className="text-xs font-bold uppercase tracking-widest">Nenhuma transação encontrada</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                data?.items.map((tx: any) => (
                                    <tr key={tx.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-[11px] font-bold text-white/60">{formatDate(tx.createdAt)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-white">{tx.wallet?.user?.name}</span>
                                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-tight">{tx.wallet?.user?.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {tx.type === 'CASH_IN' ? (
                                                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                        <ArrowDownLeft size={14} />
                                                    </div>
                                                ) : (
                                                    <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                                        <ArrowUpRight size={14} />
                                                    </div>
                                                )}
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${tx.type === 'CASH_IN' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {tx.type === 'CASH_IN' ? 'Depósito' : 'Saque'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-black tabular-nums">{formatCurrency(tx.amount)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${STATUS_MAP[tx.status]?.color}`}>
                                                {React.createElement(STATUS_MAP[tx.status]?.icon || Clock, { size: 10 })}
                                                {STATUS_MAP[tx.status]?.label || tx.status}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {tx.type === 'CASH_OUT' && (tx.status === 'PENDING' || tx.status === 'CONFIRMED') ? (
                                                <div className="flex items-center justify-end gap-2 text-white/20">
                                                    <button 
                                                        onClick={() => approveMutation.mutate(tx.txId)}
                                                        disabled={approveMutation.isPending}
                                                        className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 transition-all hover:scale-110 active:scale-95 flex items-center gap-1.5 px-3"
                                                        title="Aprovar Saque"
                                                    >
                                                        <CheckCircle2 size={16} />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Aprovar</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedTx(tx);
                                                            setIsRejectModalOpen(true);
                                                        }}
                                                        disabled={rejectMutation.isPending}
                                                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 transition-all hover:scale-110 active:scale-95 flex items-center gap-1.5 px-3"
                                                        title="Rejeitar Saque"
                                                    >
                                                        <XCircle size={16} />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Rejeitar</span>
                                                    </button>
                                                </div>
                                            ) : tx.type === 'CASH_IN' && (tx.status === 'PENDING' || tx.status === 'CONFIRMED') ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => approveDepositMutation.mutate(tx.txId)}
                                                        disabled={approveDepositMutation.isPending}
                                                        className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 transition-all hover:scale-110 active:scale-95 flex items-center gap-1.5 px-3"
                                                        title="Confirmar Depósito"
                                                    >
                                                        {approveDepositMutation.isPending ? (
                                                            <Loader2 size={16} className="animate-spin" />
                                                        ) : (
                                                            <CheckCircle2 size={16} />
                                                        )}
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Confirmar</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                <button className="p-2 rounded-xl bg-white/5 text-white/20 border border-white/5 hover:bg-white/10 hover:text-white/40 transition-all">
                                                    <Eye size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {data?.meta && (
                    <div className="p-6 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                                Página {data.meta.page} de {data.meta.totalPages} ({data.meta.total} transações)
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
            </div>

            {/* Rejection Modal */}
            <AnimatePresence>
                {isRejectModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setIsRejectModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-[#0a0e17] border border-white/10 rounded-3xl shadow-2xl p-8"
                        >
                            <h2 className="text-xl font-black uppercase tracking-tight mb-2">Rejeitar <span className="text-rose-500">Saque</span></h2>
                            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-6 border-b border-white/5 pb-4">
                                Esta ação irá estornar o valor de <span className="text-white">{formatCurrency(selectedTx?.amount)}</span> para o usuário.
                            </p>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Motivo da Rejeição</label>
                                    <textarea 
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Ex: CPF inválido, Chave PIX não encontrada..."
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-rose-500/50 outline-none transition-all min-h-[100px] resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button 
                                    onClick={() => setIsRejectModalOpen(false)}
                                    className="flex-1 py-4 px-6 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={() => rejectMutation.mutate({ txId: selectedTx.txId, reason: rejectionReason })}
                                    disabled={rejectMutation.isPending || !rejectionReason.trim()}
                                    className="flex-1 py-4 px-6 rounded-2xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all disabled:opacity-50"
                                >
                                    {rejectMutation.isPending ? 'Confirmando...' : 'Confirmar Rejeição'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
