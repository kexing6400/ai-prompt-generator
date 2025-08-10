'use client';

/**
 * 智能AI对话组件
 * 替换传统的模板选择器，提供真正的AI对话体验
 * 
 * 功能特性：
 * - 5层AI系统智能对话
 * - 实时流式响应
 * - 专家智能匹配
 * - 上下文记忆管理
 * - 动态内容生成
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  Brain, 
  Users, 
  Sparkles, 
  CheckCircle,
  ArrowRight,
  Loader2,
  User,
  Bot,
  Copy,
  Download,
  RefreshCw
} from 'lucide-react';

// 类型定义
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  layer?: number;
  type?: string;
}

interface ConversationState {
  id: string;
  currentLayer: number;
  expertType?: string;
  status: 'idle' | 'analyzing' | 'matching' | 'conversing' | 'generating' | 'optimizing' | 'completed';
  progress: number;
}

interface AIResponse {
  success: boolean;
  conversationId: string;
  currentLayer: number;
  error?: string;
  response: {
    type: string;
    content: string;
    nextStep?: string;
    analysis?: any;
    expert?: any;
    actions?: string[];
    metadata?: any;
  };
  responseTime: string;
}

// 5层AI系统状态配置
const AI_LAYERS = [
  {
    id: 1,
    name: '需求洞察AI',
    icon: Brain,
    description: '心理学专家分析您的真实需求',
    color: 'bg-blue-500'
  },
  {
    id: 2,
    name: '专家匹配AI',
    icon: Users,
    description: '智能选择最适合的行业专家',
    color: 'bg-green-500'
  },
  {
    id: 3,
    name: '专家对话AI',
    icon: MessageCircle,
    description: '深度专业对话与信息收集',
    color: 'bg-purple-500'
  },
  {
    id: 4,
    name: '内容生成AI',
    icon: Sparkles,
    description: '基于对话生成定制化内容',
    color: 'bg-orange-500'
  },
  {
    id: 5,
    name: '质量优化AI',
    icon: CheckCircle,
    description: '多维度质量检测与优化',
    color: 'bg-pink-500'
  }
];

const IntelligentChat: React.FC = () => {
  // 状态管理
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversation, setConversation] = useState<ConversationState>({
    id: `conv_${Date.now()}`,
    currentLayer: 1,
    status: 'idle',
    progress: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [finalResult, setFinalResult] = useState<string>('');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 初始化欢迎消息
  useEffect(() => {
    const welcomeMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: `🎯 **欢迎使用5层智能AI对话系统！**

我不再是简单的模板选择器，而是您的专业AI顾问团队：

✨ **第1层：需求洞察AI** - 心理学专家深度分析您的真实需求  
🎯 **第2层：专家匹配AI** - 智能选择最适合的行业专家  
💬 **第3层：专家对话AI** - 与您进行深度专业对话  
🚀 **第4层：内容生成AI** - 基于对话生成定制化内容  
⭐ **第5层：质量优化AI** - 多维度质量检测与优化

**请告诉我您需要什么帮助？**  
例如：
- "我需要写一份商业计划书"
- "帮我设计一堂英语课程"  
- "我想学习数字营销策略"
- "需要起草一份合同"`,
      timestamp: new Date(),
      type: 'welcome'
    };

    setMessages([welcomeMessage]);
  }, []);

  // 发送消息处理
  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // 更新对话状态
    const newStatus = getStatusByLayer(conversation.currentLayer);
    setConversation(prev => ({
      ...prev,
      status: newStatus,
      progress: (prev.currentLayer / 5) * 100
    }));

    try {
      // 调用AI对话API
      const response = await fetch('/api/ai-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputMessage.trim(),
          conversationId: conversation.id,
          userId: 'current_user',
          action: 'chat',
          context: {
            currentLayer: conversation.currentLayer
          }
        })
      });

      const data: AIResponse = await response.json();

      if (data.success) {
        // 添加AI响应
        const assistantMessage: Message = {
          id: `msg_${Date.now()}_ai`,
          role: 'assistant',
          content: data.response.content,
          timestamp: new Date(),
          layer: data.currentLayer,
          type: data.response.type
        };

        setMessages(prev => [...prev, assistantMessage]);

        // 更新对话状态
        setConversation(prev => ({
          ...prev,
          currentLayer: data.currentLayer,
          expertType: data.response.expert?.expertType || prev.expertType,
          progress: (data.currentLayer / 5) * 100,
          status: data.response.type === 'final_result' ? 'completed' : getStatusByLayer(data.currentLayer)
        }));

        // 处理特殊响应
        if (data.response.actions) {
          setAvailableActions(data.response.actions);
        }

        if (data.response.type === 'final_result') {
          setFinalResult(data.response.content);
        }

      } else {
        throw new Error(data.error || '对话失败');
      }

    } catch (error: any) {
      console.error('对话失败:', error);
      
      const errorMessage: Message = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',  
        content: `❌ 抱歉，AI系统暂时不可用。请稍后重试。\n\n错误信息：${error.message}`,
        timestamp: new Date(),
        type: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, conversation.id, conversation.currentLayer, isLoading]);

  // 根据层级获取状态
  const getStatusByLayer = (layer: number): ConversationState['status'] => {
    switch (layer) {
      case 1: return 'analyzing';
      case 2: return 'matching';
      case 3: return 'conversing';
      case 4: return 'generating';
      case 5: return 'optimizing';
      default: return 'idle';
    }
  };

  // 获取状态描述
  const getStatusDescription = (status: ConversationState['status']) => {
    const descriptions = {
      idle: '准备开始对话',
      analyzing: '正在分析您的需求...',
      matching: '正在匹配专业专家...',
      conversing: '与专家深度对话中...',
      generating: '正在生成专业内容...',
      optimizing: '正在优化内容质量...',
      completed: '任务完成！'
    };
    return descriptions[status];
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 复制内容
  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  // 重新开始对话
  const handleRestart = () => {
    setMessages([]);
    setConversation({
      id: `conv_${Date.now()}`,
      currentLayer: 1,
      status: 'idle',
      progress: 0
    });
    setAvailableActions([]);
    setFinalResult('');
    
    // 重新添加欢迎消息
    setTimeout(() => {
      const welcomeMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `🚀 **重新开始新的对话**\n\n我已准备好为您提供专业服务。请告诉我您需要什么帮助？`,
        timestamp: new Date(),
        type: 'welcome'
      };
      setMessages([welcomeMessage]);
    }, 100);
  };

  // 渲染消息组件
  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    const currentLayer = AI_LAYERS.find(layer => layer.id === message.layer);

    return (
      <div
        key={message.id}
        className={`flex gap-3 p-4 ${isUser ? 'bg-gray-50' : 'bg-white'} rounded-lg border`}
      >
        <div className="flex-shrink-0">
          {isUser ? (
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          ) : (
            <div className={`w-8 h-8 ${currentLayer?.color || 'bg-gray-600'} rounded-full flex items-center justify-center`}>
              {currentLayer ? (
                React.createElement(currentLayer.icon, { className: 'w-4 h-4 text-white' })
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-sm">
              {isUser ? '您' : (currentLayer?.name || 'AI助手')}
            </span>
            {currentLayer && (
              <Badge variant="secondary" className="text-xs">
                第{currentLayer.id}层
              </Badge>
            )}
            <span className="text-xs text-gray-500">
              {message.timestamp.toLocaleTimeString()}
            </span>
          </div>
          
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-gray-800">
              {message.content}
            </div>
          </div>

          {!isUser && message.content.length > 100 && (
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyContent(message.content)}
                className="text-xs"
              >
                <Copy className="w-3 h-3 mr-1" />
                复制
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 系统状态面板 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            5层智能AI对话系统
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 进度条 */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">对话进度</span>
              <span className="text-sm text-gray-500">{Math.round(conversation.progress)}%</span>
            </div>
            <Progress value={conversation.progress} className="h-2" />
            <p className="text-xs text-gray-600 mt-1">
              {getStatusDescription(conversation.status)}
            </p>
          </div>

          {/* AI层级状态 */}
          <div className="grid grid-cols-5 gap-2">
            {AI_LAYERS.map((layer) => {
              const isActive = conversation.currentLayer === layer.id;
              const isCompleted = conversation.currentLayer > layer.id;
              
              return (
                <div
                  key={layer.id}
                  className={`p-2 rounded-lg border text-center ${
                    isActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : isCompleted
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center ${
                    isActive || isCompleted ? layer.color : 'bg-gray-400'
                  }`}>
                    {React.createElement(layer.icon, { 
                      className: 'w-4 h-4 text-white' 
                    })}
                  </div>
                  <p className="text-xs font-medium">{layer.name}</p>
                  <p className="text-xs text-gray-600 mt-1">{layer.description}</p>
                </div>
              );
            })}
          </div>

          {/* 当前专家信息 */}
          {conversation.expertType && (
            <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm font-medium text-purple-800">
                🎯 当前专家：{conversation.expertType}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 对话区域 */}
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              智能对话
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleRestart}>
              <RefreshCw className="w-4 h-4 mr-1" />
              重新开始
            </Button>
          </div>
        </CardHeader>
        <Separator />
        
        {/* 消息列表 */}
        <CardContent className="flex-1 overflow-y-auto p-0">
          <div className="p-4 space-y-4">
            {messages.map(renderMessage)}
            
            {/* 加载状态 */}
            {isLoading && (
              <div className="flex gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">AI正在思考中...</p>
                  <p className="text-xs text-blue-600 mt-1">
                    {getStatusDescription(conversation.status)}
                  </p>
                </div>
              </div>
            )}

            {/* 可用操作 */}
            {availableActions.length > 0 && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-800 mb-2">选择生成类型：</p>
                <div className="flex gap-2 flex-wrap">
                  {availableActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setInputMessage(action);
                        setAvailableActions([]);
                      }}
                      className="text-green-700 border-green-300 hover:bg-green-100"
                    >
                      {action}
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </CardContent>

        {/* 输入区域 */}
        <Separator />
        <div className="p-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="请输入您的需求或问题..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-6"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                '发送'
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 提示：描述得越详细，AI专家就能提供越精准的帮助
          </p>
        </div>
      </Card>

      {/* 最终结果展示 */}
      {finalResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              最终成果
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none p-4 bg-gray-50 rounded-lg border">
              <div className="whitespace-pre-wrap">{finalResult}</div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => handleCopyContent(finalResult)}>
                <Copy className="w-4 h-4 mr-2" />
                复制内容
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                导出文档
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IntelligentChat;