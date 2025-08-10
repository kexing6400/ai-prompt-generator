'use client';

/**
 * 简化版AI聊天演示组件
 * 展示如何使用新的简洁对话API
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Brain, User, Loader2 } from 'lucide-react';

// 专家配置
const EXPERTS = {
  teacher: { name: '教师专家', emoji: '📚', color: 'bg-blue-100 text-blue-800' },
  lawyer: { name: '律师专家', emoji: '⚖️', color: 'bg-purple-100 text-purple-800' },
  accountant: { name: '会计师专家', emoji: '💰', color: 'bg-green-100 text-green-800' },
  realtor: { name: '房产专家', emoji: '🏠', color: 'bg-orange-100 text-orange-800' },
  insurance: { name: '保险顾问', emoji: '🛡️', color: 'bg-indigo-100 text-indigo-800' }
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  expert: keyof typeof EXPERTS;
  conversationId?: string;
  error?: string;
}

export default function SimpleChatDemo() {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    expert: 'teacher'
  });
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatState.messages]);

  // 发送消息
  const sendMessage = async () => {
    if (!inputMessage.trim() || chatState.isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // 添加用户消息
    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
      }],
      isLoading: true,
      error: undefined
    }));

    try {
      const response = await fetch('/api/simple-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          expert: chatState.expert,
          conversationId: chatState.conversationId
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 添加AI回复
        setChatState(prev => ({
          ...prev,
          messages: [...prev.messages, {
            role: 'assistant',
            content: data.response,
            timestamp: data.timestamp
          }],
          conversationId: data.conversationId,
          isLoading: false
        }));
      } else {
        setChatState(prev => ({
          ...prev,
          isLoading: false,
          error: data.error || '发送失败，请重试'
        }));
      }
    } catch (error) {
      setChatState(prev => ({
        ...prev,
        isLoading: false,
        error: '网络错误，请检查连接后重试'
      }));
    }
  };

  // 切换专家
  const switchExpert = (newExpert: keyof typeof EXPERTS) => {
    setChatState(prev => ({
      ...prev,
      expert: newExpert,
      messages: [],
      conversationId: undefined,
      error: undefined
    }));
  };

  // 清空对话
  const clearChat = () => {
    setChatState(prev => ({
      ...prev,
      messages: [],
      conversationId: undefined,
      error: undefined
    }));
  };

  // 键盘快捷键
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const currentExpert = EXPERTS[chatState.expert];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 标题 */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          简化版AI专家对话系统
        </h1>
        <p className="text-gray-600">
          选择一位AI专家，开始专业对话 - 简单、快速、直观
        </p>
      </div>

      {/* 专家选择器 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Brain className="w-5 h-5" />
          选择AI专家
        </h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(EXPERTS).map(([key, expert]) => (
            <button
              key={key}
              onClick={() => switchExpert(key as keyof typeof EXPERTS)}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                chatState.expert === key
                  ? `${expert.color} border-current`
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{expert.emoji}</span>
              {expert.name}
            </button>
          ))}
        </div>
      </div>

      {/* 聊天界面 */}
      <div className="bg-white rounded-lg shadow-lg border">
        {/* 聊天头部 */}
        <div className={`p-4 border-b ${currentExpert.color} rounded-t-lg`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{currentExpert.emoji}</span>
              <div>
                <h3 className="font-semibold">{currentExpert.name}</h3>
                <p className="text-sm opacity-75">
                  {chatState.conversationId ? `对话ID: ${chatState.conversationId.split('_')[1]}` : '新对话'}
                </p>
              </div>
            </div>
            {chatState.messages.length > 0 && (
              <button
                onClick={clearChat}
                className="px-3 py-1 text-sm bg-white/20 rounded-md hover:bg-white/30 transition-colors"
              >
                清空对话
              </button>
            )}
          </div>
        </div>

        {/* 消息列表 */}
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {chatState.messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-16">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>开始与{currentExpert.name}对话吧！</p>
              <p className="text-sm mt-2">
                你可以询问专业问题，获得详细的解答和建议
              </p>
            </div>
          ) : (
            chatState.messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                {/* 头像 */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : currentExpert.color
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    currentExpert.emoji
                  )}
                </div>

                {/* 消息内容 */}
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white ml-auto'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <div
                    className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* 加载状态 */}
          {chatState.isLoading && (
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentExpert.color}`}>
                {currentExpert.emoji}
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>正在思考...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 错误提示 */}
        {chatState.error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-200">
            <p className="text-red-600 text-sm">{chatState.error}</p>
          </div>
        )}

        {/* 输入区域 */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`向${currentExpert.name}提问...`}
              className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              disabled={chatState.isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || chatState.isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {chatState.isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">
              按 Enter 发送，Shift+Enter 换行
            </p>
            <p className="text-xs text-gray-500">
              {inputMessage.length}/1000 字符
            </p>
          </div>
        </div>
      </div>

      {/* 系统说明 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">✨ 简化版特点：</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• <strong>简单直观</strong>：一次提问，直接获得专业回答</li>
          <li>• <strong>专家系统</strong>：5位专业AI专家，各有所长</li>
          <li>• <strong>对话记忆</strong>：支持上下文，可进行连续对话</li>
          <li>• <strong>快速响应</strong>：去除复杂处理，响应更快</li>
          <li>• <strong>友好错误</strong>：清晰的错误提示和重试机制</li>
        </ul>
      </div>
    </div>
  );
}