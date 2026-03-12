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
            {/* Main Nav (Single Line Refinement) */}
            <nav className="relative z-50 h-[76px] glass-2 border-b border-white/[0.05] shadow-2xl backdrop-blur-3xl overflow-hidden">
                <div className="mx-auto max-w-[1400px] px-6 h-full flex items-center justify-between gap-6">

                    {/* Left: Logo + Desktop Links */}
                    <div className="flex items-center gap-6 flex-shrink-0">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-500 via-accent-800 to-black flex items-center justify-center shadow-glow-accent border border-white/20">
                                <span className="text-white font-black text-base italic">M</span>
                            </div>
                            <span className="font-display font-black text-white text-xl hidden xl:block tracking-tighter uppercase">
                                Mult<span className="text-accent-500">Markets</span>
                            </span>
                        </Link>

                        <div className="h-6 w-[1px] bg-white/10 hidden md:block" />

                        <div className="hidden md:flex items-center gap-1">
                            {navLinks.map(({ href, label, icon: Icon }) => {
                                const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                                return (
                                    <Link
                                        key={href}
                                        href={href as any}
                                        className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-300
                      ${active ? 'text-white' : 'text-white/40 hover:text-white'}`}
                                    >
                                        <Icon size={14} className={active ? 'text-accent-500' : ''} />
                                        <span>{label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Middle: Categories Scroll (Integrated) */}
                    <div className="hidden lg:flex flex-1 items-center justify-center overflow-hidden">
                        <div className="flex items-center gap-1 px-4 overflow-x-auto scrollbar-hide mask-fade-edges">
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
                                            className={`flex items-center gap-2 px-4 py-2 text-[9px] font-black uppercase tracking-[0.1em] transition-all rounded-xl whitespace-nowrap border border-transparent
                        ${isActive 
                            ? 'bg-white/5 border-white/10 text-white shadow-inner-surface' 
                            : 'text-white/30 hover:text-white hover:bg-white/[0.03]'
                        }`}
                                        >
                                            <span className="scale-110 opacity-70">{cat.icon}</span>
                                            <span>{cat.label}</span>
                                        </button>
                                    );
                                });
                            })()}
                        </div>
                    </div>

                    {/* Right side: Search + Wallet + Profile */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                        {/* Compact Search Trigger */}
                        <div className="hidden sm:flex relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent-500 transition-colors" size={14} />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                className="w-32 xl:w-48 bg-white/[0.03] border border-white/[0.08] rounded-xl py-2 pl-9 pr-3 text-[10px] text-white placeholder:text-white/20 focus:bg-white/[0.07] focus:border-accent-500/50 outline-none transition-all"
                            />
                        </div>

                        {isAuthenticated ? (
                            <>
                                {user?.role !== 'ADMIN' && (
                                    <Link
                                        href={"/wallet" as any}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-yes-500/5 border border-yes-500/20 hover:bg-yes-500/10 transition-all group/wallet"
                                    >
                                        <Wallet size={12} className="text-yes-400" />
                                        <span className="text-white font-bold tabular-nums text-xs">
                                            R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </Link>
                                )}

                                <div className="relative group/profile">
                                    <button className="flex items-center gap-2 p-0.5 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10">
                                        <div className="w-8 h-8 rounded-lg bg-accent-950 border border-white/10 flex items-center justify-center group-hover/profile:border-accent-500/50 transition-all">
                                            <span className="text-xs font-black text-accent-500">
                                                {user?.name?.charAt(0)?.toUpperCase()}
                                            </span>
                                        </div>
                                    </button>

                                    {/* Dropdown */}
                                    <div className="absolute right-0 top-full mt-3 w-56 bg-[#0a0a0a] border border-white/10 rounded-2xl py-2 shadow-2xl opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible transition-all duration-200 z-[1200] transform translate-y-1 group-hover/profile:translate-y-0">
                                        <div className="px-4 py-2 border-b border-white/5 mb-2">
                                            <div className="text-[9px] text-white/20 font-black uppercase tracking-widest mb-1">Conta Titular</div>
                                            <div className="text-xs text-white font-black truncate">{user?.username}</div>
                                        </div>
                                        <Link href={"/profile" as any} className="flex items-center gap-3 px-4 py-2.5 text-xs text-white/40 hover:text-white hover:bg-white/5 transition-colors font-bold">
                                            <User size={14} /> Perfil e Segurança
                                        </Link>
                                        {user?.role !== 'ADMIN' && (
                                            <Link href={"/orders" as any} className="flex items-center gap-3 px-4 py-2.5 text-xs text-white/40 hover:text-white hover:bg-white/5 transition-colors font-bold">
                                                <BarChart2 size={14} /> Minhas Apostas
                                            </Link>
                                        )}
                                        {user?.role === 'ADMIN' && (
                                            <Link href={"/admin" as any} className="flex items-center gap-3 px-4 py-2.5 text-xs text-accent-500 hover:text-accent-400 hover:bg-accent-500/5 transition-colors font-black">
                                                <ShieldCheck size={14} /> Painel Administrativo
                                            </Link>
                                        )}
                                        <hr className="border-white/5 my-2" />
                                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-no-400 hover:text-no-300 hover:bg-no-500/5 transition-all font-black">
                                            <LogOut size={14} /> Sair
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : mounted ? (
                            <div className="flex items-center gap-4">
                                <Link href="/auth/login" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                                    Entrar
                                </Link>
                                <Link href="/auth/register" className="bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent-500 hover:text-white transition-all shadow-glow-white hover:shadow-glow-accent">
                                    Começar
                                </Link>
                            </div>
                        ) : (
                            <div className="w-32 h-8 bg-white/5 rounded-xl animate-pulse" />
                        )}

                        <button className="md:hidden text-white/40 hover:text-white">
                            <Menu size={20} />
                        </button>
                    </div>
                </div>
            </nav>
        </header>
    );
}
