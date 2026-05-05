/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Otimização de imagens para não pesar no server
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
