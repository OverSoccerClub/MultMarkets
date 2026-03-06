import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from 'next-themes';
import { Providers } from './providers';
import { Navbar } from '@/components/layout/Navbar';
import './globals.css';

export const metadata: Metadata = {
    title: { default: 'MultMarkets', template: '%s | MultMarkets' },
    description: 'Plataforma de mercados de previsão. Aposte em eventos reais e ganhe com suas análises.',
    keywords: ['previsão', 'mercados', 'predições', 'polymarket', 'finanças'],
    authors: [{ name: 'MultMarkets' }],
    openGraph: {
        title: 'MultMarkets',
        description: 'Plataforma de mercados de previsão.',
        type: 'website',
    },
};

export const viewport: Viewport = {
    themeColor: '#080e1a',
    width: 'device-width',
    initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="pt-BR" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="min-h-dvh bg-bg-base text-text-secondary antialiased" suppressHydrationWarning>
                <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
                    <Providers>
                        <Navbar />
                        <main className="pt-16">{children}</main>
                    </Providers>
                </ThemeProvider>
            </body>
        </html>
    );
}
