'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Save, Shield, Key, Link as LinkIcon, RefreshCw, EyeOff, Eye } from 'lucide-react';

export default function AdminSettingsPage() {
    const queryClient = useQueryClient();
    
    // Form states
    const [baseUrl, setBaseUrl] = useState('');
    const [clientId, setClientId] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [accountId, setAccountId] = useState('');
    
    const [webhookSecret, setWebhookSecret] = useState('');
    
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
            setBaseUrl(getVal('BANKIZI_BASE_URL'));
            setClientId(getVal('BANKIZI_CLIENT_ID'));
            setClientSecret(getVal('BANKIZI_CLIENT_SECRET'));
            setAccountId(getVal('BANKIZI_ACCOUNT_ID'));
            setWebhookSecret(getVal('BANKIZI_WEBHOOK_SECRET'));
        }
    }, [settings]);

    const mutation = useMutation({
        mutationFn: (newSettings: any[]) => adminApi.updateSettings(newSettings),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
            alert('Configurações salvas com sucesso!');
        },
        onError: (err) => {
            console.error('Failed to save settings', err);
            alert('Erro ao salvar configurações.');
        }
    });

    const handleSave = () => {
        const payload = [
            { key: 'BANKIZI_BASE_URL', value: baseUrl, description: 'Bankizi API Base URL' },
            { key: 'BANKIZI_CLIENT_ID', value: clientId, description: 'Bankizi Client ID' },
            { key: 'BANKIZI_CLIENT_SECRET', value: clientSecret, description: 'Bankizi Client Secret', isSecret: true },
            { key: 'BANKIZI_ACCOUNT_ID', value: accountId, description: 'Bankizi Account ID (Optional)' },
            { key: 'BANKIZI_WEBHOOK_SECRET', value: webhookSecret, description: 'Bankizi Webhook Secret', isSecret: true },
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
                
                <div className="flex items-center gap-4 mb-8">
                    <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-accent-500 shadow-inner-surface">
                        <Shield size={28} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Gateway Bankizi (PIX)</h3>
                        <p className="text-white/40 text-xs mt-1">Configurações de integração bancária para depósitos e saques PIX.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Input Group */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-white/50 flex items-center gap-2">
                                <LinkIcon size={14} /> URL Base da API
                            </label>
                            <input
                                type="text"
                                value={baseUrl}
                                onChange={(e) => setBaseUrl(e.target.value)}
                                placeholder="https://api-hom.bankizi.com/api"
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500 focus:bg-white/[0.05] transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-white/50 flex items-center gap-2">
                                <Key size={14} /> Client ID
                            </label>
                            <input
                                type="text"
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
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
                                value={clientSecret}
                                onChange={(e) => setClientSecret(e.target.value)}
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
                                value={accountId}
                                onChange={(e) => setAccountId(e.target.value)}
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
                                value={webhookSecret}
                                onChange={(e) => setWebhookSecret(e.target.value)}
                                placeholder="••••••••••••••••"
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500 focus:bg-white/[0.05] transition-all"
                            />
                        </div>
                    </div>

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
