// next.config.ts — Configuración principal de Next.js para BuscayCurra

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ];
  },
  // Paquetes server-only con módulos nativos o que conectan a Redis.
  // Next.js los excluye del bundle webpack y los toma directamente de node_modules.
  serverExternalPackages: [
    'bullmq',
    'ioredis',
    'ws',
    'nodemailer',
    'canvas',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
