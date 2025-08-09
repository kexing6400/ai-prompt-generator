#!/usr/bin/env node

/**
 * AI Prompt Generator 性能分析工具
 * 专业级性能工程师的全面性能评估报告
 */

const fs = require('fs');
const path = require('path');

// 分析项目Bundle大小和依赖
function analyzeBundleSize() {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  
  console.log('📦 Bundle 大小分析');
  console.log('====================');
  
  // 分析依赖大小
  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};
  
  console.log(`生产依赖: ${Object.keys(dependencies).length} 个包`);
  console.log(`开发依赖: ${Object.keys(devDependencies).length} 个包`);
  
  // 重型依赖分析
  const heavyDependencies = [
    '@radix-ui',
    'next',
    'react',
    'tailwindcss',
    '@playwright/test',
    'typescript'
  ];
  
  console.log('\n🎯 重型依赖包分析:');
  Object.keys({...dependencies, ...devDependencies}).forEach(dep => {
    if (heavyDependencies.some(heavy => dep.includes(heavy))) {
      console.log(`- ${dep}: ${dependencies[dep] || devDependencies[dep]}`);
    }
  });
  
  return {
    totalDependencies: Object.keys(dependencies).length,
    totalDevDependencies: Object.keys(devDependencies).length,
    heavyPackages: heavyDependencies.filter(pkg => 
      Object.keys({...dependencies, ...devDependencies}).some(dep => dep.includes(pkg))
    )
  };
}

// 分析代码复杂度
function analyzeCodeComplexity() {
  console.log('\n🧮 代码复杂度分析');
  console.log('====================');
  
  const sourceFiles = [];
  
  function scanDirectory(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
        scanDirectory(filePath, extensions);
      } else if (extensions.some(ext => file.endsWith(ext))) {
        const content = fs.readFileSync(filePath, 'utf8');
        sourceFiles.push({
          path: filePath,
          size: content.length,
          lines: content.split('\n').length,
          complexity: calculateComplexity(content)
        });
      }
    });
  }
  
  function calculateComplexity(content) {
    // 简单的复杂度计算（圈复杂度的近似）
    const conditions = (content.match(/if\s*\(|for\s*\(|while\s*\(|switch\s*\(|\?\s*|&&|\|\|/g) || []).length;
    const functions = (content.match(/function|=>/g) || []).length;
    return conditions + functions;
  }
  
  scanDirectory('./app');
  scanDirectory('./components');
  scanDirectory('./lib');
  
  const totalLines = sourceFiles.reduce((sum, file) => sum + file.lines, 0);
  const totalSize = sourceFiles.reduce((sum, file) => sum + file.size, 0);
  const avgComplexity = sourceFiles.reduce((sum, file) => sum + file.complexity, 0) / sourceFiles.length;
  
  console.log(`总文件数: ${sourceFiles.length}`);
  console.log(`总代码行数: ${totalLines.toLocaleString()}`);
  console.log(`总代码大小: ${(totalSize / 1024).toFixed(2)} KB`);
  console.log(`平均复杂度: ${avgComplexity.toFixed(2)}`);
  
  // 找出最复杂的文件
  const complexFiles = sourceFiles
    .filter(file => file.complexity > avgComplexity * 1.5)
    .sort((a, b) => b.complexity - a.complexity)
    .slice(0, 5);
  
  if (complexFiles.length > 0) {
    console.log('\n🔍 高复杂度文件 (需要重构):');
    complexFiles.forEach(file => {
      console.log(`- ${file.path}: 复杂度 ${file.complexity}, ${file.lines} 行`);
    });
  }
  
  return {
    totalFiles: sourceFiles.length,
    totalLines,
    totalSize,
    avgComplexity,
    complexFiles: complexFiles.map(f => ({ path: f.path, complexity: f.complexity }))
  };
}

// 分析API性能瓶颈
function analyzeAPIPerformance() {
  console.log('\n⚡ API 性能瓶颈分析');
  console.log('========================');
  
  const apiFiles = [];
  
  function scanAPIFiles(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanAPIFiles(filePath);
      } else if (file === 'route.ts' || file === 'route.js') {
        const content = fs.readFileSync(filePath, 'utf8');
        apiFiles.push({
          path: filePath,
          content,
          hasExternalAPI: content.includes('fetch('),
          hasCaching: content.includes('cache') || content.includes('redis'),
          hasErrorHandling: content.includes('try') && content.includes('catch'),
          hasValidation: content.includes('zod') || content.includes('validate'),
          hasRateLimit: content.includes('rate') && content.includes('limit')
        });
      }
    });
  }
  
  scanAPIFiles('./app/api');
  
  console.log(`API路由总数: ${apiFiles.length}`);
  
  apiFiles.forEach(api => {
    console.log(`\n📍 ${api.path}`);
    console.log(`- 外部API调用: ${api.hasExternalAPI ? '✓' : '✗'}`);
    console.log(`- 缓存机制: ${api.hasCaching ? '✓' : '✗'}`);
    console.log(`- 错误处理: ${api.hasErrorHandling ? '✓' : '✗'}`);
    console.log(`- 输入验证: ${api.hasValidation ? '✓' : '✗'}`);
    console.log(`- 速率限制: ${api.hasRateLimit ? '✓' : '✗'}`);
    
    if (api.hasExternalAPI && !api.hasCaching) {
      console.log('  ⚠️  性能问题: 外部API调用缺乏缓存机制');
    }
  });
  
  return {
    totalAPIs: apiFiles.length,
    externalAPIs: apiFiles.filter(api => api.hasExternalAPI).length,
    cachedAPIs: apiFiles.filter(api => api.hasCaching).length,
    performanceIssues: apiFiles.filter(api => api.hasExternalAPI && !api.hasCaching).length
  };
}

// 生成性能优化建议
function generateOptimizationRecommendations(bundleAnalysis, codeAnalysis, apiAnalysis) {
  console.log('\n🎯 性能优化建议');
  console.log('==================');
  
  const recommendations = [];
  
  // Bundle优化建议
  if (bundleAnalysis.totalDependencies > 20) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Bundle Size',
      issue: `依赖包过多 (${bundleAnalysis.totalDependencies} 个)`,
      solution: '使用webpack-bundle-analyzer分析，移除未使用的依赖，考虑轻量级替代方案',
      impact: '减少初始加载时间 30-50%'
    });
  }
  
  // 代码复杂度建议
  if (codeAnalysis.avgComplexity > 10) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Code Complexity',
      issue: `平均代码复杂度过高 (${codeAnalysis.avgComplexity.toFixed(2)})`,
      solution: '重构高复杂度函数，使用设计模式，增加单元测试',
      impact: '提升维护性和运行性能'
    });
  }
  
  // API性能建议
  if (apiAnalysis.performanceIssues > 0) {
    recommendations.push({
      priority: 'CRITICAL',
      category: 'API Performance',
      issue: `${apiAnalysis.performanceIssues} 个API缺乏缓存机制`,
      solution: '实施Redis缓存、实现回退策略、添加请求去重',
      impact: '减少API响应时间 80-90%'
    });
  }
  
  // 输出建议
  recommendations.forEach((rec, index) => {
    console.log(`\n${index + 1}. [${rec.priority}] ${rec.category}`);
    console.log(`   问题: ${rec.issue}`);
    console.log(`   解决方案: ${rec.solution}`);
    console.log(`   预期效果: ${rec.impact}`);
  });
  
  return recommendations;
}

// 主分析函数
function performAnalysis() {
  console.log('🚀 AI Prompt Generator 性能分析报告');
  console.log('=====================================');
  console.log(`分析时间: ${new Date().toLocaleString()}`);
  console.log(`项目路径: ${process.cwd()}\n`);
  
  try {
    const bundleAnalysis = analyzeBundleSize();
    const codeAnalysis = analyzeCodeComplexity();
    const apiAnalysis = analyzeAPIPerformance();
    const recommendations = generateOptimizationRecommendations(bundleAnalysis, codeAnalysis, apiAnalysis);
    
    // 生成摘要报告
    console.log('\n📊 性能分析摘要');
    console.log('==================');
    console.log(`Bundle状态: ${bundleAnalysis.totalDependencies} 个依赖 - ${bundleAnalysis.totalDependencies > 20 ? '需要优化' : '良好'}`);
    console.log(`代码质量: 复杂度 ${codeAnalysis.avgComplexity.toFixed(2)} - ${codeAnalysis.avgComplexity > 10 ? '需要重构' : '良好'}`);
    console.log(`API性能: ${apiAnalysis.performanceIssues} 个待优化接口 - ${apiAnalysis.performanceIssues > 0 ? '需要缓存' : '良好'}`);
    console.log(`优化建议: ${recommendations.length} 项 - ${recommendations.filter(r => r.priority === 'CRITICAL').length} 个紧急项`);
    
    // 保存详细报告
    const report = {
      timestamp: new Date().toISOString(),
      project: 'AI Prompt Generator',
      analysis: {
        bundle: bundleAnalysis,
        code: codeAnalysis,
        api: apiAnalysis
      },
      recommendations,
      summary: {
        bundleStatus: bundleAnalysis.totalDependencies > 20 ? 'NEEDS_OPTIMIZATION' : 'GOOD',
        codeQuality: codeAnalysis.avgComplexity > 10 ? 'NEEDS_REFACTORING' : 'GOOD',
        apiPerformance: apiAnalysis.performanceIssues > 0 ? 'NEEDS_CACHING' : 'GOOD',
        totalIssues: recommendations.length,
        criticalIssues: recommendations.filter(r => r.priority === 'CRITICAL').length
      }
    };
    
    fs.writeFileSync('./performance-analysis-report.json', JSON.stringify(report, null, 2));
    console.log('\n✅ 详细报告已保存到: performance-analysis-report.json');
    
  } catch (error) {
    console.error('❌ 分析过程中出现错误:', error.message);
  }
}

// 执行分析
if (require.main === module) {
  performAnalysis();
}

module.exports = {
  performAnalysis,
  analyzeBundleSize,
  analyzeCodeComplexity,
  analyzeAPIPerformance
};