'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { SystemVersion } from './SystemVersion';

export function NavbarWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    if (isAdmin) {
        return <main className="min-h-screen">{children}</main>;
    }

    return (
        <>
            <Navbar />
            <main className="pt-32 min-h-screen flex flex-col">
                <div className="flex-1">
                    {children}
                </div>
                <SystemVersion />
            </main>
        </>
    );
}
