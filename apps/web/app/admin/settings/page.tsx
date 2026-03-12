'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Save, Shield, Key, Link as LinkIcon, RefreshCw, EyeOff, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function AdminSettingsPage() {
    const queryClient = useQueryClient();
    const { success, error: toastError } = useToast();
    
    // Master toggle
    const [environment, setEnvironment] = useState<'SANDBOX' | 'PRODUCTION'>('SANDBOX');

    // Sandbox states
    const [sandboxBaseUrl, setSandboxBaseUrl] = useState('');
    const [sandboxClientId, setSandboxClientId] = useState('');
    const [sandboxClientSecret, setSandboxClientSecret] = useState('');
    const [sandboxAccountId, setSandboxAccountId] = useState('');
    const [sandboxWebhookSecret, setSandboxWebhookSecret] = useState('');
    
    // Production states
    const [prodBaseUrl, setProdBaseUrl] = useState('');
    const [prodClientId, setProdClientId] = useState('');
    const [prodClientSecret, setProdClientSecret] = useState('');
    const [prodAccountId, setProdAccountId] = useState('');
    const [prodWebhookSecret, setProdWebhookSecret] = useState('');
    
    // UI states
    const [showSecret, setShowSecret] = useState(false);
    
    const { data: settings = [], isLoading } = useQuery({
        queryKey: ['admin-settings'],
        queryFn: () => adminApi.getSettings(),
    });

    // Populate state on load
    React.useEffect(() => {
        if (settings.length > 0) {
            const getVal = (k: string) => settings.find((s: any) => s.key === k)?.value || '';
            
            setEnvironment((getVal('BANKIZI_ENVIRONMENT') as 'SANDBOX' | 'PRODUCTION') || 'SANDBOX');

            setSandboxBaseUrl(getVal('BANKIZI_SANDBOX_BASE_URL'));
            setSandboxClientId(getVal('BANKIZI_SANDBOX_CLIENT_ID'));
            setSandboxClientSecret(getVal('BANKIZI_SANDBOX_CLIENT_SECRET'));
            setSandboxAccountId(getVal('BANKIZI_SANDBOX_ACCOUNT_ID'));
            setSandboxWebhookSecret(getVal('BANKIZI_SANDBOX_WEBHOOK_SECRET'));

            setProdBaseUrl(getVal('BANKIZI_PRODUCTION_BASE_URL'));
            setProdClientId(getVal('BANKIZI_PRODUCTION_CLIENT_ID'));
            setProdClientSecret(getVal('BANKIZI_PRODUCTION_CLIENT_SECRET'));
            setProdAccountId(getVal('BANKIZI_PRODUCTION_ACCOUNT_ID'));
            setProdWebhookSecret(getVal('BANKIZI_PRODUCTION_WEBHOOK_SECRET'));
        }
    }, [settings]);

    const mutation = useMutation({
        mutationFn: (newSettings: any[]) => adminApi.updateSettings(newSettings),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
            success('Sucesso', 'Configurações salvas com sucesso!');
        },
        onError: (err) => {
            console.error('Failed to save settings', err);
            toastError('Erro', 'Não foi possível salvar as configurações.');
        }
    });

    const handleSave = () => {
        const payload = [
            { key: 'BANKIZI_ENVIRONMENT', value: environment, description: 'Bankizi Active Environment' },
            
            { key: 'BANKIZI_SANDBOX_BASE_URL', value: sandboxBaseUrl, description: 'Bankizi Sandbox Base URL' },
            { key: 'BANKIZI_SANDBOX_CLIENT_ID', value: sandboxClientId, description: 'Bankizi Sandbox Client ID' },
            { key: 'BANKIZI_SANDBOX_CLIENT_SECRET', value: sandboxClientSecret, description: 'Bankizi Sandbox Client Secret', isSecret: true },
            { key: 'BANKIZI_SANDBOX_ACCOUNT_ID', value: sandboxAccountId, description: 'Bankizi Sandbox Account ID (Optional)' },
            { key: 'BANKIZI_SANDBOX_WEBHOOK_SECRET', value: sandboxWebhookSecret, description: 'Bankizi Sandbox Webhook Secret', isSecret: true },

            { key: 'BANKIZI_PRODUCTION_BASE_URL', value: prodBaseUrl, description: 'Bankizi Prod Base URL' },
            { key: 'BANKIZI_PRODUCTION_CLIENT_ID', value: prodClientId, description: 'Bankizi Prod Client ID' },
            { key: 'BANKIZI_PRODUCTION_CLIENT_SECRET', value: prodClientSecret, description: 'Bankizi Prod Client Secret', isSecret: true },
            { key: 'BANKIZI_PRODUCTION_ACCOUNT_ID', value: prodAccountId, description: 'Bankizi Prod Account ID (Optional)' },
            { key: 'BANKIZI_PRODUCTION_WEBHOOK_SECRET', value: prodWebhookSecret, description: 'Bankizi Prod Webhook Secret', isSecret: true },
        ];
        mutation.mutate(payload);
    };

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <RefreshCw size={32} className="text-accent-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl space-y-8 pb-20">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-black tracking-tight uppercase">Configurações do Sistema</h2>
                <p className="text-white/40 text-sm mt-1">
                    Gerencie os gateways de pagamento e integrações da plataforma.
                </p>
            </div>

            {/* Bankizi Gateway Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 overflow-hidden relative group"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/5 rounded-full blur-[80px] pointer-events-none" />
                
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-accent-500 shadow-inner-surface">
                        <Shield size={28} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Gateway Bankizi (PIX)</h3>
                        <p className="text-white/40 text-xs mt-1">Configurações de integração bancária para depósitos e saques PIX.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Environment Toggle Segmented Control */}
                    <div className="flex p-1 bg-black/40 border border-white/10 rounded-2xl relative mb-6">
                        <div
                            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-accent-500/20 backdrop-blur-md rounded-xl border border-accent-500/30 transition-all duration-300 ease-in-out ${environment === 'SANDBOX' ? 'translate-x-0' : 'translate-x-[calc(100%+8px)]'}`}
                        />
                        <button
                            type="button"
                            onClick={() => setEnvironment('SANDBOX')}
                            className={`flex-1 py-3 text-sm font-bold uppercase tracking-widest relative z-10 transition-colors ${environment === 'SANDBOX' ? 'text-accent-400' : 'text-white/50 hover:text-white/80'}`}
                        >
                            🧪 Homologação (Sandbox)
                        </button>
                        <button
                            type="button"
                            onClick={() => setEnvironment('PRODUCTION')}
                            className={`flex-1 py-3 text-sm font-bold uppercase tracking-widest relative z-10 transition-colors ${environment === 'PRODUCTION' ? 'text-accent-400' : 'text-white/50 hover:text-white/80'}`}
                        >
                            🚀 Produção
                        </button>
                    </div>

                    {/* Input Group */}
                    <motion.div
                        key={environment}
                        initial={{ opacity: 0, x: environment === 'SANDBOX' ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-white/50 flex items-center gap-2">
                                <LinkIcon size={14} /> URL Base da API
                            </label>
                            <input
                                type="text"
                                value={environment === 'SANDBOX' ? sandboxBaseUrl : prodBaseUrl}
                                onChange={(e) => environment === 'SANDBOX' ? setSandboxBaseUrl(e.target.value) : setProdBaseUrl(e.target.value)}
                                placeholder={environment === 'SANDBOX' ? "https://api-hom.bankizi.com/api" : "https://api.bankizi.com.br/api"}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500 focus:bg-white/[0.05] transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-white/50 flex items-center gap-2">
                                <Key size={14} /> Client ID
                            </label>
                            <input
                                type="text"
                                value={environment === 'SANDBOX' ? sandboxClientId : prodClientId}
                                onChange={(e) => environment === 'SANDBOX' ? setSandboxClientId(e.target.value) : setProdClientId(e.target.value)}
                                placeholder="UUID do cliente"
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500 focus:bg-white/[0.05] transition-all"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2 relative">
                            <label className="text-xs font-bold uppercase tracking-widest text-white/50 flex items-center justify-between">
                                <span className="flex items-center gap-2"><Key size={14} /> Client Secret</span>
                                <button type="button" onClick={() => setShowSecret(!showSecret)} className="text-accent-500 hover:text-accent-400">
                                    {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </label>
                            <input
                                type={showSecret ? 'text' : 'password'}
                                value={environment === 'SANDBOX' ? sandboxClientSecret : prodClientSecret}
                                onChange={(e) => environment === 'SANDBOX' ? setSandboxClientSecret(e.target.value) : setProdClientSecret(e.target.value)}
                                placeholder="••••••••••••••••"
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500 focus:bg-white/[0.05] transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-white/50 flex items-center gap-2">
                                <Shield size={14} /> Account ID (Opcional)
                            </label>
                            <input
                                type="text"
                                value={environment === 'SANDBOX' ? sandboxAccountId : prodAccountId}
                                onChange={(e) => environment === 'SANDBOX' ? setSandboxAccountId(e.target.value) : setProdAccountId(e.target.value)}
                                placeholder="Deixe vazio se for conta única"
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500 focus:bg-white/[0.05] transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-white/50 flex items-center gap-2">
                                <Key size={14} /> Webhook Secret
                            </label>
                            <input
                                type={showSecret ? 'text' : 'password'}
                                value={environment === 'SANDBOX' ? sandboxWebhookSecret : prodWebhookSecret}
                                onChange={(e) => environment === 'SANDBOX' ? setSandboxWebhookSecret(e.target.value) : setProdWebhookSecret(e.target.value)}
                                placeholder="••••••••••••••••"
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500 focus:bg-white/[0.05] transition-all"
                            />
                        </div>
                    </motion.div>

                    <div className="pt-6 border-t border-white/5 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={mutation.isPending}
                            className="bg-accent-500 hover:bg-accent-600 text-white font-black uppercase tracking-widest text-xs px-8 py-4 rounded-xl flex items-center gap-3 transition-colors disabled:opacity-50"
                        >
                            {mutation.isPending ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                            Salvar Configurações
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
