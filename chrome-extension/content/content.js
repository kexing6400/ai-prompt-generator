/**
 * AskSmarter Content Script - 主要内容脚本
 * 负责在AI平台页面注入悬浮按钮和处理prompt优化逻辑
 */

class AskSmarterContentScript {
  constructor() {
    this.currentPlatform = null;
    this.inputSelectors = this.initializeSelectors();
    this.floatingButton = null;
    this.isProcessing = false;
    
    // 初始化
    this.init();
  }
  
  /**
   * 初始化各AI平台的输入框选择器
   */
  initializeSelectors() {
    return {
      'chatgpt': [
        '#prompt-textarea',
        'textarea[data-id="root"]',
        'textarea[placeholder*="ChatGPT"]',
        'textarea[placeholder*="Message"]',
        'div[contenteditable="true"][data-id="root"]'
      ],
      'claude': [
        'div[contenteditable="true"][data-testid="message-input"]',
        'div[contenteditable="true"].ProseMirror',
        'textarea[placeholder*="Ask Claude"]',
        'div[contenteditable="true"][placeholder*="Talk with Claude"]'
      ],
      'gemini': [
        'textarea[aria-label*="Enter a prompt"]',
        'textarea[placeholder*="Enter a prompt"]',
        'div[contenteditable="true"][aria-label*="Message"]',
        'textarea.ql-editor'
      ],
      'perplexity': [
        'textarea[placeholder*="Ask anything"]',
        'textarea[aria-label*="Ask anything"]',
        'div[contenteditable="true"]'
      ]
    };
  }
  
  /**
   * 主初始化函数
   */
  async init() {
    // 检测当前平台
    this.detectPlatform();
    
    if (!this.currentPlatform) {
      console.log('AskSmarter: 未识别的AI平台');
      return;
    }
    
    console.log(`AskSmarter: 在${this.currentPlatform}平台初始化`);
    
    // 等待页面完全加载
    await this.waitForPageReady();
    
    // 创建悬浮按钮
    this.createFloatingButton();
    
    // 监听页面变化（处理SPA路由变化）
    this.observePageChanges();
  }
  
  /**
   * 检测当前AI平台
   */
  detectPlatform() {
    const hostname = window.location.hostname.toLowerCase();
    
    if (hostname.includes('openai.com')) {
      this.currentPlatform = 'chatgpt';
    } else if (hostname.includes('claude.ai')) {
      this.currentPlatform = 'claude';
    } else if (hostname.includes('gemini.google.com') || hostname.includes('bard.google.com')) {
      this.currentPlatform = 'gemini';
    } else if (hostname.includes('perplexity.ai')) {
      this.currentPlatform = 'perplexity';
    }
  }
  
  /**
   * 等待页面准备就绪
   */
  waitForPageReady() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        setTimeout(resolve, 1000); // 额外等待1秒确保SPA加载完成
      } else {
        window.addEventListener('load', () => {
          setTimeout(resolve, 1000);
        });
      }
    });
  }
  
  /**
   * 创建悬浮按钮
   */
  createFloatingButton() {
    // 移除已存在的按钮
    const existingButton = document.getElementById('asksmarter-floating-btn');
    if (existingButton) {
      existingButton.remove();
    }
    
    // 创建悬浮按钮
    this.floatingButton = document.createElement('div');
    this.floatingButton.id = 'asksmarter-floating-btn';
    this.floatingButton.innerHTML = `
      <div class="asksmarter-btn-content">
        <span class="asksmarter-icon">✨</span>
        <span class="asksmarter-text">优化</span>
      </div>
      <div class="asksmarter-loading" style="display: none;">
        <div class="asksmarter-spinner"></div>
      </div>
    `;
    
    // 绑定点击事件
    this.floatingButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleOptimizeClick();
    });
    
    // 添加到页面
    document.body.appendChild(this.floatingButton);
    
    // 延迟显示动画
    setTimeout(() => {
      this.floatingButton.classList.add('asksmarter-show');
    }, 500);
  }
  
  /**
   * 处理优化按钮点击
   */
  async handleOptimizeClick() {
    if (this.isProcessing) return;
    
    try {
      this.isProcessing = true;
      this.showLoading(true);
      
      // 查找并获取输入框内容
      const inputElement = this.findInputElement();
      if (!inputElement) {
        this.showToast('未找到输入框，请确保光标在对话框中', 'error');
        return;
      }
      
      const originalText = this.getInputText(inputElement);
      if (!originalText || originalText.trim().length === 0) {
        this.showToast('请先输入要优化的内容', 'warning');
        return;
      }
      
      // 获取用户设置的行业
      const settings = await this.getStorageSettings();
      
      // 优化prompt
      const optimizedText = await this.optimizePrompt(originalText, settings);
      
      // 将优化后的内容设置回输入框
      this.setInputText(inputElement, optimizedText);
      
      // 显示成功提示
      this.showToast('Prompt优化完成！', 'success');
      
      // 添加点击动画效果
      this.addClickAnimation();
      
    } catch (error) {
      console.error('AskSmarter优化失败:', error);
      this.showToast('优化失败，请稍后重试', 'error');
    } finally {
      this.isProcessing = false;
      this.showLoading(false);
    }
  }
  
  /**
   * 查找输入框元素
   */
  findInputElement() {
    const selectors = this.inputSelectors[this.currentPlatform] || [];
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        // 检查元素是否可见且可编辑
        if (this.isElementVisible(element) && this.isElementEditable(element)) {
          return element;
        }
      }
    }
    
    return null;
  }
  
  /**
   * 检查元素是否可见
   */
  isElementVisible(element) {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetWidth > 0 && 
           element.offsetHeight > 0;
  }
  
  /**
   * 检查元素是否可编辑
   */
  isElementEditable(element) {
    return element.isContentEditable || 
           element.tagName.toLowerCase() === 'textarea' ||
           element.tagName.toLowerCase() === 'input';
  }
  
  /**
   * 获取输入框文本
   */
  getInputText(element) {
    if (element.isContentEditable) {
      return element.textContent || element.innerText || '';
    }
    return element.value || '';
  }
  
  /**
   * 设置输入框文本
   */
  setInputText(element, text) {
    if (element.isContentEditable) {
      // 对于contenteditable元素，需要触发适当的事件
      element.textContent = text;
      
      // 触发input和change事件以确保平台检测到变化
      const inputEvent = new Event('input', { bubbles: true });
      const changeEvent = new Event('change', { bubbles: true });
      element.dispatchEvent(inputEvent);
      element.dispatchEvent(changeEvent);
      
      // 设置光标到末尾
      this.setCursorToEnd(element);
    } else {
      // 对于textarea和input元素
      element.value = text;
      
      // 触发事件
      const inputEvent = new Event('input', { bubbles: true });
      const changeEvent = new Event('change', { bubbles: true });
      element.dispatchEvent(inputEvent);
      element.dispatchEvent(changeEvent);
      
      // 设置光标到末尾
      element.selectionStart = element.selectionEnd = text.length;
    }
    
    // 聚焦元素
    element.focus();
  }
  
  /**
   * 设置光标到contenteditable元素末尾
   */
  setCursorToEnd(element) {
    if (element.isContentEditable) {
      element.focus();
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(element);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
  
  /**
   * 优化Prompt
   */
  async optimizePrompt(originalText, settings) {
    // 加载对应的行业模板
    const template = await this.loadTemplate(settings.industry || 'general');
    
    // 应用优化规则
    return template.optimize(originalText, settings);
  }
  
  /**
   * 加载行业模板
   */
  async loadTemplate(industry) {
    try {
      // 动态导入模板（这里使用内置模板，后续可扩展为远程加载）
      const templates = {
        'lawyer': await this.loadLawyerTemplate(),
        'pm': await this.loadPMTemplate(),
        'doctor': await this.loadDoctorTemplate(),
        'general': await this.loadGeneralTemplate()
      };
      
      return templates[industry] || templates['general'];
    } catch (error) {
      console.error('加载模板失败:', error);
      return await this.loadGeneralTemplate();
    }
  }
  
  /**
   * 通用模板
   */
  async loadGeneralTemplate() {
    return {
      optimize: (text, settings) => {
        let optimized = text;
        
        // 基础优化规则
        if (!text.includes('请')) {
          optimized = `请${optimized}`;
        }
        
        // 添加更具体的要求
        if (!text.includes('具体') && !text.includes('详细')) {
          optimized += '，请提供具体详细的回答。';
        }
        
        // 添加结构化要求
        if (!text.includes('步骤') && !text.includes('分点')) {
          optimized += '如果可能，请分点或分步骤说明。';
        }
        
        return optimized;
      }
    };
  }
  
  /**
   * 律师模板
   */
  async loadLawyerTemplate() {
    return {
      optimize: (text, settings) => {
        let optimized = `作为一名专业律师，${text}`;
        
        if (!text.includes('法律依据') && !text.includes('法条')) {
          optimized += '请提供相关的法律依据和条文。';
        }
        
        if (!text.includes('风险') && !text.includes('注意事项')) {
          optimized += '同时请说明相关的法律风险和注意事项。';
        }
        
        optimized += '请确保答案专业、准确，符合当前法律法规。';
        
        return optimized;
      }
    };
  }
  
  /**
   * 产品经理模板
   */
  async loadPMTemplate() {
    return {
      optimize: (text, settings) => {
        let optimized = `作为一名资深产品经理，${text}`;
        
        if (!text.includes('用户') && !text.includes('场景')) {
          optimized += '请考虑用户场景和用户体验。';
        }
        
        if (!text.includes('数据') && !text.includes('指标')) {
          optimized += '如果涉及决策，请提供相关的数据指标和分析方法。';
        }
        
        optimized += '请从产品策略、用户价值、技术可行性等维度进行分析。';
        
        return optimized;
      }
    };
  }
  
  /**
   * 医生模板
   */
  async loadDoctorTemplate() {
    return {
      optimize: (text, settings) => {
        let optimized = `作为一名专业医生，${text}`;
        
        optimized += '请注意：这仅供参考，不能替代专业医疗诊断和治疗。';
        
        if (!text.includes('症状') && !text.includes('病史')) {
          optimized += '如果涉及诊断，请考虑相关症状、病史和检查结果。';
        }
        
        optimized += '请提供科学、准确、负责任的医学建议。';
        
        return optimized;
      }
    };
  }
  
  /**
   * 获取存储设置
   */
  async getStorageSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['industry', 'customRules'], (result) => {
        resolve({
          industry: result.industry || 'general',
          customRules: result.customRules || []
        });
      });
    });
  }
  
  /**
   * 显示Toast提示
   */
  showToast(message, type = 'info') {
    // 移除已存在的toast
    const existingToast = document.getElementById('asksmarter-toast');
    if (existingToast) {
      existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.id = 'asksmarter-toast';
    toast.className = `asksmarter-toast asksmarter-toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // 显示动画
    setTimeout(() => toast.classList.add('asksmarter-toast-show'), 100);
    
    // 3秒后自动隐藏
    setTimeout(() => {
      toast.classList.remove('asksmarter-toast-show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  
  /**
   * 显示/隐藏加载状态
   */
  showLoading(show) {
    if (!this.floatingButton) return;
    
    const content = this.floatingButton.querySelector('.asksmarter-btn-content');
    const loading = this.floatingButton.querySelector('.asksmarter-loading');
    
    if (show) {
      content.style.display = 'none';
      loading.style.display = 'flex';
      this.floatingButton.classList.add('asksmarter-loading-state');
    } else {
      content.style.display = 'flex';
      loading.style.display = 'none';
      this.floatingButton.classList.remove('asksmarter-loading-state');
    }
  }
  
  /**
   * 添加点击动画效果
   */
  addClickAnimation() {
    if (!this.floatingButton) return;
    
    this.floatingButton.classList.add('asksmarter-click-animation');
    setTimeout(() => {
      this.floatingButton.classList.remove('asksmarter-click-animation');
    }, 600);
  }
  
  /**
   * 监听页面变化
   */
  observePageChanges() {
    // 使用MutationObserver监听DOM变化，适应SPA路由变化
    const observer = new MutationObserver((mutations) => {
      // 检查是否需要重新创建按钮
      const button = document.getElementById('asksmarter-floating-btn');
      if (!button && document.body) {
        this.createFloatingButton();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AskSmarterContentScript();
  });
} else {
  new AskSmarterContentScript();
}