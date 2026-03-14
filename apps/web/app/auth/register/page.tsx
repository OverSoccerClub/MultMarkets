'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { authApi } from '@/lib/api';
import { Eye, EyeOff, Lock, Mail, User, AtSign, UserPlus, CheckCircle2, ShieldCheck } from 'lucide-react';
import { FuturisticOverlay, DataStream, LiveCandlesticks } from '@/components/layout/PremiumVisuals';
import { useMotionValue, useTransform } from 'framer-motion';

// Simple formatter functions
const formatCPF = (v: string) => {
    v = v.replace(/\D/g, '');
    if (v.length <= 11) {
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return v;
};

const formatPhone = (v: string) => {
    v = v.replace(/\D/g, '');
    if (v.length <= 11) {
        v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
        v = v.replace(/(\d)(\d{4})$/, '$1-$2');
    }
    return v;
};

const isValidCpf = (cpf: string): boolean => {
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11 || /^(\d)\1{10}$/.test(cleanCpf)) return false;
    let sum = 0;
    let remainder;
    for (let i = 1; i <= 9; i++) sum += parseInt(cleanCpf.substring(i - 1, i)) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum += parseInt(cleanCpf.substring(i - 1, i)) * (12 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.substring(10, 11))) return false;
    return true;
};

const schema = z.object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    username: z.string().min(3).regex(/^[a-z0-9_]+$/, 'Apenas letras minúsculas, números e _'),
    cpf: z.string().min(11, 'Preencha o CPF').refine(isValidCpf, 'CPF Inválido'),
    phone: z.string().min(10, 'Preencha um número válido'),
    email: z.string().email('E-mail inválido'),
    password: z.string()
        .min(8, 'Mínimo 8 caracteres')
        .regex(/[A-Z]/, 'Deve conter uma maiúscula')
        .regex(/[0-9]/, 'Deve conter um número'),
    confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
    const router = useRouter();
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const { register, handleSubmit, watch, formState: { errors, touchedFields } } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: 'onTouched',
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

    const password = watch('password', '');
    const passwordRules = [
        { label: 'Mínimo 8 caracteres', ok: password.length >= 8 },
        { label: 'Uma letra maiúscula', ok: /[A-Z]/.test(password) },
        { label: 'Um número', ok: /[0-9]/.test(password) },
    ];

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        setError('');
        const { confirmPassword: _, ...payload } = data;
        
        // Limpar máscaras antes de enviar
        payload.cpf = payload.cpf.replace(/\D/g, '');
        payload.phone = payload.phone.replace(/\D/g, '');
        
        try {
            const res = await authApi.register(payload);
            // Redireciona para a tela de verificação/ativação
            router.push(`/auth/verify?userId=${res.data.userId}` as any);
        } catch (err: any) {
            setError(err?.response?.data?.message ?? 'Erro ao criar conta.');
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
                        <h1 className="text-4xl font-display font-black text-white tracking-tight">ENROLL AGENT</h1>
                        <p className="text-gray-500 text-sm font-medium">Junte-se à infraestrutura de elite.</p>
                    </div>
                </div>

                <motion.div
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={{ rotateX, rotateY, perspective: 1000 }}
                    className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-6 relative group"
                >
                    <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 relative z-10">

                        <div className="grid grid-cols-2 gap-3">
                            {/* Name */}
                            <div>
                                <label className="text-label text-text-muted block mb-1.5">Nome</label>
                                <div className="relative">
                                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                    <input {...register('name')} className="input pl-9 w-full" placeholder="João Silva" />
                                </div>
                                {errors.name && <p className="text-no-400 text-tiny mt-1">{errors.name.message}</p>}
                            </div>

                            {/* Username */}
                            <div>
                                <label className="text-label text-text-muted block mb-1.5">Username</label>
                                <div className="relative">
                                    <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                    <input {...register('username')} className="input pl-9 w-full" placeholder="joaosilva" />
                                </div>
                                {errors.username && <p className="text-no-400 text-tiny mt-1">{errors.username.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {/* CPF */}
                            <div>
                                <label className="text-label text-text-muted block mb-1.5 flex justify-between">
                                    <span>CPF</span>
                                </label>
                                <div className="relative">
                                    <ShieldCheck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                    <input 
                                        {...register('cpf')} 
                                        maxLength={14}
                                        onChange={(e) => {
                                            e.target.value = formatCPF(e.target.value);
                                            register('cpf').onChange(e);
                                        }}
                                        className={`input pl-9 w-full font-mono text-sm ${errors.cpf && touchedFields.cpf ? 'border-no-500/50 focus:border-no-500/50 bg-no-500/5 ring-no-500/20' : ''}`} 
                                        placeholder="000.000.000-00" 
                                    />
                                </div>
                                {errors.cpf && <p className="text-no-400 text-tiny mt-1">{errors.cpf.message}</p>}
                            </div>

                            {/* Celular */}
                            <div>
                                <label className="text-label text-text-muted block mb-1.5">Celular (WhatsApp)</label>
                                <div className="relative">
                                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                    <input 
                                        {...register('phone')} 
                                        maxLength={15}
                                        onChange={(e) => {
                                            e.target.value = formatPhone(e.target.value);
                                            register('phone').onChange(e);
                                        }}
                                        className="input pl-9 w-full font-mono text-sm" 
                                        placeholder="(11) 99999-9999" 
                                    />
                                </div>
                                {errors.phone && <p className="text-no-400 text-tiny mt-1">{errors.phone.message}</p>}
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="text-label text-text-muted block mb-1.5">E-mail</label>
                            <div className="relative">
                                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input 
                                    {...register('email')} 
                                    type="email" 
                                    className={`input pl-9 w-full text-sm ${errors.email && touchedFields.email ? 'border-no-500/50 focus:border-no-500/50 bg-no-500/5 ring-no-500/20' : ''}`} 
                                    placeholder="seu@email.com" 
                                />
                            </div>
                            {errors.email && <p className="text-no-400 text-tiny mt-1">{errors.email.message}</p>}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="text-label text-text-muted block mb-1.5">Senha</label>
                            <div className="relative">
                                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    {...register('password')}
                                    type={showPass ? 'text' : 'password'}
                                    className="input pl-9 pr-9 w-full"
                                    placeholder="••••••••"
                                />
                                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors">
                                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                            {/* Password strength */}
                            <div className="flex gap-2 mt-2">
                                {passwordRules.map((r) => (
                                    <span key={r.label} className={`text-tiny flex items-center gap-1 ${r.ok ? 'text-yes-400' : 'text-text-muted'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${r.ok ? 'bg-yes-400' : 'bg-border-default'}`} />
                                        {r.label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Confirm password */}
                        <div>
                            <label className="text-label text-text-muted block mb-1.5">Confirmar Senha</label>
                            <div className="relative">
                                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input {...register('confirmPassword')} type="password" className="input pl-9 w-full" placeholder="••••••••" />
                            </div>
                            {errors.confirmPassword && <p className="text-no-400 text-tiny mt-1">{errors.confirmPassword.message}</p>}
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-no-500/10 border border-no-500/20 text-no-400 text-sm">{error}</div>
                        )}

                        <button type="submit" disabled={loading} className="w-full bg-white text-black font-black py-4 rounded-xl text-xs uppercase tracking-[0.2em] hover:bg-accent-500 hover:text-white transition-all duration-300 shadow-xl disabled:opacity-50 flex items-center justify-center gap-3 overflow-hidden group">
                            {loading ? <span className="animate-pulse">Criando conta...</span> : <><UserPlus size={16} /> REGISTRAR AGENTE</>}
                        </button>
                    </form>
                </motion.div>

                <p className="text-center text-gray-600 text-[10px] font-bold uppercase tracking-widest">
                    Já possui credenciais?{' '}
                    <Link href="/auth/login" className="text-accent-500 hover:text-accent-400 transition-colors ml-1 uppercase">Entrar no Terminal</Link>
                </p>
            </motion.div>
        </div>
    );
}
