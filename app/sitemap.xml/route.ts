// 动态XML Sitemap生成器 - 世界级SEO
import { NextResponse } from 'next/server';

const BASE_URL = 'https://www.aiprompts.ink';

// 所有页面的配置
const pages = [
  {
    url: '/',
    changefreq: 'daily',
    priority: '1.0',
    lastmod: new Date().toISOString(),
  },
  {
    url: '/ai-prompts-for-lawyers',
    changefreq: 'weekly',
    priority: '0.9',
    lastmod: new Date().toISOString(),
  },
  {
    url: '/ai-prompts-for-teachers',
    changefreq: 'weekly',
    priority: '0.9',
    lastmod: new Date().toISOString(),
  },
  {
    url: '/ai-prompts-for-accountants',
    changefreq: 'weekly',
    priority: '0.9',
    lastmod: new Date().toISOString(),
  },
  {
    url: '/ai-prompts-for-realtors',
    changefreq: 'weekly',
    priority: '0.9',
    lastmod: new Date().toISOString(),
  },
  {
    url: '/ai-prompts-for-insurance-advisors',
    changefreq: 'weekly',
    priority: '0.9',
    lastmod: new Date().toISOString(),
  },
];

function generateSiteMap() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0">
${pages
  .map(({ url, changefreq, priority, lastmod }) => {
    return `
  <url>
    <loc>${BASE_URL}${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  })
  .join('')}
</urlset>`;
}

export async function GET() {
  const sitemap = generateSiteMap();
  
  return new NextResponse(sitemap, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}