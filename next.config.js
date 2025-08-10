/** @type {import('next').NextConfig} */
const nextConfig = {
  // 实验性配置 - 修复Next.js 15部署问题
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // ESLint设置 - 构建时忽略警告
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScript设置 - 生产环境严格检查
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  
  // 性能优化
  compress: true,
  poweredByHeader: false,
  
  // 图片优化
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 重定向和重写 - SEO优化
  async redirects() {
    return [
      // 重定向规则（如果需要的话）
      // 例如：将旧URL重定向到新URL
      // {
      //   source: '/old-lawyer',
      //   destination: '/lawyer',
      //   permanent: true,
      // },
    ];
  },

  // 生成sitemap需要的元数据
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap',
      },
    ];
  },

  // 环境变量
  env: {
    SITE_NAME: 'AI Prompt Generator',
    SITE_DESCRIPTION: '专业的垂直行业AI Prompt生成器',
  },

  // Webpack配置优化
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 忽略可选的drizzle-orm依赖（rate-limiter-flexible的可选依赖）
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        'drizzle-orm': false
      },
      fallback: {
        ...config.resolve?.fallback,
        'drizzle-orm': false
      }
    };
    
    // 使用webpack.IgnorePlugin忽略drizzle-orm
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^drizzle-orm$/,
        contextRegExp: /rate-limiter-flexible/
      })
    );
    
    // 优化Bundle分析
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          chunks: 'initial',
        },
        common: {
          name: 'common',
          minChunks: 2,
          priority: 5,
          chunks: 'initial',
          reuseExistingChunk: true,
        },
      };
    }
    return config;
  },
};

module.exports = nextConfig;