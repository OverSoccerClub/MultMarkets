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
    AlertCircle,
    TrendingUp
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { GatewayFormModal } from './components/GatewayFormModal';

export default function AdminSettingsPage() {
    const queryClient = useQueryClient();
    const { success, error: toastError } = useToast();
    
    // Tab state
    const [activeTab, setActiveTab] = useState<'gateways' | 'business'>('gateways');
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGateway, setSelectedGateway] = useState<any>(null);
    
    const { data: gateways = [], isLoading: loadingGateways } = useQuery({
        queryKey: ['admin-gateways'],
        queryFn: () => adminApi.getGateways(),
    });

    const { data: settings = [], isLoading: loadingSettings } = useQuery({
        queryKey: ['admin-settings'],
        queryFn: () => adminApi.getSettings(),
    });

    const settingsMutation = useMutation({
        mutationFn: (data: any) => adminApi.updateSettings(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
            success('Sucesso', 'Regras de negócio atualizadas!');
        },
        onError: () => toastError('Erro', 'Falha ao atualizar configurações.')
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

    const handleUpdateTradeFee = (key: string, value: string) => {
        settingsMutation.mutate([{ key, value }]);
    };

    if (loadingGateways || loadingSettings) {
        return (
            <div className="flex h-96 items-center justify-center">
                <RefreshCw size={32} className="text-accent-500 animate-spin" />
            </div>
        );
    }

    const tradeFeeSetting = settings.find((s: any) => s.key === 'PLATFORM_TRADE_FEE') || { key: 'PLATFORM_TRADE_FEE', value: '0.02' };

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight">Configurações <span className="text-accent-500">Gerais</span></h1>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Gerencie o motor econômico e as integrações financeiras</p>
                </div>
            </div>

            {/* Custom Tabs */}
            <div className="flex gap-4 p-1.5 bg-white/[0.03] border border-white/5 rounded-[2rem] w-fit">
                <button
                    onClick={() => setActiveTab('gateways')}
                    className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                        activeTab === 'gateways' ? 'bg-accent-500 text-white shadow-glow-accent' : 'text-white/40 hover:text-white/60'
                    }`}
                >
                    Gateways de Pagamento
                </button>
                <button
                    onClick={() => setActiveTab('business')}
                    className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                        activeTab === 'business' ? 'bg-accent-500 text-white shadow-glow-accent' : 'text-white/40 hover:text-white/60'
                    }`}
                >
                    Regras de Negócio
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'gateways' ? (
                    <motion.div
                        key="gateways"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-8"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-accent-500">Conectores Financeiros</h3>
                            <button
                                onClick={handleNew}
                                className="bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[9px] px-6 py-3 rounded-xl border border-white/10 transition-all flex items-center gap-2"
                            >
                                <Plus size={14} /> Novo Gateway
                            </button>
                        </div>

                        {/* Gateways Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {gateways.map((gateway: any) => (
                                <motion.div
                                    key={gateway.id}
                                    className={`group relative overflow-hidden bg-black/40 backdrop-blur-xl border ${gateway.isActive ? 'border-accent-500/50 ring-2 ring-accent-500/20 shadow-glow-accent' : 'border-white/5'} rounded-[2.5rem] p-8`}
                                >
                                    {/* Active Indicator & Environment Badge */}
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            {gateway.isActive ? (
                                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent-500/10 border border-accent-500/20">
                                                    <motion.div 
                                                        animate={{ opacity: [1, 0.4, 1] }} 
                                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                                        className="h-1.5 w-1.5 rounded-full bg-accent-500" 
                                                    />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-accent-500">SISTEMA ATIVO</span>
                                                </div>
                                            ) : (
                                                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">DESATIVADO</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                                            gateway.environment === 'PRODUCTION' 
                                                ? 'bg-green-500/10 border-green-500/20 text-green-500 shadow-[0_0_15px_-5px_rgba(34,197,94,0.3)]' 
                                                : 'bg-orange-500/10 border-orange-500/20 text-orange-500'
                                        }`}>
                                            {gateway.environment === 'PRODUCTION' ? '🚀 OPERAÇÃO REAL' : '🧪 HOMOLOGAÇÃO'}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-5 mb-8">
                                        <div className={`h-16 w-16 rounded-[1.5rem] ${gateway.isActive ? 'bg-accent-500 text-white' : 'bg-white/5 text-white/30'} border border-current/10 flex items-center justify-center shadow-inner-surface transition-all duration-500`}>
                                            <Shield size={32} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black uppercase tracking-tight text-white mb-1">{gateway.name}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{gateway.provider}</span>
                                                <div className="h-1 w-1 rounded-full bg-white/10" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-500/60">PIX INSTANTÂNEO</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Config Summary */}
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-1">Endpoints</span>
                                            <span className="text-[10px] text-white/40 truncate block font-mono">
                                                {gateway.config?.baseUrl?.includes('hom') ? 'Test Environment' : 'Live Gateway'}
                                            </span>
                                        </div>
                                        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-1">Gatilhamento</span>
                                            <span className="text-[10px] text-white/40 truncate block font-mono">Autenticado v2</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(gateway)} className="p-3 rounded-2xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all"><Edit size={16} /></button>
                                            <button onClick={() => confirm('Excluir?') && deleteMutation.mutate(gateway.id)} className="p-3 rounded-2xl bg-red-500/5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 border border-red-500/5 hover:border-red-500/20 transition-all"><Trash2 size={16} /></button>
                                        </div>
                                        {!gateway.isActive ? (
                                            <button 
                                                onClick={() => activateMutation.mutate(gateway.id)} 
                                                className="h-12 px-8 rounded-2xl bg-accent-500 hover:bg-accent-600 text-white text-[10px] font-black uppercase tracking-widest shadow-glow-accent transition-all"
                                            >
                                                Assumir Controle
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-2 text-[10px] font-black text-accent-500/50 uppercase tracking-widest mr-4">
                                                <CheckCircle2 size={14} /> Master Ativo
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="business"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="space-y-8"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Trade Fees Card */}
                            <div className="md:col-span-2 bg-[#0a0a0a] border border-white/[0.05] rounded-[2.5rem] p-10 space-y-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                                
                                <div className="space-y-2 relative z-10">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Taxas e Comissões</h3>
                                    <p className="text-sm text-white/40 font-medium">Configure a porcentagem que a plataforma retém em cada operação de compra/venda.</p>
                                </div>

                                <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl space-y-8 relative z-10">
                                    <div className="flex flex-col gap-6">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black text-white/60 uppercase tracking-widest block">Taxa de Negociação Básica</span>
                                                <span className="text-xs text-white/30 font-medium">Aplicada sobre o valor total da aposta/trade.</span>
                                            </div>
                                            <div className="flex items-center gap-4 bg-black border border-white/10 p-2 rounded-2xl shadow-xl">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    defaultValue={parseFloat(tradeFeeSetting.value) * 100}
                                                    onBlur={(e) => handleUpdateTradeFee('PLATFORM_TRADE_FEE', (parseFloat(e.target.value) / 100).toString())}
                                                    className="w-20 bg-transparent text-xl font-black text-accent-500 outline-none p-1 text-center"
                                                />
                                                <span className="text-xl font-black text-white/20 pr-4">%</span>
                                            </div>
                                        </div>

                                        <div className="h-[1px] bg-white/[0.05]" />

                                        <div className="flex items-center justify-between opacity-50 grayscale pointer-events-none">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black text-white/60 uppercase tracking-widest block">Taxa de Saque (Withdrawal)</span>
                                                <span className="text-xs text-white/30 font-medium">Valor fixo ou percentual cobrado em saques PIX.</span>
                                            </div>
                                            <div className="flex items-center gap-4 bg-black border border-white/10 p-2 rounded-2xl">
                                                <span className="text-xl font-black text-white/10 px-4">EM BREVE</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-orange-500/5 border border-orange-500/10 p-4 rounded-2xl flex items-start gap-4 text-orange-400 relative z-10">
                                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                                        Aviso: Alterar a taxa de negociação afetará imediatamente todos os novos trades na plataforma.
                                    </span>
                                </div>
                            </div>

                            {/* Summary Card */}
                            <div className="bg-accent-500/5 border border-accent-500/10 rounded-[2.5rem] p-8 flex flex-col justify-between">
                                <div className="space-y-6">
                                    <div className="h-14 w-14 rounded-2xl bg-accent-500/10 text-accent-500 flex items-center justify-center">
                                        <TrendingUp size={28} />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-lg font-black uppercase text-white tracking-tight">Economia da Plataforma</h4>
                                        <p className="text-xs text-white/40 leading-relaxed font-medium transition-all">
                                            Sua política atual de {parseFloat(tradeFeeSetting.value) * 100}% garante um fluxo saudável para a cobertura da liquidez LMSR e manutenção do ecossistema.
                                        </p>
                                    </div>
                                </div>
                                
                                <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black text-white/60 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all">
                                    Ver Relatório de Taxas
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
