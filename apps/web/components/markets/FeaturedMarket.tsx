'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useUiStore } from '@/lib/store';
import { Bookmark, Link as LinkIcon, TrendingUp } from 'lucide-react';

interface Market {
    id: string;
    slug: string;
    title: string;
    imageUrl: string | null;
    yesPrice: number;
    noPrice: number;
    totalVolume: number;
    uniqueTraders: number;
}

export function FeaturedMarket({ market }: { market?: Market }) {
    const { openBetPanel } = useUiStore();

    if (!market) {
        return (
            <div className="bg-black/40 border border-white/5 rounded-3xl h-[400px] flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-12 w-12 rounded-full border-2 border-accent-500/20 border-t-accent-500 animate-spin" />
                    <div className="text-xs font-black uppercase tracking-widest text-text-muted">Carregando Destaque...</div>
                </div>
            </div>
        );
    }

    const yesPercent = Math.round(market.yesPrice * 100);
    const noPercent = Math.round(market.noPrice * 100);

    const formatVolume = (v: number) => {
        if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M Vol`;
        if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}K Vol`;
        return `R$ ${v.toFixed(0)} Vol`;
    };

    return (
        <div className="group flex flex-col bg-black/40 border border-white/5 hover:border-accent-500/30 rounded-3xl overflow-hidden transition-all duration-700 hover:shadow-[0_10px_40px_-10px_rgba(16,185,129,0.1)] p-6 lg:p-8 relative">
            {/* Header: Title and Actions */}
            <div className="flex items-start justify-between gap-6 mb-8">
                <div className="flex items-start gap-4">
                    {market.imageUrl && (
                        <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-white/5 border border-white/10 relative shadow-glow-accent">
                            <Image src={market.imageUrl} alt={market.title} fill className="object-cover" />
                        </div>
                    )}
                    <Link href={`/markets/${market.slug}`} className="mt-1">
                        <h2 className="text-xl sm:text-3xl font-black text-white leading-tight hover:text-accent-500 transition-colors">
                            {market.title}
                        </h2>
                    </Link>
                </div>
                <div className="flex items-center gap-2 shrink-0 border border-white/5 rounded-xl p-1 bg-white/[0.02]">
                    <button className="p-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all">
                        <LinkIcon size={18} />
                    </button>
                    <button className="p-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all">
                        <Bookmark size={18} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8 mt-2">
                {/* Left: Options & Volume */}
                <div className="flex flex-col h-full justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <span className="text-sm font-bold text-white uppercase tracking-wider">Sim</span>
                            <div className="flex items-center gap-4">
                                <span className="text-2xl font-black text-white tabular-nums">{yesPercent}%</span>
                                <button
                                    onClick={() => openBetPanel(market.id, 'YES')}
                                    className="px-6 py-2 rounded-xl bg-yes-500/10 hover:bg-yes-500 border border-yes-500/20 hover:border-yes-500 text-yes-400 hover:text-white text-sm font-black uppercase tracking-widest transition-all duration-300 min-w-[90px]"
                                >
                                    Comprar
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-sm font-bold text-white uppercase tracking-wider">Não</span>
                            <div className="flex items-center gap-4">
                                <span className="text-2xl font-black text-white tabular-nums">{noPercent}%</span>
                                <button
                                    onClick={() => openBetPanel(market.id, 'NO')}
                                    className="px-6 py-2 rounded-xl bg-no-500/10 hover:bg-no-500 border border-no-500/20 hover:border-no-500 text-no-400 hover:text-white text-sm font-black uppercase tracking-widest transition-all duration-300 min-w-[90px]"
                                >
                                    Comprar
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center justify-between text-text-muted">
                        <span className="text-xs font-black uppercase tracking-widest">{formatVolume(market.totalVolume)}</span>
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                            <TrendingUp size={14} className="text-accent-500" />
                            <span>MultMarkets</span>
                        </div>
                    </div>
                </div>

                {/* Right: Chart (Mock SVG for visual) */}
                <div className="hidden lg:block relative h-full min-h-[160px] border-l border-white/5 pl-8">
                    <div className="absolute inset-x-0 bottom-0 top-0 pl-8 pointer-events-none opacity-50">
                        {/* Decorative Line Chart Mock */}
                        <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="gradient-yes" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="rgba(16, 185, 129, 0.2)" />
                                    <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
                                </linearGradient>
                            </defs>
                            {/* Grid Lines */}
                            <line x1="0" y1="20%" x2="100%" y2="20%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
                            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
                            <line x1="0" y1="80%" x2="100%" y2="80%" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
                            
                            {/* Yes Line Path */}
                            <path
                                d="M 0 100 Q 40 100, 50 80 T 100 70 T 150 75 T 200 60 T 250 110 T 300 30 T 350 35 T 400 80"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="2"
                                className="drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                            />
                            {/* No Line Path */}
                            <path
                                d="M 0 50 Q 40 50, 50 70 T 100 80 T 150 75 T 200 90 T 250 40 T 300 120 T 350 115 T 400 70"
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="1.5"
                                opacity="0.6"
                            />
                        </svg>
                        
                        {/* Legend */}
                        <div className="absolute top-0 right-0 flex gap-4 text-[10px] font-black tracking-widest uppercase">
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yes-400 shadow-glow-yes" /> Sim <span>{yesPercent}%</span></div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-no-400" /> Não <span>{noPercent}%</span></div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Hover Bottom Glow */}
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-accent-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        </div>
    );
}
