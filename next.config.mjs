/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Temporarily disable Turbopack due to manifest issues in Next.js 16.0.1
  // Use standard webpack compiler instead
  experimental: {
    turbo: false,
  },
};

export default nextConfig;
