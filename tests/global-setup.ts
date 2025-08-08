import { chromium, FullConfig } from '@playwright/test';

/**
 * 全局测试设置
 * 在所有测试运行前执行的初始化操作
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 开始全局测试设置...');
  
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // 等待应用启动
    console.log(`⏳ 等待应用启动: ${baseURL}`);
    await page.goto(baseURL || 'http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // 验证应用是否正常运行
    const title = await page.title();
    console.log(`✅ 应用已启动，标题: ${title}`);
    
    // 预热所有行业页面
    const industries = [
      'ai-prompts-for-lawyers',
      'ai-prompts-for-accountants', 
      'ai-prompts-for-teachers',
      'ai-prompts-for-insurance-advisors',
      'ai-prompts-for-realtors'
    ];
    
    console.log('🔥 预热行业页面...');
    for (const industry of industries) {
      try {
        await page.goto(`${baseURL}/${industry}`);
        await page.waitForLoadState('networkidle');
        console.log(`✅ ${industry} 页面预热完成`);
      } catch (error) {
        console.warn(`⚠️ ${industry} 页面预热失败:`, error);
      }
    }
    
    // 检查API健康状况
    console.log('🏥 检查API健康状况...');
    try {
      const response = await page.request.get(`${baseURL}/api/generate-prompt`);
      console.log(`✅ API健康检查完成，状态: ${response.status()}`);
    } catch (error) {
      console.warn('⚠️ API健康检查失败:', error);
    }
    
  } catch (error) {
    console.error('❌ 全局设置失败:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('✅ 全局测试设置完成');
}

export default globalSetup;