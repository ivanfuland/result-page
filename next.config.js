/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'export',  // 静态导出
  images: {
    unoptimized: true,  // Cloudflare Pages不支持Next.js图像优化
  },
}

module.exports = nextConfig 