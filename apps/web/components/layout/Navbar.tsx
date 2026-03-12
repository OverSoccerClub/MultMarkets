'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, useWalletStore } from '@/lib/store';
import { walletApi, authApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, Wallet, User, LogOut, BarChart2, Bell, Search, Menu, ShieldCheck } from 'lucide-react';

const CATEGORIES = [
    { slug: 'all', label: 'Tudo', icon: '🔥' },
    { slug: 'politics', label: 'Política', icon: '🗳️' },
    { slug: 'crypto', label: 'Crypto', icon: '💎' },
    { slug: 'sports', label: 'Esportes', icon: '⚽' },
    { slug: 'business', label: 'Negócios', icon: '📈' },
    { slug: 'science', label: 'Ciência', icon: '🔬' },
    { slug: 'entertainment', label: 'Cultura', icon: '🎬' },
];

export function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuthStore();
    const { balance, setWallet } = useWalletStore();
    const [mounted, setMounted] = useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    useQuery({
        queryKey: ['wallet'],
        queryFn: async () => {
            const data = await walletApi.get();
            setWallet(data);
            return data;
        },
        enabled: isAuthenticated && !!user && user.role !== 'ADMIN',
        refetchInterval: 30_000,
    });

    const handleLogout = async () => {
        try { await authApi.logout(); } catch { }
        logout();
        router.push('/auth/login');
    };

    const navLinks = [
        { href: '/', label: 'Explorar', icon: TrendingUp },
        ...(user?.role !== 'ADMIN' ? [{ href: '/dashboard', label: 'Portfólio', icon: BarChart2 }] : []),
    ];

    return (
        <header className="fixed top-0 left-0 right-0 z-[1100] flex flex-col">
            {/* Main Nav */}
            <nav className="relative z-50 h-[76px] glass-2 border-b border-white/[0.05] shadow-2xl backdrop-blur-3xl">
                <div className="mx-auto max-w-[1400px] px-6 h-full flex items-center justify-between gap-8">

                    {/* Left: Logo + Desktop Links */}
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
                            <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-accent-500 via-accent-800 to-black flex items-center justify-center shadow-glow-accent group-hover:scale-105 transition-all duration-700 border border-white/20">
                                <span className="text-white font-black text-lg tracking-tighter">M</span>
                            </div>
                            <span className="font-display font-black text-white text-2xl hidden lg:block tracking-tighter uppercase transition-colors">
                                Mult<span className="text-glow-accent text-accent-500">Markets</span>
                            </span>
                        </Link>

                        <div className="hidden md:flex items-center gap-2">
                            {navLinks.map(({ href, label, icon: Icon }) => {
                                const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                                return (
                                    <Link
                                        key={href}
                                        href={href as any}
                                        className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-500 group/nav
                      ${active ? 'text-white' : 'text-text-secondary hover:text-white'}`}
                                    >
                                        {active && (
                                            <motion.div
                                                layoutId="nav-active"
                                                className="absolute inset-0 bg-white/[0.08] border border-white/10 rounded-xl shadow-inner-surface"
                                                initial={false}
                                                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <Icon size={16} className={active ? 'text-accent-500' : 'group-hover/nav:text-accent-400 transition-colors'} />
                                        <span className="relative z-10">{label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Center: Search Bar (Polymarket Style) */}
                    <div className="hidden lg:flex flex-1 max-w-md relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar mercados..."
                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-2.5 pl-12 pr-4 text-sm text-white placeholder:text-text-muted focus:bg-white/[0.07] focus:border-accent-500/50 outline-none transition-all"
                        />
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        {isAuthenticated ? (
                            <>
                                {user?.role !== 'ADMIN' && (
                                    <Link
                                        href={"/wallet" as any}
                                        className="hidden sm:flex items-center gap-3 px-4 py-2.5 rounded-xl glass-refraction border border-white/10 hover:border-accent-500/50 transition-all duration-500 group/wallet"
                                    >
                                        <div className="p-1.2 rounded-lg bg-yes-500/10 group-hover/wallet:bg-yes-500/20 transition-colors">
                                            <Wallet size={14} className="text-yes-400" />
                                        </div>
                                        <span className="text-white font-bold tabular-nums text-sm">
                                            R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </Link>
                                )}

                                <button className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/5 transition-all relative">
                                    <Bell size={18} />
                                    <span className="absolute top-3 right-3 w-2 h-2 bg-accent-500 rounded-full border-2 border-[#0a0a0a]" />
                                </button>

                                <div className="relative group/profile">
                                    <button className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-white/10">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500/20 to-accent-700/20 border border-accent-500/30 flex items-center justify-center group-hover/profile:border-accent-500/50 transition-all">
                                            <span className="text-sm font-bold text-accent-500">
                                                {user?.name?.charAt(0)?.toUpperCase()}
                                            </span>
                                        </div>
                                    </button>

                                    {/* Dropdown */}
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-[#111111] border border-white/10 rounded-2xl py-2 shadow-2xl opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible transition-all duration-200 z-50 transform translate-y-1 group-hover/profile:translate-y-0">
                                        <div className="px-4 py-2 border-b border-white/5 mb-2">
                                            <div className="text-xs text-text-muted font-bold uppercase tracking-wider mb-1">Conta Financeira</div>
                                            <div className="text-sm text-white font-bold truncate">{user?.username}</div>
                                        </div>
                                        <Link href={"/profile" as any} className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-colors">
                                            <User size={16} /> Ver Perfil
                                        </Link>
                                        {user?.role !== 'ADMIN' && (
                                            <Link href={"/orders" as any} className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-colors">
                                                <BarChart2 size={16} /> Minhas Operações
                                            </Link>
                                        )}
                                        {user?.role === 'ADMIN' && (
                                            <Link href={"/admin" as any} className="flex items-center gap-3 px-4 py-2.5 text-sm text-accent-500 hover:text-accent-400 hover:bg-accent-500/5 transition-colors font-bold">
                                                <ShieldCheck size={16} /> Painel Administrativo
                                            </Link>
                                        )}
                                        <hr className="border-white/5 my-2" />
                                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-no-400 hover:text-no-300 hover:bg-no-500/5 transition-all duration-300 font-bold">
                                            <LogOut size={16} /> Encerrar Sessão
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : mounted ? (
                            <div className="flex items-center gap-3">
                                <Link href="/auth/login" className="hidden sm:flex px-5 py-2.5 text-sm font-bold text-white hover:text-accent-400 transition-colors">
                                    Entrar
                                </Link>
                                <Link href="/auth/register" className="btn-primary px-6 py-2.5 rounded-xl text-sm font-bold shadow-glow-accent">
                                    Criar Conta
                                </Link>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 opacity-0">
                                <div className="w-20 h-10 bg-white/5 rounded-xl" />
                                <div className="w-32 h-10 bg-white/5 rounded-xl" />
                            </div>
                        )}

                        <button className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center text-white hover:bg-white/5">
                            <Menu size={24} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Sub-Nav: Categories (Polymarket Style) - Hide if Admin route or Admin user */}
            {!pathname.startsWith('/admin') && user?.role !== 'ADMIN' && (
                <div className="relative z-40 h-[48px] bg-black/60 backdrop-blur-3xl border-b border-white/[0.03] overflow-x-auto scrollbar-hide flex items-center">
                    <div className="mx-auto max-w-[1400px] px-6 flex items-center gap-6">
                        {(() => {
                            const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
                            const currentCat = params?.get('category') || 'all';
                            return CATEGORIES.map((cat) => {
                                const isActive = currentCat === cat.slug;
                                return (
                                    <button
                                        key={cat.slug}
                                        onClick={() => {
                                            if (cat.slug === 'all') router.push('/');
                                            else router.push(`/?category=${cat.slug}`);
                                        }}
                                        className={`flex items-center gap-2 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${isActive ? 'text-white border-accent-500' : 'text-text-muted hover:text-white border-transparent hover:border-accent-500/50'
                                            }`}
                                    >
                                        <span>{cat.icon}</span>
                                        <span>{cat.label}</span>
                                    </button>
                                );
                            });
                        })()}
                    </div>
                </div>
            )}
        </header>
    );
}
