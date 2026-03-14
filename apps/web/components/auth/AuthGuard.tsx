'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
    children: React.ReactNode;
    requiredRole?: 'ADMIN' | 'USER' | 'OPERATOR';
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
    const { isAuthenticated, user, _hasHydrated } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (!_hasHydrated) return;

        if (!isAuthenticated) {
            // Redirect to appropriate login page
            const loginUrl = pathname.startsWith('/admin') ? '/admin/login' : '/auth/login';
            router.push(`${loginUrl}?callbackUrl=${pathname}`);
            return;
        }

        if (requiredRole && user?.role !== requiredRole && user?.role !== 'ADMIN') {
            // If it's an admin page and user is not admin
            if (pathname.startsWith('/admin')) {
                router.push('/dashboard');
            } else {
                router.push('/');
            }
            return;
        }

        setIsAuthorized(true);
    }, [_hasHydrated, isAuthenticated, user, requiredRole, pathname, router]);

    if (!_hasHydrated || (!isAuthorized && isAuthenticated)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground animate-pulse text-sm font-medium">
                    Verificando acesso...
                </p>
            </div>
        );
    }

    if (!isAuthorized) return null;

    return <>{children}</>;
}
