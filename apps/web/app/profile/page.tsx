'use client';

import { useAuthStore } from '@/lib/store';

export default function ProfilePage() {
    const { user } = useAuthStore();
    return (
        <div className="mx-auto max-w-4xl px-6 pt-36 pb-20">
            <h1 className="text-3xl font-black uppercase tracking-tight">Meu Perfil</h1>
            <div className="mt-8 bg-black/40 border border-white/5 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white/50 mb-2">Usuário</h3>
                <p className="text-lg font-black">{user?.name || 'Carregando...'}</p>
                <h3 className="text-sm font-bold text-white/50 mt-6 mb-2">E-mail</h3>
                <p className="text-lg font-black">{user?.email || '...'}</p>
            </div>
        </div>
    );
}
