# AI Prompt Generator E2E测试套件

这是一个全面的端到端测试套件，专为AI Prompt Generator项目设计，覆盖所有5个行业页面的功能测试。

## 🎯 测试覆盖范围

### 🏢 行业页面测试
- ⚖️ 律师页面 (`/ai-prompts-for-lawyers`)
- 💰 会计师页面 (`/ai-prompts-for-accountants`)  
- 👩‍🏫 教师页面 (`/ai-prompts-for-teachers`)
- 🛡️ 保险顾问页面 (`/ai-prompts-for-insurance-advisors`)
- 🏠 房产经纪页面 (`/ai-prompts-for-realtors`)

### 🔧 功能测试
- ✅ 页面加载和导航
- ✅ 表单验证和提交
- ✅ API集成测试
- ✅ 错误处理和边界情况
- ✅ 性能基准测试
- ✅ 响应式设计验证
- ✅ 可访问性检查

## 🚀 快速开始

### 安装依赖
```bash
npm install
npm run test:e2e:install
```

### 运行测试

#### 运行所有E2E测试
```bash
npm run test:e2e
```

#### 以UI模式运行测试
```bash
npm run test:e2e:ui
```

#### 以调试模式运行测试
```bash
npm run test:e2e:debug
```

#### 运行特定测试套件
```bash
# 行业页面测试
npm run test:industry

# API测试
npm run test:api

# 性能测试
npm run test:performance

# 错误处理测试
npm run test:error
```

### 查看测试报告
```bash
npm run test:e2e:report
```

## 📁 项目结构

```
tests/
├── e2e/                           # E2E测试用例
│   ├── industry-pages.spec.ts     # 所有行业页面功能测试
│   ├── api-integration.spec.ts    # API集成测试
│   ├── performance.spec.ts        # 性能基准测试
│   └── error-handling.spec.ts     # 错误处理测试
├── pages/                         # 页面对象模型(POM)
│   ├── base-industry-page.ts      # 基础页面类
│   ├── lawyer-page.ts             # 律师页面类
│   └── index.ts                   # 页面工厂
├── fixtures/                      # 测试数据和fixtures
│   ├── test-data.ts              # 测试数据工厂
│   └── index.ts                  # 自定义fixtures
├── utils/                        # 测试工具函数
│   └── test-helpers.ts           # 通用测试辅助函数
├── global-setup.ts              # 全局测试设置
├── global-teardown.ts           # 全局测试清理
└── README.md                    # 本文件
```

## 🏗️ 测试架构

### 页面对象模型(POM)
采用页面对象模型设计，将页面元素和操作封装在类中，提高测试的可维护性：

```typescript
// 使用基础页面类
const industryPage = createIndustryPage('lawyer', page);
await industryPage.goto('/ai-prompts-for-lawyers');
await industryPage.fillForm({
  scenario: 'contract-review',
  prompt: '测试提示词',
  context: '测试上下文'
});
await industryPage.submitForm();
await industryPage.waitForResult();
```

### 测试数据工厂
标准化的测试数据管理，支持所有行业的测试场景：

```typescript
// 获取律师行业测试数据
const testData = lawyerTestData;
const testCase = testData.testCases[0];

// 使用测试数据
await industryPage.fillForm({
  scenario: testCase.scenario,
  prompt: testCase.prompt,
  context: testCase.context
});
```

### 自定义Fixtures
提供强大的测试工具和数据管理：

```typescript
// 使用自定义fixtures
test('测试用例', async ({ page, industryData, fillForm, checkPerformance }) => {
  await checkPerformance(async () => {
    await fillForm({
      scenario: industryData.testCases[0].scenario,
      prompt: industryData.testCases[0].prompt
    });
  }, 5000);
});
```

## 📊 测试类型详解

### 1. 功能测试
测试核心业务功能：
- 页面加载和渲染
- 表单验证和提交
- 结果生成和显示
- 用户交互响应

### 2. API集成测试  
验证前后端集成：
- API请求和响应
- 错误状态处理
- 数据格式验证
- 并发请求处理

### 3. 性能基准测试
确保应用性能：
- 页面加载时间 < 3秒
- API响应时间 < 5秒  
- 表单提交时间 < 10秒
- 内存使用监控

### 4. 错误处理测试
验证异常场景：
- 网络错误处理
- 服务器错误响应
- 无效输入处理
- 边界条件测试

## 🌐 多浏览器支持

测试套件支持多种浏览器：
- ✅ Chromium (Chrome/Edge)
- ✅ Firefox  
- ✅ WebKit (Safari)
- 📱 移动端浏览器

## 📈 性能阈值

| 指标 | 阈值 | 描述 |
|------|------|------|
| 页面加载时间 | 3秒 | 首次内容绘制 |
| API响应时间 | 5秒 | 生成提示词API |
| 表单提交 | 10秒 | 端到端表单提交 |
| 内存增长 | 50MB | 多次操作后内存增长 |

## 🔧 配置选项

### Playwright配置
主要配置在 `playwright.config.ts`：
- 并行执行
- 多浏览器测试
- 自动截图和录制
- 测试报告生成

### 环境变量
```bash
# 基础URL
BASE_URL=http://localhost:3000

# API密钥（测试环境）
OPENROUTER_API_KEY=your-test-api-key

# 应用URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🚨 调试测试

### 调试失败的测试
```bash
# 以有界面模式运行
npm run test:e2e:headed

# 单步调试
npm run test:e2e:debug

# 运行特定测试文件
npx playwright test tests/e2e/industry-pages.spec.ts --debug
```

### 查看测试追踪
```bash
npx playwright show-trace test-results/trace.zip
```

### 生成调试截图
测试失败时会自动生成截图，保存在 `test-results/` 目录。

## 📋 CI/CD集成

### GitHub Actions
自动化测试流程在 `.github/workflows/e2e-tests.yml`：
- 多Node版本支持 (18, 20)
- 多浏览器测试矩阵  
- 性能回归测试
- 测试报告上传

### 本地CI模拟
```bash
# 模拟CI环境运行
CI=true npm run test:e2e
```

## 📝 编写新测试

### 添加新的行业测试
1. 在 `tests/fixtures/test-data.ts` 中添加行业数据
2. 在 `tests/pages/index.ts` 中创建页面类
3. 测试会自动包含新行业

### 添加自定义测试用例
```typescript
test.describe('自定义测试套件', () => {
  test('测试用例描述', async ({ page, industryData }) => {
    const industryPage = createIndustryPage(industryData.industry, page);
    
    // 测试步骤
    await industryPage.goto(industryData.route);
    // ... 测试逻辑
  });
});
```

## 🤝 贡献指南

1. 遵循现有的代码风格
2. 为新功能添加对应测试
3. 确保所有测试通过
4. 更新相关文档

## 🐛 问题排查

### 常见问题

**1. 测试超时**
- 检查网络连接
- 增加超时时间
- 确认应用正常启动

**2. 元素定位失败**
- 检查选择器是否正确
- 确认元素是否已加载
- 使用调试模式检查页面状态

**3. API测试失败**
- 验证API密钥配置
- 检查网络代理设置
- 确认测试环境API可用

### 获取帮助
- 查看 [Playwright官方文档](https://playwright.dev/)
- 检查项目Issues
- 联系开发团队

---

## 📞 联系信息

如有问题或建议，请联系开发团队或创建Issue。

**版本**: 1.0.0  
**更新时间**: 2024-08-08  
**维护团队**: AI Prompt Builder Pro Team