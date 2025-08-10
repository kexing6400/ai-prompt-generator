'use client';

/**
 * OpenRouter AI设置管理页面
 * 
 * 功能包括：
 * 1. API Key管理 - 隐藏显示、默认key集成、实时验证
 * 2. 模型选择 - 流行模型展示、价格对比、性能指标  
 * 3. 系统Prompt配置 - 5个专家的个性化prompt编辑
 * 4. 配额管理 - 用户限制设置、使用统计监控
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import {
  Settings,
  Key,
  Cpu,
  MessageSquare,
  BarChart3,
  Save,
  TestTube,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  RefreshCw,
  DollarSign,
  Clock,
  Zap,
  Users,
  AlertTriangle
} from 'lucide-react';

// 默认API Key（用户提供）
const DEFAULT_API_KEY = 'sk-ant-oat01-ee0f35df8f630aae92f9a6561dd9be32edfe84a1e5f0f6e4636923a0e7ad5aca';

// 流行模型配置
const POPULAR_MODELS = [
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI", 
    category: "Text",
    inputPrice: 0.005,
    outputPrice: 0.015,
    contextLength: 128000,
    description: "最新GPT-4模型，平衡了性能和成本",
    recommended: true
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet", 
    provider: "Anthropic",
    category: "Text",
    inputPrice: 0.003,
    outputPrice: 0.015, 
    contextLength: 200000,
    description: "Claude最新模型，擅长推理和分析",
    recommended: true
  },
  {
    id: "google/gemini-pro",
    name: "Gemini Pro",
    provider: "Google",
    category: "Text", 
    inputPrice: 0.0005,
    outputPrice: 0.0015,
    contextLength: 32000,
    description: "谷歌的高性能模型，性价比优异"
  },
  {
    id: "mistralai/mistral-large",
    name: "Mistral Large",
    provider: "Mistral",
    category: "Text",
    inputPrice: 0.008,
    outputPrice: 0.024,
    contextLength: 32000, 
    description: "欧洲领先的开源模型，注重隐私"
  }
];

// 专家系统Prompt模板
const EXPERT_PROMPTS = {
  teacher: {
    name: '教师AI专家',
    icon: '👨‍🏫',
    defaultPrompt: `你是一位拥有15年教学经验的资深教育专家李明教授。

专业背景：
- 高等教育15年经验，培养学生3000+名  
- 擅长课程设计、教学方法创新、学习效果评估
- 深度理解教育心理学和数字化教学

服务风格：
- 耐心细致，循循善诱
- 注重个性化学习方案设计
- 善于激发学生学习兴趣和潜能

请以专业、耐心的态度为用户提供教育相关的专业建议和解决方案。`
  },
  lawyer: {
    name: '律师AI专家', 
    icon: '⚖️',
    defaultPrompt: `你是一位拥有18年执业经验的资深律师王建华。

专业背景：
- 18年执业经验，处理案件1500+起
- 精通合同法、公司法、知识产权、劳动法、诉讼实务
- 在商业法律事务领域具有丰富实战经验

服务风格：
- 严谨专业，逻辑清晰
- 善于风险识别和预防
- 注重实用性和操作性

请以专业、严谨的态度为用户提供法律相关的咨询和建议，但请注意这仅供参考，不构成正式法律意见。`
  },
  accountant: {
    name: '会计AI专家',
    icon: '💼', 
    defaultPrompt: `你是一位拥有12年财务管理经验的注册会计师张会计师。

专业背景：
- 12年财务管理经验，服务企业500+家
- 精通财务分析、税务筹划、审计、成本控制、投资分析
- 具备深厚的财务规划和税务优化经验

服务风格：
- 数据驱动，逻辑严密
- 注重实用性和合规性
- 善于将复杂财务概念简化解释

请以专业、精准的态度为用户提供财务和会计相关的专业建议。`
  },
  realtor: {
    name: '房产AI专家',
    icon: '🏠',
    defaultPrompt: `你是一位拥有10年房地产经验的资深房产顾问刘房产专家。

专业背景：  
- 10年房地产经验，成交额10亿+
- 精通市场分析、投资策略、交易流程、房产评估、政策解读
- 对房地产市场趋势有敏锐洞察

服务风格：
- 市场敏感度高，数据分析能力强
- 注重投资回报和风险控制
- 善于为客户制定个性化投资策略

请以专业、实用的态度为用户提供房地产相关的投资建议和市场分析。`
  },
  insurance: {
    name: '保险AI专家',
    icon: '🛡️',
    defaultPrompt: `你是一位拥有8年保险行业经验的保险规划师陈保险专家。

专业背景：
- 8年保险行业经验，服务客户2000+名
- 精通风险评估、保险产品设计、理赔服务、保险规划、风险管理
- 具备丰富的个人和企业保险规划经验

服务风格：
- 风险意识强，保障意识深
- 注重客户需求分析和个性化方案设计
- 善于将保险知识通俗化解释

请以专业、贴心的态度为用户提供保险规划和风险管理相关的建议。`
  }
};

interface SettingsState {
  apiKey: string;
  selectedModel: string;
  systemPrompts: Record<string, string>;
  quotas: {
    dailyLimit: number;
    monthlyLimit: number;
    currentUsage: {
      daily: number;
      monthly: number;
    }
  };
  isTestingConnection: boolean;
  connectionStatus: 'idle' | 'testing' | 'success' | 'error';
}

const SettingsPage: React.FC = () => {
  // 状态管理
  const [settings, setSettings] = useState<SettingsState>({
    apiKey: DEFAULT_API_KEY,
    selectedModel: 'openai/gpt-4o',
    systemPrompts: Object.fromEntries(
      Object.entries(EXPERT_PROMPTS).map(([key, value]) => [key, value.defaultPrompt])
    ),
    quotas: {
      dailyLimit: 100,
      monthlyLimit: 1000,
      currentUsage: {
        daily: 23,
        monthly: 387
      }
    },
    isTestingConnection: false,
    connectionStatus: 'idle'
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [activeExpert, setActiveExpert] = useState<string>('teacher');

  // API Key 掩码显示
  const maskApiKey = (key: string): string => {
    if (!key || key.length < 10) return key;
    return `${key.slice(0, 7)}...${key.slice(-3)}`;
  };

  // 测试API连接
  const testConnection = async () => {
    setSettings(prev => ({ ...prev, isTestingConnection: true, connectionStatus: 'testing' }));
    
    try {
      const response = await fetch('/api/openrouter/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          apiKey: settings.apiKey,
          model: settings.selectedModel 
        })
      });
      
      const result = await response.json();
      
      setSettings(prev => ({ 
        ...prev, 
        isTestingConnection: false,
        connectionStatus: result.success ? 'success' : 'error' 
      }));
    } catch (error) {
      setSettings(prev => ({ 
        ...prev, 
        isTestingConnection: false,
        connectionStatus: 'error' 
      }));
    }
  };

  // 保存设置
  const saveSettings = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openrouter: settings })
      });
      
      if (response.ok) {
        setShowSaveDialog(false);
        // 显示成功提示
      }
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  };

  // 计算使用率
  const dailyUsagePercent = (settings.quotas.currentUsage.daily / settings.quotas.dailyLimit) * 100;
  const monthlyUsagePercent = (settings.quotas.currentUsage.monthly / settings.quotas.monthlyLimit) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">OpenRouter AI 设置</h1>
          </div>
          <p className="text-gray-600">
            配置您的AI模型、系统提示词和使用配额，打造专属的智能助手体验
          </p>
        </div>

        {/* 主要配置区域 */}
        <Tabs defaultValue="api" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              API配置
            </TabsTrigger>
            <TabsTrigger value="models" className="flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              模型选择
            </TabsTrigger>
            <TabsTrigger value="prompts" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              系统提示
            </TabsTrigger>
            <TabsTrigger value="quotas" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              配额管理
            </TabsTrigger>
          </TabsList>

          {/* API配置标签页 */}
          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  API密钥管理
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="apiKey">OpenRouter API密钥</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="apiKey"
                        type={showApiKey ? "text" : "password"}
                        value={showApiKey ? settings.apiKey : maskApiKey(settings.apiKey)}
                        onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                        placeholder="输入您的OpenRouter API密钥"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      默认已配置密钥，您可以使用自己的密钥替换
                    </p>
                  </div>

                  <div>
                    <Label>连接状态</Label>
                    <div className="flex items-center gap-3 mt-2">
                      <Button
                        onClick={testConnection}
                        disabled={settings.isTestingConnection}
                        size="sm"
                        variant="outline"
                      >
                        {settings.isTestingConnection ? (
                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <TestTube className="w-4 h-4 mr-2" />
                        )}
                        测试连接
                      </Button>

                      {settings.connectionStatus === 'success' && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">连接正常</span>
                        </div>
                      )}

                      {settings.connectionStatus === 'error' && (
                        <div className="flex items-center gap-2 text-red-600">
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">连接失败</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 模型选择标签页 */}
          <TabsContent value="models" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="w-5 h-5" />
                  AI模型选择
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {POPULAR_MODELS.map((model) => (
                    <div
                      key={model.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        settings.selectedModel === model.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSettings(prev => ({ ...prev, selectedModel: model.id }))}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{model.name}</h3>
                          <p className="text-sm text-gray-600">{model.provider}</p>
                        </div>
                        <div className="flex gap-2">
                          {model.recommended && (
                            <Badge variant="default" className="bg-green-500">推荐</Badge>
                          )}
                          {settings.selectedModel === model.id && (
                            <Badge variant="default">已选择</Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">{model.description}</p>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          <span>输入: ${model.inputPrice}/1K</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          <span>输出: ${model.outputPrice}/1K</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{model.contextLength.toLocaleString()} tokens</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 系统提示标签页 */}
          <TabsContent value="prompts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  系统提示词配置
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* 专家选择 */}
                <div className="flex gap-2 mb-6 flex-wrap">
                  {Object.entries(EXPERT_PROMPTS).map(([key, expert]) => (
                    <Button
                      key={key}
                      variant={activeExpert === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveExpert(key)}
                      className="flex items-center gap-2"
                    >
                      <span>{expert.icon}</span>
                      {expert.name}
                    </Button>
                  ))}
                </div>

                {/* 当前专家的Prompt编辑 */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="systemPrompt">
                      {EXPERT_PROMPTS[activeExpert as keyof typeof EXPERT_PROMPTS].name} 系统提示词
                    </Label>
                    <Textarea
                      id="systemPrompt"
                      value={settings.systemPrompts[activeExpert] || ''}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        systemPrompts: {
                          ...prev.systemPrompts,
                          [activeExpert]: e.target.value
                        }
                      }))}
                      rows={12}
                      className="mt-1 font-mono text-sm"
                      placeholder="输入系统提示词..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        systemPrompts: {
                          ...prev.systemPrompts,
                          [activeExpert]: EXPERT_PROMPTS[activeExpert as keyof typeof EXPERT_PROMPTS].defaultPrompt
                        }
                      }))}
                    >
                      恢复默认
                    </Button>
                    <Button
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // 测试Prompt功能
                        console.log('测试Prompt:', activeExpert);
                      }}
                    >
                      <TestTube className="w-4 h-4 mr-2" />
                      测试Prompt
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 配额管理标签页 */}
          <TabsContent value="quotas" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 使用统计 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    使用统计
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>今日使用量</Label>
                      <span className="text-sm text-gray-600">
                        {settings.quotas.currentUsage.daily} / {settings.quotas.dailyLimit}
                      </span>
                    </div>
                    <Progress value={dailyUsagePercent} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">
                      已使用 {dailyUsagePercent.toFixed(1)}%
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>本月使用量</Label>
                      <span className="text-sm text-gray-600">
                        {settings.quotas.currentUsage.monthly} / {settings.quotas.monthlyLimit}
                      </span>
                    </div>
                    <Progress value={monthlyUsagePercent} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">
                      已使用 {monthlyUsagePercent.toFixed(1)}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* 配额设置 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    配额设置
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="dailyLimit">每日请求限制</Label>
                    <Input
                      id="dailyLimit"
                      type="number"
                      value={settings.quotas.dailyLimit}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        quotas: {
                          ...prev.quotas,
                          dailyLimit: parseInt(e.target.value) || 0
                        }
                      }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="monthlyLimit">每月请求限制</Label>
                    <Input
                      id="monthlyLimit"
                      type="number"
                      value={settings.quotas.monthlyLimit}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        quotas: {
                          ...prev.quotas,
                          monthlyLimit: parseInt(e.target.value) || 0
                        }
                      }))}
                      className="mt-1"
                    />
                  </div>

                  {(dailyUsagePercent > 80 || monthlyUsagePercent > 80) && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-yellow-800">
                        使用量接近限制，请注意合理使用
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 mt-8">
          <Button variant="outline" onClick={() => window.location.reload()}>
            重置更改
          </Button>
          <Button 
            onClick={() => setShowSaveDialog(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            保存设置
          </Button>
        </div>
      </div>

      {/* 保存确认对话框 */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认保存设置</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要保存当前的OpenRouter AI配置吗？保存后新设置将立即生效。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={saveSettings}>
              确认保存
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsPage;