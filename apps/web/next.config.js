/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    experimental: {
        typedRoutes: true,
        serverActions: { allowedOrigins: [] },  // App uses client-side API calls, not Server Actions
    },
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: '**' },
        ],
    },
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
        NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001',
    },
    // Prevent cached JS from old deploys from causing "Server Action not found" errors
    headers: async () => [
        {
            source: '/:path*',
            headers: [
                { key: 'X-DNS-Prefetch-Control', value: 'on' },
            ],
        },
    ],
};

module.exports = nextConfig;
