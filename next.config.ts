import type {NextConfig} from 'next';
import type {Configuration as WebpackConfiguration} from 'webpack';

interface NextJsWebpackConfigContext {
  isServer: boolean;
  webpack: any; // Using 'any' for simplicity, can be typed more strictly
}

const nextConfig: NextConfig = {
  output: 'export', // <-- ADDED FOR STATIC EXPORT
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
      config.externals = {
        ...(config.externals || {}),
        'genkit': 'commonjs genkit',
        '@genkit-ai/core': 'commonjs @genkit-ai/core',
        'dotprompt': 'commonjs dotprompt',
        'handlebars': 'commonjs handlebars',
      };
    }
    return config;
  },
};

export default nextConfig;
