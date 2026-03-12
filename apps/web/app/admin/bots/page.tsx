'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { botApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import {
    Plus,
    Trash2,
    RotateCw,
    ExternalLink,
    Rss,
    Globe,
    Hash,
    AlertCircle,
    Play,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SOURCE_TYPE_ICONS: Record<string, any> = {
    RSS: Rss,
    NEWS_API: Globe,
    REDDIT: Hash,
    TWITTER: Globe,
    GNEWS: Globe,
};

export default function AdminBotsPage() {
    const queryClient = useQueryClient();
    const { success, error: toastError } = useToast();
    const [isAdding, setIsAdding] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [newSource, setNewSource] = useState({ name: '', type: 'RSS', url: '', fetchInterval: 30 });

    const { data: sources = [], isLoading } = useQuery({
        queryKey: ['bot-sources'],
        queryFn: botApi.getSources,
    });

    const [execResult, setExecResult] = useState<any>(null);
    const [showExecLog, setShowExecLog] = useState(false);

    const runMutation = useMutation({
        mutationFn: botApi.runCycle,
        onSuccess: (data) => {
            setExecResult(data);
            setShowExecLog(true);
            queryClient.invalidateQueries({ queryKey: ['bot-sources'] });
            queryClient.invalidateQueries({ queryKey: ['bot-drafts'] });
            success(
                'Ciclo Concluído',
                `${data?.totalTopicsIngested ?? 0} tópicos coletados, ${data?.draftsGenerated ?? 0} rascunhos gerados.`
            );
        },
        onError: (err: any) => toastError(
            'Erro no Processamento',
            err?.response?.data?.message ?? 'Não foi possível iniciar o ciclo do bot.'
        ),
    });

    const createMutation = useMutation({
        mutationFn: botApi.createSource,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bot-sources'] });
            setIsAdding(false);
            setNewSource({ name: '', type: 'RSS', url: '', fetchInterval: 30 });
            success('Fonte Criada', 'A nova fonte de dados foi registrada com sucesso.');
        },
        onError: () => toastError('Erro ao Criar', 'Verifique os dados da fonte e tente novamente.'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => botApi.updateSource(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bot-sources'] }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => botApi.deleteSource(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bot-sources'] });
            setDeleteId(null);
            success('Fonte Removida', 'A fonte foi excluída permanentemente.');
        },
        onError: () => toastError('Erro ao Remover', 'Não foi possível excluir a fonte.'),
    });

    return (
        <div className="space-y-8">
            {/* 🚀 Header Actions */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight uppercase">Configurações de Bots</h2>
                    <p className="text-white/40 text-sm mt-1">Gerencie as fontes de dados para predições automáticas.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => { setShowExecLog(false); runMutation.mutate(); }}
                        disabled={runMutation.isPending}
                        className="btn-secondary px-6 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest group bg-white/5 border border-white/10 hover:bg-accent-500/10 hover:border-accent-500/30 transition-all duration-500 disabled:opacity-60"
                    >
                        <Play size={14} className={`${runMutation.isPending ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
                        {runMutation.isPending ? 'Executando...' : 'Forçar Execução'}
                    </button>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="btn-primary px-6 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-glow-accent border border-white/10"
                    >
                        <Plus size={16} />
                        Nova Fonte
                    </button>
                </div>
            </div>

            {/* ⚡ Execution in progress indicator */}
            {runMutation.isPending && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 px-6 py-4 bg-accent-500/10 border border-accent-500/20 rounded-2xl"
                >
                    <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="w-2 h-2 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-accent-400 uppercase tracking-widest">Bot em execução</div>
                        <div className="text-xs text-white/40">Escaneando fontes RSS, Reddit e NewsAPI em busca de tendências...</div>
                    </div>
                </motion.div>
            )}

            {/* 📊 Execution Results Log */}
            <AnimatePresence>
                {showExecLog && execResult && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-black/60 backdrop-blur-xl border border-yes-500/20 rounded-[2.5rem] overflow-hidden"
                    >
                        {/* Summary bar */}
                        <div className="flex items-center justify-between px-8 py-5 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={18} className="text-yes-400" />
                                <span className="text-sm font-black text-yes-400 uppercase tracking-widest">Ciclo Completo</span>
                                <span className="text-white/30 text-xs">{new Date(execResult.completedAt).toLocaleTimeString('pt-BR')}</span>
                            </div>
                            <button onClick={() => setShowExecLog(false)} className="text-white/20 hover:text-white transition-colors p-2">
                                <XCircle size={16} />
                            </button>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 divide-x divide-white/5 border-b border-white/5">
                            {[
                                { label: 'Tópicos Encontrados', value: execResult.totalTopicsFound, color: 'text-white' },
                                { label: 'Tópicos Salvos', value: execResult.totalTopicsIngested, color: 'text-accent-400' },
                                { label: 'Rascunhos Gerados', value: execResult.draftsGenerated, color: 'text-yes-400' },
                            ].map((stat) => (
                                <div key={stat.label} className="px-8 py-5">
                                    <div className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">{stat.label}</div>
                                    <div className={`text-3xl font-black tabular-nums ${stat.color}`}>{stat.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Per-source log */}
                        <div className="px-8 py-4 space-y-2">
                            <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-3">Resultado por Fonte</div>
                            {(execResult.executionLog ?? []).map((log: any, i: number) => (
                                <div key={i} className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs ${log.status === 'ok' ? 'bg-yes-400/5 border border-yes-400/10' : 'bg-no-400/5 border border-no-400/10'}`}>
                                    <div className="flex items-center gap-3">
                                        {log.status === 'ok'
                                            ? <CheckCircle2 size={12} className="text-yes-400 shrink-0" />
                                            : <XCircle size={12} className="text-no-400 shrink-0" />
                                        }
                                        <span className="font-bold">{log.source}</span>
                                        <span className="text-white/30 font-medium">[{log.type}]</span>
                                        {log.error && <span className="text-no-400 text-[10px] truncate max-w-[200px]">{log.error}</span>}
                                    </div>
                                    <div className="flex items-center gap-4 text-white/40 font-bold shrink-0">
                                        <span>{log.topicsFound} encontrados</span>
                                        <span className="text-accent-400">{log.ingested} salvos</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* 📝 Add Source Modal */}
            <Modal isOpen={isAdding} onClose={() => setIsAdding(false)} title="Registrar Nova Fonte" maxWidth="lg">
                <div className="space-y-6 relative z-10 pt-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1">Nome Identificador</label>
                        <input
                            className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-accent-500/50 transition-colors"
                            placeholder="Ex: CNN Brasil Politics"
                            value={newSource.name}
                            onChange={e => setNewSource({ ...newSource, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1">Tipo</label>
                            <select
                                className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none appearance-none cursor-pointer"
                                value={newSource.type}
                                onChange={e => setNewSource({ ...newSource, type: e.target.value })}
                            >
                                <option value="RSS">RSS Feed</option>
                                <option value="NEWS_API">News API</option>
                                <option value="REDDIT">Reddit Sub</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1">Intervalo (Min)</label>
                            <input
                                type="number"
                                className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none"
                                value={newSource.fetchInterval}
                                onChange={e => setNewSource({ ...newSource, fetchInterval: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1">URL / Identificador</label>
                        <input
                            className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-accent-500/50 transition-colors"
                            placeholder="https://... ou nome do subreddit"
                            value={newSource.url}
                            onChange={e => setNewSource({ ...newSource, url: e.target.value })}
                        />
                    </div>

                    <div className="flex gap-4 pt-6">
                        <button
                            onClick={() => setIsAdding(false)}
                            className="flex-1 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => createMutation.mutate(newSource)}
                            disabled={createMutation.isPending}
                            className="flex-[2] btn-primary px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-glow-accent"
                        >
                            {createMutation.isPending ? 'Criando...' : 'Criar Fonte'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* 🗑️ Confirm Delete Modal */}
            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
                title="Excluir Fonte"
                message="Tem certeza que deseja remover esta fonte de dados permanentemente? Isso pode afetar a descoberta de novas tendências."
                confirmText="Excluir Permanentemente"
                variant="danger"
                isLoading={deleteMutation.isPending}
            />

            {/* 📊 Sources Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white/5 rounded-[2.5rem] animate-pulse" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sources.map((source: any) => {
                        const Icon = SOURCE_TYPE_ICONS[source.type] || Globe;
                        return (
                            <motion.div
                                layout
                                key={source.id}
                                className={`relative group overflow-hidden bg-black/40 backdrop-blur-xl border rounded-[2.5rem] p-8 transition-all duration-500 ${source.active ? 'border-white/5 hover:border-accent-500/30' : 'border-red-500/10 opacity-60 grayscale'
                                    }`}
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-accent-500/5 rounded-full blur-[40px] group-hover:bg-accent-500/10 transition-colors duration-500" />

                                <div className="flex items-start justify-between mb-8">
                                    <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-accent-400 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-inner-surface">
                                        <Icon size={24} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => updateMutation.mutate({ id: source.id, data: { active: !source.active } })}
                                            className={`p-2 rounded-xl border border-white/5 transition-colors ${source.active ? 'text-yes-400 hover:bg-yes-400/10' : 'text-no-400 hover:bg-no-400/10'}`}
                                        >
                                            {source.active ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                        </button>
                                        <button
                                            onClick={() => setDeleteId(source.id)}
                                            className="p-2 rounded-xl text-white/20 hover:text-no-400 hover:bg-no-400/10 border border-white/5 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-lg font-black tracking-tight">{source.name}</h4>
                                        <p className="text-[10px] text-white/30 font-bold truncate max-w-[200px] mt-1 uppercase tracking-widest">{source.url}</p>
                                    </div>

                                    <div className="flex items-center gap-6 pt-2 border-t border-white/5">
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Intervalo</span>
                                            <div className="text-xs font-bold tabular-nums">{source.fetchInterval}m</div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Falhas</span>
                                            <div className={`text-xs font-bold tabular-nums ${source.errorCount > 0 ? 'text-no-400' : 'text-yes-400'}`}>{source.errorCount}</div>
                                        </div>
                                        <div className="space-y-1 ml-auto text-right">
                                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Tipo</span>
                                            <div className="text-[10px] font-black text-accent-500">{source.type}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex items-center justify-between">
                                    <span className="text-[9px] text-white/20">Visto em {source.lastFetchedAt ? new Date(source.lastFetchedAt).toLocaleTimeString() : 'Nunca'}</span>
                                    <a href={source.url} target="_blank" className="text-accent-400 hover:text-accent-300 transition-colors">
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {!isLoading && sources.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-[3rem]">
                    <AlertCircle size={48} className="text-white/10 mb-4" />
                    <p className="text-white/40 font-bold">Nenhuma fonte configurada.</p>
                    <button onClick={() => setIsAdding(true)} className="mt-4 text-accent-400 hover:underline text-xs font-black uppercase tracking-widest">Adicione a primeira!</button>
                </div>
            )}
        </div>
    );
}
