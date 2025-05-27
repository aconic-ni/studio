
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Enable static export for GitHub Pages
  output: 'export',
  // Image optimization needs a server, so we disable it for static export.
  // The GitHub Pages action `actions/configure-pages@v5` also attempts to set this.
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // If deploying to a subpath like username.github.io/repo-name,
  // the `actions/configure-pages@v5` GitHub Action step in your
  // `.github/workflows/nextjs.yml` file should automatically detect
  // and set the correct `basePath` for you during the build process.
  // You generally do not need to set `basePath` or `assetPrefix` manually here
  // when using that action.
};

export default nextConfig;
