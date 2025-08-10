#!/usr/bin/env node

/**
 * Vercel 部署修复脚本
 * 解决 Dynamic Server Usage 错误
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 开始修复Vercel部署问题...\n');

// 需要添加 dynamic = 'force-dynamic' 的API路由
const apiRoutesToFix = [
  'app/api/templates/list/route.ts',
  'app/api/subscription/plans/route.ts',
  'app/api/subscription/usage/route.ts',
  'app/api/subscription/current/route.ts',
  'app/api/admin/auth/simple-verify/route.ts'
];

let fixedCount = 0;

apiRoutesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  文件不存在: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // 检查是否已经包含 dynamic 配置
  if (content.includes("export const dynamic = 'force-dynamic'")) {
    console.log(`✅ 已配置: ${filePath}`);
    return;
  }
  
  // 查找导入语句的结束位置
  const importEndRegex = /import[^;]+;(?:\s*\n)*/g;
  let lastImportMatch;
  let match;
  
  while ((match = importEndRegex.exec(content)) !== null) {
    lastImportMatch = match;
  }
  
  if (lastImportMatch) {
    const insertPosition = lastImportMatch.index + lastImportMatch[0].length;
    const beforeInsert = content.slice(0, insertPosition);
    const afterInsert = content.slice(insertPosition);
    
    const newContent = beforeInsert + 
      '\n// 强制动态路由 - 防止Vercel部署时的静态生成错误\n' +
      "export const dynamic = 'force-dynamic'\n" + 
      afterInsert;
    
    fs.writeFileSync(fullPath, newContent, 'utf8');
    console.log(`✅ 修复完成: ${filePath}`);
    fixedCount++;
  } else {
    console.log(`⚠️  无法找到导入语句: ${filePath}`);
  }
});

console.log(`\n🎉 修复完成! 共修复 ${fixedCount} 个文件\n`);

// 检查和修复依赖问题
console.log('📦 检查依赖问题...');

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// 检查是否需要添加 drizzle-orm 或修改 rate-limiter-flexible 配置
if (!packageJson.dependencies['drizzle-orm']) {
  console.log('⚠️  建议: 可以添加 drizzle-orm 依赖或调整 rate-limiter 配置');
}

console.log('\n📋 下一步需要手动执行:');
console.log('1. 在Vercel控制台添加环境变量:');
console.log('   - OPENROUTER_API_KEY=sk-or-v1-your-key-here');
console.log('2. 重新部署项目');
console.log('3. 测试所有API端点');

console.log('\n🚀 修复脚本执行完成!');