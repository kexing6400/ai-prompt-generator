/**
 * AskSmarter Popup JavaScript
 * 处理扩展弹窗的用户交互和设置管理
 */

class AskSmarterPopup {
  constructor() {
    this.settings = {};
    this.init();
  }
  
  async init() {
    // 加载当前设置
    await this.loadSettings();
    
    // 初始化UI
    this.initUI();
    
    // 绑定事件
    this.bindEvents();
    
    // 加载统计数据
    await this.loadStats();
    
    console.log('AskSmarter Popup 初始化完成');
  }
  
  /**
   * 加载用户设置
   */
  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(null, (result) => {
        this.settings = {
          industry: 'general',
          showButton: true,
          autoOptimize: false,
          customRules: [],
          ...result
        };
        resolve();
      });
    });
  }
  
  /**
   * 初始化UI界面
   */
  initUI() {
    // 设置行业选择
    const industryCards = document.querySelectorAll('.industry-card');
    industryCards.forEach(card => {
      if (card.dataset.industry === this.settings.industry) {
        card.classList.add('selected');
      }
    });
    
    // 设置开关状态
    document.getElementById('showButton').checked = this.settings.showButton;
    document.getElementById('autoOptimize').checked = this.settings.autoOptimize;
  }
  
  /**
   * 绑定事件监听
   */
  bindEvents() {
    // 行业选择事件
    const industryCards = document.querySelectorAll('.industry-card');
    industryCards.forEach(card => {
      card.addEventListener('click', () => {
        // 移除其他选中状态
        industryCards.forEach(c => c.classList.remove('selected'));
        // 选中当前卡片
        card.classList.add('selected');
        this.settings.industry = card.dataset.industry;
      });
    });
    
    // 开关事件
    document.getElementById('showButton').addEventListener('change', (e) => {
      this.settings.showButton = e.target.checked;
    });
    
    document.getElementById('autoOptimize').addEventListener('change', (e) => {
      this.settings.autoOptimize = e.target.checked;
    });
    
    // 按钮事件
    document.getElementById('saveBtn').addEventListener('click', () => {
      this.saveSettings();
    });
    
    document.getElementById('resetBtn').addEventListener('click', () => {
      this.resetSettings();
    });
  }
  
  /**
   * 保存设置
   */
  async saveSettings() {
    try {
      await new Promise((resolve) => {
        chrome.storage.sync.set(this.settings, () => {
          resolve();
        });
      });
      
      // 通知content script设置已更新
      this.notifyContentScripts();
      
      this.showMessage('设置已保存！', 'success');
      
      // 延迟关闭弹窗
      setTimeout(() => {
        window.close();
      }, 1000);
      
    } catch (error) {
      console.error('保存设置失败:', error);
      this.showMessage('保存失败，请重试', 'error');
    }
  }
  
  /**
   * 重置设置
   */
  async resetSettings() {
    if (!confirm('确定要重置所有设置吗？')) {
      return;
    }
    
    try {
      // 重置为默认设置
      this.settings = {
        industry: 'general',
        showButton: true,
        autoOptimize: false,
        customRules: []
      };
      
      await new Promise((resolve) => {
        chrome.storage.sync.set(this.settings, () => {
          resolve();
        });
      });
      
      // 重新初始化UI
      this.initUI();
      
      // 通知content script
      this.notifyContentScripts();
      
      this.showMessage('设置已重置！', 'success');
      
    } catch (error) {
      console.error('重置设置失败:', error);
      this.showMessage('重置失败，请重试', 'error');
    }
  }
  
  /**
   * 通知content scripts设置已更新
   */
  async notifyContentScripts() {
    try {
      const tabs = await chrome.tabs.query({
        url: [
          'https://chat.openai.com/*',
          'https://claude.ai/*',
          'https://gemini.google.com/*',
          'https://www.perplexity.ai/*'
        ]
      });
      
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'settingsUpdated',
          settings: this.settings
        }).catch(() => {
          // 忽略错误，可能页面还未加载完成
        });
      });
    } catch (error) {
      console.error('通知content scripts失败:', error);
    }
  }
  
  /**
   * 加载使用统计
   */
  async loadStats() {
    try {
      const stats = await new Promise((resolve) => {
        chrome.storage.local.get(['usageStats'], (result) => {
          resolve(result.usageStats || {
            totalUsage: 0,
            dailyUsage: {},
            platformUsage: {}
          });
        });
      });
      
      // 更新总使用次数
      document.getElementById('totalUsage').textContent = stats.totalUsage || 0;
      
      // 计算今日使用次数
      const today = new Date().toISOString().split('T')[0];
      const todayUsage = stats.dailyUsage ? (stats.dailyUsage[today] || 0) : 0;
      document.getElementById('todayUsage').textContent = todayUsage;
      
      // 更新平台状态（这里可以根据实际使用情况动态更新）
      this.updatePlatformStatus(stats.platformUsage);
      
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  }
  
  /**
   * 更新平台使用状态
   */
  updatePlatformStatus(platformUsage) {
    const platforms = ['ChatGPT', 'Claude', 'Gemini', 'Perplexity'];
    const platformItems = document.querySelectorAll('.platform-item');
    
    platformItems.forEach((item, index) => {
      const platformName = platforms[index];
      const usageCount = platformUsage ? (platformUsage[platformName.toLowerCase()] || 0) : 0;
      
      // 可以在这里添加使用次数显示
      const statusElement = item.querySelector('.platform-status');
      if (usageCount > 0) {
        statusElement.textContent = `✓ ${usageCount}`;
      }
    });
  }
  
  /**
   * 显示消息提示
   */
  showMessage(text, type = 'success') {
    const messageElement = document.getElementById('message');
    
    messageElement.textContent = text;
    messageElement.className = `message ${type}`;
    
    // 显示消息
    messageElement.classList.add('show');
    
    // 3秒后自动隐藏
    setTimeout(() => {
      messageElement.classList.remove('show');
    }, 3000);
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  new AskSmarterPopup();
});

// 处理来自background的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateStats') {
    // 重新加载统计数据
    const popup = new AskSmarterPopup();
    popup.loadStats();
  }
});