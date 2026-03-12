'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Shield, Save, Key, CheckCircle, RefreshCw, User as UserIcon, Mail, Fingerprint, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

// Máscara básica para CPF: 000.000.000-00 (usada no input)
const formatCpf = (value: string) => {
    return value
        .replace(/\D/g, '') // remove letras
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1')
        .substring(0, 14);
};

// Máscara de exibição: 000.***.***-00
const maskCpf = (value: string) => {
    if (!value) return '';
    const clean = value.replace(/\D/g, '');
    if (clean.length !== 11) return value;
    return `${clean.substring(0, 3)}.***.***-${clean.substring(9, 11)}`;
};

export default function ProfilePage() {
    const { user, setUser, _hasHydrated } = useAuthStore();
    const { success, error: toastError } = useToast();
    
    const [cpfInput, setCpfInput] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (user?.cpf) {
            setCpfInput(user.cpf); // Armazenar limpo internamente
        }
    }, [user]);

    const mutation = useMutation({
        mutationFn: (cpf: string) => authApi.updateProfile({ cpf }),
        onSuccess: (data) => {
            setUser(data.user);
            success('Sucesso', 'Seu CPF foi cadastrado como Chave PIX oficial!');
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || 'Falha ao salvar CPF.';
            toastError('Erro', msg);
        }
    });

    const handleSaveCpf = () => {
        const cleanCpf = cpfInput.replace(/\D/g, '');
        mutation.mutate(cleanCpf);
    };

    if (!mounted || !_hasHydrated) {
        return (
            <div className="mx-auto max-w-[1400px] px-6 lg:px-10 pb-20 flex flex-col items-center justify-center min-h-[60vh]">
                <RefreshCw size={40} className="text-accent-500 animate-spin mb-4" />
                <p className="text-white/20 font-black uppercase tracking-[0.3em] text-[10px]">Sincronizando Terminal...</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 pb-20 space-y-12">
            <header className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="h-2 w-8 bg-accent-500 rounded-full" />
                    <h1 className="text-4xl font-black uppercase tracking-tighter">Infraestrutura<span className="text-accent-500">.Perfil</span></h1>
                </div>
                <p className="text-white/40 text-sm font-medium tracking-tight border-l border-white/10 pl-4 ml-1">
                    Gerenciamento centralizado de identidade e protocolo de segurança PIX.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User Identity Column */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-8 relative overflow-hidden group shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                        
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-3xl bg-accent-950 border border-white/10 p-1 mb-6 group-hover:border-accent-500/50 transition-all duration-500 shadow-glow-accent/20">
                                <div className="h-full w-full rounded-2xl bg-gradient-to-br from-accent-600 to-accent-900 flex items-center justify-center text-3xl font-black text-white">
                                    {user?.name?.substring(0, 2).toUpperCase() || user?.username?.substring(0,2).toUpperCase() || 'M'}
                                </div>
                            </div>
                            
                            <h2 className="text-2xl font-black text-white tracking-tight leading-none mb-1">
                                {user?.name || 'Operador'}
                            </h2>
                            <p className="text-accent-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                                @{user?.username}
                            </p>

                            <div className="w-full space-y-4 pt-6 border-t border-white/5">
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-white/30 font-bold uppercase tracking-widest">Cargo</span>
                                    <span className="text-white font-black bg-white/5 px-3 py-1 rounded-lg border border-white/10">{user?.role}</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-white/30 font-bold uppercase tracking-widest">Status</span>
                                    <span className="flex items-center gap-2 text-yes-400 font-black">
                                        <div className="h-1.5 w-1.5 rounded-full bg-yes-400 animate-pulse" />
                                        AUTENTICADO
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 flex items-center gap-4 group cursor-default">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
                            <Mail size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-0.5">E-mail Principal</p>
                            <p className="text-sm text-white font-bold truncate">{user?.email}</p>
                        </div>
                    </div>
                </div>

                {/* PIX Security Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-10 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent-500/5 rounded-full blur-[100px] pointer-events-none translate-x-1/2 -translate-y-1/2" />
                        
                        <div className="flex items-start justify-between mb-10 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-accent-500/10 text-accent-500 flex items-center justify-center border border-accent-500/20 shadow-glow-accent/10">
                                    <Shield size={28} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight text-white mb-1">Cofre de Pagamentos</h3>
                                    <p className="text-xs text-white/40 font-medium">Protocolo de segurança PIX para saques instantâneos.</p>
                                </div>
                            </div>
                            <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                                <Fingerprint size={14} className="text-accent-500" />
                                <span className="text-[9px] font-black text-white uppercase tracking-widest">KYC: Verified</span>
                            </div>
                        </div>

                        <div className="bg-accent-500/5 border border-accent-500/10 rounded-2xl p-6 mb-10 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-accent-500/0 via-accent-500/[0.02] to-accent-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <p className="text-xs text-accent-100/60 leading-relaxed relative z-10">
                                <span className="text-accent-400 font-black mr-2">AVISO DE SEGURANÇA:</span> 
                                Para sua proteção, todos os resgates são vinculados obrigatoriamente ao seu <strong className="text-white">CPF TITULAR</strong>. 
                                Uma vez registrada, esta chave é blindada e não poderá ser alterada sem contato direto com o suporte especializado.
                            </p>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 flex items-center gap-2 ml-1">
                                    <Key size={14} className="text-accent-500" /> Registro de Identidade (CPF)
                                </label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={user?.cpf ? maskCpf(user.cpf) : formatCpf(cpfInput)}
                                        onChange={(e) => !user?.cpf && setCpfInput(e.target.value)}
                                        disabled={Boolean(user?.cpf)}
                                        placeholder="000.000.000-00"
                                        className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-5 text-lg font-black tracking-widest text-white placeholder:text-white/10 focus:outline-none focus:border-accent-400/50 disabled:bg-white/[0.01] disabled:text-white/40 disabled:cursor-not-allowed transition-all shadow-inner"
                                    />
                                    {user?.cpf && (
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                            <div className="px-3 py-1 bg-yes-500/10 border border-yes-500/20 rounded-lg text-[9px] font-black text-yes-400 uppercase tracking-widest">Bloqueado</div>
                                            <CheckCircle className="text-yes-400" size={18} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {!user?.cpf ? (
                                <button
                                    onClick={handleSaveCpf}
                                    disabled={cpfInput.replace(/\D/g, '').length < 11 || mutation.isPending}
                                    className="w-full bg-accent-500 hover:bg-accent-400 text-white font-black uppercase tracking-[0.3em] text-[11px] py-5 rounded-2xl flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-glow-accent disabled:opacity-30 disabled:grayscale"
                                >
                                    {mutation.isPending ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                                    Finalizar Registro PIX
                                </button>
                            ) : (
                                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                                    Documentação Sincronizada com o Gateway de Pagamentos
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="space-y-1 text-center sm:text-left">
                            <h4 className="text-sm font-black text-white uppercase tracking-tight">Precisa de Ajuda?</h4>
                            <p className="text-xs text-white/30 font-medium">Contate nosso suporte para alteração de dados sensíveis.</p>
                        </div>
                        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent-500 hover:text-accent-400 transition-colors bg-accent-500/5 px-6 py-3 rounded-xl border border-accent-500/20">
                            Abrir Ticket <ExternalLink size={12} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
