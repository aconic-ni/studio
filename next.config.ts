import type { NextConfig } from 'next';
import type { Configuration as WebpackConfiguration } from 'webpack';

interface NextJsWebpackConfigContext {
  isServer: boolean;
}

const nextConfig: NextConfig = {
  output: 'export', // <-- ADDED FOR STATIC EXPORT
  typescript: {
    ignoreBuildErrors: true, // Consider setting this to false in production for better type safety
  },
  eslint: {
    ignoreDuringBuilds: true, // Consider setting this to false in production for better linting
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
    unoptimized: true, // <-- ADDED: Necessary for next export with next/image
  },
  webpack: (
    config: WebpackConfiguration,
    { isServer }: NextJsWebpackConfigContext
  ): WebpackConfiguration => {
    if (!isServer) {
      // Safer way to merge externals
      config.externals = Array.isArray(config.externals)
        ? [...config.externals, 'genkit', '@genkit-ai/core', 'dotprompt', 'handlebars']
        : config.externals
          ? [config.externals, 'genkit', '@genkit-ai/core', 'dotprompt', 'handlebars']
          : ['genkit', '@genkit-ai/core', 'dotprompt', 'handlebars'];
    }
    return config;
  },
};

export default nextConfig;
