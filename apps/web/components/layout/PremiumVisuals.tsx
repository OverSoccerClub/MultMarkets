'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// 🖥️ Futuristic Overlay (CRT Scanlines + Technical Grain)
export function FuturisticOverlay() {
    return (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
            {/* Scanlines */}
            <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] animate-scanline" />
            {/* Grain Texture */}
            <div className="absolute inset-0 opacity-[0.2] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            {/* Edge Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,black_100%)] opacity-40" />
        </div>
    );
}

// 📡 DataStream Component
export const DataStream = ({ position }: { position: 'left' | 'right' }) => {
    const [mounted, setMounted] = useState(false);
    const [streams, setStreams] = useState<string[]>([]);

    useEffect(() => {
        setMounted(true);
        const generateStream = () => Array.from({ length: 20 }).map(() =>
            `0x${Math.random().toString(16).slice(2, 8).toUpperCase()}`
        );
        setStreams(generateStream());

        const interval = setInterval(() => {
            setStreams(generateStream());
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    if (!mounted) return null;

    return (
        <div className={`absolute top-0 bottom-0 w-32 opacity-[0.05] pointer-events-none overflow-hidden flex flex-col gap-2 p-4 font-mono text-[10px] ${position === 'left' ? 'left-0' : 'right-0'}`}>
            {streams.map((data, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: position === 'left' ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="text-accent-500 whitespace-nowrap"
                >
                    {data}
                </motion.div>
            ))}
        </div>
    );
};

// 📈 Ultra-Realistic Candlestick Engine - Organic Price Action
export const LiveCandlesticks = () => {
    const [mounted, setMounted] = useState(false);
    const [candles, setCandles] = useState<{ id: number; open: number; close: number; high: number; low: number; x: number; color: string }[]>([]);

    useEffect(() => {
        setMounted(true);
        const count = 35;
        const width = 12;
        const gap = 24;

        // 🧬 Organic Price Generation Logic
        let lastClose = 400;
        const initialCandles = Array.from({ length: count }).map((_, i) => {
            const volatility = 40;
            const open = lastClose;
            const close = open + (Math.random() - 0.5) * volatility;
            const high = Math.max(open, close) + Math.random() * 15;
            const low = Math.min(open, close) - Math.random() * 15;
            lastClose = close;

            return {
                id: i,
                open,
                close,
                high,
                low,
                x: i * gap,
                color: close >= open ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)'
            };
        });
        setCandles(initialCandles);

        // 🌊 Cinematic Market Flow
        const interval = setInterval(() => {
            setCandles(prev => {
                const nextOpen = prev[prev.length - 1].close;
                const volatility = 20;
                const nextClose = nextOpen + (Math.random() - 0.5) * volatility;
                const nextHigh = Math.max(nextOpen, nextClose) + Math.random() * 8;
                const nextLow = Math.min(nextOpen, nextClose) - Math.random() * 8;

                const newCandle = {
                    id: Date.now(),
                    open: nextOpen,
                    close: nextClose,
                    high: nextHigh,
                    low: nextLow,
                    x: (prev.length) * gap,
                    color: nextClose >= nextOpen ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)'
                };

                return [...prev.slice(1), newCandle].map((c, idx) => ({ ...c, x: idx * gap }));
            });
        }, 800);

        return () => clearInterval(interval);
    }, []);

    if (!mounted) return null;

    return (
        <div className="absolute inset-0 z-0 opacity-[0.06] pointer-events-none overflow-hidden flex items-center justify-center translate-y-20">
            <svg width="100%" height="800" className="overflow-visible">
                <defs>
                    <filter id="candle-glow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
                {candles.map((candle) => (
                    <motion.g
                        key={candle.id}
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1, x: candle.x }}
                        transition={{ duration: 0.6, ease: "anticipate" }}
                    >
                        <line
                            x1={6} y1={candle.high}
                            x2={6} y2={candle.low}
                            stroke={candle.color}
                            strokeWidth="1"
                            strokeOpacity="0.4"
                        />
                        <rect
                            x={0} y={bodyY(candle)}
                            width={12} height={bodyHeight(candle)}
                            fill={candle.color}
                            filter="url(#candle-glow)"
                            rx="1"
                        />
                    </motion.g>
                ))}
            </svg>
        </div>
    );
};

// Helper functions for SVG calculation
const bodyY = (candle: any) => Math.min(candle.open, candle.close);
const bodyHeight = (candle: any) => Math.abs(candle.open - candle.close) || 2;
