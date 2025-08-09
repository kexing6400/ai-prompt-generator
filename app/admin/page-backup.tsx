/**
 * 企业级管理后台
 * 提供完整的系统配置、模版管理和监控功能
 * 作者：Claude Code (前端架构师)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { CodeEditor } from '@/components/ui/code-editor';
import { useAdminConfig } from '@/lib/hooks/use-admin-config';
import { useAdminTemplates, PromptTemplate } from '@/lib/hooks/use-admin-templates';
import { 
  Settings, 
  Key, 
  Database, 
  Cpu, 
  Shield, 
  Activity,
  Save,
  TestTube,
  RefreshCw,
  LogOut,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  FileText,
  BarChart3,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Moon,
  Sun,
  Globe,
  Zap,
  Monitor,
  Users,
  TrendingUp,
  Clock
} from 'lucide-react';

// 管理后台模块定义
const ADMIN_MODULES = {
  api: {
    name: 'API配置管理',
    icon: Key,
    description: 'OpenRouter API密钥、模型选择和参数配置',
    color: 'bg-blue-500'
  },
  templates: {
    name: '提示词模板',
    icon: FileText,
    description: '行业提示词模板的创建、编辑和管理',
    color: 'bg-green-500'
  },
  security: {
    name: '安全配置',
    icon: Shield,
    description: '认证设置、访问控制和安全监控',
    color: 'bg-red-500'
  },
  monitor: {
    name: '系统监控',
    icon: BarChart3,
    description: 'API调用统计、性能监控和系统状态',
    color: 'bg-purple-500'
  }
};

// 可用的AI模型列表
const AVAILABLE_MODELS = [
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic' },
  { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
  { id: 'google/gemini-pro', name: 'Gemini Pro', provider: 'Google' },
  { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' }
];

// 行业类型定义
const INDUSTRIES = [
  { id: 'lawyer', name: '法律行业', icon: '⚖️' },
  { id: 'realtor', name: '房地产', icon: '🏠' },
  { id: 'insurance', name: '保险顾问', icon: '🛡️' },
  { id: 'teacher', name: '教育行业', icon: '📚' },
  { id: 'accountant', name: '会计财务', icon: '💼' }
];

// 组件状态类型定义
interface AdminPageState {
  isDarkMode: boolean;
  language: 'zh' | 'en';
  showPasswordFields: boolean;
  selectedTemplateId: string | null;
  editingTemplate: Partial<PromptTemplate> | null;
  showTemplateEditor: boolean;
}

export default function AdminPage() {
  // 认证状态
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [isInitialization, setIsInitialization] = useState(false);
  
  // 页面状态
  const [state, setState] = useState<AdminPageState>({
    isDarkMode: false,
    language: 'zh',
    showPasswordFields: false,
    selectedTemplateId: null,
    editingTemplate: null,
    showTemplateEditor: false
  });
  
  // 当前活跃模块
  const [activeModule, setActiveModule] = useState('api');
  
  // UI状态
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  
  // 使用自定义hooks
  const adminConfig = useAdminConfig();
  const adminTemplates = useAdminTemplates();

  /**
   * 检查认证状态
   */
  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/admin/auth');
      const data = await response.json();
      
      if (data.success && data.authenticated) {
        setIsAuthenticated(true);
        await loadConfigs();
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('检查认证状态失败:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 登录处理
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        setMessage('登录成功');
        setMessageType('success');
        await loadConfigs();
      } else {
        setMessage(data.error || '登录失败');
        setMessageType('error');
        
        if (data.isInitialization) {
          setIsInitialization(true);
        }
      }
    } catch (error) {
      setMessage('连接服务器失败');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 登出处理
   */
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
      setIsAuthenticated(false);
      setConfigs({});
      setUnsavedChanges({});
      setMessage('已安全登出');
      setMessageType('info');
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  /**
   * 加载配置
   */
  const loadConfigs = async () => {
    try {
      const response = await fetch('/api/admin/config');
      const data = await response.json();

      if (data.success) {
        setConfigs(data.configs);
      } else {
        setMessage('加载配置失败');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('加载配置失败');
      setMessageType('error');
    }
  };

  /**
   * 处理配置变更
   */
  const handleConfigChange = (key: string, value: string) => {
    setUnsavedChanges(prev => ({
      ...prev,
      [key]: value
    }));
  };

  /**
   * 保存配置
   */
  const saveConfigs = async () => {
    if (Object.keys(unsavedChanges).length === 0) {
      setMessage('没有需要保存的变更');
      setMessageType('info');
      return;
    }

    setIsLoading(true);

    try {
      const configsToUpdate = Object.entries(unsavedChanges).map(([key, value]) => ({
        key,
        value,
        encrypted: key.includes('key') || key.includes('secret') || key.includes('password')
      }));

      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('x-admin-csrf-token='))
        ?.split('=')[1];

      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-CSRF-Token': csrfToken || ''
        },
        body: JSON.stringify({ configs: configsToUpdate }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`成功保存 ${data.updatedCount} 个配置`);
        setMessageType('success');
        setUnsavedChanges({});
        await loadConfigs();
      } else {
        setMessage(data.error || '保存失败');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('保存配置失败');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 测试配置
   */
  const testConfiguration = async (type: string) => {
    setIsTestingConfig(true);

    try {
      const testConfig = {
        ...configs[type],
        ...unsavedChanges
      };

      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          config: testConfig
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`${type.toUpperCase()}配置测试成功`);
        setMessageType('success');
      } else {
        setMessage(`${type.toUpperCase()}配置测试失败: ${data.error}`);
        setMessageType('error');
      }
    } catch (error) {
      setMessage('测试配置时发生错误');
      setMessageType('error');
    } finally {
      setIsTestingConfig(false);
    }
  };

  /**
   * 获取配置值（包括未保存的变更）
   */
  const getConfigValue = (category: string, key: string): string => {
    if (unsavedChanges[key] !== undefined) {
      return unsavedChanges[key];
    }
    return configs[category]?.[key] || '';
  };

  // 初始化
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // 加载中状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载管理后台...</p>
        </div>
      </div>
    );
  }

  // 登录界面
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6">
          <div className="text-center mb-6">
            <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">
              {isInitialization ? '初始化管理员密码' : '管理员登录'}
            </h1>
            {isInitialization && (
              <p className="text-sm text-gray-600 mt-2">
                首次使用需要设置管理员密码
              </p>
            )}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="password">
                {isInitialization ? '设置管理员密码' : '管理员密码'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isInitialization ? '请设置一个强密码' : '输入管理员密码'}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {isInitialization && (
                <p className="text-xs text-gray-500 mt-1">
                  密码需包含大小写字母、数字和特殊字符，至少8位
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '处理中...' : (isInitialization ? '设置密码并登录' : '登录')}
            </Button>
          </form>

          {message && (
            <div className={`mt-4 p-3 rounded-md text-sm ${
              messageType === 'error' ? 'bg-red-50 text-red-700' : 
              messageType === 'success' ? 'bg-green-50 text-green-700' : 
              'bg-blue-50 text-blue-700'
            }`}>
              {message}
            </div>
          )}
        </Card>
      </div>
    );
  }

  // 主管理界面
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Settings className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">管理后台</h1>
                <p className="text-sm text-gray-600">AI Prompt Generator 配置中心</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-600">系统正常</span>
              </div>
              
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                登出
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 消息提示 */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
            messageType === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 
            messageType === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
            'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {messageType === 'error' ? <AlertCircle className="h-5 w-5" /> : 
             messageType === 'success' ? <CheckCircle className="h-5 w-5" /> : 
             <Activity className="h-5 w-5" />}
            <span>{message}</span>
          </div>
        )}

        {/* 操作栏 */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex space-x-2">
            <Button 
              onClick={saveConfigs} 
              disabled={Object.keys(unsavedChanges).length === 0 || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              保存配置 {Object.keys(unsavedChanges).length > 0 && `(${Object.keys(unsavedChanges).length})`}
            </Button>
            
            <Button variant="outline" onClick={() => testConfiguration(activeTab)} disabled={isTestingConfig}>
              <TestTube className="h-4 w-4 mr-2" />
              {isTestingConfig ? '测试中...' : '测试配置'}
            </Button>
            
            <Button variant="outline" onClick={loadConfigs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
          </div>
        </div>

        {/* 配置分类标签页 */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {Object.entries(CONFIG_CATEGORIES).map(([key, category]) => {
                const Icon = category.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{category.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 配置内容 */}
        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {CONFIG_CATEGORIES[activeTab]?.name}
            </h2>
            <p className="text-sm text-gray-600">
              {CONFIG_CATEGORIES[activeTab]?.description}
            </p>
          </div>

          <div className="grid gap-6">
            {configs[activeTab] && Object.entries(configs[activeTab]).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className="text-sm font-medium text-gray-700">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Label>
                
                {key.includes('password') || key.includes('secret') || key.includes('key') ? (
                  <div className="relative">
                    <Input
                      id={key}
                      type={showPassword ? 'text' : 'password'}
                      value={getConfigValue(activeTab, key)}
                      onChange={(e) => handleConfigChange(key, e.target.value)}
                      placeholder="请输入安全配置..."
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                ) : key.includes('url') || value.length > 50 ? (
                  <Textarea
                    id={key}
                    value={getConfigValue(activeTab, key)}
                    onChange={(e) => handleConfigChange(key, e.target.value)}
                    placeholder="请输入配置值..."
                    rows={3}
                  />
                ) : (
                  <Input
                    id={key}
                    type="text"
                    value={getConfigValue(activeTab, key)}
                    onChange={(e) => handleConfigChange(key, e.target.value)}
                    placeholder="请输入配置值..."
                  />
                )}
                
                {unsavedChanges[key] !== undefined && (
                  <p className="text-xs text-amber-600">● 未保存的变更</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}