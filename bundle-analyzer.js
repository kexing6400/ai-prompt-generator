/**
 * 前端Bundle大小分析器
 * 分析打包文件大小、依赖关系、Code Splitting优化建议
 * 作者：Performance Engineer Team
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

// Bundle分析配置
const BUNDLE_CONFIG = {
  buildDir: '.next',
  staticDir: '.next/static',
  chunkThreshold: 250000, // 250KB chunk警告阈值
  gzipThreshold: 100000,  // 100KB gzip警告阈值
  maxBundleSize: 1000000, // 1MB最大bundle大小
  criticalResources: [
    'main',
    'framework',
    'commons',
    'runtime'
  ]
};

// Bundle分析器类
class BundleAnalyzer {
  constructor() {
    this.results = {
      totalSize: 0,
      gzippedSize: 0,
      chunkAnalysis: {},
      pageAnalysis: {},
      dependencies: {},
      recommendations: [],
      coreWebVitals: {},
      timestamp: Date.now()
    };
  }

  // 分析Next.js构建输出
  async analyzeBuildOutput() {
    try {
      console.log('📦 开始分析Bundle大小...');
      
      // 检查是否存在构建文件
      const buildPath = path.join(process.cwd(), BUNDLE_CONFIG.buildDir);
      await fs.access(buildPath);
      
      // 分析静态资源
      await this.analyzeStaticAssets();
      
      // 分析页面Bundle
      await this.analyzePageBundles();
      
      // 分析依赖关系
      await this.analyzeDependencies();
      
      // 生成优化建议
      this.generateOptimizationRecommendations();
      
      return this.results;
    } catch (error) {
      console.error('Bundle分析失败:', error.message);
      throw error;
    }
  }

  // 分析静态资源
  async analyzeStaticAssets() {
    try {
      const staticPath = path.join(process.cwd(), BUNDLE_CONFIG.staticDir);
      const chunks = await this.scanDirectory(staticPath, '.js');
      
      for (const chunk of chunks) {
        const stats = await fs.stat(chunk);
        const relativePath = path.relative(process.cwd(), chunk);
        const chunkName = this.extractChunkName(chunk);
        
        // 尝试获取gzip大小
        let gzippedSize = 0;
        try {
          const { stdout } = await execAsync(`gzip -c "${chunk}" | wc -c`);
          gzippedSize = parseInt(stdout.trim());
        } catch (error) {
          // 如果gzip命令不可用，估算压缩后大小（约35%）
          gzippedSize = Math.round(stats.size * 0.35);
        }
        
        this.results.chunkAnalysis[chunkName] = {
          path: relativePath,
          size: stats.size,
          gzippedSize,
          compressionRatio: ((stats.size - gzippedSize) / stats.size * 100).toFixed(1) + '%',
          isLarge: stats.size > BUNDLE_CONFIG.chunkThreshold,
          isCritical: BUNDLE_CONFIG.criticalResources.some(resource => 
            chunkName.toLowerCase().includes(resource.toLowerCase())
          )
        };
        
        this.results.totalSize += stats.size;
        this.results.gzippedSize += gzippedSize;
      }
      
      // 分析CSS文件
      const cssFiles = await this.scanDirectory(staticPath, '.css');
      for (const cssFile of cssFiles) {
        const stats = await fs.stat(cssFile);
        const relativePath = path.relative(process.cwd(), cssFile);
        
        this.results.chunkAnalysis[path.basename(cssFile)] = {
          path: relativePath,
          size: stats.size,
          type: 'css',
          isLarge: stats.size > 50000 // 50KB CSS警告阈值
        };
        
        this.results.totalSize += stats.size;
      }
      
    } catch (error) {
      console.warn('静态资源分析失败:', error.message);
    }
  }

  // 分析页面Bundle
  async analyzePageBundles() {
    try {
      const pagesPath = path.join(process.cwd(), BUNDLE_CONFIG.buildDir, 'static', 'chunks', 'pages');
      
      if (await this.pathExists(pagesPath)) {
        const pageFiles = await this.scanDirectory(pagesPath, '.js');
        
        for (const pageFile of pageFiles) {
          const stats = await fs.stat(pageFile);
          const relativePath = path.relative(process.cwd(), pageFile);
          const pageName = this.extractPageName(pageFile);
          
          this.results.pageAnalysis[pageName] = {
            path: relativePath,
            size: stats.size,
            sizeFormatted: this.formatBytes(stats.size),
            isLarge: stats.size > 100000 // 100KB页面警告阈值
          };
        }
      }
    } catch (error) {
      console.warn('页面Bundle分析失败:', error.message);
    }
  }

  // 分析依赖关系
  async analyzeDependencies() {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };
      
      // 分析重要依赖的大小
      const heavyDependencies = [
        'react', 'react-dom', 'next',
        '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu',
        'framer-motion', 'lucide-react',
        'tailwindcss', 'autoprefixer'
      ];
      
      for (const dep of heavyDependencies) {
        if (dependencies[dep]) {
          this.results.dependencies[dep] = {
            version: dependencies[dep],
            estimated_size: await this.estimatePackageSize(dep),
            isHeavy: true
          };
        }
      }
      
      // 计算总依赖数
      this.results.dependencies.total_count = Object.keys(dependencies).length;
      
    } catch (error) {
      console.warn('依赖分析失败:', error.message);
    }
  }

  // 生成优化建议
  generateOptimizationRecommendations() {
    const recommendations = [];
    
    // Bundle大小检查
    if (this.results.totalSize > BUNDLE_CONFIG.maxBundleSize) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Bundle Size',
        issue: `总Bundle大小过大 (${this.formatBytes(this.results.totalSize)})`,
        suggestion: '启用代码分割，使用动态导入，移除未使用的依赖',
        impact: 'FCP, LCP 性能影响'
      });
    }
    
    // 大文件检查
    const largeChunks = Object.entries(this.results.chunkAnalysis)
      .filter(([name, info]) => info.isLarge)
      .map(([name]) => name);
    
    if (largeChunks.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Code Splitting',
        issue: `发现 ${largeChunks.length} 个大文件: ${largeChunks.join(', ')}`,
        suggestion: '对大组件使用React.lazy()，拆分vendor chunks',
        impact: 'FCP, TTI 性能影响'
      });
    }
    
    // 压缩优化检查
    const poorlyCompressed = Object.entries(this.results.chunkAnalysis)
      .filter(([name, info]) => {
        if (!info.compressionRatio) return false;
        const ratio = parseFloat(info.compressionRatio);
        return ratio < 60; // 压缩率低于60%
      });
    
    if (poorlyCompressed.length > 0) {
      recommendations.push({
        priority: 'LOW',
        category: 'Compression',
        issue: `${poorlyCompressed.length} 个文件压缩效果不佳`,
        suggestion: '启用Brotli压缩，优化重复代码',
        impact: '网络传输性能影响'
      });
    }
    
    // 关键路径检查
    const criticalChunks = Object.entries(this.results.chunkAnalysis)
      .filter(([name, info]) => info.isCritical && info.size > BUNDLE_CONFIG.chunkThreshold);
    
    if (criticalChunks.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Critical Path',
        issue: `关键路径文件过大: ${criticalChunks.map(([name]) => name).join(', ')}`,
        suggestion: '优化关键路径，延迟加载非关键资源',
        impact: 'FCP, LCP, TTI 严重影响'
      });
    }
    
    // 未使用的依赖检查
    if (this.results.dependencies.total_count > 50) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Dependencies',
        issue: `依赖数量过多 (${this.results.dependencies.total_count})`,
        suggestion: '移除未使用的依赖，使用轻量级替代方案',
        impact: 'Bundle大小和构建时间影响'
      });
    }
    
    this.results.recommendations = recommendations;
  }

  // 辅助方法
  async scanDirectory(dirPath, extension) {
    const files = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.scanDirectory(fullPath, extension);
          files.push(...subFiles);
        } else if (entry.isFile() && entry.name.endsWith(extension)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // 目录不存在或无权访问
    }
    
    return files;
  }

  async pathExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  extractChunkName(filePath) {
    return path.basename(filePath, path.extname(filePath));
  }

  extractPageName(filePath) {
    const relativePath = path.relative(
      path.join(process.cwd(), BUNDLE_CONFIG.buildDir, 'static', 'chunks', 'pages'),
      filePath
    );
    return relativePath.replace(path.extname(relativePath), '');
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  async estimatePackageSize(packageName) {
    // 简单的大小估算表
    const sizeEstimates = {
      'react': '42KB',
      'react-dom': '130KB',
      'next': '280KB',
      'framer-motion': '180KB',
      'lucide-react': '90KB',
      '@radix-ui/react-dialog': '45KB',
      '@radix-ui/react-dropdown-menu': '55KB',
      'tailwindcss': '15KB (runtime)',
      'autoprefixer': '0KB (build-time)'
    };
    
    return sizeEstimates[packageName] || 'Unknown';
  }
}

// Core Web Vitals分析器
class CoreWebVitalsAnalyzer {
  constructor() {
    this.thresholds = {
      FCP: 1800,  // First Contentful Paint - 1.8s
      LCP: 2500,  // Largest Contentful Paint - 2.5s
      TTI: 3800,  // Time to Interactive - 3.8s
      CLS: 0.1,   // Cumulative Layout Shift - 0.1
      FID: 100    // First Input Delay - 100ms
    };
  }

  // 基于Bundle大小估算Core Web Vitals
  estimateWebVitals(bundleResults) {
    const estimates = {};
    
    // 基于Bundle大小估算FCP
    const mainBundleSize = this.getMainBundleSize(bundleResults);
    const estimatedFCP = this.estimateFCP(mainBundleSize);
    estimates.FCP = {
      estimated: estimatedFCP,
      threshold: this.thresholds.FCP,
      status: estimatedFCP <= this.thresholds.FCP ? 'GOOD' : 'NEEDS_IMPROVEMENT'
    };
    
    // 基于关键路径资源估算LCP
    const criticalResourcesSize = this.getCriticalResourcesSize(bundleResults);
    const estimatedLCP = this.estimateLCP(criticalResourcesSize);
    estimates.LCP = {
      estimated: estimatedLCP,
      threshold: this.thresholds.LCP,
      status: estimatedLCP <= this.thresholds.LCP ? 'GOOD' : 'NEEDS_IMPROVEMENT'
    };
    
    // 基于总JS大小估算TTI
    const totalJSSize = this.getTotalJSSize(bundleResults);
    const estimatedTTI = this.estimateTTI(totalJSSize);
    estimates.TTI = {
      estimated: estimatedTTI,
      threshold: this.thresholds.TTI,
      status: estimatedTTI <= this.thresholds.TTI ? 'GOOD' : 'NEEDS_IMPROVEMENT'
    };
    
    // CLS和FID基于代码质量估算（简化版本）
    estimates.CLS = {
      estimated: 0.05, // 假设良好的布局
      threshold: this.thresholds.CLS,
      status: 'GOOD'
    };
    
    estimates.FID = {
      estimated: 50, // 假设良好的交互响应
      threshold: this.thresholds.FID,
      status: 'GOOD'
    };
    
    return estimates;
  }

  getMainBundleSize(bundleResults) {
    const mainChunks = Object.entries(bundleResults.chunkAnalysis)
      .filter(([name, info]) => info.isCritical)
      .reduce((sum, [name, info]) => sum + info.size, 0);
    
    return mainChunks || bundleResults.totalSize * 0.3; // 估算30%为关键路径
  }

  getCriticalResourcesSize(bundleResults) {
    return this.getMainBundleSize(bundleResults);
  }

  getTotalJSSize(bundleResults) {
    return Object.values(bundleResults.chunkAnalysis)
      .filter(info => info.type !== 'css')
      .reduce((sum, info) => sum + info.size, 0);
  }

  estimateFCP(bundleSize) {
    // 基于Bundle大小的FCP估算公式
    // 假设3G网络 (1.6Mbps)，考虑解析时间
    const downloadTime = (bundleSize * 8) / (1.6 * 1000000) * 1000; // ms
    const parseTime = bundleSize / 1000; // 简化的解析时间估算
    return Math.round(downloadTime + parseTime + 300); // 300ms基础延迟
  }

  estimateLCP(criticalSize) {
    // LCP通常比FCP晚500-1000ms
    return this.estimateFCP(criticalSize) + 700;
  }

  estimateTTI(totalJSSize) {
    // TTI基于总JS大小，考虑主线程阻塞时间
    const fcp = this.estimateFCP(totalJSSize * 0.4); // 关键路径约40%
    const jsExecutionTime = totalJSSize / 2000; // 简化的执行时间
    return Math.round(fcp + jsExecutionTime + 500);
  }
}

// 报告生成器
class BundleReportGenerator {
  async generateReport(bundleResults, webVitals) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bundle分析报告 - 律师AI工作台</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f7fa;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5rem;
            font-weight: 300;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }
        .metric-card {
            background: white;
            padding: 25px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .metric-value {
            font-size: 2.2rem;
            font-weight: bold;
            margin-bottom: 8px;
        }
        .metric-label {
            color: #666;
            font-size: 1rem;
        }
        .good { color: #28a745; }
        .warning { color: #ffc107; }
        .danger { color: #dc3545; }
        .section {
            padding: 30px;
            border-bottom: 1px solid #e9ecef;
        }
        .section h2 {
            margin: 0 0 25px 0;
            color: #333;
            font-size: 1.8rem;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        .chunk-list {
            display: grid;
            gap: 15px;
        }
        .chunk-item {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #28a745;
        }
        .chunk-item.large {
            border-left-color: #ffc107;
        }
        .chunk-item.critical {
            border-left-color: #dc3545;
        }
        .chunk-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .chunk-name {
            font-weight: bold;
            font-size: 1.1rem;
        }
        .chunk-size {
            background: #667eea;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.9rem;
        }
        .webvitals-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        .vital-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #28a745;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .vital-card.needs-improvement {
            border-left-color: #ffc107;
        }
        .vital-card.poor {
            border-left-color: #dc3545;
        }
        .recommendations {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 25px;
        }
        .recommendation {
            background: white;
            padding: 20px;
            margin: 15px 0;
            border-radius: 8px;
            border-left: 4px solid #17a2b8;
        }
        .recommendation.high { border-left-color: #dc3545; }
        .recommendation.medium { border-left-color: #ffc107; }
        .recommendation.low { border-left-color: #28a745; }
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e9ecef;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 10px;
        }
        .progress-fill {
            height: 100%;
            background: #28a745;
            transition: width 0.3s ease;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📦 Bundle分析报告</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">律师AI工作台前端性能分析</p>
            <p style="margin: 5px 0 0 0; font-size: 0.9rem;">生成时间: ${new Date().toLocaleString()}</p>
        </div>

        <div class="summary-grid">
            <div class="metric-card">
                <div class="metric-value good">${bundleResults.totalSize ? (bundleResults.totalSize / 1024 / 1024).toFixed(1) : '0'} MB</div>
                <div class="metric-label">总Bundle大小</div>
            </div>
            <div class="metric-card">
                <div class="metric-value good">${bundleResults.gzippedSize ? (bundleResults.gzippedSize / 1024 / 1024).toFixed(1) : '0'} MB</div>
                <div class="metric-label">压缩后大小</div>
            </div>
            <div class="metric-card">
                <div class="metric-value ${Object.keys(bundleResults.chunkAnalysis).length > 20 ? 'warning' : 'good'}">${Object.keys(bundleResults.chunkAnalysis).length}</div>
                <div class="metric-label">文件数量</div>
            </div>
            <div class="metric-card">
                <div class="metric-value ${bundleResults.dependencies.total_count > 50 ? 'warning' : 'good'}">${bundleResults.dependencies.total_count || 0}</div>
                <div class="metric-label">依赖数量</div>
            </div>
        </div>

        <div class="section">
            <h2>🎯 Core Web Vitals估算</h2>
            <div class="webvitals-grid">
                ${Object.entries(webVitals).map(([metric, data]) => `
                    <div class="vital-card ${data.status.toLowerCase().replace('_', '-')}">
                        <h4>${metric}</h4>
                        <p style="font-size: 1.5rem; margin: 10px 0;">
                            ${metric === 'CLS' ? data.estimated.toFixed(3) : Math.round(data.estimated) + 'ms'}
                        </p>
                        <p style="color: #666; margin: 0;">
                            目标: ${metric === 'CLS' ? data.threshold : data.threshold + 'ms'}
                        </p>
                        <p style="margin: 5px 0 0 0; font-weight: bold; color: ${data.status === 'GOOD' ? '#28a745' : '#ffc107'};">
                            ${data.status.replace('_', ' ')}
                        </p>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2>📋 Chunk分析</h2>
            <div class="chunk-list">
                ${Object.entries(bundleResults.chunkAnalysis).map(([name, info]) => `
                    <div class="chunk-item ${info.isLarge ? 'large' : ''} ${info.isCritical ? 'critical' : ''}">
                        <div class="chunk-header">
                            <span class="chunk-name">${name}</span>
                            <span class="chunk-size">${(info.size / 1024).toFixed(1)} KB</span>
                        </div>
                        <div style="font-size: 0.9rem; color: #666;">
                            <span>路径: ${info.path}</span>
                            ${info.compressionRatio ? ` | 压缩率: ${info.compressionRatio}` : ''}
                            ${info.isCritical ? ' | 关键路径' : ''}
                            ${info.isLarge ? ' | 大文件' : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2>🔧 优化建议</h2>
            <div class="recommendations">
                ${bundleResults.recommendations.map(rec => `
                    <div class="recommendation ${rec.priority.toLowerCase()}">
                        <h4>【${rec.priority}】${rec.category}</h4>
                        <p><strong>问题:</strong> ${rec.issue}</p>
                        <p><strong>建议:</strong> ${rec.suggestion}</p>
                        <p><strong>影响:</strong> ${rec.impact}</p>
                    </div>
                `).join('')}
            </div>
        </div>

        <div style="text-align: center; padding: 20px; color: #666;">
            <p>Bundle分析报告 | 生成时间: ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>`;

    const reportPath = path.join(process.cwd(), 'bundle-analysis-report.html');
    await fs.writeFile(reportPath, htmlContent);
    
    return reportPath;
  }
}

// 主函数
async function analyzeBundlePerformance() {
  console.log('🚀 开始Bundle性能分析...');
  
  try {
    const analyzer = new BundleAnalyzer();
    const webVitalsAnalyzer = new CoreWebVitalsAnalyzer();
    const reportGenerator = new BundleReportGenerator();
    
    // 分析Bundle
    const bundleResults = await analyzer.analyzeBuildOutput();
    
    // 估算Web Vitals
    const webVitals = webVitalsAnalyzer.estimateWebVitals(bundleResults);
    bundleResults.coreWebVitals = webVitals;
    
    // 生成报告
    const reportPath = await reportGenerator.generateReport(bundleResults, webVitals);
    
    // 保存JSON结果
    const jsonPath = path.join(process.cwd(), 'bundle-analysis-results.json');
    await fs.writeFile(jsonPath, JSON.stringify(bundleResults, null, 2));
    
    console.log('✅ Bundle分析完成');
    console.log(`📊 HTML报告: ${reportPath}`);
    console.log(`📄 JSON结果: ${jsonPath}`);
    
    // 输出关键指标
    console.log('\n🎯 关键指标:');
    console.log(`总Bundle大小: ${(bundleResults.totalSize / 1024 / 1024).toFixed(1)} MB`);
    console.log(`压缩后大小: ${(bundleResults.gzippedSize / 1024 / 1024).toFixed(1)} MB`);
    console.log(`文件数量: ${Object.keys(bundleResults.chunkAnalysis).length}`);
    console.log(`优化建议数: ${bundleResults.recommendations.length}`);
    
    return bundleResults;
    
  } catch (error) {
    console.error('❌ Bundle分析失败:', error);
    throw error;
  }
}

// 如果直接运行
if (require.main === module) {
  analyzeBundlePerformance()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = {
  BundleAnalyzer,
  CoreWebVitalsAnalyzer,
  BundleReportGenerator,
  analyzeBundlePerformance
};