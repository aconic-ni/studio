import type {NextConfig} from 'next';
import type {Configuration as WebpackConfiguration} from 'webpack';

interface NextJsWebpackConfigContext {
  isServer: boolean;
  webpack: any; // Using 'any' for simplicity, can be typed more strictly
}

const nextConfig: NextConfig = {
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
  },
  webpack: (
    config: WebpackConfiguration,
    { isServer }: NextJsWebpackConfigContext
  ): WebpackConfiguration => {
    // This function runs twice: once for the server bundle (isServer: true)
    // and once for the client bundle (isServer: false).

    if (!isServer) {
      // For client-side bundle, externalize Genkit and its problematic dependencies
      // This prevents them from being included in the browser bundle.
      config.externals = {
        ...(config.externals || {}), // Spread existing externals if any
        // Do not externalize local application files like '@ai/flows/...' here.
        // Rely on server-only package and API routes for proper separation.
        'genkit': 'commonjs genkit', // Externalize the main genkit package
        '@genkit-ai/core': 'commonjs @genkit-ai/core', // Externalize genkit core
        'dotprompt': 'commonjs dotprompt', // Externalize dotprompt
        'handlebars': 'commonjs handlebars', // Externalize handlebars
      };
    }

    // Always return the modified configuration
    return config;
  },
};

export default nextConfig;
