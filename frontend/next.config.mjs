/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Otimização de imagens para não pesar no server
  images: {
    unoptimized: true,
  },
};

// Next.js configuration
export default nextConfig;
