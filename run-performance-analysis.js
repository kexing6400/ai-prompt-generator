#!/usr/bin/env node

/**
 * 律师AI工作台性能分析执行器
 * 一键运行所有性能测试并生成综合报告
 * 作者：Performance Engineer & Database Optimizer Team
 */

const { generateComprehensiveReport } = require('./comprehensive-performance-report.js');
const fs = require('fs').promises;
const path = require('path');

// 性能分析配置
const ANALYSIS_CONFIG = {
  outputDir: './performance-reports',
  runIndividualTests: true,
  generateSummary: true,
  openReportInBrowser: false,
  cleanupOldReports: true
};

// 日志记录器
class Logger {
  constructor() {
    this.logFile = path.join(process.cwd(), 'performance-analysis.log');
    this.startTime = Date.now();
  }

  async log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;
    
    console.log(`${this.getLogPrefix(level)} ${message}`);
    
    try {
      await fs.appendFile(this.logFile, logEntry);
    } catch (error) {
      // 忽略日志写入错误
    }
  }

  getLogPrefix(level) {
    const prefixes = {
      'INFO': '📋',
      'SUCCESS': '✅',
      'WARNING': '⚠️',
      'ERROR': '❌',
      'PROGRESS': '🔄'
    };
    return prefixes[level] || '📋';
  }

  async logError(error) {
    await this.log(`Error: ${error.message}`, 'ERROR');
    if (error.stack) {
      await this.log(`Stack trace: ${error.stack}`, 'ERROR');
    }
  }

  getElapsedTime() {
    return ((Date.now() - this.startTime) / 1000).toFixed(1);
  }
}

// 性能分析执行器
class PerformanceAnalysisRunner {
  constructor() {
    this.logger = new Logger();
    this.results = {
      startTime: Date.now(),
      endTime: null,
      success: false,
      reports: {},
      errors: [],
      summary: {}
    };
  }

  // 检查运行环境
  async checkEnvironment() {
    await this.logger.log('检查运行环境...', 'PROGRESS');
    
    const checks = [];
    
    // 检查Node.js版本
    const nodeVersion = process.version;
    const nodeMajorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
    
    if (nodeMajorVersion < 14) {
      checks.push({
        name: 'Node.js版本',
        status: 'ERROR',
        message: `需要Node.js 14+，当前版本：${nodeVersion}`
      });
    } else {
      checks.push({
        name: 'Node.js版本',
        status: 'OK',
        message: nodeVersion
      });
    }
    
    // 检查必要文件
    const requiredFiles = [
      'package.json',
      'app/api',
      'components',
      'lib'
    ];
    
    for (const file of requiredFiles) {
      try {
        await fs.access(path.join(process.cwd(), file));
        checks.push({
          name: `文件：${file}`,
          status: 'OK',
          message: '存在'
        });
      } catch (error) {
        checks.push({
          name: `文件：${file}`,
          status: 'WARNING',
          message: '不存在或无法访问'
        });
      }
    }
    
    // 检查数据目录
    try {
      await fs.access(path.join(process.cwd(), 'data'));
      checks.push({
        name: '数据目录',
        status: 'OK',
        message: '存在'
      });
    } catch (error) {
      checks.push({
        name: '数据目录',
        status: 'WARNING',
        message: '不存在，将创建测试数据'
      });
      
      // 创建测试数据
      await this.createTestData();
    }
    
    // 检查构建文件（Bundle分析用）
    try {
      await fs.access(path.join(process.cwd(), '.next'));
      checks.push({
        name: '构建文件',
        status: 'OK',
        message: '存在'
      });
    } catch (error) {
      checks.push({
        name: '构建文件',
        status: 'WARNING',
        message: '不存在，将跳过Bundle分析'
      });
    }
    
    // 输出检查结果
    await this.logger.log('环境检查结果:', 'INFO');
    for (const check of checks) {
      const level = check.status === 'ERROR' ? 'ERROR' : 
                   check.status === 'WARNING' ? 'WARNING' : 'SUCCESS';
      await this.logger.log(`  ${check.name}: ${check.message}`, level);
    }
    
    const hasErrors = checks.some(check => check.status === 'ERROR');
    if (hasErrors) {
      throw new Error('环境检查失败，请解决错误后重试');
    }
  }

  // 创建测试数据
  async createTestData() {
    await this.logger.log('创建测试数据...', 'PROGRESS');
    
    try {
      // 创建数据目录
      const dataDir = path.join(process.cwd(), 'data');
      const usersDir = path.join(dataDir, 'users');
      const usageDir = path.join(dataDir, 'usage');
      
      await fs.mkdir(dataDir, { recursive: true });
      await fs.mkdir(usersDir, { recursive: true });
      await fs.mkdir(usageDir, { recursive: true });
      
      // 创建测试用户数据
      const testUsers = Array.from({ length: 10 }, (_, i) => ({
        id: `test-user-${i + 1}`,
        email: `test${i + 1}@example.com`,
        name: `测试用户${i + 1}`,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        isActive: Math.random() > 0.2,
        preferences: {
          language: 'zh',
          theme: Math.random() > 0.5 ? 'light' : 'dark'
        },
        subscription: {
          plan: Math.random() > 0.7 ? 'pro' : 'free',
          status: 'active'
        }
      }));
      
      // 写入用户文件
      for (const user of testUsers) {
        const filePath = path.join(usersDir, `${user.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(user, null, 2));
      }
      
      // 创建测试使用量数据
      const currentMonth = new Date().toISOString().substring(0, 7);
      for (let i = 0; i < 5; i++) {
        const usage = {
          userId: `test-user-${i + 1}`,
          date: new Date().toISOString().split('T')[0],
          month: currentMonth,
          requests: Math.floor(Math.random() * 50),
          tokens: Math.floor(Math.random() * 1000),
          generatedPrompts: Math.floor(Math.random() * 10),
          documentsProcessed: Math.floor(Math.random() * 5),
          errors: Math.floor(Math.random() * 3)
        };
        
        const filePath = path.join(usageDir, `${usage.userId}-${usage.month}.json`);
        await fs.writeFile(filePath, JSON.stringify(usage, null, 2));
      }
      
      await this.logger.log(`创建了 ${testUsers.length} 个测试用户和 5 个使用量记录`, 'SUCCESS');
      
    } catch (error) {
      await this.logger.logError(error);
      await this.logger.log('测试数据创建失败，继续运行分析', 'WARNING');
    }
  }

  // 准备输出目录
  async prepareOutputDirectory() {
    await this.logger.log('准备输出目录...', 'PROGRESS');
    
    const outputDir = path.resolve(ANALYSIS_CONFIG.outputDir);
    
    try {
      // 如果需要清理旧报告
      if (ANALYSIS_CONFIG.cleanupOldReports) {
        try {
          await fs.access(outputDir);
          const files = await fs.readdir(outputDir);
          
          // 只删除性能报告文件
          for (const file of files) {
            if (file.includes('performance') && (file.endsWith('.html') || file.endsWith('.json'))) {
              await fs.unlink(path.join(outputDir, file));
            }
          }
          
          await this.logger.log(`清理了 ${files.length} 个旧报告文件`, 'SUCCESS');
        } catch (error) {
          // 目录不存在，忽略错误
        }
      }
      
      // 创建输出目录
      await fs.mkdir(outputDir, { recursive: true });
      
      this.results.outputDir = outputDir;
      await this.logger.log(`输出目录准备完成: ${outputDir}`, 'SUCCESS');
      
    } catch (error) {
      await this.logger.logError(error);
      throw new Error(`输出目录准备失败: ${error.message}`);
    }
  }

  // 运行性能分析
  async runPerformanceAnalysis() {
    await this.logger.log('开始运行性能分析...', 'PROGRESS');
    await this.logger.log(`预计分析时间: 3-5分钟`, 'INFO');
    
    try {
      // 运行综合性能分析
      const results = await generateComprehensiveReport();
      
      this.results.summary = {
        overallScore: results.scores.overall,
        apiScore: results.scores.api,
        bundleScore: results.scores.bundle,
        databaseScore: results.scores.database,
        recommendationCount: results.recommendations.length,
        phaseCount: results.implementationGuide.length
      };
      
      // 移动报告到输出目录
      await this.moveReportsToOutputDir();
      
      this.results.success = true;
      await this.logger.log('性能分析完成', 'SUCCESS');
      
      return results;
      
    } catch (error) {
      this.results.errors.push({
        type: 'PERFORMANCE_ANALYSIS',
        message: error.message,
        timestamp: Date.now()
      });
      
      await this.logger.logError(error);
      throw error;
    }
  }

  // 移动报告到输出目录
  async moveReportsToOutputDir() {
    const reportFiles = [
      'comprehensive-performance-report.html',
      'comprehensive-performance-results.json',
      'performance-test-report.html',
      'performance-test-results.json',
      'bundle-analysis-report.html',
      'bundle-analysis-results.json',
      'database-performance-report.html',
      'database-performance-results.json'
    ];
    
    for (const file of reportFiles) {
      const sourcePath = path.join(process.cwd(), file);
      const targetPath = path.join(this.results.outputDir, file);
      
      try {
        await fs.access(sourcePath);
        await fs.rename(sourcePath, targetPath);
        this.results.reports[file] = targetPath;
      } catch (error) {
        // 文件不存在，跳过
      }
    }
  }

  // 生成执行摘要
  async generateExecutionSummary() {
    await this.logger.log('生成执行摘要...', 'PROGRESS');
    
    const summary = {
      timestamp: new Date().toISOString(),
      executionTime: this.logger.getElapsedTime() + 's',
      success: this.results.success,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        workingDirectory: process.cwd()
      },
      results: this.results.summary,
      reports: Object.keys(this.results.reports),
      errors: this.results.errors
    };
    
    const summaryPath = path.join(this.results.outputDir, 'execution-summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    
    await this.logger.log(`执行摘要已保存: ${summaryPath}`, 'SUCCESS');
    
    return summary;
  }

  // 输出结果
  async displayResults() {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 律师AI工作台性能分析完成');
    console.log('='.repeat(80));
    
    if (this.results.success) {
      console.log(`✅ 分析成功完成 (耗时: ${this.logger.getElapsedTime()}s)`);
      console.log('\n📊 性能评分摘要:');
      console.log(`   综合评分: ${this.results.summary.overallScore}/100`);
      console.log(`   API性能:  ${this.results.summary.apiScore}/100`);
      console.log(`   Bundle:   ${this.results.summary.bundleScore}/100`);
      console.log(`   数据库:   ${this.results.summary.databaseScore}/100`);
      
      console.log(`\n💡 优化建议: ${this.results.summary.recommendationCount}项`);
      console.log(`📋 实施阶段: ${this.results.summary.phaseCount}个`);
      
      console.log('\n📄 生成的报告:');
      Object.entries(this.results.reports).forEach(([file, path]) => {
        console.log(`   ${file}`);
      });
      
      console.log(`\n📁 报告目录: ${this.results.outputDir}`);
      
      // 性能等级评估
      const grade = this.getPerformanceGrade(this.results.summary.overallScore);
      console.log(`\n🏆 性能等级: ${grade.level} ${grade.description}`);
      
      if (grade.level === 'A' || grade.level === 'B') {
        console.log('👍 您的应用性能表现良好！');
      } else {
        console.log('⚠️  建议优先处理高优先级的性能问题。');
      }
      
    } else {
      console.log(`❌ 分析失败 (耗时: ${this.logger.getElapsedTime()}s)`);
      console.log('\n错误详情:');
      this.results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.type}: ${error.message}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
  }

  getPerformanceGrade(score) {
    if (score >= 90) {
      return { level: 'A+', description: '优秀 - 性能表现卓越' };
    } else if (score >= 85) {
      return { level: 'A', description: '优秀 - 性能表现很好' };
    } else if (score >= 80) {
      return { level: 'B+', description: '良好 - 性能表现不错' };
    } else if (score >= 75) {
      return { level: 'B', description: '良好 - 性能基本满足要求' };
    } else if (score >= 70) {
      return { level: 'C+', description: '一般 - 有改进空间' };
    } else if (score >= 60) {
      return { level: 'C', description: '一般 - 需要优化' };
    } else if (score >= 50) {
      return { level: 'D', description: '较差 - 急需优化' };
    } else {
      return { level: 'F', description: '很差 - 必须立即优化' };
    }
  }

  // 运行完整分析
  async run() {
    try {
      this.results.startTime = Date.now();
      
      await this.logger.log('律师AI工作台性能分析开始', 'INFO');
      await this.logger.log(`分析配置: ${JSON.stringify(ANALYSIS_CONFIG, null, 2)}`, 'INFO');
      
      // 1. 检查运行环境
      await this.checkEnvironment();
      
      // 2. 准备输出目录
      await this.prepareOutputDirectory();
      
      // 3. 运行性能分析
      await this.runPerformanceAnalysis();
      
      // 4. 生成执行摘要
      await this.generateExecutionSummary();
      
      this.results.endTime = Date.now();
      
      // 5. 显示结果
      await this.displayResults();
      
      return this.results;
      
    } catch (error) {
      this.results.success = false;
      this.results.endTime = Date.now();
      
      await this.logger.logError(error);
      await this.displayResults();
      
      throw error;
    }
  }
}

// 主函数
async function main() {
  const runner = new PerformanceAnalysisRunner();
  
  try {
    const results = await runner.run();
    process.exit(results.success ? 0 : 1);
  } catch (error) {
    console.error('\n❌ 性能分析执行失败:', error.message);
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

// 如果直接运行
if (require.main === module) {
  main();
}

module.exports = {
  PerformanceAnalysisRunner,
  ANALYSIS_CONFIG
};