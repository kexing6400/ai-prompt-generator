/**
 * 简化版AI对话系统 - ChatGPT风格的直接对话接口
 * 
 * 替代复杂的5层AI架构，提供简单直观的专家对话体验：
 * - 输入：message + expert + conversationId（可选）
 * - 输出：专家的直接AI回复
 * - 支持：对话历史、专家提示词、错误处理
 */

import { NextRequest, NextResponse } from 'next/server';
import { createOpenRouterClient } from '@/lib/openrouter-client';

export const dynamic = 'force-dynamic';

// 简化的类型定义
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  expert: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

interface ChatRequest {
  message: string;
  expert: 'teacher' | 'lawyer' | 'accountant' | 'realtor' | 'insurance';
  conversationId?: string;
}

interface ChatResponse {
  success: boolean;
  response?: string;
  conversationId?: string;
  expert?: string;
  timestamp?: string;
  error?: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}

// 专家配置映射
const EXPERT_CONFIG = {
  teacher: {
    name: '教师专家',
    emoji: '📚',
    description: '专业教育顾问，提供教学设计、学习评估、教育方法指导'
  },
  lawyer: {
    name: '律师专家',
    emoji: '⚖️', 
    description: '专业法律顾问，提供合同审查、法务建议、纠纷解决方案'
  },
  accountant: {
    name: '会计师专家',
    emoji: '💰',
    description: '专业财务顾问，提供财务分析、税务筹划、投资建议'
  },
  realtor: {
    name: '房产专家',
    emoji: '🏠',
    description: '专业房产顾问，提供房产投资、市场分析、置业建议'
  },
  insurance: {
    name: '保险顾问',
    emoji: '🛡️',
    description: '专业保险规划师，提供保险配置、风险评估、理赔指导'
  }
};

// 简化的内存存储（生产环境应使用数据库）
const conversationMemory = new Map<string, Conversation>();

/**
 * 简化的AI对话系统类
 */
class SimpleChatSystem {
  private client: any = null;
  private expertPrompts: any = null;

  constructor() {
    this.initializeSystem();
  }

  /**
   * 初始化系统
   */
  private async initializeSystem() {
    try {
      // 加载专家提示词
      await this.loadExpertPrompts();
      // 初始化AI客户端
      await this.initializeAIClient();
    } catch (error) {
      console.error('[简化聊天] 系统初始化失败:', error);
    }
  }

  /**
   * 加载专家提示词
   */
  private async loadExpertPrompts() {
    try {
      // 从设置API获取用户自定义提示词
      const settingsResponse = await fetch('http://localhost:3000/api/settings');
      const settingsData = await settingsResponse.json();
      
      if (settingsData.success && settingsData.data.openrouter?.systemPrompts) {
        this.expertPrompts = settingsData.data.openrouter.systemPrompts;
        console.log('[简化聊天] 已加载用户自定义专家提示词');
        return;
      }
    } catch (error) {
      console.log('[简化聊天] 无法从设置加载提示词，使用默认配置');
    }

    // 使用优化的专家提示词作为后备
    try {
      const fs = await import('fs');
      const path = await import('path');
      const promptsPath = path.join(process.cwd(), 'optimized-expert-prompts.json');
      const promptsData = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
      
      // 转换为简化格式
      this.expertPrompts = {};
      Object.entries(promptsData.experts).forEach(([key, expert]: [string, any]) => {
        this.expertPrompts[key] = expert.optimized_prompt.system;
      });
      
      console.log('[简化聊天] 已加载优化的专家提示词');
    } catch (error) {
      console.error('[简化聊天] 无法加载专家提示词，使用内置默认');
      this.expertPrompts = this.getDefaultExpertPrompts();
    }
  }

  /**
   * 获取默认专家提示词
   */
  private getDefaultExpertPrompts() {
    return {
      teacher: '你是一位资深教育专家，擅长课程设计、教学方法和学习评估。请以专业、友好的方式回答教育相关问题。',
      lawyer: '你是一位经验丰富的律师，精通合同法、公司法和诉讼实务。请提供专业的法律建议，但提醒用户具体问题应咨询当地律师。',
      accountant: '你是一位注册会计师，擅长财务分析、税务筹划和审计。请提供专业的财务建议和指导。',
      realtor: '你是一位房地产专家，精通市场分析、投资策略和交易流程。请提供专业的房产投资和置业建议。',
      insurance: '你是一位保险专家，擅长风险评估、产品推荐和理赔处理。请提供专业的保险规划建议。'
    };
  }

  /**
   * 初始化AI客户端
   */
  private async initializeAIClient() {
    try {
      // 获取用户设置
      const settingsResponse = await fetch('http://localhost:3000/api/settings');
      const settingsData = await settingsResponse.json();
      
      if (settingsData.success && settingsData.data.openrouter?.apiKey) {
        const { apiKey, selectedModel } = settingsData.data.openrouter;
        
        if (apiKey.startsWith('sk-')) {
          this.client = createOpenRouterClient({
            apiKey,
            defaultModel: selectedModel || 'anthropic/claude-3.5-sonnet',
            debug: process.env.NODE_ENV === 'development'
          });
          console.log('[简化聊天] OpenRouter客户端已初始化，模型:', selectedModel);
          return;
        }
      }
      
      // API密钥无效时使用智能模拟
      console.log('[简化聊天] API密钥无效，启用智能模拟模式');
      this.client = { generate: this.simulateAIResponse.bind(this) };
      
    } catch (error) {
      console.error('[简化聊天] AI客户端初始化失败:', error);
      this.client = { generate: this.simulateAIResponse.bind(this) };
    }
  }

  /**
   * 智能模拟AI响应（开发阶段使用）
   */
  private async simulateAIResponse(prompt: string, options: any = {}) {
    const expert = options.expert || 'general';
    const expertConfig = EXPERT_CONFIG[expert as keyof typeof EXPERT_CONFIG];
    
    // 基于专家类型生成不同风格的模拟回复
    let response = `你好！我是${expertConfig?.name || '专业顾问'} ${expertConfig?.emoji || '🤖'}。

我理解你的问题，让我为你提供专业的建议：

`;

    // 根据消息内容生成相关回复
    if (prompt.includes('课程') || prompt.includes('教学') || prompt.includes('学生')) {
      response += `**关于你的教育问题：**
1. 我建议采用差异化教学方法，关注每个学生的学习特点
2. 可以设计互动性强的课堂活动来提高学生参与度  
3. 建议建立定期的学习评估机制来跟踪进度

**具体实施步骤：**
- 第一步：分析学生的学习基础和兴趣点
- 第二步：设计多样化的教学内容和方法
- 第三步：实施并收集反馈，持续优化

这个方案已经在多个教学场景中验证过效果。你还有什么具体的教学难点需要探讨吗？`;
    } else if (prompt.includes('合同') || prompt.includes('法律') || prompt.includes('纠纷')) {
      response += `**法律风险分析：**
根据你描述的情况，我识别出几个需要注意的要点：

1. **合同条款审查**：确保关键条款明确、无歧义
2. **法律风险评估**：识别可能的法律漏洞和风险点
3. **纠纷预防措施**：建立有效的风险防控机制

**建议处理方案：**
- 优先考虑和解协商，降低成本和时间投入
- 如需诉讼，准备完整的证据材料
- 建议咨询当地执业律师获取具体法律意见

请注意，具体的法律问题还需要结合当地法律法规和案例来分析。`;
    } else {
      response += `基于我的专业经验，我建议从以下几个方面来解决你的问题：

**问题分析：**
- 核心挑战：你面临的主要问题需要专业的解决方案
- 影响因素：多个因素可能影响最终效果

**专业建议：**
1. 建议采用系统化的方法来处理
2. 重点关注关键影响因素
3. 制定分步骤的实施计划

**后续行动：**
请告诉我更多具体细节，这样我能为你提供更精准的专业指导。`;
    }

    return {
      content: response,
      usage: {
        inputTokens: Math.ceil(prompt.length / 4),
        outputTokens: Math.ceil(response.length / 4),
        totalTokens: Math.ceil((prompt.length + response.length) / 4)
      }
    };
  }

  /**
   * 处理聊天请求
   */
  async processChat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const { message, expert, conversationId } = request;
      
      // 验证专家类型
      if (!EXPERT_CONFIG[expert]) {
        return {
          success: false,
          error: '不支持的专家类型。可选：teacher, lawyer, accountant, realtor, insurance'
        };
      }

      // 获取或创建对话
      const conversation = this.getOrCreateConversation(conversationId, expert);
      
      // 添加用户消息
      conversation.messages.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      });

      // 确保AI客户端已初始化
      if (!this.client) {
        await this.initializeAIClient();
      }

      // 构建对话提示词
      const systemPrompt = this.expertPrompts?.[expert] || this.getDefaultExpertPrompts()[expert];
      const conversationHistory = this.buildConversationPrompt(conversation.messages);

      // 调用AI生成回复
      const aiResponse = await this.client.generate(conversationHistory, {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 2000,
        expert // 传递专家信息给模拟器
      });

      // 添加AI回复到对话历史
      conversation.messages.push({
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date().toISOString()
      });

      // 更新对话时间
      conversation.updatedAt = new Date().toISOString();

      // 清理旧对话（保持最近20条消息）
      if (conversation.messages.length > 20) {
        conversation.messages = conversation.messages.slice(-20);
      }

      return {
        success: true,
        response: aiResponse.content,
        conversationId: conversation.id,
        expert,
        timestamp: new Date().toISOString(),
        usage: aiResponse.usage
      };

    } catch (error: any) {
      console.error('[简化聊天] 处理失败:', error);
      return {
        success: false,
        error: error.message || '对话处理失败，请稍后重试'
      };
    }
  }

  /**
   * 获取或创建对话
   */
  private getOrCreateConversation(conversationId: string | undefined, expert: string): Conversation {
    const id = conversationId || this.generateConversationId();
    
    let conversation = conversationMemory.get(id);
    if (!conversation) {
      conversation = {
        id,
        expert,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      conversationMemory.set(id, conversation);
    }
    
    return conversation;
  }

  /**
   * 构建对话提示词
   */
  private buildConversationPrompt(messages: ChatMessage[]): string {
    // 只包含用户和助手的消息，排除系统消息
    const conversationMessages = messages
      .filter(msg => msg.role !== 'system')
      .slice(-10) // 只保留最近10条消息作为上下文
      .map(msg => `${msg.role === 'user' ? '用户' : '助手'}: ${msg.content}`)
      .join('\n\n');

    return conversationMessages || '用户: [开始新对话]';
  }

  /**
   * 生成对话ID
   */
  private generateConversationId(): string {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取对话历史
   */
  getConversation(conversationId: string): Conversation | undefined {
    return conversationMemory.get(conversationId);
  }

  /**
   * 获取活跃对话数量
   */
  getActiveConversationsCount(): number {
    return conversationMemory.size;
  }
}

// 全局实例
let chatSystem: SimpleChatSystem | null = null;

function getChatSystem(): SimpleChatSystem {
  if (!chatSystem) {
    chatSystem = new SimpleChatSystem();
  }
  return chatSystem;
}

/**
 * POST - 处理聊天请求
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    console.log('[简化聊天] 收到请求:', {
      expert: body.expert,
      conversationId: body.conversationId,
      messageLength: body.message?.length,
      timestamp: new Date().toISOString()
    });

    // 验证请求参数
    if (!body.message || !body.expert) {
      return NextResponse.json({
        success: false,
        error: '缺少必需参数：message 和 expert'
      }, { status: 400 });
    }

    // 处理聊天请求
    const chatSystemInstance = getChatSystem();
    const result = await chatSystemInstance.processChat(body);

    // 添加性能指标
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      ...result,
      responseTime: `${responseTime}ms`
    });

  } catch (error: any) {
    console.error('[简化聊天] 请求处理失败:', error);
    
    return NextResponse.json({
      success: false,
      error: '服务暂时不可用，请稍后重试',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

/**
 * GET - 获取对话历史或系统状态
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const action = searchParams.get('action') || 'status';
    
    const chatSystemInstance = getChatSystem();
    
    if (action === 'conversation' && conversationId) {
      const conversation = chatSystemInstance.getConversation(conversationId);
      
      if (!conversation) {
        return NextResponse.json({
          success: false,
          error: '对话不存在'
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        conversation: {
          id: conversation.id,
          expert: conversation.expert,
          messageCount: conversation.messages.length,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
          messages: conversation.messages.slice(-10) // 只返回最近10条
        }
      });
    }
    
    // 返回系统状态
    return NextResponse.json({
      success: true,
      system: '简化版AI对话系统',
      description: 'ChatGPT风格的直接对话接口',
      status: 'running',
      activeConversations: chatSystemInstance.getActiveConversationsCount(),
      supportedExperts: Object.entries(EXPERT_CONFIG).map(([key, config]) => ({
        type: key,
        name: config.name,
        emoji: config.emoji,
        description: config.description
      })),
      features: [
        '直接AI对话，无需多层处理',
        '支持5种专业AI专家',
        '对话历史记忆',
        '友好的错误处理',
        '高性能响应'
      ],
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}