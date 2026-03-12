'use client';
import { useQuery } from '@tanstack/react-query';
import { marketsApi } from '@/lib/api';
import { MarketCard } from '@/components/markets/MarketCard';
import { useAuthStore } from '@/lib/store';
import { useState, useRef, useEffect } from 'react';
import { TrendingUp, Clock, Flame, Shield, Zap, BarChart3 } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence, useScroll } from 'framer-motion';

// 🧲 Magnetic Button Component
function MagneticButton({ children, className }: { children: React.ReactNode; className?: string }) {
    const ref = useRef<HTMLButtonElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const springConfig = { damping: 15, stiffness: 150 };
    const dx = useSpring(x, springConfig);
    const dy = useSpring(y, springConfig);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current) return;
        const { clientX, clientY } = e;
        const { left, top, width, height } = ref.current.getBoundingClientRect();
        const centerX = left + width / 2;
        const centerY = top + height / 2;
        x.set((clientX - centerX) * 0.4);
        y.set((clientY - centerY) * 0.4);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.button
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ x: dx, y: dy }}
            className={className}
        >
            {children}
        </motion.button>
    );
}

// 🖋️ Split Text Reveal Component
function SplitText({ text, delay = 0 }: { text: string; delay?: number }) {
    return (
        <span className="inline-block overflow-hidden">
            {text.split("").map((char, i) => (
                <motion.span
                    key={i}
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    transition={{
                        delay: delay + i * 0.03,
                        duration: 0.8,
                        ease: [0.22, 1, 0.36, 1]
                    }}
                    className="inline-block"
                >
                    {char === " " ? "\u00A0" : char}
                </motion.span>
            ))}
        </span>
    );
}

import { FuturisticOverlay, DataStream, LiveCandlesticks } from '@/components/layout/PremiumVisuals';

import { useSearchParams } from 'next/navigation';

const SORT_OPTIONS = [
    { value: 'totalVolume', label: 'Maior Volume', icon: TrendingUp },
    { value: 'newest', label: 'Mais Recentes', icon: Flame },
    { value: 'ending_soon', label: 'Encerrando Em Breve', icon: Clock },
];

export default function HomePage() {
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const categoryQuery = searchParams?.get('category') || '';

    const { isAuthenticated } = useAuthStore();
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('totalVolume');

    const { data: markets = [], isLoading } = useQuery({
        queryKey: ['markets', { search, category: categoryQuery, sort }],
        queryFn: () => marketsApi.list({ search, categorySlug: categoryQuery || undefined, sortBy: sort }),
    });

    const [filter, setFilter] = useState('trending');
    const containerRef = useRef<HTMLDivElement>(null);

    // 🌊 Parallax & 3D Tilt Mouse Effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springX = useSpring(mouseX, { damping: 50, stiffness: 400 });
    const springY = useSpring(mouseY, { damping: 50, stiffness: 400 });

    const { scrollYProgress } = useScroll();
    const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]); // Assuming a simple parallax effect for y1

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const { clientWidth, clientHeight } = document.documentElement;
            mouseX.set((e.clientX / clientWidth - 0.5) * 50);
            mouseY.set((e.clientY / clientHeight - 0.5) * 50);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const orbX = useTransform(springX, (val) => val * 1.5);
    const orbY = useTransform(springY, (val) => val * 1.5);
    const gridX = useTransform(springX, (val) => val * 0.5);
    const gridY = useTransform(springY, (val) => val * 0.5);

    // 🏛️ 3D Tilt Calculations
    const rotateX = useTransform(springY, [-25, 25], [5, -5]);
    const rotateY = useTransform(springX, [-25, 25], [-5, 5]);

    return (
        <div className={`mx-auto max-w-[1400px] px-6 ${isAuthenticated ? 'pt-28' : 'pt-36'} pb-20 space-y-12 overflow-hidden`} ref={containerRef}>

            {/* 🌲 Forest Terminal Hero (Senior Motion Redesign) - Solo mostrado se não logado */}
            <AnimatePresence>
                {!isAuthenticated && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        style={{ rotateX, rotateY, perspective: 1000 }}
                        className="relative overflow-hidden py-32 sm:py-44 rounded-[4rem] mb-20 flex flex-col items-center justify-center border border-white/5 bg-black selection:bg-accent-500/30 group transform-gpu"
                    >
                        {/* 🌑 Futuristic Overlays */}
                        <FuturisticOverlay />
                        <DataStream position="left" />
                        <DataStream position="right" />

                        {/* 🌌 Animated Background Elements */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <LiveCandlesticks />
                            <motion.div
                                style={{ y: y1, opacity: 0.4 }}
                                className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-500/10 to-transparent"
                            />
                        </div>

                        {/* 🌌 High-Fidelity Parallax Background Layers */}
                        <motion.div style={{ x: orbX, y: orbY }} className="absolute top-[-30%] left-[-20%] w-[80%] h-[90%] bg-accent-500/10 rounded-full blur-[180px] mix-blend-screen opacity-40 pointer-events-none" />
                        <motion.div style={{ x: orbY, y: orbX }} className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[70%] bg-accent-900/15 rounded-full blur-[140px] mix-blend-screen opacity-30 pointer-events-none" />

                        {/* 🏁 Reactive Technical Grid */}
                        <motion.div
                            style={{ x: gridX, y: gridY }}
                            className="absolute inset-0 opacity-[0.03] [mask-image:radial-gradient(ellipse_at_center,black,transparent)] pointer-events-none"
                        >
                            <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                                <defs>
                                    <pattern id="elite-grid" width="80" height="80" patternUnits="userSpaceOnUse">
                                        <path d="M 80 0 L 0 0 0 80" fill="none" stroke="white" strokeWidth="0.5" />
                                        <circle cx="0" cy="0" r="1.5" fill="white" fillOpacity="0.5" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#elite-grid)" />
                            </svg>
                        </motion.div>

                        <div className="text-center space-y-14 relative z-10 px-8 max-w-7xl">
                            {/* 🎖️ Animated Tech Badge */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2, duration: 1 }}
                                className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/[0.02] border border-white/[0.08] text-[10px] uppercase tracking-[0.4em] text-accent-400 font-black shadow-glow-accent backdrop-blur-3xl"
                            >
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-500 opacity-40"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-500"></span>
                                </span>
                                Elite Intelligence Terminal
                            </motion.div>

                            {/* 🏛️ Massive Slogan with Senior Reveal */}
                            <div className="space-y-4">
                                <h1 className="font-display text-7xl sm:text-[130px] font-black tracking-[-0.06em] text-white leading-[0.75] uppercase filter drop-shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                                    <SplitText text="DECIFRE O" delay={0.4} /><br />
                                    <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-accent-500 to-accent-900 animate-shimmer bg-[length:200%_auto]">
                                        <SplitText text="INEVITÁVEL" delay={0.8} />
                                    </span>.
                                </h1>
                            </div>

                            {/* 💎 Elite Subtext & Real-time Stats */}
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.4, duration: 1 }}
                                className="flex flex-col sm:flex-row items-center justify-center gap-10 mt-20 max-w-5xl mx-auto"
                            >
                                <p className="text-xl sm:text-2xl text-white/30 font-bold leading-[1.1] tracking-tighter uppercase text-center sm:text-left max-w-lg">
                                    A infraestrutura de elite para transformar <br />
                                    <span className="text-white">visão estratégica em capital de performance.</span>
                                </p>

                                <div className="h-16 w-[1px] bg-white/10 hidden sm:block overflow-hidden">
                                    <motion.div
                                        initial={{ y: "-100%" }}
                                        animate={{ y: "100%" }}
                                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                        className="w-full h-1/2 bg-accent-500/50 blur-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="flex flex-col items-start px-4 border-l border-accent-500/20">
                                        <span className="text-[9px] font-black text-accent-500 uppercase tracking-widest mb-1 opacity-60">Status de Rede</span>
                                        <span className="text-2xl font-black text-white tabular-nums tracking-tighter flex items-center gap-2">
                                            1ms <Zap size={14} className="text-accent-500 animate-pulse" />
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-start px-4 border-l border-accent-500/20">
                                        <span className="text-[9px] font-black text-accent-500 uppercase tracking-widest mb-1 opacity-60">Verificação</span>
                                        <span className="text-2xl font-black text-white tabular-nums tracking-tighter flex items-center gap-2">
                                            SECURE <Shield size={14} className="text-accent-500" />
                                        </span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* 🧲 Magnetic Primary CTA */}
                            <div className="flex items-center justify-center pt-8">
                                <MagneticButton className="btn-primary px-16 py-7 text-[12px] tracking-[0.5em] uppercase group overflow-hidden relative rounded-2xl shadow-glow-elite border border-white/10">
                                    <span className="relative z-10 flex items-center gap-3">
                                        <BarChart3 size={18} className="group-hover:rotate-12 transition-transform duration-500" />
                                        Acessar Terminal
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer-fast" />
                                </MagneticButton>
                            </div>
                        </div>

                        {/* 🛡️ Subtle Bottom Gradient Fade */}
                        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent pointer-events-none" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Premium Stats Bar */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {[
                    { label: 'Mercados Ativos', value: '342', color: 'text-accent-500' },
                    { label: 'Volume Total', value: 'R$ 2.4M', color: 'text-yes-400' },
                    { label: 'Participantes', value: '12.5K', color: 'text-white' },
                    { label: 'Precisão AI', value: '98%', color: 'text-accent-400' },
                ].map((stat) => (
                    <div key={stat.label} className="relative group overflow-hidden bg-[#0a0a0a]/60 backdrop-blur-3xl glass-refraction border border-white/5 rounded-[2rem] p-8 transition-all hover:bg-bg-elevated/60">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className={`text-4xl font-display tabular-nums font-black leading-none mb-3 ${stat.color}`}>{stat.value}</div>
                        <div className="text-[10px] text-text-muted font-black uppercase tracking-[0.25em]">{stat.label}</div>
                    </div>
                ))}
            </motion.div>

            {/* Sort options */}
            <div className="flex items-center justify-between mt-4">
                <h2 className="text-xs font-black text-text-muted uppercase tracking-[0.25em] flex items-center gap-3">
                    <span className="w-8 h-[1px] bg-white/10"></span>
                    {search ? `Resultados: "${search}"` : 'Explorar Mercados'}
                </h2>
                <div className="flex gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5">
                    {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
                        <button
                            key={value}
                            onClick={() => setSort(value)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${sort === value
                                ? 'bg-white/10 text-white shadow-inner-surface border border-white/10'
                                : 'text-text-muted hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Icon size={14} className={sort === value ? 'text-accent-400' : ''} />
                            <span className="hidden sm:block">{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Market grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-bg-surface border border-border-default rounded-xl overflow-hidden">
                            <div className="skeleton h-36 w-full" />
                            <div className="p-4 space-y-3">
                                <div className="skeleton h-4 w-full rounded" />
                                <div className="skeleton h-4 w-3/4 rounded" />
                                <div className="skeleton h-2 w-full rounded-full mt-2" />
                                <div className="grid grid-cols-2 gap-2 mt-3">
                                    <div className="skeleton h-9 rounded-lg" />
                                    <div className="skeleton h-9 rounded-lg" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {markets?.items?.map((market: any) => (
                        <MarketCard key={market.id} market={market} />
                    ))}
                </div>
            )}

            {!isLoading && !markets?.items?.length && (
                <div className="text-center py-16 text-text-muted">
                    <p className="text-body-lg">Nenhum mercado encontrado.</p>
                </div>
            )}

            {/* System Version */}
            <div className="mt-20 border-t border-white/5 pt-8 text-center text-[10px] text-white/20 font-mono uppercase tracking-[0.3em] select-none hover:text-white/40 transition-colors">
                MultMarkets OS v1.0.0
            </div>
        </div>
    );
}
