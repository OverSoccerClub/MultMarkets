'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import { SocketProvider } from '@/providers/SocketProvider';

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 30_000,      // 30s
                        retry: 1,
                        refetchOnWindowFocus: true,
                    },
                },
            }),
    );

    return (
        <QueryClientProvider client={queryClient}>
            <SocketProvider>
                <ToastProvider>
                    {children}
                </ToastProvider>
            </SocketProvider>
        </QueryClientProvider>
    );
}
