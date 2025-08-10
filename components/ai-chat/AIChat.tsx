'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Trash2, 
  Loader2, 
  MessageSquare, 
  Zap, 
  Copy, 
  Check,
  AlertCircle,
  StopCircle
} from 'lucide-react';
import { ChatMessage, ChatState, ChatAction, OptimizationSuggestion } from '@/types/ai-chat';
import { PromptAnalyzer, OptimizationSuggestionEngine } from '@/lib/ai/prompt-optimizer';
import { cn } from '@/lib/utils';

/**
 * AI对话优化组件
 * 提供专业的提示词优化对话界面
 */

interface AIChatProps {
  initialPrompt?: string;
  onOptimizedPrompt?: (prompt: string) => void;
  className?: string;
}

// Chat状态管理reducer
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
        error: null,
      };
    case 'UPDATE_STREAMING_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id
            ? { ...msg, content: action.payload.content }
            : msg
        ),
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [], error: null, streamingMessageId: null };
    case 'START_STREAMING':
      return { ...state, streamingMessageId: action.payload, isLoading: true };
    case 'STOP_STREAMING':
      return { ...state, streamingMessageId: null, isLoading: false };
    default:
      return state;
  }
}

export default function AIChat({ initialPrompt, onOptimizedPrompt, className }: AIChatProps) {
  // 状态管理
  const [state, dispatch] = React.useReducer(chatReducer, {
    messages: [],
    isLoading: false,
    error: null,
    streamingMessageId: null,
  });

  const [input, setInput] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [state.messages, scrollToBottom]);

  // 初始化时添加欢迎消息和初始提示词分析
  useEffect(() => {
    if (state.messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `👋 您好！我是您的专业提示词优化顾问。

我可以帮您：
🔍 **深度分析** 提示词的问题和潜力
⚡ **精准优化** 提升AI响应质量
🎯 **量化评估** 优化效果对比
💡 **策略建议** 针对性改进方案

${initialPrompt ? '让我先分析一下您当前的提示词...' : '请分享您想优化的提示词，或描述您的需求。'}`,
        timestamp: new Date(),
      };

      dispatch({ type: 'ADD_MESSAGE', payload: welcomeMessage });

      // 如果有初始提示词，进行分析
      if (initialPrompt) {
        setTimeout(() => {
          analyzeInitialPrompt(initialPrompt);
        }, 1000);
      }
    }
  }, [initialPrompt]);

  // 分析初始提示词
  const analyzeInitialPrompt = useCallback((prompt: string) => {
    const analysis = PromptAnalyzer.analyzePrompt(prompt);
    const suggestions = OptimizationSuggestionEngine.generateSuggestions(prompt);

    const analysisMessage: ChatMessage = {
      id: `analysis-${Date.now()}`,
      role: 'assistant',
      content: `📊 **提示词质量分析报告**

**原始提示词：**
"${prompt}"

**质量评分：**
- 🎯 明确性: ${analysis.clarity}/10
- 📋 具体性: ${analysis.specificity}/10  
- 🏗️ 结构性: ${analysis.structure}/10
- 🏆 **总体评分: ${analysis.overall}/10**

**优化建议：**
${suggestions.map(s => `
**${s.title}** (${s.priority === 'high' ? '🔴 高优先级' : s.priority === 'medium' ? '🟡 中优先级' : '🟢 低优先级'})
${s.description}
${s.example ? `💡 示例: ${s.example}` : ''}
`).join('\n')}

您希望我重点优化哪个方面？或者直接让我为您提供一个全面优化的版本？`,
      timestamp: new Date(),
    };

    dispatch({ type: 'ADD_MESSAGE', payload: analysisMessage });
  }, []);

  // 发送消息
  const sendMessage = useCallback(async (message?: string) => {
    const messageContent = message || input.trim();
    if (!messageContent || state.isLoading) return;

    // 清空输入框
    setInput('');

    // 添加用户消息
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };
    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });

    // 创建助手消息占位符
    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });

    // 开始流式响应
    dispatch({ type: 'START_STREAMING', payload: assistantMessageId });

    try {
      const controller = new AbortController();
      setAbortController(controller);

      const response = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...state.messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // 处理服务器发送事件
          while (true) {
            const lineEnd = buffer.indexOf('\n\n');
            if (lineEnd === -1) break;

            const line = buffer.slice(0, lineEnd).trim();
            buffer = buffer.slice(lineEnd + 2);

            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                dispatch({ type: 'STOP_STREAMING' });
                setAbortController(null);
                return;
              }

              try {
                const parsed = JSON.parse(data);
                
                if (parsed.error) {
                  throw new Error(parsed.error);
                }

                if (parsed.content) {
                  fullContent += parsed.content;
                  dispatch({
                    type: 'UPDATE_STREAMING_MESSAGE',
                    payload: { id: assistantMessageId, content: fullContent },
                  });
                }
              } catch (parseError) {
                console.warn('解析流式数据失败:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
        dispatch({ type: 'STOP_STREAMING' });
        setAbortController(null);
      }

    } catch (error) {
      console.error('发送消息失败:', error);
      
      if ((error as Error).name !== 'AbortError') {
        dispatch({ 
          type: 'SET_ERROR', 
          payload: error instanceof Error ? error.message : '发送消息失败' 
        });
        
        // 移除失败的助手消息
        dispatch({
          type: 'UPDATE_STREAMING_MESSAGE',
          payload: { 
            id: assistantMessageId, 
            content: '❌ 抱歉，处理您的请求时出现了错误。请稍后重试。' 
          },
        });
      }
      
      dispatch({ type: 'STOP_STREAMING' });
      setAbortController(null);
    }
  }, [input, state.isLoading, state.messages]);

  // 停止流式响应
  const stopStreaming = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      dispatch({ type: 'STOP_STREAMING' });
    }
  }, [abortController]);

  // 清空对话
  const clearMessages = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' });
    setInput('');
  }, []);

  // 复制消息内容
  const copyMessage = useCallback(async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  }, []);

  // 应用优化后的提示词
  const applyOptimizedPrompt = useCallback((content: string) => {
    // 尝试提取优化后的提示词
    const optimizedMatch = content.match(/(?:\*\*优化后的提示词：?\*\*|【优化版本】)([\s\S]*?)(?=\n\n|\*\*|$)/);
    const extracted = optimizedMatch?.[1]?.trim() || content;
    
    if (onOptimizedPrompt) {
      onOptimizedPrompt(extracted);
    }
  }, [onOptimizedPrompt]);

  // 处理键盘快捷键
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  return (
    <Card className={cn("w-full h-[600px] flex flex-col", className)}>
      <CardHeader className="flex-shrink-0 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">AI提示词优化助手</CardTitle>
              <p className="text-sm text-muted-foreground">
                专业的提示词分析与优化服务
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {state.messages.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearMessages}
                className="text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Badge variant="outline" className="text-xs">
              {state.messages.filter(m => m.role !== 'system').length} 消息
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 p-4 min-h-0">
        {/* 消息列表 */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {state.messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 p-4 rounded-lg transition-colors",
                  message.role === 'user' 
                    ? "bg-primary/5 ml-8 border border-primary/10" 
                    : "bg-muted/50 mr-8"
                )}
              >
                {/* 头像 */}
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium",
                  message.role === 'user' 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                )}>
                  {message.role === 'user' ? 'U' : 'AI'}
                </div>

                {/* 消息内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      {message.role === 'user' ? '您' : 'AI助手'}
                    </span>
                    <div className="flex items-center gap-1">
                      {message.isStreaming && (
                        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyMessage(message.content, message.id)}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-background/50"
                      >
                        {copiedMessageId === message.id ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </pre>
                  </div>

                  {/* 应用优化按钮（仅对助手的优化消息显示） */}
                  {message.role === 'assistant' && 
                   !message.isStreaming && 
                   message.content.includes('优化') && 
                   onOptimizedPrompt && (
                    <div className="mt-3 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => applyOptimizedPrompt(message.content)}
                        className="text-xs"
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        应用优化后的提示词
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* 错误提示 */}
            {state.error && (
              <div className="flex gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-destructive font-medium">发生错误</p>
                  <p className="text-xs text-destructive/80 mt-1">{state.error}</p>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* 输入区域 */}
        <div className="flex-shrink-0 space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="描述您想优化的提示词，或提出具体问题..."
                className="min-h-[80px] pr-12 resize-none"
                disabled={state.isLoading}
              />
              <Button
                size="sm"
                onClick={() => sendMessage()}
                disabled={!input.trim() || state.isLoading}
                className="absolute bottom-2 right-2 h-8 w-8 p-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {state.isLoading && (
              <Button
                variant="outline"
                size="sm"
                onClick={stopStreaming}
                className="flex items-center gap-1 text-xs"
              >
                <StopCircle className="w-3 h-3" />
                停止
              </Button>
            )}
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>按 Enter 发送，Shift+Enter 换行</span>
            <span>{input.length}/1000</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}