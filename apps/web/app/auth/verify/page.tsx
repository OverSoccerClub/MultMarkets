'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { authApi } from '@/lib/api';
import { CheckCircle2, ShieldCheck, Mail, Smartphone } from 'lucide-react';
import { FuturisticOverlay, DataStream, LiveCandlesticks } from '@/components/layout/PremiumVisuals';
import Link from 'next/link';

export default function VerifyKycPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId');

    const [emailCode, setEmailCode] = useState('');
    const [smsCode, setSmsCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!userId) {
            setError('Sessão de verificação inválida. Tente registrar novamente.');
            setLoading(false);
            return;
        }

        try {
            await authApi.verifyKyc({ userId, emailCode, smsCode });
            setSuccess(true);
            setTimeout(() => {
                router.push('/auth/login');
            }, 3000);
        } catch (err: any) {
            setError(err?.response?.data?.message ?? 'Códigos incorretos ou expirados.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 bg-black">
                <motion.div
                    className="text-center space-y-4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <CheckCircle2 size={64} className="text-yes-400 mx-auto" />
                    <h2 className="text-h3 font-display font-bold text-text-primary">Conta Validada!</h2>
                    <p className="text-text-secondary text-body-sm max-w-sm mx-auto">
                        Sua identidade foi confirmada. Redirecionando para o login...
                    </p>
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
                className="w-full max-w-sm space-y-6 relative"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
            >
                <div className="text-center space-y-4">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-600 to-accent-400 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] mx-auto border border-white/10"
                    >
                        <ShieldCheck className="text-white" size={32} />
                    </motion.div>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-display font-black text-white tracking-tight leading-tight">CONFIRMAR<br/>IDENTIDADE</h1>
                        <p className="text-gray-500 text-sm font-medium px-4">Enviamos protocolos de segurança para o seu e-mail e SMS.</p>
                    </div>
                </div>

                <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
                    <form onSubmit={handleVerify} className="space-y-5 relative z-10">
                        {/* Email Code */}
                        <div>
                            <label className="text-label text-text-muted block mb-1.5 flex items-center gap-2">
                                <Mail size={14} className="text-accent-500" /> Código por E-mail
                            </label>
                            <input
                                type="text"
                                maxLength={6}
                                value={emailCode}
                                onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ''))}
                                className="input w-full font-mono text-center text-xl tracking-[0.5em] h-14 bg-surface-base border-surface-raised focus:border-accent-500"
                                placeholder="000000"
                                required
                            />
                        </div>

                        {/* Phone Code */}
                        <div>
                            <label className="text-label text-text-muted block mb-1.5 flex items-center gap-2">
                                <Smartphone size={14} className="text-yes-500" /> Código por Celular (SMS)
                            </label>
                            <input
                                type="text"
                                maxLength={6}
                                value={smsCode}
                                onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
                                className="input w-full font-mono text-center text-xl tracking-[0.5em] h-14 bg-surface-base border-surface-raised focus:border-yes-500"
                                placeholder="000000"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-no-500/10 border border-no-500/20 text-no-400 text-sm text-center font-medium">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || emailCode.length !== 6 || smsCode.length !== 6}
                            className="w-full bg-white text-black font-black py-4 rounded-xl text-xs uppercase tracking-[0.2em] hover:bg-accent-500 hover:text-white transition-all duration-300 shadow-xl disabled:opacity-50"
                        >
                            {loading ? 'Verificando...' : 'VALIDAR ACESSO'}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
