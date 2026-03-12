'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import {
    LayoutDashboard,
    Bot,
    Settings as SettingsIcon,
    Sliders,
    Search,
    LogOut,
    ChevronRight,
    TrendingUp,
    ShieldCheck,
    Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Fontes dos Bots', href: '/admin/bots', icon: SettingsIcon },
    { name: 'Descobertas AI', href: '/admin/findings', icon: Bot },
    { name: 'Mercados', href: '/admin/markets', icon: Search },
    { name: 'Configurações', href: '/admin/settings', icon: Sliders },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isAuthenticated, _hasHydrated } = useAuthStore();
    const [isAuthorized, setIsAuthorized] = React.useState(false);

    React.useEffect(() => {
        if (!_hasHydrated) return; // Wait for zustand to restore from localStorage

        // Skip check if we are already on the login page
        if (pathname === '/admin/login') {
            setIsAuthorized(true);
            return;
        }

        // Check for admin role only
        if (!isAuthenticated || user?.role !== 'ADMIN') {
            router.push('/admin/login');
        } else {
            setIsAuthorized(true);
        }
    }, [pathname, isAuthenticated, user, router, _hasHydrated]);

    // Wait for client hydration to prevent SSR mismatch and flash
    if (!_hasHydrated) {
        return <div className="min-h-screen bg-black" />;
    }

    // Don't render admin layout content if not authorized (except for login page)
    if (!isAuthorized && pathname !== '/admin/login') {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-accent-500/20 border-t-accent-500 rounded-full animate-spin" />
                    <span className="text-[10px] font-black text-accent-500 uppercase tracking-widest">Validando Credenciais...</span>
                </div>
            </div>
        );
    }

    // If we are on the login page, we don't want the full sidebar layout
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen bg-[#05080f] text-white selection:bg-accent-500/30">
            {/* 🔮 Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-900/10 rounded-full blur-[100px]" />
            </div>

            {/* 🏛️ Premium Sidebar */}
            <aside className="sticky top-0 h-screen w-72 flex-shrink-0 border-r border-white/5 bg-black/40 backdrop-blur-2xl z-50">
                <div className="flex flex-col h-full p-6">
                    {/* Logo Section */}
                    <div className="mb-12 px-2">
                        <Link href={"/" as any} className="flex items-center gap-3 group">
                            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 shadow-glow-accent ring-1 ring-white/20">
                                <ShieldCheck size={24} className="text-white" />
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 rounded-xl border border-white/20 opacity-50"
                                />
                            </div>
                            <div>
                                <span className="text-lg font-black tracking-tighter uppercase block leading-none">MultMarkets</span>
                                <span className="text-[10px] font-black text-accent-500 tracking-[0.2em] uppercase">Control Panel</span>
                            </div>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-2">
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link key={item.name} href={item.href as any}>
                                    <motion.div
                                        whileHover={{ x: 5 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`relative flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group ${isActive
                                            ? 'bg-white/5 text-white'
                                            : 'text-white/40 hover:text-white/70 hover:bg-white/[0.02]'
                                            }`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="active-pill"
                                                className="absolute inset-0 bg-white/[0.03] border border-white/10 rounded-2xl shadow-inner-surface"
                                            />
                                        )}

                                        <div className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-accent-400' : 'group-hover:text-white'}`}>
                                            <item.icon size={20} />
                                        </div>

                                        <span className="relative z-10">{item.name}</span>

                                        {isActive && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="ml-auto relative z-10"
                                            >
                                                <ChevronRight size={14} className="text-accent-500" />
                                            </motion.div>
                                        )}
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer Stats */}
                    <div className="mt-auto pt-8 border-t border-white/5 space-y-4">
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Bot Status</span>
                                <span className="flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-accent-500 opacity-40"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-500"></span>
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Zap size={16} className="text-accent-500" />
                                <div>
                                    <div className="text-[11px] font-bold text-white">Ciclos Ativos</div>
                                    <div className="text-[9px] text-white/40">Sincronizado há 2m</div>
                                </div>
                            </div>
                        </div>

                        <button className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-bold text-yes-400/60 hover:text-yes-400 hover:bg-yes-400/5 transition-all duration-300">
                            <LogOut size={20} />
                            <span>Sair</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* 🚀 Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* 🚀 Top Navigation / Header */}
                <header className="h-[76px] border-b border-white/5 flex items-center justify-between px-10 bg-black/20 backdrop-blur-3xl sticky top-0 z-40">
                    <div className="flex items-center gap-8 flex-1">
                        <div className="flex items-center gap-4">
                            <h1 className="text-sm font-black tracking-tight uppercase">
                                {NAV_ITEMS.find(i => i.href === pathname)?.name || 'Painel Admin'}
                            </h1>
                            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[8px] font-black text-accent-400 uppercase tracking-widest">Live</span>
                        </div>

                        {/* Middle: Admin Search Wrapper */}
                        <div className="hidden lg:flex flex-1 max-w-sm relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent-500 transition-colors" size={14} />
                            <input
                                type="text"
                                placeholder="Comando rápido..."
                                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-2 pl-10 pr-4 text-xs text-white placeholder:text-white/20 focus:bg-white/[0.07] focus:border-accent-500/50 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                            <TrendingUp size={14} className="text-accent-500" />
                            <span className="text-[11px] font-bold tabular-nums">R$ 1.4M Volume</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <div className="text-[10px] font-black text-white uppercase leading-none mb-1">{user?.username || 'Admin'}</div>
                                <div className="text-[8px] font-bold text-accent-500 uppercase tracking-widest">Master Access</div>
                            </div>
                            <div className="h-10 w-10 rounded-xl border border-white/10 p-0.5 bg-gradient-to-br from-white/10 to-transparent group hover:border-accent-500/50 transition-all cursor-pointer">
                                <div className="h-full w-full rounded-[10px] bg-accent-950 flex items-center justify-center text-[10px] font-black">
                                    {user?.name?.substring(0, 2).toUpperCase() || 'AD'}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-10">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        {children}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
