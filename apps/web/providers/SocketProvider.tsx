'use client';
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore, useWalletStore } from '@/lib/store';
import { useQueryClient } from '@tanstack/react-query';

interface SocketContextType {
    socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const { user, accessToken, isAuthenticated } = useAuthStore();
    const { setWallet } = useWalletStore();
    const queryClient = useQueryClient();
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!isAuthenticated || !accessToken) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            return;
        }

        // Initialize User Socket
        const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
        const socket = io(`${socketUrl}/users`, {
            auth: { token: accessToken },
            transports: ['websocket'],
        });

        socket.on('connect', () => {
            console.log('Connected to Users WebSocket');
        });

        socket.on('wallet_updated', (data) => {
            console.log('Wallet updated via Socket:', data);
            setWallet({
                balance: data.balance,
                available: data.available,
            });
            // Also invalidate query to ensure everything else refreshes
            queryClient.invalidateQueries({ queryKey: ['wallet'] });
        });

        socket.on('orders_updated', () => {
            console.log('Orders updated via Socket');
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['positions'] });
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [isAuthenticated, accessToken, setWallet, queryClient]);

    return (
        <SocketContext.Provider value={{ socket: socketRef.current }}>
            {children}
        </SocketContext.Provider>
    );
}
