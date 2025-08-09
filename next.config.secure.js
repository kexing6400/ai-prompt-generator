/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🔐 实验性配置 - 修复Next.js 15部署问题
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb', // 限制请求体大小防止DoS
    },
  },
  
  // 🔐 ESLint和TypeScript设置 - 生产环境应启用
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'development', // 仅开发环境忽略
  },
  
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development', // 仅开发环境忽略
  },
  
  // 🔐 性能和安全优化
  compress: true, // 启用gzip压缩
  poweredByHeader: false, // 隐藏X-Powered-By头部，防止指纹识别
  
  // 🔐 图片优化和安全配置
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 🔐 限制外部图片域名，防止SSRF攻击
    domains: [], // 明确指定允许的图片域名
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
      {
        protocol: 'https', 
        hostname: 'aiprompts.ink',
      }
    ],
    // 🔐 防止图片优化滥用
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false, // 禁止SVG防止XSS
  },

  // 🔐 安全头部配置 (Next.js原生支持)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // 🔐 内容安全策略 (备用方案，主要通过middleware实现)
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://vercel.live; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://openrouter.ai https://api.openrouter.ai; object-src 'none'; frame-ancestors 'none';",
          },
          // 🔐 OWASP推荐的安全头部
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options', 
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          // 🔐 HSTS (仅生产环境)
          ...(process.env.NODE_ENV === 'production' ? [
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=31536000; includeSubDomains; preload',
            }
          ] : []),
        ],
      },
      // 🔐 API路由特殊安全配置
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
    ];
  },

  // 🔐 重定向配置
  async redirects() {
    return [
      // 重定向规则保持原有功能
      // 可以在这里添加安全重定向
    ];
  },

  // 🔐 URL重写配置  
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap',
      },
      // 🔐 隐藏敏感路径
      {
        source: '/admin/(.*)',
        destination: '/404', // 隐藏潜在的管理界面
      },
    ];
  },

  // 🔐 环境变量配置
  env: {
    SITE_NAME: 'AI Prompt Builder Pro',
    SITE_DESCRIPTION: '专业的垂直行业AI Prompt生成器',
    // 不在这里暴露敏感环境变量
  },

  // 🔐 Webpack配置优化
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 🔐 生产环境优化Bundle分析
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

    // 🔐 防止敏感文件打包
    config.resolve.alias = {
      ...config.resolve.alias,
      // 确保敏感文件不被意外打包
      '.env': false,
      '.env.local': false,
      '.env.production': false,
    };

    return config;
  },

  // 🔐 输出配置
  output: 'standalone', // 有助于容器化部署安全

  // 🔐 编译配置
  compiler: {
    // 🔐 生产环境移除console.log，但保留console.error和console.warn用于安全监控
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // 🔐 页面扩展限制
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'], // 明确指定允许的文件扩展名

  // 🔐 跟踪配置
  productionBrowserSourceMaps: false, // 生产环境禁用source map防止代码泄露

  // 🔐 国际化配置安全性
  i18n: {
    locales: ['zh-CN', 'en-US'],
    defaultLocale: 'zh-CN',
    localeDetection: true, // 但需要配合安全的语言检测
  },
};

module.exports = nextConfig;