'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Key, Link as LinkIcon, Shield, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface GatewayFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    initialData?: any;
    isLoading?: boolean;
}

export function GatewayFormModal({ isOpen, onClose, onSave, initialData, isLoading }: GatewayFormModalProps) {
    const [name, setName] = useState('');
    const [provider, setProvider] = useState('BANKIZI');
    const [environment, setEnvironment] = useState<'SANDBOX' | 'PRODUCTION'>('SANDBOX');
    
    // Separate states for each environment
    const [sandboxConfig, setSandboxConfig] = useState<any>({});
    const [productionConfig, setProductionConfig] = useState<any>({});

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || '');
            setProvider(initialData.provider || 'BANKIZI');
            setEnvironment(initialData.environment || 'SANDBOX');
            
            // If the data already has environment-specific configs (or we use current env)
            if (initialData.environment === 'PRODUCTION') {
                setProductionConfig(initialData.config || {});
                setSandboxConfig({}); // Or fetch if stored elsewhere
            } else {
                setSandboxConfig(initialData.config || {});
                setProductionConfig({});
            }
        } else {
            setName('');
            setProvider('BANKIZI');
            setEnvironment('SANDBOX');
            setSandboxConfig({});
            setProductionConfig({});
        }
    }, [initialData, isOpen]);

    const handleConfigChange = (key: string, value: string) => {
        if (environment === 'SANDBOX') {
            setSandboxConfig((prev: any) => ({ ...prev, [key]: value }));
        } else {
            setProductionConfig((prev: any) => ({ ...prev, [key]: value }));
        }
    };

    const currentConfig = environment === 'SANDBOX' ? sandboxConfig : productionConfig;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name,
            provider,
            environment,
            config: currentConfig,
            type: 'PIX',
            isActive: false, // Let the user activate manually to avoid accidents
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Editar Gateway" : "Novo Gateway"}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-white/50">Nome do Gateway</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Bankizi Principal"
                            required
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-500 transition-all outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-white/50">Provedor</label>
                        <select
                            value={provider}
                            onChange={(e) => setProvider(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-500 transition-all outline-none appearance-none"
                        >
                            <option value="BANKIZI" className="bg-black">Bankizi (PIX)</option>
                            <option value="SUITPAY" className="bg-black" disabled>SuitPay (Em breve)</option>
                        </select>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-white/50">Ambiente de Operação</label>
                        <div className="flex p-1 bg-black/40 border border-white/10 rounded-2xl relative">
                            <motion.div
                                layoutId="env-bg"
                                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-accent-500/20 backdrop-blur-md rounded-xl border border-accent-500/30 transition-all ${environment === 'SANDBOX' ? 'translate-x-0' : 'translate-x-[calc(100%+8px)]'}`}
                            />
                            <button
                                type="button"
                                onClick={() => setEnvironment('SANDBOX')}
                                className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest relative z-10 transition-colors ${environment === 'SANDBOX' ? 'text-accent-400' : 'text-white/50'}`}
                            >
                                🧪 Homologação
                            </button>
                            <button
                                type="button"
                                onClick={() => setEnvironment('PRODUCTION')}
                                className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest relative z-10 transition-colors ${environment === 'PRODUCTION' ? 'text-accent-400' : 'text-white/50'}`}
                            >
                                🚀 Produção
                            </button>
                        </div>
                        <p className="text-[10px] text-white/30 font-medium px-2">
                            {environment === 'SANDBOX' 
                                ? "Modo de teste. Nenhuma transação real será processada." 
                                : "Modo real. Atenção: Transações financeiras verdadeiras serão enviadas."}
                        </p>
                    </div>

                    {provider === 'BANKIZI' && (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-white/50 flex items-center gap-2">
                                    <LinkIcon size={14} /> URL Base
                                </label>
                                <input
                                    type="text"
                                    value={currentConfig.baseUrl || ''}
                                    onChange={(e) => handleConfigChange('baseUrl', e.target.value)}
                                    placeholder={environment === 'SANDBOX' ? "https://api-hom.bankizi.com/api" : "https://api.bankizi.com.br/api"}
                                    required
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-500 transition-all outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-white/50 flex items-center gap-2">
                                    <Key size={14} /> Client ID
                                </label>
                                <input
                                    type="text"
                                    value={currentConfig.clientId || ''}
                                    onChange={(e) => handleConfigChange('clientId', e.target.value)}
                                    placeholder="UUID do cliente"
                                    required
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-500 transition-all outline-none"
                                />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-white/50 flex items-center gap-2">
                                    <Shield size={14} /> Client Secret
                                </label>
                                <input
                                    type="password"
                                    value={currentConfig.clientSecret || ''}
                                    onChange={(e) => handleConfigChange('clientSecret', e.target.value)}
                                    placeholder="••••••••••••••••"
                                    required
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-500 transition-all outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-white/50 flex items-center gap-2">
                                    <LinkIcon size={14} /> Account ID (Opcional)
                                </label>
                                <input
                                    type="text"
                                    value={currentConfig.accountId || ''}
                                    onChange={(e) => handleConfigChange('accountId', e.target.value)}
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-500 transition-all outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-white/50 flex items-center gap-2">
                                    <Shield size={14} /> Webhook Secret
                                </label>
                                <input
                                    type="password"
                                    value={currentConfig.webhookSecret || ''}
                                    onChange={(e) => handleConfigChange('webhookSecret', e.target.value)}
                                    placeholder="••••••••••••••••"
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-500 transition-all outline-none"
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="pt-6 flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-accent-500 hover:bg-accent-600 px-10 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                        <Save size={16} />
                        {initialData ? "Atualizar Gateway" : "Cadastrar Gateway"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
