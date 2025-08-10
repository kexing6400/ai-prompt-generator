'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  MessageSquare, 
  Send, 
  GraduationCap, 
  Scale, 
  Calculator,
  Home,
  Shield,
  Settings,
  Globe,
  Copy,
  Download,
  Trash2,
  Menu,
  X,
  User,
  Bot,
  Sparkles
} from 'lucide-react'

import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"

// AI专家配置
const AI_EXPERTS = [
  {
    id: 'teacher',
    name: '教师专家',
    icon: '📚',
    iconComponent: GraduationCap,
    color: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-600',
    description: '教案设计、学习评估、教育方法',
    prompt: '您是一位拥有15年教学经验的资深教育专家。请以专业、耐心的态度为用户提供教育相关的建议和解决方案。'
  },
  {
    id: 'lawyer',
    name: '律师专家',
    icon: '⚖️', 
    iconComponent: Scale,
    color: 'bg-purple-500',
    hoverColor: 'hover:bg-purple-600',
    description: '法律咨询、合同审查、法务建议',
    prompt: '您是一位拥有18年执业经验的资深律师。请以专业、严谨的态度为用户提供法律相关的咨询和建议。'
  },
  {
    id: 'accountant',
    name: '会计师专家',
    icon: '💰',
    iconComponent: Calculator,
    color: 'bg-green-500',
    hoverColor: 'hover:bg-green-600',
    description: '财务分析、税务筹划、会计咨询',
    prompt: '您是一位拥有12年财务管理经验的注册会计师。请以专业、精准的态度为用户提供财务和会计相关的建议。'
  },
  {
    id: 'realtor',
    name: '房产专家',
    icon: '🏠',
    iconComponent: Home,
    color: 'bg-orange-500',
    hoverColor: 'hover:bg-orange-600',
    description: '房产投资、市场分析、置业建议',
    prompt: '您是一位拥有10年房地产经验的资深房产顾问。请以专业、实用的态度为用户提供房地产相关的投资建议。'
  },
  {
    id: 'insurance',
    name: '保险顾问',
    icon: '🛡️',
    iconComponent: Shield,
    color: 'bg-teal-500',
    hoverColor: 'hover:bg-teal-600',
    description: '保险规划、风险评估、理赔指导',
    prompt: '您是一位拥有8年保险行业经验的保险规划师。请以专业、贴心的态度为用户提供保险规划和风险管理建议。'
  }
]

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface HomePageProps {
  params: { locale: string }
}

export default function HomePage({ params: { locale } }: HomePageProps) {
  const [selectedExpert, setSelectedExpert] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // 语言切换功能
  const switchLanguage = () => {
    const newLocale = locale === 'zh' ? 'en' : 'zh'
    window.location.href = `/${newLocale}`
  }

  // 选择专家
  const handleSelectExpert = (expertId: string) => {
    setSelectedExpert(expertId)
    setMessages([])
    const expert = AI_EXPERTS.find(e => e.id === expertId)
    if (expert) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `您好！我是${expert.name}，专业提供${expert.description}。请告诉我您的具体需求，我将为您提供专业的建议和解决方案。`,
        timestamp: new Date()
      }])
    }
    setSidebarOpen(false)
  }

  // 发送消息
  const handleSendMessage = async () => {
    if (!input.trim() || !selectedExpert) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const expert = AI_EXPERTS.find(e => e.id === selectedExpert)
      const response = await fetch('/api/ai-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          systemPrompt: expert?.prompt || '',
          expertId: selectedExpert
        })
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response || '抱歉，我现在无法回应。请稍后再试。',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，发生了一个错误。请检查网络连接后重试。',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // 复制消息
  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  // 清空对话
  const handleClearChat = () => {
    setMessages([])
    if (selectedExpert) {
      const expert = AI_EXPERTS.find(e => e.id === selectedExpert)
      if (expert) {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: `您好！我是${expert.name}，专业提供${expert.description}。请告诉我您的具体需求，我将为您提供专业的建议和解决方案。`,
          timestamp: new Date()
        }])
      }
    }
  }

  const currentExpert = AI_EXPERTS.find(e => e.id === selectedExpert)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 左侧边栏 - 专家选择 */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-30 flex flex-col w-80 bg-white border-r border-gray-200 transition-transform duration-300`}>
        {/* 侧边栏头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">AI专家对话</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* 专家列表 */}
        <div className="flex-1 p-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">选择AI专家</h2>
          <div className="space-y-2">
            {AI_EXPERTS.map((expert) => {
              const IconComponent = expert.iconComponent
              return (
                <Button
                  key={expert.id}
                  variant={selectedExpert === expert.id ? "default" : "ghost"}
                  className={`w-full justify-start p-3 h-auto ${selectedExpert === expert.id ? expert.color : ''}`}
                  onClick={() => handleSelectExpert(expert.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-lg">{expert.icon}</div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{expert.name}</div>
                      <div className="text-xs opacity-75">{expert.description}</div>
                    </div>
                  </div>
                </Button>
              )
            })}
          </div>
        </div>

        {/* 侧边栏底部 */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={handleClearChat}
            disabled={messages.length === 0}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            清空对话
          </Button>
          <Link href={`/${locale}/settings`}>
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <Settings className="w-4 h-4 mr-2" />
              设置
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={switchLanguage}
          >
            <Globe className="w-4 h-4 mr-2" />
            {locale === 'zh' ? 'English' : '中文'}
          </Button>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部导航栏 */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-4 h-4" />
            </Button>
            {currentExpert ? (
              <>
                <div className="text-lg">{currentExpert.icon}</div>
                <div>
                  <h2 className="font-semibold text-gray-900">{currentExpert.name}</h2>
                  <p className="text-sm text-gray-500">{currentExpert.description}</p>
                </div>
              </>
            ) : (
              <h2 className="font-semibold text-gray-900">请选择AI专家开始对话</h2>
            )}
          </div>
          
          {currentExpert && (
            <Badge variant="secondary" className={currentExpert.color + ' text-white'}>
              专业服务
            </Badge>
          )}
        </div>

        {/* 对话区域 */}
        <div className="flex-1 overflow-hidden">
          {!selectedExpert ? (
            // 欢迎界面
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  欢迎使用AI专家对话系统
                </h3>
                <p className="text-gray-600 mb-6">
                  请从左侧选择一位AI专家，开始您的专业咨询对话。
                  我们的专家将为您提供个性化的建议和解决方案。
                </p>
                <Button
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  选择AI专家
                </Button>
              </div>
            </div>
          ) : (
            // 消息列表
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* 头像 */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user' 
                          ? 'bg-blue-500' 
                          : currentExpert?.color || 'bg-gray-500'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Bot className="w-4 h-4 text-white" />
                        )}
                      </div>

                      {/* 消息气泡 */}
                      <div className="group relative">
                        <Card className={`${
                          message.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border border-gray-200'
                        }`}>
                          <CardContent className="p-3">
                            <div className="text-sm whitespace-pre-wrap">
                              {message.content}
                            </div>
                            <div className={`text-xs mt-2 ${
                              message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {message.timestamp.toLocaleTimeString()}
                            </div>
                          </CardContent>
                        </Card>

                        {/* 复制按钮 */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleCopyMessage(message.content)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 加载状态 */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex gap-3 max-w-[80%]">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${currentExpert?.color || 'bg-gray-500'}`}>
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <Card className="bg-white border border-gray-200">
                        <CardContent className="p-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </div>

              {/* 输入区域 */}
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`向${currentExpert?.name}提问...`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isLoading}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  按 Enter 发送，Shift + Enter 换行
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}