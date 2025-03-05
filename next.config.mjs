/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'rakit.digital',
        port: '',
        pathname: '/assets/**',
        search: '',
      },
    ],
  },
};

export default nextConfig;
