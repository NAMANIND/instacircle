import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      const {
        PrismaPlugin,
      } = require('@prisma/nextjs-monorepo-workaround-plugin');
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }
    return config;
  },
  turbopack: {},
};

export default nextConfig;
