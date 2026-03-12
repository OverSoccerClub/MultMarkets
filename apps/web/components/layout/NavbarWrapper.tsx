'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';

export function NavbarWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    if (isAdmin) {
        return <main className="min-h-screen">{children}</main>;
    }

    return (
        <>
            <Navbar />
            <main className="pt-16 min-h-screen">{children}</main>
        </>
    );
}
