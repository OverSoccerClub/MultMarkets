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
            className="group flex flex-col bg-black/80 border border-white/[0.05] hover:border-accent-500/30 rounded-[28px] overflow-hidden transition-all duration-700 hover:shadow-[0_20px_50px_-10px_rgba(16,185,129,0.15)] h-full relative"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-accent-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

            <div className="flex flex-col p-6 h-full relative z-10">
                {/* Header: Title + Probability */}
                <div className="flex justify-between items-start gap-4 mb-4">
                    <Link href={`/markets/${market.slug}`} className="flex-1">
                        <h3 className="text-lg font-bold text-white/90 group-hover:text-white transition-colors leading-snug line-clamp-2">
                            {market.title}
                        </h3>
                    </Link>
                    <div className="flex flex-col items-end shrink-0">
                        <span className="text-2xl font-black text-white tabular-nums">{yesPercent}%</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">CHANCE</span>
                    </div>
                </div>

                {/* Probability Visual Bar */}
                <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden mb-6 relative">
                    <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-yes-600 to-yes-neon rounded-full"
                        style={{ width: `${yesPercent}%` }}
                    />
                </div>

                {/* Interactive Action Area */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                        onClick={(e) => { e.preventDefault(); openBetPanel(market.id, 'YES'); }}
                        className="group/btn relative px-4 py-3 rounded-xl bg-yes-500/5 hover:bg-yes-500 border border-yes-500/20 hover:border-yes-500 transition-all duration-300 overflow-hidden"
                    >
                        <div className="relative z-10 flex flex-col items-center">
                            <span className="text-[10px] font-black text-yes-400 group-hover/btn:text-white uppercase tracking-widest mb-0.5 transition-colors">COMPRAR</span>
                            <span className="text-sm font-black text-white">SIM</span>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-yes-neon opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    </button>
                    <button
                        onClick={(e) => { e.preventDefault(); openBetPanel(market.id, 'NO'); }}
                        className="group/btn relative px-4 py-3 rounded-xl bg-no-500/5 hover:bg-no-500 border border-no-500/20 hover:border-no-500 transition-all duration-300 overflow-hidden"
                    >
                        <div className="relative z-10 flex flex-col items-center">
                            <span className="text-[10px] font-black text-no-400 group-hover/btn:text-white uppercase tracking-widest mb-0.5 transition-colors">COMPRAR</span>
                            <span className="text-sm font-black text-white">NÃO</span>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-no-400 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    </button>
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
