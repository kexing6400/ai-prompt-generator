import { defineConfig, devices } from '@playwright/test';

/**
 * AI Prompt Generator E2E测试配置
 * 支持5个行业页面的全面测试覆盖
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* 并行运行测试 */
  fullyParallel: true,
  
  /* 在CI中如果测试失败则阻止构建 */
  forbidOnly: !!process.env.CI,
  
  /* 在CI中重试失败的测试 */
  retries: process.env.CI ? 2 : 0,
  
  /* 并行worker数量 */
  workers: process.env.CI ? 1 : undefined,
  
  /* 测试报告配置 */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
    ['github'] // GitHub Actions集成
  ],
  
  /* 全局测试设置 */
  use: {
    /* 基础URL */
    baseURL: process.env.BASE_URL || 'http://localhost:3001',
    
    /* 测试追踪设置 - 失败时保留追踪 */
    trace: 'on-first-retry',
    
    /* 截图设置 */
    screenshot: 'only-on-failure',
    
    /* 视频录制 */
    video: 'retain-on-failure',
    
    /* 等待导航超时 */
    navigationTimeout: 30000,
    
    /* 等待动作超时 */
    actionTimeout: 10000,
  },

  /* 项目配置 - 不同浏览器测试 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    /* 移动端测试 */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* 本地开发服务器配置 */
  webServer: {
    command: 'npm run dev',
    port: 3001,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  /* 测试超时配置 */
  timeout: 30000,
  expect: {
    timeout: 5000,
  },

  /* 全局设置 */
  globalSetup: require.resolve('./tests/global-setup.ts'),
  globalTeardown: require.resolve('./tests/global-teardown.ts'),
});