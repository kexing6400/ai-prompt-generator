/**
 * Claude API 客户端使用示例
 * 
 * 此文件展示了如何正确使用 ClaudeClient 进行各种操作
 * 
 * @example
 * 基本用法：
 * ```typescript
 * import { createClaudeClient } from './claude-client';
 * 
 * const client = createClaudeClient();
 * const result = await client.generatePrompt('帮我写一个市场营销计划');
 * console.log(result.content);
 * ```
 */

import { 
  ClaudeClient, 
  createClaudeClient, 
  defaultClaudeClient,
  ClaudeErrorType,
  ClaudeApiError,
  ClaudeClientConfig,
  GeneratePromptRequest,
  GeneratePromptResponse
} from './claude-client';

// ==================== 基本使用示例 ====================

/**
 * 基本使用示例 - 生成简单提示词
 */
export async function basicUsageExample(): Promise<void> {
  try {
    const client = createClaudeClient();
    
    const result = await client.generatePrompt(
      '请帮我写一个关于房地产销售的AI提示词模板'
    );
    
    console.log('生成的内容：', result.content);
    console.log('使用的Token数：', result.metadata.usage.totalTokens);
    console.log('响应时间：', result.metadata.responseTimeMs, 'ms');
    
  } catch (error) {
    if (error instanceof ClaudeApiError) {
      console.error('Claude API 错误：', error.getUserFriendlyMessage());
      console.error('错误类型：', error.type);
      console.error('状态码：', error.statusCode);
    } else {
      console.error('未知错误：', error);
    }
  }
}

/**
 * 带上下文的生成示例
 */
export async function contextualGenerationExample(): Promise<void> {
  try {
    const client = createClaudeClient();
    
    const context = {
      industry: '房地产',
      target_audience: '首次购房者',
      tone: '专业且友好',
      length: '500-800字',
    };
    
    const result = await client.generatePrompt(
      '基于以下上下文，生成一个销售话术模板',
      context
    );
    
    console.log('生成结果：', result);
    
  } catch (error) {
    console.error('生成失败：', error);
  }
}

/**
 * 高级配置示例
 */
export async function advancedConfigExample(): Promise<void> {
  try {
    // 自定义配置
    const customConfig: ClaudeClientConfig = {
      apiKey: process.env.CLAUDE_API_KEY || 'sk-ant-oat01-ee0f35df8f630aae92f9a6561dd9be32edfe84a1e5f0f6e4636923a0e7ad5aca',
      baseUrl: 'https://gaccode.com/claudecode',
      timeout: 45000, // 45秒超时
      maxRetries: 5,   // 最多重试5次
      debug: true,     // 启用调试日志
      rateLimitPerMinute: 30, // 每分钟30个请求
    };
    
    const client = new ClaudeClient(customConfig);
    
    const advancedRequest: GeneratePromptRequest = {
      prompt: '创建一个关于保险销售的专业提示词',
      context: {
        product_type: '人寿保险',
        client_age_range: '25-45岁',
        income_level: '中等收入',
      },
      model: 'claude-3-sonnet-20240229',
      maxTokens: 2048,
      temperature: 0.5, // 较低的创造性
      systemPrompt: '你是一个专业的保险销售顾问，擅长创建有说服力的销售话术。',
    };
    
    const result = await client.generatePromptAdvanced(advancedRequest);
    console.log('高级生成结果：', result);
    
  } catch (error) {
    console.error('高级生成失败：', error);
  }
}

/**
 * 错误处理示例
 */
export async function errorHandlingExample(): Promise<void> {
  try {
    // 创建一个配置错误的客户端
    const badClient = createClaudeClient({
      apiKey: 'invalid-key',
      timeout: 1000, // 很短的超时时间
    });
    
    await badClient.generatePrompt('测试请求');
    
  } catch (error) {
    if (error instanceof ClaudeApiError) {
      switch (error.type) {
        case ClaudeErrorType.INVALID_API_KEY:
          console.error('API密钥无效，请检查配置');
          break;
        case ClaudeErrorType.TIMEOUT_ERROR:
          console.error('请求超时，建议增加timeout配置');
          break;
        case ClaudeErrorType.RATE_LIMIT_EXCEEDED:
          console.error('请求频率过高，请稍后再试');
          break;
        case ClaudeErrorType.NETWORK_ERROR:
          console.error('网络连接问题，请检查网络状态');
          break;
        default:
          console.error('其他错误：', error.getUserFriendlyMessage());
      }
      
      // 记录详细错误信息用于调试
      console.debug('错误详情：', {
        type: error.type,
        message: error.message,
        statusCode: error.statusCode,
        requestId: error.requestId,
      });
    } else {
      console.error('未知错误：', error);
    }
  }
}

/**
 * 健康检查示例
 */
export async function healthCheckExample(): Promise<void> {
  try {
    const client = defaultClaudeClient;
    
    const health = await client.healthCheck();
    
    console.log('健康检查结果：', health);
    
    if (health.status === 'healthy') {
      console.log('✅ Claude API 服务正常');
    } else {
      console.log('❌ Claude API 服务异常');
    }
    
  } catch (error) {
    console.error('健康检查失败：', error);
  }
}

/**
 * 批量处理示例
 */
export async function batchProcessingExample(): Promise<void> {
  const client = createClaudeClient();
  
  const prompts = [
    '生成律师咨询的专业话术',
    '创建房地产销售的营销文案',
    '制作保险产品的推销模板',
    '编写教师培训的课程大纲',
    '设计会计服务的客户沟通脚本',
  ];
  
  // 顺序处理（遵守速率限制）
  for (let index = 0; index < prompts.length; index++) {
    const prompt = prompts[index];
    try {
      console.log(`正在处理第 ${index + 1} 个提示词...`);
      
      const result = await client.generatePrompt(prompt);
      
      console.log(`✅ 第 ${index + 1} 个提示词生成成功`);
      console.log('内容长度：', result.content.length, '字符');
      console.log('使用Token：', result.metadata.usage.totalTokens);
      console.log('---');
      
      // 添加延迟，避免过于频繁的请求
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ 第 ${index + 1} 个提示词生成失败：`, error);
    }
  }
}

/**
 * 与现有系统集成的示例
 */
export async function integrationWithExistingSystemExample(): Promise<void> {
  const client = createClaudeClient();
  
  // 模拟从数据库获取的模板数据
  const templateData = {
    id: 'lawyer-consultation-001',
    industry: '法律服务',
    scenario: '客户初次咨询',
    requirements: {
      tone: '专业、严谨',
      length: '300-500字',
      includeElements: ['问候语', '问题了解', '初步建议', '后续安排'],
    },
  };
  
  try {
    // 构建结构化的提示词
    const structuredPrompt = `
请为${templateData.industry}行业的${templateData.scenario}场景创建一个专业的对话模板。

要求：
- 语调：${templateData.requirements.tone}
- 字数：${templateData.requirements.length}
- 必须包含：${templateData.requirements.includeElements.join('、')}

请生成一个实用的模板，可以直接用于实际工作场景。
    `.trim();
    
    const result = await client.generatePrompt(
      structuredPrompt,
      {
        template_id: templateData.id,
        industry: templateData.industry,
        scenario: templateData.scenario,
      }
    );
    
    // 处理生成结果，保存到数据库或返回给用户
    const processedResult = {
      templateId: templateData.id,
      generatedContent: result.content,
      metadata: {
        ...result.metadata,
        generatedAt: new Date().toISOString(),
        industry: templateData.industry,
        scenario: templateData.scenario,
      },
    };
    
    console.log('集成示例结果：', processedResult);
    
    // 在实际应用中，这里会保存到数据库
    // await saveToDatabase(processedResult);
    
  } catch (error) {
    console.error('集成示例失败：', error);
    
    // 在实际应用中，这里会记录错误日志
    // await logError(error, templateData);
  }
}

// ==================== 工具函数 ====================

/**
 * 验证生成结果的质量
 */
export function validateGeneratedContent(content: string): {
  isValid: boolean;
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 100;
  
  // 检查长度
  if (content.length < 50) {
    issues.push('内容过短');
    score -= 20;
  }
  
  if (content.length > 5000) {
    issues.push('内容过长');
    score -= 10;
  }
  
  // 检查是否包含敏感内容
  const sensitiveWords = ['错误', '失败', '抱歉', '无法'];
  for (const word of sensitiveWords) {
    if (content.includes(word)) {
      issues.push(`包含敏感词汇：${word}`);
      score -= 5;
    }
  }
  
  // 检查结构完整性
  if (!content.includes('。') && !content.includes('？') && !content.includes('！')) {
    issues.push('缺少标点符号');
    score -= 15;
  }
  
  return {
    isValid: score >= 70,
    score: Math.max(0, score),
    issues,
  };
}

/**
 * 格式化输出结果
 */
export function formatOutput(response: GeneratePromptResponse): string {
  const validation = validateGeneratedContent(response.content);
  
  return `
=== AI提示词生成结果 ===

📝 生成内容：
${response.content}

📊 元数据信息：
- 请求ID: ${response.metadata.requestId}
- 使用模型: ${response.metadata.model}
- 输入Token数: ${response.metadata.usage.inputTokens}
- 输出Token数: ${response.metadata.usage.outputTokens}
- 总Token数: ${response.metadata.usage.totalTokens}
- 响应时间: ${response.metadata.responseTimeMs}ms

✅ 质量评估：
- 质量分数: ${validation.score}/100
- 状态: ${validation.isValid ? '通过' : '需要优化'}
- 问题: ${validation.issues.length > 0 ? validation.issues.join(', ') : '无'}

=========================
  `.trim();
}

// ==================== 导出所有示例函数 ====================

export const examples = {
  basicUsage: basicUsageExample,
  contextualGeneration: contextualGenerationExample,
  advancedConfig: advancedConfigExample,
  errorHandling: errorHandlingExample,
  healthCheck: healthCheckExample,
  batchProcessing: batchProcessingExample,
  integrationWithExistingSystem: integrationWithExistingSystemExample,
};

export const utils = {
  validateGeneratedContent,
  formatOutput,
};