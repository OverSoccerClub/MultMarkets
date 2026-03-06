'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Eye, EyeOff, Lock, Mail, LogIn, ShieldCheck } from 'lucide-react';
import { FuturisticOverlay, DataStream, LiveCandlesticks } from '@/components/layout/PremiumVisuals';

const schema = z.object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(1, 'Senha obrigatória'),
    totpCode: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
    const router = useRouter();
    const { setTokens, setUser } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [requires2FA, setRequires2FA] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    // 🌊 3D Tilt Effect
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

            if (result.requiresTwoFactor) {
                setRequires2FA(true);
                return;
            }

            setTokens(result.accessToken, result.refreshToken);
            const me = await authApi.me();
            setUser(me);
            router.push('/');
        } catch (err: any) {
            setError(err?.response?.data?.message ?? 'Erro ao entrar. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-black selection:bg-accent-500/30 overflow-hidden relative">
            {/* 🌌 Animated Background Elements */}
            <LiveCandlesticks />
            <DataStream position="left" />
            <DataStream position="right" />
            <FuturisticOverlay />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,163,255,0.05)_0%,transparent_70%)]" />

            <motion.div
                className="w-full max-w-md space-y-6 relative"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
            >
                {/* Logo */}
                <div className="text-center space-y-4">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-600 to-accent-400 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] mx-auto border border-white/10"
                    >
                        <span className="text-white font-black text-2xl tracking-tighter">M</span>
                    </motion.div>
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-500/10 border border-accent-500/20 mb-2">
                            <ShieldCheck size={12} className="text-accent-400" />
                            <span className="text-[10px] font-bold text-accent-400 tracking-widest uppercase">Elite Intelligence Terminal</span>
                        </div>
                        <h1 className="text-4xl font-display font-black text-white tracking-tight">TERMINAL ACCESS</h1>
                        <p className="text-gray-500 text-sm font-medium">Decifre o inavitável. Opere o amanhã.</p>
                    </div>
                </div>

                {/* Form card with 3D Tilt */}
                <motion.div
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={{ rotateX, rotateY, perspective: 1000 }}
                    className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-6 relative group"
                >
                    <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 relative z-10">

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Terminal ID (E-mail)</label>
                            <div className="relative group">
                                <div className="absolute inset-0 bg-accent-500/5 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 transition-colors group-focus-within:text-accent-500" />
                                <input
                                    {...register('email')}
                                    type="email"
                                    className="w-full bg-black/40 border border-white/5 focus:border-accent-500/50 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-gray-700 outline-none transition-all"
                                    placeholder="USUÁRIO@TERMINAL.FIN"
                                    autoComplete="email"
                                />
                            </div>
                            {errors.email && <p className="text-red-500/80 text-[10px] font-bold uppercase tracking-tight ml-1">{errors.email.message}</p>}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Acesso Criptografado</label>
                                <Link href={"/auth/forgot-password" as any} id="forgot-password" className="text-[10px] font-bold text-accent-500/70 hover:text-accent-500 uppercase tracking-widest transition-colors">
                                    Recuperar
                                </Link>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-0 bg-accent-500/5 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 transition-colors group-focus-within:text-accent-500" />
                                <input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    className="w-full bg-black/40 border border-white/5 focus:border-accent-500/50 rounded-xl py-3.5 pl-11 pr-12 text-sm text-white placeholder:text-gray-700 outline-none transition-all"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-500/80 text-[10px] font-bold uppercase tracking-tight ml-1">{errors.password.message}</p>}
                        </div>

                        {/* 2FA (shown after first step) */}
                        {requires2FA && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                <label className="text-label text-text-muted block mb-1.5">Código 2FA (Google Authenticator)</label>
                                <input
                                    {...register('totpCode')}
                                    type="text"
                                    maxLength={6}
                                    className="input text-center text-num-md tracking-widest w-full font-mono"
                                    placeholder="000000"
                                    autoFocus
                                />
                            </motion.div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="p-3 rounded-lg bg-no-500/10 border border-no-500/20 text-no-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-black font-black py-4 rounded-xl text-xs uppercase tracking-[0.2em] hover:bg-accent-500 hover:text-white transition-all duration-300 shadow-xl disabled:opacity-50 flex items-center justify-center gap-3 overflow-hidden group"
                        >
                            {loading ? (
                                <span className="animate-pulse">Autenticando...</span>
                            ) : (
                                <>
                                    <span className="group-hover:translate-x-1 transition-transform">ACESSAR SISTEMA</span>
                                    <LogIn size={16} />
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>

                <p className="text-center text-gray-600 text-[10px] font-bold uppercase tracking-widest">
                    Novo operador?{' '}
                    <Link href="/auth/register" className="text-accent-500 hover:text-accent-400 transition-colors ml-1">
                        Registrar Credenciais
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
