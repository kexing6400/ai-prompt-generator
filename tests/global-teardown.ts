import { FullConfig } from '@playwright/test';

/**
 * 全局测试清理
 * 在所有测试运行完成后执行的清理操作
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 开始全局测试清理...');
  
  try {
    // 清理测试数据
    console.log('🗑️ 清理测试数据...');
    
    // 清理本地存储数据（如果有的话）
    // 这里可以添加清理数据库、文件系统等操作
    
    // 生成测试报告摘要
    console.log('📊 生成测试摘要...');
    const testResults = {
      timestamp: new Date().toISOString(),
      config: {
        testDir: config.testDir,
        workers: config.workers,
        retries: config.retries
      }
    };
    
    console.log('✅ 测试摘要:', JSON.stringify(testResults, null, 2));
    
  } catch (error) {
    console.error('❌ 全局清理失败:', error);
    // 不要抛出错误，避免影响测试结果
  }
  
  console.log('✅ 全局测试清理完成');
}

export default globalTeardown;