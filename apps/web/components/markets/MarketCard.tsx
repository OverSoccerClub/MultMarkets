'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useUiStore } from '@/lib/store';
import { TrendingUp, Users, Clock } from 'lucide-react';

interface Market {
    id: string;
    slug: string;
    title: string;
    imageUrl: string | null;
    yesPrice: number;
    noPrice: number;
    totalVolume: number;
    uniqueTraders: number;
    resolutionDate: string | null;
    category: { name: string; icon: string | null; color: string | null } | null;
}

export function MarketCard({ market }: { market: Market }) {
    const { openBetPanel } = useUiStore();

    const yesPercent = Math.round(market.yesPrice * 100);
    const noPercent = Math.round(market.noPrice * 100);

    const formatVolume = (v: number) => {
        if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
        if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}K`;
        return `R$ ${v.toFixed(0)}`;
    };

    return (
        <motion.div
            className="group flex flex-col bg-black/40 border border-white/5 hover:border-accent-500/30 rounded-2xl overflow-hidden transition-all duration-700 hover:shadow-[0_10px_40px_-10px_rgba(16,185,129,0.1)] h-full relative"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-accent-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

            <div className="flex flex-col p-5 h-full relative z-10">
                {/* Header: Title */}
                <div className="flex items-start gap-3 mb-4">
                    {market.imageUrl && (
                        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-white/5 border border-white/10 relative">
                            <Image src={market.imageUrl} alt={market.title} fill className="object-cover" />
                        </div>
                    )}
                    <Link href={`/markets/${market.slug}`} className="flex-1 mt-0.5">
                        <h3 className="text-sm font-bold text-white/90 group-hover:text-white transition-colors leading-snug line-clamp-3">
                            {market.title}
                        </h3>
                    </Link>
                </div>

                {/* Options Layout (Polymarket Style) */}
                <div className="space-y-2 mb-5">
                    {/* YES Option */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Sim</span>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-white tabular-nums">{yesPercent}%</span>
                            <button
                                onClick={(e) => { e.preventDefault(); openBetPanel(market.id, 'YES'); }}
                                className="px-5 py-1.5 rounded-lg bg-yes-500/10 hover:bg-yes-500 flex-1 border border-yes-500/20 hover:border-yes-500 text-yes-400 hover:text-white text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap min-w-[70px] text-center"
                            >
                                Sim
                            </button>
                        </div>
                    </div>
                    {/* NO Option */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Não</span>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-white tabular-nums">{noPercent}%</span>
                            <button
                                onClick={(e) => { e.preventDefault(); openBetPanel(market.id, 'NO'); }}
                                className="px-5 py-1.5 rounded-lg bg-no-500/10 hover:bg-no-500 flex-1 border border-no-500/20 hover:border-no-500 text-no-400 hover:text-white text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap min-w-[70px] text-center"
                            >
                                Não
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Metadata */}
                <div className="mt-auto pt-5 border-t border-white/[0.05] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-0.5">Volume</span>
                            <span className="text-[11px] font-black text-white/50">{formatVolume(market.totalVolume)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-0.5">Traders</span>
                            <span className="text-[11px] font-black text-white/50">{market.uniqueTraders.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:border-accent-500/30 transition-colors">
                            <TrendingUp size={12} className="text-text-muted group-hover:text-accent-500 transition-colors" />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
