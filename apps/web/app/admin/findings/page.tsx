'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { botApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import {
    Sparkles,
    CheckCircle,
    XCircle,
    Edit3,
    ExternalLink,
    TrendingUp,
    Calendar,
    Layers,
    Info,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminFindingsPage() {
    const queryClient = useQueryClient();
    const { success, error: toastError } = useToast();
    const [selectedDraft, setSelectedDraft] = useState<any>(null);
    const [rejectId, setRejectId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>(null);

    const { data: draftsData, isLoading } = useQuery({
        queryKey: ['bot-drafts'],
        queryFn: () => botApi.getDrafts(),
        staleTime: 60000,
        refetchOnWindowFocus: false,
    });

    const approveMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => botApi.approveDraft(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bot-drafts'] });
            setSelectedDraft(null);
            success('Mercado Publicado', 'O mercado foi criado e já está disponível para apostas.');
        },
        onError: () => toastError('Erro na Aprovação', 'Não foi possível converter o rascunho em mercado.'),
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) => botApi.rejectDraft(id, { reason }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bot-drafts'] });
            setSelectedDraft(null);
            setRejectId(null);
            success('Rascunho Rejeitado', 'O tópico foi removido da lista de pendências.');
        },
        onError: () => toastError('Erro ao Rejeitar', 'Falha ao processar a rejeição do rascunho.'),
    });

    const handleOpenReview = (draft: any) => {
        setSelectedDraft(draft);
        setEditForm({
            title: draft.generatedTitle,
            description: draft.generatedDescription,
            resolutionCriteria: draft.resolutionCriteria,
            categorySlug: draft.suggestedCategory || 'outros',
            resolutionDate: draft.suggestedEndDate ? new Date(draft.suggestedEndDate).toISOString().split('T')[0] : '',
        });
    };

    const drafts = draftsData?.items || [];
    console.log("DRAFTS DATA:", draftsData, "MAPPED DRAFTS:", drafts);

    return (
        <div className="space-y-8 pb-20">
            {/* 🚀 Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight">Descobertas <span className="text-accent-500">AI</span></h1>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Revise e aprove mercados gerados por inteligência artificial</p>
                </div>
                <div className="flex items-center gap-3 px-6 py-3 bg-accent-500/10 border border-accent-500/20 rounded-2xl">
                    <Sparkles size={16} className="text-accent-400 animate-pulse" />
                    <span className="text-[10px] font-black text-accent-400 uppercase tracking-widest">{drafts.length} Pendentes</span>
                </div>
            </div>

            {/* 📊 Drafts Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-white/5 rounded-[2.5rem] animate-pulse" />)}
                </div>
            ) : (
                <motion.div layout className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AnimatePresence mode="popLayout">
                        {drafts.map((draft: any) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                key={draft.id}
                                className="relative group bg-black/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 hover:border-accent-500/30 transition-all duration-500 overflow-hidden"
                            >
                                {/* Score Badge */}
                                <div className="absolute top-6 right-8 flex flex-col items-end">
                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Virality</span>
                                    <div className="text-2xl font-black text-accent-500 tabular-nums">
                                        {draft.topic?.viralityScore || 0}%
                                    </div>
                                </div>

                                <div className="flex flex-col h-full">
                                    <div className="pr-20 mb-6">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-black text-yes-400 uppercase tracking-widest">
                                                {draft.suggestedCategory || 'News'}
                                            </span>
                                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                                                via {draft.topic?.url?.includes('reddit') ? 'Reddit' : 'News'}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-black leading-tight tracking-tight line-clamp-2">
                                            {draft.generatedTitle}
                                        </h3>
                                    </div>

                                    <p className="text-white/40 text-sm line-clamp-2 mb-8 flex-1">
                                        "{draft.generatedDescription.substring(0, 150)}..."
                                    </p>

                                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                        <div className="flex items-center gap-4 text-white/30 truncate max-w-[50%] mr-4">
                                            <Info size={14} />
                                            <span className="text-[10px] font-bold truncate">{draft.topic?.title}</span>
                                        </div>
                                        <button
                                            onClick={() => handleOpenReview(draft)}
                                            className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-glow-accent group"
                                        >
                                            Revisar
                                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {!isLoading && drafts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 bg-white/[0.01] border border-dashed border-white/5 rounded-[4rem]">
                    <div className="relative mb-6">
                        <Sparkles size={64} className="text-white/5" />
                        <div className="absolute inset-0 bg-accent-500/20 blur-[40px] rounded-full" />
                    </div>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-sm">Nenhum rascunho pendente</p>
                    <p className="text-white/20 text-xs mt-2">O bot está escaneando a internet em busca de tendências...</p>
                </div>
            )}

            {/* 📝 Review Modal */}
            <AnimatePresence>
                {selectedDraft && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10 lg:p-20">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedDraft(null)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        />

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, x: 20 }}
                            animate={{ scale: 1, opacity: 1, x: 0 }}
                            exit={{ scale: 0.95, opacity: 0, x: 20 }}
                            className="relative w-full max-w-6xl h-[85vh] bg-[#0a0c14] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row"
                        >
                            {/* Left: Original Info (Read-only) */}
                            <div className="w-full lg:w-2/5 p-10 border-b lg:border-b-0 lg:border-r border-white/5 bg-white/[0.02]">
                                <div className="space-y-8">
                                    <div>
                                        <span className="text-[10px] font-black text-accent-500 uppercase tracking-[0.3em] block mb-2">Trend Original</span>
                                        <h4 className="text-2xl font-black tracking-tight leading-none mb-4">{selectedDraft.topic?.title}</h4>
                                        <div className="flex items-center gap-3">
                                            <a
                                                href={selectedDraft.topic?.url}
                                                target="_blank"
                                                className="text-[10px] font-black text-white/30 hover:text-white flex items-center gap-2 uppercase tracking-widest transition-colors"
                                            >
                                                <ExternalLink size={12} /> Ver Fonte Original
                                            </a>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
                                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest block mb-1">Virality Score</span>
                                            <div className="text-2xl font-black text-accent-400 tabular-nums">{selectedDraft.topic?.viralityScore}%</div>
                                        </div>
                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
                                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest block mb-1">Final Score</span>
                                            <div className="text-2xl font-black text-yes-400 tabular-nums">{selectedDraft.topic?.finalScore?.toFixed(0)}</div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] block">Análise de IA</span>
                                        <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 space-y-4">
                                            <div className="flex items-center gap-4">
                                                <TrendingUp size={16} className="text-accent-500" />
                                                <span className="text-xs font-bold">Trend está crescendo no Reddit e RSS.</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Sparkles size={16} className="text-accent-500" />
                                                <span className="text-xs font-bold">Modelo GPT-4o-mini gerou a estrutura.</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Edit & Approve (Form) */}
                            <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-black uppercase tracking-tight">Revisar Mercado</h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setRejectId(selectedDraft.id)}
                                                className="p-3 rounded-xl border border-white/5 text-no-400 hover:bg-no-400/10 transition-colors"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1">Título do Mercado</label>
                                            <input
                                                className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-accent-500/50 transition-colors"
                                                value={editForm.title}
                                                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1">Descrição</label>
                                            <textarea
                                                rows={4}
                                                className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-accent-500/50 transition-colors resize-none"
                                                value={editForm.description}
                                                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1">Critérios de Resolução</label>
                                            <textarea
                                                rows={3}
                                                className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-accent-500/50 transition-colors resize-none"
                                                value={editForm.resolutionCriteria}
                                                onChange={e => setEditForm({ ...editForm, resolutionCriteria: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1">Categoria Principal</label>
                                                <div className="relative">
                                                    <Layers className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                                    <select
                                                        className="w-full bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold focus:outline-none appearance-none cursor-pointer"
                                                        value={editForm.categorySlug}
                                                        onChange={e => setEditForm({ ...editForm, categorySlug: e.target.value })}
                                                    >
                                                        <option value="noticias">Notícias</option>
                                                        <option value="politica">Política</option>
                                                        <option value="tecnologia">Tecnologia</option>
                                                        <option value="entretenimento">Entretenimento</option>
                                                        <option value="esportes">Esportes</option>
                                                        <option value="crypto">Crypto</option>
                                                        <option value="outros">Outros</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-1">Data de Fechamento</label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                                    <input
                                                        type="date"
                                                        className="w-full bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold focus:outline-none"
                                                        value={editForm.resolutionDate}
                                                        onChange={e => setEditForm({ ...editForm, resolutionDate: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/5 flex gap-4">
                                        <button
                                            onClick={() => setSelectedDraft(null)}
                                            className="flex-1 px-8 py-5 rounded-2xl text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={() => approveMutation.mutate({ id: selectedDraft.id, data: editForm })}
                                            disabled={approveMutation.isPending}
                                            className="flex-[2] btn-primary px-8 py-5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-glow-accent flex items-center justify-center gap-3"
                                        >
                                            <CheckCircle size={18} />
                                            {approveMutation.isPending ? 'Criando Mercado...' : 'Aprovar e Publicar Mercado'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 🗑️ Confirm Discard Modal */}
            <ConfirmationModal
                isOpen={!!rejectId}
                onClose={() => setRejectId(null)}
                onConfirm={() => rejectId && rejectMutation.mutate({ id: rejectId })}
                title="Rejeitar Rascunho"
                message="Deseja realmente descartar esta sugestão de mercado? Ela não poderá ser recuperada."
                confirmText="Rejeitar e Apagar"
                variant="danger"
                isLoading={rejectMutation.isPending}
            />
        </div>
    );
}
