'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { 
    Plus, 
    Shield, 
    RefreshCw, 
    Trash2, 
    Edit, 
    CheckCircle2, 
    Power,
    ExternalLink,
    AlertCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { GatewayFormModal } from './components/GatewayFormModal';

export default function AdminSettingsPage() {
    const queryClient = useQueryClient();
    const { success, error: toastError } = useToast();
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGateway, setSelectedGateway] = useState<any>(null);
    
    const { data: gateways = [], isLoading } = useQuery({
        queryKey: ['admin-gateways'],
        queryFn: () => adminApi.getGateways(),
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => adminApi.createGateway(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-gateways'] });
            success('Sucesso', 'Gateway cadastrado com sucesso!');
            setIsModalOpen(false);
        },
        onError: () => toastError('Erro', 'Falha ao cadastrar gateway.')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateGateway(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-gateways'] });
            success('Sucesso', 'Configurações atualizadas!');
            setIsModalOpen(false);
        },
        onError: () => toastError('Erro', 'Falha ao atualizar gateway.')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => adminApi.deleteGateway(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-gateways'] });
            success('Removido', 'Gateway excluído permanentemente.');
        },
        onError: () => toastError('Erro', 'Não foi possível excluir o gateway.')
    });

    const activateMutation = useMutation({
        mutationFn: (id: string) => adminApi.activateGateway(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-gateways'] });
            success('Ativado', 'Este gateway agora processará as transações.');
        },
        onError: () => toastError('Erro', 'Falha ao ativar gateway.')
    });

    const handleSave = (data: any) => {
        if (selectedGateway) {
            updateMutation.mutate({ id: selectedGateway.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEdit = (gateway: any) => {
        setSelectedGateway(gateway);
        setIsModalOpen(true);
    };

    const handleNew = () => {
        setSelectedGateway(null);
        setIsModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <RefreshCw size={32} className="text-accent-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight uppercase text-white">Configurações do Sistema</h2>
                    <p className="text-white/40 text-sm mt-1">
                        Gerencie gateways de pagamento e integrações bancárias da plataforma.
                    </p>
                </div>
                <button
                    onClick={handleNew}
                    className="bg-accent-500 hover:bg-accent-600 text-white font-black uppercase tracking-widest text-[10px] px-6 py-3.5 rounded-xl flex items-center gap-2 transition-all shadow-glow-accent hover:scale-105 active:scale-95"
                >
                    <Plus size={16} />
                    Novo Gateway
                </button>
            </div>

            {/* Warning if no gateway is active */}
            {!gateways.some((g: any) => g.isActive) && gateways.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-yes-500/10 border border-yes-500/20 p-4 rounded-2xl flex items-center gap-4 text-yes-400"
                >
                    <AlertCircle size={20} />
                    <span className="text-xs font-bold uppercase tracking-widest">Nenhum gateway está ativo. Os pagamentos e saques estão suspensos.</span>
                </motion.div>
            )}

            {/* Gateways Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                    {gateways.map((gateway: any) => (
                        <motion.div
                            layout
                            key={gateway.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className={`group relative overflow-hidden bg-black/40 backdrop-blur-xl border ${gateway.isActive ? 'border-accent-500/30 ring-1 ring-accent-500/20' : 'border-white/5'} rounded-[2.5rem] p-8 transition-all duration-500`}
                        >
                            {/* Glow */}
                            <div className={`absolute -top-24 -right-24 w-48 h-48 ${gateway.isActive ? 'bg-accent-500/10' : 'bg-white/5'} rounded-full blur-[60px] pointer-events-none transition-colors`} />

                            <div className="flex items-start justify-between mb-8 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className={`h-14 w-14 rounded-2xl ${gateway.isActive ? 'bg-accent-500/10 text-accent-500' : 'bg-white/5 text-white/30'} border border-current/10 flex items-center justify-center shadow-inner-surface`}>
                                        <Shield size={28} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-black uppercase tracking-tight text-white">{gateway.name}</h3>
                                            {gateway.isActive && <CheckCircle2 size={16} className="text-accent-500" />}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md bg-white/5 text-white/40 border border-white/5">
                                                {gateway.provider}
                                            </span>
                                            <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md border ${gateway.environment === 'PRODUCTION' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                                {gateway.environment === 'PRODUCTION' ? '🚀 Produção' : '🧪 Sandbox'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <div className="grid grid-cols-2 gap-3 pb-6 border-b border-white/5">
                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3">
                                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest block mb-1">Status</span>
                                        <span className={`text-[10px] font-black uppercase ${gateway.isActive ? 'text-accent-400' : 'text-white/40'}`}>
                                            {gateway.isActive ? 'Operacional / Ativo' : 'Inativo / Backup'}
                                        </span>
                                    </div>
                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3">
                                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest block mb-1">API URL</span>
                                        <span className="text-[10px] font-black text-white/60 truncate block" title={gateway.config.baseUrl}>
                                            {gateway.config.baseUrl || 'Não configurado'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(gateway)}
                                            className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
                                            title="Editar"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm('Deseja realmente excluir este gateway? Esta ação é irreversível.')) {
                                                    deleteMutation.mutate(gateway.id);
                                                }
                                            }}
                                            className="h-10 w-10 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-center text-red-400/60 hover:text-red-400 hover:bg-red-500/20 transition-all"
                                            title="Excluir"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {!gateway.isActive && (
                                        <button
                                            onClick={() => activateMutation.mutate(gateway.id)}
                                            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase tracking-widest text-[9px] px-6 h-10 rounded-xl flex items-center gap-2 transition-all active:scale-95"
                                        >
                                            <Power size={14} />
                                            Ativar Agora
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {gateways.length === 0 && (
                    <div className="md:col-span-2 py-20 bg-black/40 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center text-center">
                        <div className="h-16 w-16 rounded-3xl bg-white/5 flex items-center justify-center text-white/20 mb-4">
                            <Shield size={32} />
                        </div>
                        <h4 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Nenhum Gateway Cadastrado</h4>
                        <p className="text-white/40 text-sm max-w-sm mb-8">
                            Para aceitar depósitos e processar saques, você precisa configurar pelo menos um gateway de pagamento (PIX).
                        </p>
                        <button
                            onClick={handleNew}
                            className="bg-accent-500 hover:bg-accent-600 text-white font-black uppercase tracking-widest text-[10px] px-10 py-4 rounded-xl shadow-glow-accent transition-all hover:scale-105"
                        >
                            Começar Configuração
                        </button>
                    </div>
                )}
            </div>

            <GatewayFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={selectedGateway}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
}
