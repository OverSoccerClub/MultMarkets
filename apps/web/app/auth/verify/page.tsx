'use client';
import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { authApi } from '@/lib/api';
import { CheckCircle2, ShieldCheck, Mail, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { FuturisticOverlay, DataStream, LiveCandlesticks } from '@/components/layout/PremiumVisuals';
import Link from 'next/link';

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId');

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState('');
    const [resendMessage, setResendMessage] = useState('');
    const [success, setSuccess] = useState(false);
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length !== 6) return;
        
        setLoading(true);
        setError('');
        setResendMessage('');

        if (!userId) {
            setError('Sessão de verificação expirada. Por favor, tente se registrar novamente.');
            setLoading(false);
            return;
        }

        try {
            await authApi.verifyKyc({ userId, emailCode: code });
            setSuccess(true);
            setTimeout(() => {
                window.location.href = '/auth/login';
            }, 2500);
        } catch (err: any) {
            setError(err?.response?.data?.message ?? 'Código incorreto ou expirado.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!userId || countdown > 0) return;
        
        setResending(true);
        setError('');
        try {
            const res = await authApi.resendVerification(userId);
            setResendMessage(res.message);
            setCountdown(60); // 1 minute cooldown
        } catch (err: any) {
            setError('Erro ao reenviar código. Tente novamente mais tarde.');
        } finally {
            setResending(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
                <FuturisticOverlay opacity={0.3} />
                <motion.div
                    className="text-center space-y-6 relative z-10"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <div className="relative mx-auto w-24 h-24">
                        <motion.div 
                            className="absolute inset-0 bg-accent-500/20 rounded-full blur-2xl"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        <CheckCircle2 size={96} className="text-accent-500 relative z-10" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase">IDENTIDADE CONFIRMADA</h2>
                        <p className="text-accent-500/60 font-bold tracking-widest text-xs uppercase animate-pulse">
                            Acesso autorizado ao terminal de elite
                        </p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-black selection:bg-accent-500/30 overflow-hidden relative">
            <LiveCandlesticks />
            <DataStream position="left" />
            <DataStream position="right" />
            <FuturisticOverlay />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,163,255,0.05)_0%,transparent_70%)]" />

            <motion.div
                className="w-full max-w-md space-y-8 relative"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                {/* Header Container */}
                <div className="text-center space-y-6">
                    <motion.div
                        initial={{ rotateY: 0 }}
                        animate={{ rotateY: 360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent-600 to-accent-400 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.4)] mx-auto border border-white/20 relative"
                    >
                        <ShieldCheck className="text-white" size={40} />
                        <div className="absolute inset-0 rounded-3xl border border-white/30 animate-ping opacity-20" />
                    </motion.div>
                    
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-500/10 border border-accent-500/20 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" />
                            <span className="text-[10px] font-black text-accent-500 tracking-[0.2em] uppercase">Protocolo de Ativação</span>
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">VALIDAR<br/><span className="text-accent-500">TERMINAL</span></h1>
                        <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest max-w-[280px] mx-auto leading-relaxed">
                            Insira o código de ativação enviado para o seu <span className="text-white/60">e-mail institucional</span>.
                        </p>
                    </div>
                </div>

                <div className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] relative group">
                    <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
                    
                    <form onSubmit={handleVerify} className="space-y-8 relative z-10">
                        {/* OTP Input */}
                        <div className="space-y-4">
                            <div className="relative">
                                <Mail size={16} className="absolute -top-10 left-1/2 -translate-x-1/2 text-accent-500/50" />
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                    className="w-full bg-white/[0.02] border-b-2 border-white/10 focus:border-accent-500 text-center text-5xl font-black tracking-[0.4em] py-4 text-white outline-none transition-all placeholder:text-white/5 selection:bg-accent-500/20"
                                    placeholder="000000"
                                    autoFocus
                                    required
                                />
                            </div>

                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex items-center gap-2 text-no-400 text-[10px] font-black uppercase tracking-widest bg-no-500/5 p-3 rounded-xl border border-no-500/20"
                                    >
                                        <AlertCircle size={14} />
                                        {error}
                                    </motion.div>
                                )}
                                {resendMessage && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex items-center gap-2 text-yes-400 text-[10px] font-black uppercase tracking-widest bg-yes-500/5 p-3 rounded-xl border border-yes-500/20"
                                    >
                                        <CheckCircle2 size={14} />
                                        {resendMessage}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || code.length !== 6}
                            className="w-full bg-white text-black font-black py-5 rounded-2xl text-[11px] uppercase tracking-[0.3em] hover:bg-accent-500 hover:text-white transition-all duration-300 shadow-xl disabled:opacity-30 group flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <RefreshCw className="animate-spin" size={18} />
                            ) : (
                                <>
                                    <span>Ativar Credenciais</span>
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center space-y-4">
                        <button
                            onClick={handleResend}
                            disabled={resending || countdown > 0}
                            className="text-[10px] font-black text-white/30 hover:text-accent-500 uppercase tracking-[0.2em] transition-all disabled:opacity-50 flex items-center gap-2 mx-auto decoration-accent-500/30 underline-offset-4 hover:underline"
                        >
                            {resending ? (
                                <RefreshCw className="animate-spin" size={12} />
                            ) : countdown > 0 ? (
                                `Aguarde ${countdown}s para reenviar`
                            ) : (
                                "Não recebeu o código? Reenviar"
                            )}
                        </button>
                    </div>
                </div>

                <p className="text-center text-white/20 text-[9px] font-black uppercase tracking-[0.4em] hover:text-white/40 transition-colors">
                    <Link href="/auth/register">← Voltar e corrigir e-mail</Link>
                </p>
            </motion.div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center font-black tracking-widest text-[#111]">INITIALIZING...</div>}>
            <VerifyContent />
        </Suspense>
    );
}
