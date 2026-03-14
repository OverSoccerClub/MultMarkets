'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useToast } from '@/components/ui/Toast';
import { Eye, EyeOff, Lock, Mail, LogIn, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';
import { FuturisticOverlay, DataStream } from '@/components/layout/PremiumVisuals';

const schema = z.object({
    email: z.string().email('E-mail institucional inválido'),
    password: z.string().min(1, 'Assinatura criptográfica obrigatória'),
});

type FormData = z.infer<typeof schema>;

export default function AdminLoginPage() {
    const router = useRouter();
    const { success, error: toastError } = useToast();
    const { setTokens, setUser } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
    const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        mouseX.set(e.clientX - centerX);
        mouseY.set(e.clientY - centerY);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        setError('');
        try {
            const result = await authApi.login(data);

            // Check if user has admin/operator role before proceeding
            setTokens(result.accessToken, result.refreshToken);
            const me = await authApi.me();

            if (me.role !== 'ADMIN' && me.role !== 'OPERATOR') {
                setError('Acesso negado: Credenciais sem privilégios administrativos.');
                toastError('Acesso Negado', 'Este terminal é restrito a administradores.');
                return;
            }

            setUser(me);
            success('Bem-vindo, Comandante', 'Acesso autorizado ao terminal administrativo.');
            window.location.href = '/admin';
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? 'Falha na autenticação administrativa.';
            setError(msg);
            toastError('Falha no Login', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#050505] selection:bg-accent-500/30 overflow-hidden relative font-mono">
            <DataStream position="left" />
            <DataStream position="right" />
            <FuturisticOverlay />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03)_0%,transparent_70%)]" />

            <motion.div
                className="w-full max-w-md space-y-8 relative"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-accent-500/5 border border-accent-500/20 mb-4">
                        <Zap size={14} className="text-accent-500 animate-pulse" />
                        <span className="text-[10px] font-black text-accent-500 tracking-[0.3em] uppercase">Security Level: Maximum</span>
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">ADMIN TERMINAL</h1>
                    <p className="text-white/20 text-xs tracking-widest uppercase">Unauthorized access is strictly prohibited</p>
                </div>

                <motion.div
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={{ rotateX, rotateY, perspective: 1000 }}
                    className="bg-[#0a0a0a] border-2 border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative group"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-500/50 to-transparent" />

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Institucional ID</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-accent-500" />
                                <input
                                    {...register('email')}
                                    type="email"
                                    className="w-full bg-white/[0.02] border border-white/5 focus:border-accent-500/30 rounded-2xl py-4 pl-14 pr-6 text-sm text-white placeholder:text-white/5 outline-none transition-all"
                                    placeholder="admin@multmarkets.com"
                                />
                            </div>
                            {errors.email && <p className="text-no-500 text-[9px] font-black uppercase mt-1 ml-1">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Cripto Passkey</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-accent-500" />
                                <input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    className="w-full bg-white/[0.02] border border-white/5 focus:border-accent-500/30 rounded-2xl py-4 pl-14 pr-14 text-sm text-white placeholder:text-white/5 outline-none transition-all font-sans"
                                    placeholder="••••••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-white/10 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && <p className="text-no-500 text-[9px] font-black uppercase mt-1 ml-1">{errors.password.message}</p>}
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 rounded-2xl bg-no-500/5 border border-no-500/20 flex items-center gap-3"
                            >
                                <AlertTriangle size={16} className="text-no-400 flex-shrink-0" />
                                <p className="text-[10px] font-black text-no-400 uppercase leading-tight">{error}</p>
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-accent-500 text-white font-black py-5 rounded-2xl text-[11px] uppercase tracking-[0.3em] hover:bg-accent-400 transition-all duration-300 shadow-glow-accent disabled:opacity-50 flex items-center justify-center gap-3 group"
                        >
                            {loading ? (
                                <span className="animate-pulse">Sincronizando...</span>
                            ) : (
                                <>
                                    <span>Inicializar Terminal</span>
                                    <ShieldCheck size={18} className="group-hover:rotate-12 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>

                <div className="text-center pt-4">
                    <button
                        onClick={() => router.push('/')}
                        className="text-[9px] font-black text-white/20 hover:text-white uppercase tracking-[0.4em] transition-colors"
                    >
                        ← Voltar para Rede Pública
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
