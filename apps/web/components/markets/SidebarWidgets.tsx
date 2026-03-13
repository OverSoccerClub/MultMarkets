'use client';

import { Flame, TrendingUp, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export function SidebarWidgets() {
    return (
        <div className="flex flex-col gap-6">
            {/* Widget 1: Últimas notícias (Mocked for now) */}
            <div className="bg-black/40 border border-white/5 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4 group cursor-pointer">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 group-hover:text-accent-500 transition-colors">
                        Últimas notícias
                        <ChevronRight size={14} className="text-white/30 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" />
                    </h3>
                </div>
                
                <div className="space-y-4">
                    {[
                        { title: "BCB manterá Selic inalterada na próxima reunião?", prob: "77%", trend: "down" },
                        { title: "Aprovação da regulamentação das apostas esportivas no senado?", prob: "65%", trend: "up" },
                        { title: "Ibovespa atingirá 140k pontos até o final de abril?", prob: "24%", trend: "up" }
                    ].map((news, i) => (
                        <div key={i} className="flex gap-4 group cursor-pointer">
                            <span className="text-[10px] font-black text-white/30 mt-0.5">{i + 1}</span>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-white/70 group-hover:text-white transition-colors leading-snug line-clamp-2 pr-2">{news.title}</p>
                            </div>
                            <div className="flex flex-col items-end shrink-0 pl-2">
                                <span className="text-sm font-black text-white tabular-nums">{news.prob}</span>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${news.trend === 'up' ? 'text-yes-400' : 'text-no-400'}`}>
                                    {news.trend === 'up' ? '↗ 3%' : '↘ 4%'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Widget 2: Tópicos Quentes (Trending) */}
            <div className="bg-black/40 border border-white/5 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4 group cursor-pointer">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 group-hover:text-accent-500 transition-colors">
                        Tópicos quentes
                        <ChevronRight size={14} className="text-white/30 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" />
                    </h3>
                </div>
                
                <div className="space-y-4">
                    {[
                        { title: "Política Brasil", vol: "$9M", hot: true },
                        { title: "Futebol Série A", vol: "$62.7K", hot: true },
                        { title: "Criptomoedas", vol: "$230K", hot: true },
                        { title: "Oscar 2026", vol: "$421K", hot: false },
                        { title: "Economia Global", vol: "$405K", hot: false }
                    ].map((topic, i) => (
                        <div key={i} className="flex items-center gap-4 group cursor-pointer">
                            <span className="text-[10px] font-black text-white/30 mb-0.5">{i + 1}</span>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-white/80 group-hover:text-white transition-colors">{topic.title}</p>
                            </div>
                            <div className="flex flex-col items-end shrink-0 pl-2">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{topic.vol} hoje</span>
                                    {topic.hot && <Flame size={12} className="text-red-500 animate-pulse" />}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                <button className="w-full mt-6 py-3 border border-white/10 rounded-xl text-xs font-black text-white/60 uppercase tracking-widest hover:text-white hover:bg-white/5 hover:border-white/20 transition-all">
                    Explorar tudo
                </button>
            </div>
        </div>
    );
}
