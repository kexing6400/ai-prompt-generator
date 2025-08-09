import { test, expect, type Page, type BrowserContext } from '@playwright/test';

/**
 * 国际化功能E2E测试
 * 测试用户在不同语言环境下的完整使用流程
 */

// 测试数据
const LOCALES = ['cn', 'en'] as const;
type Locale = typeof LOCALES[number];

const INDUSTRIES = [
  'ai-prompts-for-lawyers',
  'ai-prompts-for-realtors',
  'ai-prompts-for-insurance-advisors', 
  'ai-prompts-for-teachers',
  'ai-prompts-for-accountants'
] as const;

const LANGUAGE_TEST_DATA = {
  cn: {
    displayName: '中文',
    flag: '🇨🇳',
    homeTitle: /AI提示词生成器/,
    sampleScenario: '合同审查',
    sampleGoal: '审查一份软件采购合同',
    generateButtonText: '生成提示词',
    industryName: {
      'ai-prompts-for-lawyers': '律师',
      'ai-prompts-for-realtors': '房产经纪人',
      'ai-prompts-for-insurance-advisors': '保险顾问',
      'ai-prompts-for-teachers': '教师',
      'ai-prompts-for-accountants': '会计师'
    }
  },
  en: {
    displayName: 'English',
    flag: '🇺🇸', 
    homeTitle: /AI Prompt Generator/,
    sampleScenario: 'Contract Review',
    sampleGoal: 'Review a software procurement contract',
    generateButtonText: 'Generate Prompt',
    industryName: {
      'ai-prompts-for-lawyers': 'Lawyer',
      'ai-prompts-for-realtors': 'Real Estate Agent',
      'ai-prompts-for-insurance-advisors': 'Insurance Advisor',
      'ai-prompts-for-teachers': 'Teacher',
      'ai-prompts-for-accountants': 'Accountant'
    }
  }
};

// 设置不同语言的浏览器环境
const setupLocaleContext = async (context: BrowserContext, locale: Locale) => {
  // 设置语言偏好
  await context.addCookies([{
    name: 'locale',
    value: locale,
    domain: 'localhost',
    path: '/'
  }]);
  
  // 根据locale设置Accept-Language头
  const acceptLanguage = locale === 'cn' ? 'zh-CN,zh;q=0.9,en;q=0.8' : 'en-US,en;q=0.9';
  await context.setExtraHTTPHeaders({
    'Accept-Language': acceptLanguage
  });
};

test.describe('国际化路由和重定向', () => {
  test('根路径应该重定向到默认语言', async ({ page }) => {
    await page.goto('/');
    
    // 检查是否重定向到语言路径
    await expect(page).toHaveURL(/\/(cn|en)\//);
    
    // 检查页面内容是否正确加载
    await expect(page.locator('h1')).toBeVisible();
  });

  test('访问无效locale应重定向到默认语言', async ({ page }) => {
    await page.goto('/fr/'); // 不支持的法语
    
    // 应该重定向到默认语言(中文)
    await expect(page).toHaveURL('/cn/');
  });

  test('带Accept-Language头的语言检测', async ({ browser }) => {
    // 测试中文浏览器
    const zhContext = await browser.newContext({
      extraHTTPHeaders: {
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      }
    });
    const zhPage = await zhContext.newPage();
    
    await zhPage.goto('/');
    await expect(zhPage).toHaveURL('/cn/');
    await zhContext.close();

    // 测试英文浏览器
    const enContext = await browser.newContext({
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    const enPage = await enContext.newPage();
    
    await enPage.goto('/');
    await expect(enPage).toHaveURL('/en/');
    await enContext.close();
  });

  test('保留查询参数和哈希', async ({ page }) => {
    await page.goto('/?utm_source=test#section1');
    
    await expect(page).toHaveURL(/\/(cn|en)\/\?utm_source=test#section1/);
  });
});

test.describe('语言切换功能', () => {
  for (const locale of LOCALES) {
    test(`在${LANGUAGE_TEST_DATA[locale].displayName}环境下测试语言切换器`, async ({ page, context }) => {
      await setupLocaleContext(context, locale);
      await page.goto(`/${locale}/`);

      // 验证当前语言显示正确
      const languageSwitcher = page.locator('[data-testid="language-switcher"], button:has-text("' + LANGUAGE_TEST_DATA[locale].flag + '")').first();
      await expect(languageSwitcher).toBeVisible();
      await expect(languageSwitcher).toContainText(LANGUAGE_TEST_DATA[locale].displayName);

      // 点击语言切换器
      await languageSwitcher.click();

      // 验证下拉菜单显示所有语言选项
      for (const otherLocale of LOCALES) {
        const option = page.locator(`text="${LANGUAGE_TEST_DATA[otherLocale].displayName}"`);
        await expect(option).toBeVisible();
      }

      // 切换到另一种语言
      const targetLocale = locale === 'cn' ? 'en' : 'cn';
      await page.click(`text="${LANGUAGE_TEST_DATA[targetLocale].displayName}"`);

      // 验证URL和页面内容已切换
      await expect(page).toHaveURL(`/${targetLocale}/`);
      
      // 验证页面标题使用了正确的语言
      await expect(page.locator('title')).toContainText(LANGUAGE_TEST_DATA[targetLocale].homeTitle);
    });
  }

  test('语言切换保持在相同页面类型', async ({ page }) => {
    // 从中文律师页面切换到英文
    await page.goto('/cn/ai-prompts-for-lawyers/');
    
    const languageSwitcher = page.locator('button:has-text("🇨🇳")').first();
    await languageSwitcher.click();
    await page.click('text="English"');
    
    // 应该切换到英文律师页面
    await expect(page).toHaveURL('/en/ai-prompts-for-lawyers/');
    
    // 验证页面内容已更新为英文
    await expect(page.locator('h1')).toContainText('Lawyer');
  });

  test('语言偏好保存到cookie和localStorage', async ({ page }) => {
    await page.goto('/cn/');
    
    // 切换到英文
    const languageSwitcher = page.locator('button:has-text("🇨🇳")').first();
    await languageSwitcher.click();
    await page.click('text="English"');
    
    // 检查cookie是否设置
    const cookies = await page.context().cookies();
    const localeCookie = cookies.find(cookie => cookie.name === 'locale');
    expect(localeCookie?.value).toBe('en');
    
    // 检查localStorage(如果页面中有相关代码)
    const localeFromStorage = await page.evaluate(() => localStorage.getItem('locale'));
    expect(localeFromStorage).toBe('en');
    
    // 刷新页面验证偏好是否保持
    await page.reload();
    await expect(page).toHaveURL('/en/');
  });
});

test.describe('行业页面多语言访问', () => {
  for (const locale of LOCALES) {
    test(`测试所有行业页面的${LANGUAGE_TEST_DATA[locale].displayName}版本`, async ({ page }) => {
      for (const industry of INDUSTRIES) {
        await page.goto(`/${locale}/${industry}/`);
        
        // 验证页面成功加载
        await expect(page.locator('h1')).toBeVisible();
        
        // 验证页面标题包含行业名称(使用对应语言)
        const expectedIndustryName = LANGUAGE_TEST_DATA[locale].industryName[industry];
        await expect(page.locator('h1')).toContainText(expectedIndustryName);
        
        // 验证表单元素存在
        await expect(page.locator('input, textarea').first()).toBeVisible();
        
        // 验证生成按钮使用正确语言
        await expect(page.locator(`button:has-text("${LANGUAGE_TEST_DATA[locale].generateButtonText}")`)).toBeVisible();
        
        console.log(`✅ ${locale.toUpperCase()}: ${industry} 页面正常`);
      }
    });
  }
});

test.describe('API多语言支持', () => {
  for (const locale of LOCALES) {
    test(`测试${LANGUAGE_TEST_DATA[locale].displayName}环境下的API调用`, async ({ page, context }) => {
      await setupLocaleContext(context, locale);
      await page.goto(`/${locale}/ai-prompts-for-lawyers/`);
      
      // 填写表单
      await page.fill('input[placeholder*="场景"], input[placeholder*="scenario"]', LANGUAGE_TEST_DATA[locale].sampleScenario);
      await page.fill('textarea[placeholder*="目标"], textarea[placeholder*="goal"]', LANGUAGE_TEST_DATA[locale].sampleGoal);
      
      // 监听API请求
      const apiResponsePromise = page.waitForResponse(response => 
        response.url().includes('/api/generate-prompt') && response.status() === 200
      );
      
      // 点击生成按钮
      await page.click(`button:has-text("${LANGUAGE_TEST_DATA[locale].generateButtonText}")`);
      
      // 等待API响应
      const apiResponse = await apiResponsePromise;
      const responseData = await apiResponse.json();
      
      // 验证API响应
      expect(responseData.success).toBe(true);
      expect(responseData.prompt).toBeDefined();
      expect(responseData.prompt.length).toBeGreaterThan(100);
      
      // 验证生成的内容在页面上显示
      await expect(page.locator('text=' + responseData.prompt.substring(0, 50))).toBeVisible({ timeout: 10000 });
      
      // 验证语言相关内容
      if (locale === 'cn') {
        // 中文内容应该包含中文字符
        expect(responseData.prompt).toMatch(/[\u4e00-\u9fff]/);
      } else {
        // 英文内容主要应该是拉丁字符
        expect(responseData.prompt).toMatch(/[a-zA-Z]/);
      }
      
      console.log(`✅ ${locale.toUpperCase()}: API调用成功，生成${responseData.prompt.length}字符内容`);
    });
  }
});

test.describe('用户体验和UI一致性', () => {
  test('首页行业卡片链接包含正确的locale', async ({ page }) => {
    for (const locale of LOCALES) {
      await page.goto(`/${locale}/`);
      
      // 找到所有行业卡片链接
      const industryLinks = page.locator('a[href*="ai-prompts-for-"]');
      const linkCount = await industryLinks.count();
      
      for (let i = 0; i < linkCount; i++) {
        const href = await industryLinks.nth(i).getAttribute('href');
        expect(href).toMatch(`^/${locale}/`);
      }
      
      console.log(`✅ ${locale.toUpperCase()}: 所有行业链接都包含正确的locale前缀`);
    }
  });

  test('导航一致性 - 语言切换后导航链接正确', async ({ page }) => {
    await page.goto('/cn/');
    
    // 切换到英文
    const languageSwitcher = page.locator('button:has-text("🇨🇳")').first();
    await languageSwitcher.click();
    await page.click('text="English"');
    
    await page.waitForURL('/en/');
    
    // 验证所有导航链接都使用en前缀
    const navLinks = page.locator('nav a, header a').filter({ hasText: /ai-prompts-for-/ });
    const navLinkCount = await navLinks.count();
    
    for (let i = 0; i < navLinkCount; i++) {
      const href = await navLinks.nth(i).getAttribute('href');
      if (href && href.includes('ai-prompts-for-')) {
        expect(href).toMatch(/^\/en\//);
      }
    }
  });

  test('表单占位符文本本地化', async ({ page }) => {
    for (const locale of LOCALES) {
      await page.goto(`/${locale}/ai-prompts-for-lawyers/`);
      
      // 检查表单元素的占位符文本
      const inputs = page.locator('input[placeholder], textarea[placeholder]');
      const inputCount = await inputs.count();
      
      for (let i = 0; i < inputCount; i++) {
        const placeholder = await inputs.nth(i).getAttribute('placeholder');
        
        if (locale === 'cn') {
          // 中文占位符应包含中文字符
          expect(placeholder).toMatch(/[\u4e00-\u9fff]/);
        } else {
          // 英文占位符应主要是拉丁字符
          expect(placeholder).toMatch(/[a-zA-Z]/);
        }
      }
      
      console.log(`✅ ${locale.toUpperCase()}: 表单占位符正确本地化`);
    }
  });
});

test.describe('SEO和meta标签国际化', () => {
  for (const locale of LOCALES) {
    test(`验证${LANGUAGE_TEST_DATA[locale].displayName}页面的SEO元素`, async ({ page }) => {
      await page.goto(`/${locale}/`);
      
      // 验证页面标题
      const title = await page.locator('title').textContent();
      expect(title).toMatch(LANGUAGE_TEST_DATA[locale].homeTitle);
      
      // 验证html lang属性
      const htmlLang = await page.locator('html').getAttribute('lang');
      const expectedLang = locale === 'cn' ? 'zh-CN' : 'en';
      expect(htmlLang).toBe(expectedLang);
      
      // 验证meta description
      const metaDescription = page.locator('meta[name="description"]');
      await expect(metaDescription).toHaveAttribute('content', /.+/);
      
      const description = await metaDescription.getAttribute('content');
      if (locale === 'cn') {
        expect(description).toMatch(/[\u4e00-\u9fff]/);
      } else {
        expect(description).toMatch(/[a-zA-Z]/);
      }
      
      console.log(`✅ ${locale.toUpperCase()}: SEO元素正确设置`);
    });
  }

  test('验证hreflang和alternate链接', async ({ page }) => {
    await page.goto('/cn/');
    
    // 检查是否有正确的hreflang标签
    const alternateLinks = page.locator('link[rel="alternate"]');
    const alternateCount = await alternateLinks.count();
    
    if (alternateCount > 0) {
      for (let i = 0; i < alternateCount; i++) {
        const hreflang = await alternateLinks.nth(i).getAttribute('hreflang');
        const href = await alternateLinks.nth(i).getAttribute('href');
        
        // 验证hreflang和href的对应关系
        if (hreflang === 'zh-CN' || hreflang === 'zh') {
          expect(href).toContain('/cn/');
        } else if (hreflang === 'en') {
          expect(href).toContain('/en/');
        }
      }
      console.log('✅ hreflang链接正确设置');
    }
  });
});

test.describe('错误处理和边界情况', () => {
  test('无效locale路径的错误处理', async ({ page }) => {
    // 访问不存在的locale
    const response = await page.goto('/invalid-locale/', { waitUntil: 'networkidle' });
    
    // 应该重定向到默认语言或返回适当的错误页面
    expect([200, 301, 302, 404]).toContain(response?.status() || 0);
    
    // 检查最终URL是否正确
    const finalUrl = page.url();
    expect(finalUrl).toMatch(/\/(cn|en)\//);
  });

  test('API在错误语言参数下的行为', async ({ page, context }) => {
    await page.goto('/cn/ai-prompts-for-lawyers/');
    
    // 拦截API请求并修改locale参数
    await page.route('/api/generate-prompt', async route => {
      const request = route.request();
      const postData = request.postDataJSON();
      
      // 修改为无效的locale
      postData.locale = 'invalid-lang';
      
      await route.continue({
        postData: JSON.stringify(postData)
      });
    });
    
    // 填写表单并提交
    await page.fill('input[placeholder*="场景"]', '测试场景');
    await page.fill('textarea[placeholder*="目标"]', '测试目标');
    
    const responsePromise = page.waitForResponse('/api/generate-prompt');
    await page.click('button:has-text("生成提示词")');
    
    const response = await responsePromise;
    const responseData = await response.json();
    
    // API应该有适当的错误处理或回退到默认语言
    expect(response.status()).toBe(200);
    expect(responseData.success).toBeDefined();
  });

  test('浏览器后退/前进在多语言环境下的行为', async ({ page }) => {
    // 访问中文首页
    await page.goto('/cn/');
    await expect(page).toHaveURL('/cn/');
    
    // 切换到英文
    const languageSwitcher = page.locator('button:has-text("🇨🇳")').first();
    await languageSwitcher.click();
    await page.click('text="English"');
    await expect(page).toHaveURL('/en/');
    
    // 浏览器后退
    await page.goBack();
    await expect(page).toHaveURL('/cn/');
    
    // 浏览器前进
    await page.goForward();
    await expect(page).toHaveURL('/en/');
  });
});