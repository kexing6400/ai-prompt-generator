#!/usr/bin/env node

/**
 * 部署前检查脚本 - 确保代码质量和配置正确
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始部署前检查...\n');

const checks = [
  {
    name: 'TypeScript类型检查',
    command: 'npm run type-check',
    required: true
  },
  {
    name: 'ESLint代码规范检查', 
    command: 'npm run lint',
    required: true
  },
  {
    name: '构建测试',
    command: 'npm run build',
    required: true
  },
  {
    name: 'API路由动态配置检查',
    custom: checkApiRoutesConfig,
    required: true
  }
];

let passed = 0;
let failed = 0;

for (const check of checks) {
  try {
    console.log(`📋 检查: ${check.name}`);
    
    if (check.custom) {
      await check.custom();
    } else {
      execSync(check.command, { stdio: 'pipe' });
    }
    
    console.log(`✅ 通过: ${check.name}\n`);
    passed++;
  } catch (error) {
    console.log(`❌ 失败: ${check.name}`);
    if (check.required) {
      console.log(`错误详情: ${error.message}\n`);
      failed++;
    } else {
      console.log(`警告: 非必需检查失败\n`);
    }
  }
}

// 检查API路由配置
async function checkApiRoutesConfig() {
  const apiRoutes = [
    'app/api/templates/list/route.ts',
    'app/api/subscription/plans/route.ts', 
    'app/api/subscription/usage/route.ts',
    'app/api/subscription/current/route.ts',
    'app/api/admin/auth/simple-verify/route.ts'
  ];
  
  for (const routePath of apiRoutes) {
    const fullPath = path.join(__dirname, '..', routePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (!content.includes("export const dynamic = 'force-dynamic'")) {
        throw new Error(`缺少dynamic配置: ${routePath}`);
      }
    }
  }
}

console.log(`\n📊 检查结果: ${passed} 通过, ${failed} 失败`);

if (failed > 0) {
  console.log('\n❌ 部署前检查失败，请修复问题后重试');
  process.exit(1);
} else {
  console.log('\n✅ 所有检查通过，可以安全部署！');
  process.exit(0);
}