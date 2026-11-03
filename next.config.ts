import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'storage.cloud.google.com' },
    ],
  },
  // Ensure the build process handles server-side packages correctly
  serverExternalPackages: ['handlebars', 'wav'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Allow the Cloud Workstation dev origin to prevent cross-origin chunk loading issues
    allowedDevOrigins: [
      '6000-firebase-studio-1757528281636.cluster-lu4mup47g5gm4rtyvhzpwbfadi.cloudworkstations.dev',
      'localhost:9002'
    ],
  },
};

export default nextConfig;
