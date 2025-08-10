#!/usr/bin/env node

/**
 * 修复 rate-limiter-flexible 依赖问题
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 修复 rate-limiter-flexible 依赖问题...\n');

const rateLimitFilePath = path.join(__dirname, 'lib/middleware/rate-limit.ts');

if (fs.existsSync(rateLimitFilePath)) {
  let content = fs.readFileSync(rateLimitFilePath, 'utf8');
  
  // 移除 RateLimiterRedis 导入
  content = content.replace(
    /import { RateLimiterMemory, RateLimiterRedis, IRateLimiterOptions } from 'rate-limiter-flexible'/,
    `import { RateLimiterMemory, IRateLimiterOptions } from 'rate-limiter-flexible'
// 注意：移除了RateLimiterRedis以避免drizzle-orm依赖问题`
  );
  
  fs.writeFileSync(rateLimitFilePath, content, 'utf8');
  console.log('✅ 修复 rate-limiter 导入');
} else {
  console.log('⚠️  rate-limit.ts 文件不存在');
}

console.log('🎉 rate-limiter 修复完成!');