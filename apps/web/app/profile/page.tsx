'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { Shield, Save, Key, CheckCircle, RefreshCw } from 'lucide-react';

// Máscara básica para CPF: 000.000.000-00
const formatCpf = (value: string) => {
    return value
        .replace(/\D/g, '') // remove letras
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1'); // max 14 chars
};

export default function ProfilePage() {
    const { user, setUser } = useAuthStore();
    const { success, error: toastError } = useToast();
    
    const [cpfInput, setCpfInput] = useState('');

    useEffect(() => {
        if (user?.cpf) {
            setCpfInput(formatCpf(user.cpf));
        }
    }, [user]);

    const mutation = useMutation({
        mutationFn: (cpf: string) => authApi.updateProfile({ cpf }),
        onSuccess: (data) => {
            // Update auth store with new user data
            setUser(data.user);
            success('Sucesso', 'Seu CPF foi cadastrado como Chave PIX oficial!');
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || 'Falha ao salvar CPF.';
            toastError('Erro', msg);
        }
    });

    const handleSaveCpf = () => {
        mutation.mutate(cpfInput);
    };

    return (
        <div className="mx-auto max-w-4xl px-6 pt-36 pb-20 space-y-8">
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tight">Meu Perfil</h1>
                <p className="text-white/40 text-sm mt-1">Gerencie suas informações e chaves PIX de saque.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Data Card */}
                <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-white/50 mb-2">Usuário</h3>
                    <p className="text-lg font-black">{user?.name || 'Carregando...'}</p>
                    <h3 className="text-sm font-bold text-white/50 mt-6 mb-2">E-mail</h3>
                    <p className="text-lg font-black">{user?.email || '...'}</p>
                </div>

                {/* PIX Key / CPF Card */}
                <div className="bg-black/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/10 rounded-full blur-[50px] pointer-events-none" />
                    
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-xl bg-accent-500/10 text-accent-500 flex items-center justify-center">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white/70">Chave PIX (Saque)</h3>
                        </div>
                    </div>

                    <p className="text-xs text-white/40 mb-6 leading-relaxed">
                        Por motivos de segurança e combate à fraude, todos os saques devem ser realizados exclusivamente para a chave PIX do seu <strong className="text-white/80">CPF titular</strong>. O CPF não poderá ser alterado após o cadastro.
                    </p>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-white/50 flex items-center gap-2">
                                <Key size={14} /> Seu CPF
                            </label>
                            <input
                                type="text"
                                value={cpfInput}
                                onChange={(e) => setCpfInput(formatCpf(e.target.value))}
                                disabled={Boolean(user?.cpf)}
                                placeholder="000.000.000-00"
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            />
                        </div>

                        {!user?.cpf ? (
                            <button
                                onClick={handleSaveCpf}
                                disabled={cpfInput.length < 14 || mutation.isPending}
                                className="w-full bg-accent-500 hover:bg-accent-600 text-white font-black uppercase tracking-widest text-xs px-6 py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {mutation.isPending ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                                Salvar Chave PIX
                            </button>
                        ) : (
                            <div className="w-full bg-white/5 border border-white/10 text-white/70 font-bold uppercase tracking-widest text-xs px-6 py-4 rounded-xl flex items-center justify-center gap-2">
                                <CheckCircle size={16} className="text-accent-500" />
                                Chave PIX Registrada e Travada
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
