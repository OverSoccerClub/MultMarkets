'use client';
import { useQuery } from '@tanstack/react-query';
import { marketsApi } from '@/lib/api';
import { MarketCard } from '@/components/markets/MarketCard';
import { useAuthStore } from '@/lib/store';
import { useState, useRef, useEffect } from 'react';
import { TrendingUp, Clock, Flame, Shield, Zap, BarChart3 } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence, useScroll } from 'framer-motion';

import { FeaturedMarket } from '@/components/markets/FeaturedMarket';
import { SidebarWidgets } from '@/components/markets/SidebarWidgets';

const CATEGORIES = [
    { value: '', label: 'Todos' },
    { value: 'politica', label: 'Política' },
    { value: 'desporto', label: 'Desporto' },
    { value: 'criptomoedas', label: 'Criptomoedas' },
    { value: 'financas', label: 'Finanças' },
    { value: 'geopolitica', label: 'Geopolítica' },
    { value: 'ciencia', label: 'Ciência' },
];

const SORT_OPTIONS = [
    { value: 'totalVolume', label: 'Maior Volume', icon: TrendingUp },
    { value: 'newest', label: 'Mais Recentes', icon: Flame },
    { value: 'ending_soon', label: 'Encerrando Em Breve', icon: Clock },
];

export default function HomePage() {
    const { isAuthenticated } = useAuthStore();
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('totalVolume');
    const [categoryQuery, setCategoryQuery] = useState('');

    const { data: markets = [], isLoading } = useQuery({
        queryKey: ['markets', { search, category: categoryQuery, sort }],
        queryFn: () => marketsApi.list({ search, categorySlug: categoryQuery || undefined, sortBy: sort }),
    });

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
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 pb-20 space-y-10 mt-8" ref={containerRef}>

            {/* NEW POLYMARKET-STYLE LAYOUT */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                <div className="xl:col-span-3 h-full">
                    {/* Exclude the featured market from the main grid below by shifting */}
                    <FeaturedMarket market={markets?.items?.[0]} />
                </div>
                <div className="xl:col-span-1 border-l border-white/5 xl:pl-8">
                    <SidebarWidgets />
                </div>
            </div>

            {/* Horizontal Categories Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide border-b border-white/5">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.value}
                        onClick={() => setCategoryQuery(cat.value)}
                        className={`px-5 py-2.5 rounded-full whitespace-nowrap text-[13px] font-bold transition-all ${
                            (categoryQuery === cat.value) 
                                ? 'bg-white text-black' 
                                : 'bg-transparent text-white/50 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

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
                    {/* Skips the first market as it is featured above */}
                    {markets?.items?.slice(1).map((market: any) => (
                        <MarketCard key={market.id} market={market} />
                    ))}
                </div>
            )}

            {!isLoading && !markets?.items?.length && (
                <div className="text-center py-16 text-text-muted">
                    <p className="text-body-lg">Nenhum mercado encontrado.</p>
                </div>
            )}

        </div>
    );
}
