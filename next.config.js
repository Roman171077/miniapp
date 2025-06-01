// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',      // оставляем статическую выгрузку
  images: {
    unoptimized: true,   // полностью отключаем Image Optimizer
  },
};

module.exports = nextConfig;
