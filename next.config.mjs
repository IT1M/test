/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      // Dexie.js works fine with Turbopack, no special config needed
    },
  },
};

export default nextConfig;
