'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Image as ImageIcon, Calendar, Tag, FileText, Info } from 'lucide-react';
import { marketsApi, botApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { useQuery } from '@tanstack/react-query';

interface MarketFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

export function MarketFormModal({ isOpen, onClose, onSuccess, initialData }: MarketFormModalProps) {
    const { success, error: toastError } = useToast();
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        categoryId: '',
        resolutionDate: '',
        resolutionCriteria: '',
        imageUrl: '',
        sourceUrl: '#admin'
    });

    const { data: categoriesData } = useQuery({
        queryKey: ['admin-categories'],
        queryFn: () => marketsApi.getCategories(),
    });
    
    // Safety check: ensure categories is always an array
    const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.items || []);

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                description: initialData.description || '',
                categoryId: initialData.categoryId || (initialData.category?.id || ''),
                resolutionDate: initialData.resolutionDate ? new Date(initialData.resolutionDate).toISOString().split('T')[0] : '',
                resolutionCriteria: initialData.resolutionCriteria || '',
                imageUrl: initialData.imageUrl || '',
                sourceUrl: initialData.sourceUrl || '#admin'
            });
        } else {
            setFormData({
                title: '',
                description: '',
                categoryId: '',
                resolutionDate: '',
                resolutionCriteria: '',
                imageUrl: '',
                sourceUrl: '#admin'
            });
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (initialData?.id) {
                await marketsApi.update(initialData.id, {
                    ...formData,
                    resolutionDate: formData.resolutionDate ? new Date(formData.resolutionDate).toISOString() : null
                });
                success('Sucesso', 'Mercado atualizado com sucesso!');
            } else {
                await marketsApi.create({
                    ...formData,
                    resolutionDate: formData.resolutionDate ? new Date(formData.resolutionDate).toISOString() : null
                });
                success('Sucesso', 'Novo mercado criado com sucesso!');
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            toastError('Erro', err?.response?.data?.message || 'Erro ao processar mercado.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
                >
                    <div className="p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight">
                                    {initialData ? 'Editar Mercado' : 'Nova Predição'}
                                </h3>
                                <p className="text-white/40 text-sm mt-1">
                                    {initialData ? 'Ajuste os detalhes do mercado selecionado.' : 'Crie uma nova enquete preditiva para a plataforma.'}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Title */}
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block flex items-center gap-2">
                                        <FileText size={12} className="text-accent-500" /> Título da Predição
                                    </label>
                                    <input
                                        required
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Ex: O Bitcoin vai ultrapassar US$ 100k até o fim do ano?"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-accent-500/50 transition-colors"
                                    />
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block flex items-center gap-2">
                                        <Tag size={12} className="text-accent-500" /> Categoria
                                    </label>
                                    <select
                                        required
                                        value={formData.categoryId}
                                        onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-accent-500/50 transition-colors appearance-none"
                                    >
                                        <option value="" disabled className="bg-black">Selecione...</option>
                                        {categories.map((cat: any) => (
                                            <option key={cat.id} value={cat.id} className="bg-black">
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Resolution Date */}
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block flex items-center gap-2">
                                        <Calendar size={12} className="text-accent-500" /> Data de Resolução
                                    </label>
                                    <input
                                        required
                                        type="date"
                                        value={formData.resolutionDate}
                                        onChange={e => setFormData({ ...formData, resolutionDate: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-accent-500/50 transition-colors"
                                    />
                                </div>

                                {/* Image URL */}
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block flex items-center gap-2">
                                        <ImageIcon size={12} className="text-accent-500" /> URL da Imagem (Capa)
                                    </label>
                                    <input
                                        value={formData.imageUrl}
                                        onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                        placeholder="https://exemplo.com/imagem.jpg"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-accent-500/50 transition-colors"
                                    />
                                </div>

                                {/* Criteria */}
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block flex items-center gap-2">
                                        <Info size={12} className="text-accent-500" /> Critérios de Resolução
                                    </label>
                                    <textarea
                                        value={formData.resolutionCriteria}
                                        onChange={e => setFormData({ ...formData, resolutionCriteria: e.target.value })}
                                        placeholder="Descreva as condições exatas para o resultado ser 'SIM' ou 'NÃO'..."
                                        rows={3}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-accent-500/50 transition-colors resize-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white text-black font-black py-5 rounded-2xl text-xs uppercase tracking-[0.2em] hover:bg-accent-500 hover:text-white transition-all duration-300 shadow-glow-accent disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                            >
                                {loading ? (
                                    'Processando...'
                                ) : (
                                    <>
                                        <Save size={16} />
                                        {initialData ? 'Salvar Alterações' : 'Publicar Mercado'}
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
