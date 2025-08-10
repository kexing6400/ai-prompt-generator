import { NextRequest, NextResponse } from 'next/server';
import { validateOpenRouterKey } from '@/lib/utils/api-validation';

/**
 * AI对话优化API端点
 * 支持流式响应，提供专业的提示词优化服务
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { messages, prompt, model = 'anthropic/claude-3.5-sonnet' } = body;

    // 验证必需参数
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: '缺少必需的消息数组参数' },
        { status: 400 }
      );
    }

    // 验证OpenRouter API密钥
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: '服务器配置错误：缺少OpenRouter API密钥' },
        { status: 500 }
      );
    }

    // 验证API密钥格式（基本验证）
    if (!validateOpenRouterKey(apiKey)) {
      return NextResponse.json(
        { error: '无效的API密钥格式' },
        { status: 500 }
      );
    }

    // 构建系统提示词 - 专业的提示词优化专家
    const systemPrompt = `你是一位世界级的提示词优化专家和AI工程师，拥有深厚的心理学、语言学和认知科学背景。

你的专长包括：
🎯 **提示词诊断**：像外科医生一样精准识别提示词的问题点
🔧 **结构化优化**：将模糊表述转化为清晰、具体、可操作的指令
🎨 **创意增强**：运用心理学原理激发AI的最佳创作能力
📊 **效果验证**：提供优化前后的对比分析

**优化原则**：
1. **明确性** - 消除歧义，增加具体细节
2. **结构化** - 采用分层次、有逻辑的指令结构
3. **上下文丰富** - 提供充足的背景信息和示例
4. **目标导向** - 确保每个指令都直指预期结果
5. **人性化** - 考虑用户体验和AI理解模式

请以对话形式与用户互动，逐步优化他们的提示词。每次回复都要：
- 诊断当前提示词的具体问题
- 提供改进建议和原理解释
- 给出优化后的版本
- 预测优化效果

保持专业、耐心，并用富有洞察力的分析帮助用户理解优化背后的逻辑。`;

    // 构建完整的消息数组
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    // 如果有新的用户提示词，添加到消息中
    if (prompt) {
      fullMessages.push({ 
        role: 'user', 
        content: `请帮我优化这个提示词：\n\n${prompt}` 
      });
    }

    // 创建ReadableStream用于流式响应
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 发送请求到OpenRouter
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://prompt-generator.com',
              'X-Title': 'AI Prompt Generator',
            },
            body: JSON.stringify({
              model,
              messages: fullMessages,
              temperature: 0.7,
              max_tokens: 4000,
              stream: true,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API错误 (${response.status}): ${errorText}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('无法读取响应流');
          }

          const decoder = new TextDecoder();
          let buffer = '';

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              // 将新的字节块添加到缓冲区
              buffer += decoder.decode(value, { stream: true });

              // 处理完整的行
              while (true) {
                const lineEnd = buffer.indexOf('\n');
                if (lineEnd === -1) break;

                const line = buffer.slice(0, lineEnd).trim();
                buffer = buffer.slice(lineEnd + 1);

                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  
                  if (data === '[DONE]') {
                    controller.close();
                    return;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    
                    if (content) {
                      // 发送内容块到客户端
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                    }

                    // 检查是否完成
                    const finishReason = parsed.choices?.[0]?.finish_reason;
                    if (finishReason) {
                      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                      controller.close();
                      return;
                    }
                  } catch (parseError) {
                    console.warn('JSON解析错误:', parseError);
                    // 继续处理下一行
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }

        } catch (error) {
          console.error('流式处理错误:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              error: error instanceof Error ? error.message : '未知错误' 
            })}\n\n`)
          );
          controller.close();
        }
      },
    });

    // 返回流式响应
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('AI优化API错误:', error);
    
    return NextResponse.json(
      { 
        error: '服务器内部错误', 
        details: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    );
  }
}

// 支持OPTIONS请求用于CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}