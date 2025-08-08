/**
 * AskSmarter Background Service Worker
 * 处理扩展的后台逻辑、存储管理和消息传递
 */

class AskSmarterBackground {
  constructor() {
    this.init();
  }
  
  init() {
    // 监听扩展安装事件
    chrome.runtime.onInstalled.addListener(this.handleInstall.bind(this));
    
    // 监听来自content script的消息
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    
    // 监听标签页更新事件
    chrome.tabs.onUpdated.addListener(this.handleTabUpdate.bind(this));
    
    console.log('AskSmarter Background Service Worker 已启动');
  }
  
  /**
   * 处理扩展安装
   */
  async handleInstall(details) {
    if (details.reason === 'install') {
      // 首次安装，设置默认配置
      await this.setDefaultSettings();
      
      // 显示欢迎页面
      chrome.tabs.create({
        url: chrome.runtime.getURL('popup/welcome.html')
      });
      
      console.log('AskSmarter 首次安装完成');
    } else if (details.reason === 'update') {
      // 更新版本
      console.log('AskSmarter 更新到版本:', chrome.runtime.getManifest().version);
    }
  }
  
  /**
   * 设置默认配置
   */
  async setDefaultSettings() {
    const defaultSettings = {
      industry: 'general',
      autoOptimize: false,
      showButton: true,
      customRules: [],
      installedDate: new Date().toISOString(),
      version: chrome.runtime.getManifest().version
    };
    
    return new Promise((resolve) => {
      chrome.storage.sync.set(defaultSettings, () => {
        console.log('默认设置已保存:', defaultSettings);
        resolve();
      });
    });
  }
  
  /**
   * 处理来自content script的消息
   */
  handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'getSettings':
        this.getSettings().then(sendResponse);
        return true; // 异步响应
        
      case 'saveSettings':
        this.saveSettings(request.settings).then(sendResponse);
        return true;
        
      case 'optimizePrompt':
        this.optimizePromptAPI(request.text, request.settings).then(sendResponse);
        return true;
        
      case 'logUsage':
        this.logUsage(request.data);
        break;
        
      case 'getStats':
        this.getUsageStats().then(sendResponse);
        return true;
        
      default:
        console.log('未知消息类型:', request.action);
    }
  }
  
  /**
   * 获取用户设置
   */
  async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(null, (result) => {
        resolve(result);
      });
    });
  }
  
  /**
   * 保存用户设置
   */
  async saveSettings(settings) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(settings, () => {
        console.log('设置已保存:', settings);
        resolve({ success: true });
      });
    });
  }
  
  /**
   * 使用API优化Prompt（预留接口）
   */
  async optimizePromptAPI(text, settings) {
    try {
      // 这里是预留的API接口，可以后续接入OpenRouter等服务
      // 目前返回基础优化结果
      const optimized = await this.basicOptimize(text, settings);
      
      return {
        success: true,
        optimizedText: optimized,
        originalLength: text.length,
        optimizedLength: optimized.length
      };
    } catch (error) {
      console.error('Prompt优化失败:', error);
      return {
        success: false,
        error: error.message,
        optimizedText: text // 失败时返回原文
      };
    }
  }
  
  /**
   * 基础优化算法
   */
  async basicOptimize(text, settings) {
    const industry = settings?.industry || 'general';
    
    // 基于行业的优化模板
    const templates = {
      lawyer: {
        prefix: '作为一名专业律师，',
        suffix: '请提供相关法律依据，并说明相关风险和注意事项。确保答案专业准确。',
        keywords: ['法律依据', '法条', '风险', '注意事项']
      },
      pm: {
        prefix: '作为一名资深产品经理，',
        suffix: '请从产品策略、用户价值、技术可行性等维度分析，并考虑用户场景和体验。',
        keywords: ['用户场景', '数据指标', '产品策略', '用户体验']
      },
      doctor: {
        prefix: '作为一名专业医生，',
        suffix: '注意：这仅供参考，不能替代专业医疗诊断。请提供科学、准确、负责任的医学建议。',
        keywords: ['症状', '病史', '检查结果', '医学建议']
      },
      general: {
        prefix: '',
        suffix: '请提供具体详细的回答，如果可能请分点说明。',
        keywords: ['具体', '详细', '步骤', '分点']
      }
    };
    
    const template = templates[industry] || templates.general;
    let optimized = text;
    
    // 添加角色前缀
    if (template.prefix && !text.toLowerCase().includes('作为')) {
      optimized = template.prefix + optimized;
    }
    
    // 检查并添加关键词要求
    const hasKeywords = template.keywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (!hasKeywords) {
      optimized += ' ' + template.suffix;
    }
    
    // 基础语法优化
    optimized = this.improveGrammar(optimized);
    
    return optimized;
  }
  
  /**
   * 基础语法改进
   */
  improveGrammar(text) {
    let improved = text;
    
    // 确保以"请"开头（中文优化）
    if (!improved.match(/^(请|帮|能否|可以)/)) {
      improved = '请' + improved;
    }
    
    // 添加礼貌用语
    if (!improved.includes('谢谢') && !improved.includes('感谢')) {
      improved += '谢谢！';
    }
    
    // 去除多余空格
    improved = improved.replace(/\s+/g, ' ').trim();
    
    return improved;
  }
  
  /**
   * 记录使用统计
   */
  async logUsage(data) {
    const stats = await this.getUsageStats();
    
    const today = new Date().toISOString().split('T')[0];
    
    if (!stats.dailyUsage) stats.dailyUsage = {};
    if (!stats.dailyUsage[today]) stats.dailyUsage[today] = 0;
    
    stats.dailyUsage[today]++;
    stats.totalUsage = (stats.totalUsage || 0) + 1;
    stats.lastUsed = new Date().toISOString();
    
    // 记录平台使用情况
    if (!stats.platformUsage) stats.platformUsage = {};
    const platform = data.platform || 'unknown';
    stats.platformUsage[platform] = (stats.platformUsage[platform] || 0) + 1;
    
    // 只保留最近30天的数据
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    Object.keys(stats.dailyUsage).forEach(date => {
      if (new Date(date) < thirtyDaysAgo) {
        delete stats.dailyUsage[date];
      }
    });
    
    return new Promise((resolve) => {
      chrome.storage.local.set({ usageStats: stats }, () => {
        resolve();
      });
    });
  }
  
  /**
   * 获取使用统计
   */
  async getUsageStats() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['usageStats'], (result) => {
        resolve(result.usageStats || {
          totalUsage: 0,
          dailyUsage: {},
          platformUsage: {},
          lastUsed: null
        });
      });
    });
  }
  
  /**
   * 处理标签页更新
   */
  handleTabUpdate(tabId, changeInfo, tab) {
    // 检查是否是支持的AI平台页面
    if (changeInfo.status === 'complete' && tab.url) {
      const supportedDomains = [
        'chat.openai.com',
        'claude.ai',
        'gemini.google.com',
        'bard.google.com',
        'perplexity.ai'
      ];
      
      const isSupported = supportedDomains.some(domain => 
        tab.url.includes(domain)
      );
      
      if (isSupported) {
        // 可以在这里执行一些页面加载完成后的逻辑
        console.log('支持的AI平台页面已加载:', tab.url);
        
        // 设置页面图标状态
        chrome.action.setIcon({
          tabId: tabId,
          path: {
            16: 'assets/icons/icon16.png',
            32: 'assets/icons/icon32.png'
          }
        });
      }
    }
  }
}

// 初始化Background Service Worker
new AskSmarterBackground();