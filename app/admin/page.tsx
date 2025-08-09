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
  testing: {
    name: '实时测试',
    icon: TestTube,
    description: '配置测试、生成测试和系统健康检查',
    color: 'bg-orange-500'
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
  const [username, setUsername] = useState('admin');
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

  // 状态更新辅助函数
  const updateState = (updates: Partial<AdminPageState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  /**
   * 检查认证状态
   */
  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/admin/auth/simple-verify');
      const data = await response.json();
      
      if (data.success && data.authenticated) {
        setIsAuthenticated(true);
        // 加载初始数据
        await Promise.all([
          adminConfig.loadConfigs(),
          adminTemplates.loadTemplates()
        ]);
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
      const response = await fetch('/api/admin/auth/simple-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        setMessage('登录成功');
        setMessageType('success');
        await Promise.all([
          adminConfig.loadConfigs(),
          adminTemplates.loadTemplates()
        ]);
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
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setMessage('已安全登出');
      setMessageType('info');
      // 重置状态
      setState({
        isDarkMode: false,
        language: 'zh',
        showPasswordFields: false,
        selectedTemplateId: null,
        editingTemplate: null,
        showTemplateEditor: false
      });
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  /**
   * 显示消息提示
   */
  const showMessage = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000); // 5秒后自动清除
  };

  /**
   * 获取CSRF token（如果存在）
   */
  const getCSRFToken = (): string => {
    // 尝试从meta标签获取
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) return metaTag.getAttribute('content') || '';
    
    // 尝试从响应头获取（需要在登录时保存）
    return localStorage.getItem('admin-csrf-token') || '';
  };

  /**
   * 切换主题模式
   */
  const toggleDarkMode = () => {
    updateState({ isDarkMode: !state.isDarkMode });
    // 存储到localStorage
    localStorage.setItem('admin-dark-mode', (!state.isDarkMode).toString());
  };

  /**
   * 切换语言
   */
  const toggleLanguage = () => {
    const newLang = state.language === 'zh' ? 'en' : 'zh';
    updateState({ language: newLang });
    localStorage.setItem('admin-language', newLang);
  };

  /**
   * 处理模板编辑
   */
  const handleTemplateEdit = (template: PromptTemplate) => {
    updateState({
      editingTemplate: template,
      showTemplateEditor: true,
      selectedTemplateId: template.id
    });
  };

  /**
   * 保存模板
   */
  const handleTemplateSave = async () => {
    if (!state.editingTemplate) return;

    const isNew = !state.editingTemplate.id;
    const success = isNew 
      ? await adminTemplates.createTemplate(state.editingTemplate as any)
      : await adminTemplates.updateTemplate(state.editingTemplate.id!, state.editingTemplate);

    if (success) {
      showMessage(`模板${isNew ? '创建' : '更新'}成功`, 'success');
      updateState({
        editingTemplate: null,
        showTemplateEditor: false,
        selectedTemplateId: null
      });
    } else {
      showMessage(adminTemplates.lastError || '操作失败', 'error');
    }
  };

  // 初始化加载用户偏好
  useEffect(() => {
    const darkMode = localStorage.getItem('admin-dark-mode') === 'true';
    const language = (localStorage.getItem('admin-language') as 'zh' | 'en') || 'zh';
    updateState({ isDarkMode: darkMode, language });
    checkAuthStatus();
  }, []);

  // 监听配置和模板状态变化
  useEffect(() => {
    if (adminConfig.lastError) {
      showMessage(adminConfig.lastError, 'error');
    }
  }, [adminConfig.lastError]);

  useEffect(() => {
    if (adminTemplates.lastError) {
      showMessage(adminTemplates.lastError, 'error');
    }
  }, [adminTemplates.lastError]);

  // 应用主题模式
  useEffect(() => {
    if (state.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.isDarkMode]);

  // 加载中状态
  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        state.isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`text-sm ${
            state.isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            正在加载企业级管理后台...
          </p>
          <div className="mt-4 flex space-x-1 justify-center">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // 登录界面
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        state.isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <Card className={`w-full max-w-md p-8 ${
          state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
        }`}>
          {/* 语言切换按钮 */}
          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className={state.isDarkMode ? 'text-gray-300 hover:text-white' : ''}
            >
              <Globe className="h-4 w-4 mr-1" />
              {state.language === 'zh' ? 'EN' : '中'}
            </Button>
          </div>

          <div className="text-center mb-8">
            <div className="relative">
              <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <Zap className="h-3 w-3 text-white" />
              </div>
            </div>
            <h1 className={`text-2xl font-bold mb-2 ${
              state.isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {isInitialization ? '初始化管理员密码' : 'AI Prompt Generator'}
            </h1>
            <p className={`text-sm ${
              state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {isInitialization 
                ? '首次使用需要设置管理员密码' 
                : '企业级管理后台'
              }
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Label htmlFor="username" className={state.isDarkMode ? 'text-gray-300' : ''}>
                用户名
              </Label>
              <div className="mt-2">
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="输入用户名 (默认: admin)"
                  required
                  className={state.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="password" className={state.isDarkMode ? 'text-gray-300' : ''}>
                {isInitialization ? '设置管理员密码' : '管理员密码'}
              </Label>
              <div className="relative mt-2">
                <Input
                  id="password"
                  type={state.showPasswordFields ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isInitialization ? '请设置一个强密码' : '输入管理员密码'}
                  required
                  className={`pr-10 ${
                    state.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''
                  }`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => updateState({ showPasswordFields: !state.showPasswordFields })}
                >
                  {state.showPasswordFields ? 
                    <EyeOff className="h-4 w-4" /> : 
                    <Eye className="h-4 w-4" />
                  }
                </Button>
              </div>
              {isInitialization && (
                <p className={`text-xs mt-2 ${
                  state.isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  密码需包含大小写字母、数字和特殊字符，至少8位
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  处理中...
                </div>
              ) : (
                isInitialization ? '设置密码并登录' : '进入管理后台'
              )}
            </Button>
          </form>

          {message && (
            <div className={`mt-6 p-4 rounded-lg text-sm flex items-center ${
              messageType === 'error' ? 
                (state.isDarkMode ? 'bg-red-900/50 text-red-300 border border-red-700' : 'bg-red-50 text-red-700 border border-red-200') : 
              messageType === 'success' ? 
                (state.isDarkMode ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-green-50 text-green-700 border border-green-200') : 
                (state.isDarkMode ? 'bg-blue-900/50 text-blue-300 border border-blue-700' : 'bg-blue-50 text-blue-700 border border-blue-200')
            }`}>
              {messageType === 'error' ? <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" /> : 
               messageType === 'success' ? <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" /> : 
               <Activity className="h-4 w-4 mr-2 flex-shrink-0" />}
              <span>{message}</span>
            </div>
          )}

          <div className={`mt-6 text-center text-xs ${
            state.isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            版权所有 © 2024 AI Prompt Generator Pro
          </div>
        </Card>
      </div>
    );
  }

  // 企业级管理界面
  return (
    <div className={`min-h-screen ${
      state.isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* 高级头部导航 */}
      <header className={`shadow-lg border-b-2 border-blue-600 ${
        state.isDarkMode ? 'bg-gray-800 border-b-blue-400' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* 左侧品牌区 */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Settings className="h-10 w-10 text-blue-600" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Activity className="h-2 w-2 text-white" />
                </div>
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${
                  state.isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  企业级管理中心
                </h1>
                <p className={`text-sm flex items-center ${
                  state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <Zap className="h-3 w-3 mr-1" />
                  AI Prompt Generator Pro · 高级配置与管理
                </p>
              </div>
            </div>
            
            {/* 右侧操作区 */}
            <div className="flex items-center space-x-3">
              {/* 系统状态 */}
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${
                state.isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'
              }`}>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">系统正常</span>
              </div>
              
              {/* 未保存提示 */}
              {adminConfig.hasUnsavedChanges && (
                <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${
                  state.isDarkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600'
                }`}>
                  <Clock className="h-3 w-3" />
                  <span className="text-sm font-medium">有未保存变更</span>
                </div>
              )}
              
              {/* 主题切换 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
                className={state.isDarkMode ? 'text-gray-300 hover:text-white' : ''}
                title={`切换至${state.isDarkMode ? '浅色' : '深色'}主题`}
              >
                {state.isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              
              {/* 语言切换 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className={state.isDarkMode ? 'text-gray-300 hover:text-white' : ''}
                title="切换语言"
              >
                <Globe className="h-4 w-4 mr-1" />
                {state.language === 'zh' ? 'EN' : '中'}
              </Button>
              
              {/* 登出按钮 */}
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className={`border-red-200 text-red-600 hover:bg-red-50 ${
                  state.isDarkMode ? 'border-red-700 text-red-400 hover:bg-red-900/20' : ''
                }`}
              >
                <LogOut className="h-4 w-4 mr-2" />
                安全登出
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 全局消息提示 */}
        {message && (
          <div className={`mb-8 p-4 rounded-xl flex items-start space-x-3 shadow-lg border-l-4 ${
            messageType === 'error' ? 
              (state.isDarkMode ? 'bg-red-900/20 text-red-300 border-red-500' : 'bg-red-50 text-red-700 border-red-500') : 
            messageType === 'success' ? 
              (state.isDarkMode ? 'bg-green-900/20 text-green-300 border-green-500' : 'bg-green-50 text-green-700 border-green-500') : 
              (state.isDarkMode ? 'bg-blue-900/20 text-blue-300 border-blue-500' : 'bg-blue-50 text-blue-700 border-blue-500')
          }`}>
            <div className="flex-shrink-0">
              {messageType === 'error' ? <AlertCircle className="h-5 w-5" /> : 
               messageType === 'success' ? <CheckCircle className="h-5 w-5" /> : 
               <Activity className="h-5 w-5" />}
            </div>
            <div className="flex-1">
              <p className="font-medium">{message}</p>
              {messageType === 'success' && (
                <p className="text-xs mt-1 opacity-75">
                  操作已完成，系统已自动更新
                </p>
              )}
            </div>
          </div>
        )}

        {/* 快速操作栏 */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex flex-wrap gap-3">
              {/* 保存按钮 */}
              <Button 
                onClick={adminConfig.saveConfigs} 
                disabled={!adminConfig.hasUnsavedChanges || adminConfig.saving}
                className="bg-blue-600 hover:bg-blue-700 shadow-lg"
                size="lg"
              >
                <Save className="h-4 w-4 mr-2" />
                {adminConfig.saving ? '保存中...' : '保存配置'}
                {adminConfig.hasUnsavedChanges && (
                  <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                    {Object.keys(adminConfig.unsavedChanges).length}
                  </span>
                )}
              </Button>
              
              {/* 测试按钮 */}
              <Button 
                variant="outline" 
                onClick={() => adminConfig.testConfiguration(activeModule)} 
                disabled={adminConfig.testing}
                className={state.isDarkMode ? 'border-gray-600 text-gray-300' : ''}
              >
                <TestTube className="h-4 w-4 mr-2" />
                {adminConfig.testing ? '测试中...' : '测试配置'}
              </Button>
              
              {/* 刷新按钮 */}
              <Button 
                variant="outline" 
                onClick={adminConfig.loadConfigs}
                disabled={adminConfig.loading}
                className={state.isDarkMode ? 'border-gray-600 text-gray-300' : ''}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${
                  adminConfig.loading ? 'animate-spin' : ''
                }`} />
                刷新数据
              </Button>
            </div>
            
            {/* 状态显示 */}
            <div className="flex items-center space-x-4 text-sm">
              {adminConfig.lastUpdate && (
                <span className={state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  最后更新: {adminConfig.lastUpdate.toLocaleTimeString()}
                </span>
              )}
              
              <div className={`flex items-center space-x-2 px-2 py-1 rounded ${
                state.isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <Users className="h-3 w-3" />
                <span>在线管理员: 1</span>
              </div>
            </div>
          </div>
        </div>

        {/* 高级模块导航 */}
        <div className="mb-8">
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`}>
            {Object.entries(ADMIN_MODULES).map(([key, module]) => {
              const Icon = module.icon;
              const isActive = activeModule === key;
              
              return (
                <Card
                  key={key}
                  className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    isActive 
                      ? `ring-2 ring-blue-500 ${module.color.replace('bg-', 'bg-')} bg-opacity-10` 
                      : 'hover:shadow-md'
                  } ${
                    state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
                  }`}
                  onClick={() => setActiveModule(key)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${module.color} bg-opacity-20`}>
                      <Icon className={`h-6 w-6 ${
                        module.color.includes('blue') ? 'text-blue-600' :
                        module.color.includes('green') ? 'text-green-600' :
                        module.color.includes('red') ? 'text-red-600' :
                        'text-purple-600'
                      }`} />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className={`font-semibold text-lg mb-2 ${
                        state.isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {module.name}
                      </h3>
                      <p className={`text-sm leading-relaxed ${
                        state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {module.description}
                      </p>
                      
                      {isActive && (
                        <div className="mt-3 flex items-center text-xs text-blue-600">
                          <Zap className="h-3 w-3 mr-1" />
                          当前活跃模块
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* 主内容区域 */}
        <div className="space-y-8">
          {/* 动态渲染当前模块内容 */}
          {activeModule === 'api' && renderAPIConfigModule()}
          {activeModule === 'templates' && renderTemplatesModule()}
          {activeModule === 'testing' && renderTestingModule()}
          {activeModule === 'security' && renderSecurityModule()}
          {activeModule === 'monitor' && renderMonitorModule()}
        </div>
      </div>
      
      {/* 模板编辑器弹窗 */}
      {state.showTemplateEditor && renderTemplateEditor()}
    </div>
  );

  // ===========================================
  // 模块渲染函数们
  // ===========================================
  
  /**
   * 渲染API配置模块
   */
  function renderAPIConfigModule() {
    return (
      <div className="space-y-6">
        {/* 基本API配置 */}
        <Card className={`p-6 ${
          state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
        }`}>
          <div className="flex items-center space-x-3 mb-6">
            <Key className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className={`text-xl font-bold ${
                state.isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                API配置管理
              </h3>
              <p className={`text-sm ${
                state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                配置 OpenRouter API 密钥、模型选择和调用参数
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* API密钥 */}
            <div className="space-y-3">
              <Label className={`text-sm font-medium ${
                state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                OpenRouter API 密钥 *
              </Label>
              <div className="relative">
                <Input
                  type={state.showPasswordFields ? 'text' : 'password'}
                  value={adminConfig.getConfigValue('api', 'openrouter_api_key')}
                  onChange={(e) => adminConfig.updateConfig('openrouter_api_key', e.target.value)}
                  placeholder="sk-ant-..."
                  className={`pr-10 font-mono ${
                    state.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''
                  }`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => updateState({ showPasswordFields: !state.showPasswordFields })}
                >
                  {state.showPasswordFields ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className={`text-xs ${
                state.isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                在 OpenRouter 控制台获取您的 API 密钥
              </p>
            </div>
            
            {/* 基础URL */}
            <div className="space-y-3">
              <Label className={`text-sm font-medium ${
                state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                API 基础 URL
              </Label>
              <Input
                value={adminConfig.getConfigValue('api', 'openrouter_base_url')}
                onChange={(e) => adminConfig.updateConfig('openrouter_base_url', e.target.value)}
                placeholder="https://openrouter.ai/api/v1"
                className={state.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
              />
            </div>
          </div>
        </Card>
        
        {/* 模型选择 */}
        <Card className={`p-6 ${
          state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
        }`}>
          <div className="flex items-center space-x-3 mb-6">
            <Cpu className="h-6 w-6 text-green-600" />
            <div>
              <h3 className={`text-xl font-bold ${
                state.isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                AI 模型配置
              </h3>
              <p className={`text-sm ${
                state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                选择和配置用于生成提示词的 AI 模型
              </p>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* 默认模型 */}
            <div>
              <Label className={`block text-sm font-medium mb-3 ${
                state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                默认 AI 模型
              </Label>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {AVAILABLE_MODELS.map((model) => {
                  const isSelected = adminConfig.getConfigValue('api', 'default_model') === model.id;
                  return (
                    <div
                      key={model.id}
                      onClick={() => adminConfig.updateConfig('default_model', model.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                      } ${
                        state.isDarkMode ? 'bg-gray-700' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`font-medium ${
                            state.isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {model.name}
                          </h4>
                          <p className={`text-sm mt-1 ${
                            state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {model.provider}
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle className="h-5 w-5 text-blue-600 ml-2" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* 模型参数调节 */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Temperature 滑块 */}
              <div>
                <Slider
                  label="创意性 (Temperature)"
                  value={parseFloat(adminConfig.getConfigValue('api', 'temperature') || '0.7')}
                  onChange={(value) => adminConfig.updateConfig('temperature', value.toString())}
                  min={0}
                  max={2}
                  step={0.1}
                  description="控制 AI 回复的随机性和创意性"
                  className={state.isDarkMode ? 'text-white' : ''}
                />
              </div>
              
              {/* Max Tokens 滑块 */}
              <div>
                <Slider
                  label="最大令牌数 (Max Tokens)"
                  value={parseInt(adminConfig.getConfigValue('api', 'max_tokens') || '2000')}
                  onChange={(value) => adminConfig.updateConfig('max_tokens', Math.floor(value).toString())}
                  min={500}
                  max={4000}
                  step={100}
                  description="限制 AI 生成内容的最大长度"
                  className={state.isDarkMode ? 'text-white' : ''}
                />
              </div>
            </div>
            
            {/* 超时设置 */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className={`block text-sm font-medium mb-2 ${
                  state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  API 超时时间 (毫秒)
                </Label>
                <Input
                  type="number"
                  value={adminConfig.getConfigValue('api', 'api_timeout')}
                  onChange={(e) => adminConfig.updateConfig('api_timeout', e.target.value)}
                  placeholder="30000"
                  min="5000"
                  max="60000"
                  step="1000"
                  className={state.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
              
              <div>
                <Label className={`block text-sm font-medium mb-2 ${
                  state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  缓存过期时间 (分钟)
                </Label>
                <Input
                  type="number"
                  value={adminConfig.getConfigValue('cache', 'cache_ttl')}
                  onChange={(e) => adminConfig.updateConfig('cache_ttl', e.target.value)}
                  placeholder="60"
                  min="1"
                  max="1440"
                  className={state.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  /**
   * 渲染提示词模板模块
   */
  function renderTemplatesModule() {
    return (
      <div className="space-y-6">
        {/* 模板管理头部 */}
        <Card className={`p-6 ${
          state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
        }`}>
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-green-600" />
              <div>
                <h3 className={`text-xl font-bold ${
                  state.isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  提示词模板管理
                </h3>
                <p className={`text-sm ${
                  state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  创建、编辑和管理各行业的专业提示词模板
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={() => updateState({
                  editingTemplate: {
                    name: '',
                    industry: '',
                    scenario: '',
                    template: '',
                    variables: [],
                    active: true,
                    description: ''
                  },
                  showTemplateEditor: true
                })}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                新建模板
              </Button>
              
              <Button
                variant="outline"
                onClick={adminTemplates.loadTemplates}
                disabled={adminTemplates.loading}
                className={state.isDarkMode ? 'border-gray-600 text-gray-300' : ''}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${
                  adminTemplates.loading ? 'animate-spin' : ''
                }`} />
                刷新
              </Button>
            </div>
          </div>
          
          {/* 统计信息 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className={`text-center p-4 rounded-lg ${
              state.isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <div className="text-2xl font-bold text-blue-600">
                {adminTemplates.totalCount}
              </div>
              <div className={`text-sm ${
                state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                总模板数
              </div>
            </div>
            
            <div className={`text-center p-4 rounded-lg ${
              state.isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <div className="text-2xl font-bold text-green-600">
                {adminTemplates.activeCount}
              </div>
              <div className={`text-sm ${
                state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                活跃模板
              </div>
            </div>
            
            <div className={`text-center p-4 rounded-lg ${
              state.isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <div className="text-2xl font-bold text-gray-600">
                {adminTemplates.inactiveCount}
              </div>
              <div className={`text-sm ${
                state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                停用模板
              </div>
            </div>
            
            <div className={`text-center p-4 rounded-lg ${
              state.isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <div className="text-2xl font-bold text-purple-600">
                {adminTemplates.industries.length}
              </div>
              <div className={`text-sm ${
                state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                覆盖行业
              </div>
            </div>
          </div>
        </Card>
        
        {/* 筛选和搜索 */}
        <Card className={`p-4 ${
          state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
        }`}>
          <div className="flex flex-wrap gap-4 items-center">
            {/* 搜索框 */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索模板名称、场景或内容..."
                  value={adminTemplates.searchQuery}
                  onChange={(e) => adminTemplates.setSearchQuery(e.target.value)}
                  className={`pl-10 ${
                    state.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''
                  }`}
                />
              </div>
            </div>
            
            {/* 筛选按钮 */}
            <div className="flex space-x-2">
              <Button
                variant={adminTemplates.activeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => adminTemplates.setActiveFilter('all')}
                className={state.isDarkMode && adminTemplates.activeFilter !== 'all' ? 'border-gray-600 text-gray-300' : ''}
              >
                全部
              </Button>
              <Button
                variant={adminTemplates.activeFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => adminTemplates.setActiveFilter('active')}
                className={state.isDarkMode && adminTemplates.activeFilter !== 'active' ? 'border-gray-600 text-gray-300' : ''}
              >
                活跃
              </Button>
              <Button
                variant={adminTemplates.activeFilter === 'inactive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => adminTemplates.setActiveFilter('inactive')}
                className={state.isDarkMode && adminTemplates.activeFilter !== 'inactive' ? 'border-gray-600 text-gray-300' : ''}
              >
                停用
              </Button>
            </div>
          </div>
        </Card>
        
        {/* 模板列表 */}
        <div className="grid gap-4">
          {adminTemplates.filteredTemplates.map((template) => (
            <Card key={template.id} className={`p-6 hover:shadow-lg transition-shadow ${
              state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
            }`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h4 className={`text-lg font-semibold ${
                      state.isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {template.name}
                    </h4>
                    
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      template.active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {template.active ? '活跃' : '停用'}
                    </span>
                    
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-medium">
                      {INDUSTRIES.find(i => i.id === template.industry)?.name || template.industry}
                    </span>
                  </div>
                  
                  <p className={`text-sm mb-2 ${
                    state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    场景：{template.scenario}
                  </p>
                  
                  {template.description && (
                    <p className={`text-sm mb-3 ${
                      state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {template.description}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>使用次数: {template.usage_count}</span>
                    <span>创建时间: {new Date(template.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTemplateEdit(template)}
                    className={state.isDarkMode ? 'border-gray-600 text-gray-300' : ''}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('确定要删除这个模板吗？此操作不可撤销。')) {
                        adminTemplates.deleteTemplate(template.id);
                      }
                    }}
                    className={`border-red-200 text-red-600 hover:bg-red-50 ${
                      state.isDarkMode ? 'border-red-700 text-red-400 hover:bg-red-900/20' : ''
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          
          {adminTemplates.filteredTemplates.length === 0 && (
            <div className={`text-center py-12 ${
              state.isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>没有找到匹配的模板</p>
              <p className="text-sm">试试调整搜索条件或创建新模板</p>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  /**
   * 渲染安全配置模块
   */
  function renderSecurityModule() {
    return (
      <div className="space-y-6">
        <Card className={`p-6 ${
          state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
        }`}>
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="h-6 w-6 text-red-600" />
            <div>
              <h3 className={`text-xl font-bold ${
                state.isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                安全配置与监控
              </h3>
              <p className={`text-sm ${
                state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                管理员认证、访问控制和安全日志
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* 密码更改 */}
            <div className="space-y-4">
              <h4 className={`text-lg font-semibold ${
                state.isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                更改管理员密码
              </h4>
              
              <div className="space-y-3">
                <Input
                  type="password"
                  placeholder="当前密码"
                  className={state.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
                <Input
                  type="password"
                  placeholder="新密码"
                  className={state.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
                <Input
                  type="password"
                  placeholder="确认新密码"
                  className={state.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                />
                <Button className="w-full">
                  更新密码
                </Button>
              </div>
            </div>
            
            {/* 登录日志 */}
            <div className="space-y-4">
              <h4 className={`text-lg font-semibold ${
                state.isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                最近登录记录
              </h4>
              
              <div className={`space-y-2 max-h-64 overflow-y-auto ${
                state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <div className="text-sm p-3 rounded bg-gray-50 dark:bg-gray-700">
                  <div className="font-medium">登录成功</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date().toLocaleString()} · IP: 127.0.0.1
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  /**
   * 渲染实时测试模块
   */
  function renderTestingModule() {
    // 测试状态管理
    const [testingState, setTestingState] = useState({
      configTesting: false,
      generateTesting: false,
      healthChecking: false,
      batchTesting: false,
      selectedModels: [] as string[],
      selectedScenarios: [] as string[],
      testResults: null as any,
      healthStatus: null as any
    });

    const [activeTab, setActiveTab] = useState('config');

    return (
      <div className="space-y-6">
        {/* 测试模块头部 */}
        <Card className={`p-6 ${
          state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
        }`}>
          <div className="flex items-center space-x-3 mb-6">
            <TestTube className="h-6 w-6 text-orange-600" />
            <div>
              <h3 className={`text-xl font-bold ${
                state.isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                实时测试中心
              </h3>
              <p className={`text-sm ${
                state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                配置验证、生成测试和系统健康监控
              </p>
            </div>
          </div>

          {/* 测试标签页 */}
          <div className="flex space-x-1 mb-6">
            {[
              { key: 'config', label: '配置测试', icon: Key },
              { key: 'generate', label: '生成测试', icon: Zap },
              { key: 'health', label: '健康检查', icon: Activity },
              { key: 'scenarios', label: '测试场景', icon: FileText }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? 'default' : 'outline'}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center space-x-2 ${
                    activeTab !== tab.key && state.isDarkMode ? 'border-gray-600 text-gray-300' : ''
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </Button>
              );
            })}
          </div>

          {/* 配置测试面板 */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <h4 className={`text-lg font-semibold ${
                state.isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                配置验证测试
              </h4>
              
              <div className="grid md:grid-cols-2 gap-4">
                {/* API密钥测试 */}
                <Card className={`p-4 ${
                  state.isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Key className="h-5 w-5 text-blue-600" />
                      <span className={`font-medium ${
                        state.isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        API密钥验证
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={async () => {
                        setTestingState(prev => ({ ...prev, configTesting: true }));
                        try {
                          const response = await fetch('/api/admin/test/config', {
                            method: 'POST',
                            headers: { 
                              'Content-Type': 'application/json',
                              // 添加CSRF token如果需要
                              ...(document.cookie.includes('admin-session') ? {
                                'x-admin-csrf-token': getCSRFToken()
                              } : {})
                            },
                            body: JSON.stringify({ testType: 'api_key' })
                          });
                          
                          if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                          }
                          
                          const result = await response.json();
                          setTestingState(prev => ({ 
                            ...prev, 
                            configTesting: false,
                            testResults: { apiKey: result }
                          }));
                          
                          showMessage(
                            result.success 
                              ? `API密钥验证通过 (${result.details?.apiType || 'Unknown API'})` 
                              : result.error || '验证失败',
                            result.success ? 'success' : 'error'
                          );
                        } catch (error: any) {
                          console.error('API密钥测试失败:', error);
                          setTestingState(prev => ({ ...prev, configTesting: false }));
                          showMessage(
                            `API密钥测试失败: ${error.message || '网络错误'}`, 
                            'error'
                          );
                        }
                      }}
                      disabled={testingState.configTesting}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {testingState.configTesting ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <TestTube className="h-4 w-4" />
                      )}
                      <span className="ml-1">测试</span>
                    </Button>
                  </div>
                  <p className={`text-sm ${
                    state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    验证OpenRouter API密钥的有效性
                  </p>
                  {testingState.testResults?.apiKey && (
                    <div className={`mt-3 p-3 rounded-lg text-sm ${
                      testingState.testResults.apiKey.success 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      <div className="flex items-center space-x-2 mb-2">
                        {testingState.testResults.apiKey.success ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        <span className="font-medium">
                          {testingState.testResults.apiKey.message}
                        </span>
                      </div>
                      {testingState.testResults.apiKey.details && (
                        <div className="text-xs space-y-1">
                          <div>API类型: {testingState.testResults.apiKey.details.apiType || '未知'}</div>
                          <div>响应时间: {testingState.testResults.apiKey.responseTime}ms</div>
                          {testingState.testResults.apiKey.details.modelsAvailable && (
                            <div>可用模型: {testingState.testResults.apiKey.details.modelsAvailable}</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </Card>

                {/* 模型连接测试 */}
                <Card className={`p-4 ${
                  state.isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Cpu className="h-5 w-5 text-green-600" />
                      <span className={`font-medium ${
                        state.isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        模型连接测试
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={async () => {
                        setTestingState(prev => ({ ...prev, generateTesting: true }));
                        try {
                          const response = await fetch('/api/admin/test/config', {
                            method: 'POST',
                            headers: { 
                              'Content-Type': 'application/json',
                              ...(document.cookie.includes('admin-session') ? {
                                'x-admin-csrf-token': getCSRFToken()
                              } : {})
                            },
                            body: JSON.stringify({ testType: 'model_connection' })
                          });
                          
                          if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                          }
                          
                          const result = await response.json();
                          setTestingState(prev => ({ 
                            ...prev, 
                            generateTesting: false,
                            testResults: { ...prev.testResults, modelConnection: result }
                          }));
                          
                          showMessage(
                            result.success 
                              ? `模型连接正常 (${result.details?.modelName || '未知模型'})` 
                              : result.error || '连接失败',
                            result.success ? 'success' : 'error'
                          );
                        } catch (error: any) {
                          console.error('模型连接测试失败:', error);
                          setTestingState(prev => ({ ...prev, generateTesting: false }));
                          showMessage(
                            `模型连接测试失败: ${error.message || '网络错误'}`, 
                            'error'
                          );
                        }
                      }}
                      disabled={testingState.generateTesting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {testingState.generateTesting ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <TestTube className="h-4 w-4" />
                      )}
                      <span className="ml-1">测试</span>
                    </Button>
                  </div>
                  <p className={`text-sm ${
                    state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    测试AI模型的连接和响应
                  </p>
                  {testingState.testResults?.modelConnection && (
                    <div className={`mt-3 p-3 rounded-lg text-sm ${
                      testingState.testResults.modelConnection.success 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      <div className="flex items-center space-x-2 mb-2">
                        {testingState.testResults.modelConnection.success ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        <span className="font-medium">
                          {testingState.testResults.modelConnection.message}
                        </span>
                      </div>
                      {testingState.testResults.modelConnection.details && (
                        <div className="text-xs space-y-1">
                          <div>模型: {testingState.testResults.modelConnection.details.modelName || '未知'}</div>
                          <div>提供商: {testingState.testResults.modelConnection.details.provider || '未知'}</div>
                          <div>响应时间: {testingState.testResults.modelConnection.responseTime}ms</div>
                          {testingState.testResults.modelConnection.details.responsePreview && (
                            <div>响应预览: {testingState.testResults.modelConnection.details.responsePreview}</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </div>

              {/* 一键全面测试 */}
              <div className="flex justify-center pt-4">
                <Button
                  size="lg"
                  onClick={async () => {
                    setTestingState(prev => ({ ...prev, configTesting: true }));
                    try {
                      const response = await fetch('/api/admin/test/config', {
                        method: 'POST',
                        headers: { 
                          'Content-Type': 'application/json',
                          ...(document.cookie.includes('admin-session') ? {
                            'x-admin-csrf-token': '' // 这里需要实际的CSRF token
                          } : {})
                        },
                        body: JSON.stringify({ testType: 'all' })
                      });
                      
                      if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                      }
                      
                      const result = await response.json();
                      setTestingState(prev => ({ 
                        ...prev, 
                        configTesting: false,
                        testResults: { comprehensive: result }
                      }));
                      
                      const successRate = result.summary?.successRate || '0%';
                      const message = result.success 
                        ? `全面测试完成: 成功率 ${successRate}` 
                        : `测试完成但有错误: 成功率 ${successRate}`;
                      
                      showMessage(message, result.success ? 'success' : 'error');
                    } catch (error: any) {
                      console.error('全面测试失败:', error);
                      setTestingState(prev => ({ ...prev, configTesting: false }));
                      showMessage(
                        `全面测试失败: ${error.message || '网络错误'}`, 
                        'error'
                      );
                    }
                  }}
                  disabled={testingState.configTesting}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {testingState.configTesting ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  一键全面测试
                </Button>
              </div>
            </div>
          )}

          {/* 生成测试面板 */}
          {activeTab === 'generate' && (
            <div className="space-y-4">
              <h4 className={`text-lg font-semibold ${
                state.isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                实时生成测试
              </h4>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className={`text-sm font-medium ${
                      state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      行业选择
                    </Label>
                    <select className={`w-full mt-2 p-2 border rounded-md ${
                      state.isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                    }`}>
                      <option value="lawyer">⚖️ 法律行业</option>
                      <option value="realtor">🏠 房地产</option>
                      <option value="insurance">🛡️ 保险顾问</option>
                      <option value="teacher">📚 教育行业</option>
                      <option value="accountant">💼 会计财务</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label className={`text-sm font-medium ${
                      state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      测试场景
                    </Label>
                    <Input
                      placeholder="如：合同审查、市场分析"
                      className={state.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                    />
                  </div>

                  <div>
                    <Label className={`text-sm font-medium ${
                      state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      测试目标
                    </Label>
                    <Textarea
                      placeholder="描述你想要测试的具体目标..."
                      rows={3}
                      className={state.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                    />
                  </div>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={testingState.generateTesting}
                  >
                    {testingState.generateTesting ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2" />
                    )}
                    开始生成测试
                  </Button>
                </div>

                <div>
                  <Label className={`text-sm font-medium mb-3 block ${
                    state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    生成结果预览
                  </Label>
                  <div className={`h-96 p-4 border rounded-lg overflow-y-auto ${
                    state.isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-300'
                  }`}>
                    <div className="text-center text-gray-400 py-8">
                      点击"开始生成测试"查看结果
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 健康检查面板 */}
          {activeTab === 'health' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className={`text-lg font-semibold ${
                  state.isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  系统健康检查
                </h4>
                
                <Button
                  onClick={async () => {
                    setTestingState(prev => ({ ...prev, healthChecking: true }));
                    try {
                      const response = await fetch('/api/admin/test/health?level=standard');
                      const result = await response.json();
                      setTestingState(prev => ({ 
                        ...prev, 
                        healthChecking: false,
                        healthStatus: result
                      }));
                    } catch (error) {
                      setTestingState(prev => ({ ...prev, healthChecking: false }));
                      showMessage('健康检查失败', 'error');
                    }
                  }}
                  disabled={testingState.healthChecking}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {testingState.healthChecking ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Activity className="h-4 w-4 mr-2" />
                  )}
                  执行健康检查
                </Button>
              </div>

              {testingState.healthStatus && (
                <div className="grid md:grid-cols-2 gap-4">
                  {testingState.healthStatus.results?.map((result: any, index: number) => (
                    <Card key={index} className={`p-4 ${
                      state.isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium ${
                          state.isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {result.component.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          result.status === 'healthy' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : result.status === 'degraded'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {result.status}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {result.message}
                      </p>
                      <p className={`text-xs mt-2 ${
                        state.isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        响应时间: {result.responseTime}ms
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 测试场景面板 */}
          {activeTab === 'scenarios' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className={`text-lg font-semibold ${
                  state.isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  测试场景管理
                </h4>
                
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  新建场景
                </Button>
              </div>

              <div className={`p-4 border-2 border-dashed text-center ${
                state.isDarkMode ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'
              }`}>
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>测试场景功能开发中...</p>
                <p className="text-sm mt-1">将支持自定义测试用例的创建和管理</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  /**
   * 渲染系统监控模块
   */
  function renderMonitorModule() {
    return (
      <div className="space-y-6">
        <Card className={`p-6 ${
          state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
        }`}>
          <div className="flex items-center space-x-3 mb-6">
            <BarChart3 className="h-6 w-6 text-purple-600" />
            <div>
              <h3 className={`text-xl font-bold ${
                state.isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                系统监控与统计
              </h3>
              <p className={`text-sm ${
                state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                API 调用统计、性能监控和系统状态
              </p>
            </div>
          </div>
          
          {/* 核心指标 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className={`text-center p-6 rounded-xl ${
              state.isDarkMode ? 'bg-gray-700' : 'bg-gradient-to-br from-blue-50 to-blue-100'
            }`}>
              <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-blue-600 mb-1">1,234</div>
              <div className={`text-sm ${
                state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                今日API调用
              </div>
            </div>
            
            <div className={`text-center p-6 rounded-xl ${
              state.isDarkMode ? 'bg-gray-700' : 'bg-gradient-to-br from-green-50 to-green-100'
            }`}>
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-green-600 mb-1">99.5%</div>
              <div className={`text-sm ${
                state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                成功率
              </div>
            </div>
            
            <div className={`text-center p-6 rounded-xl ${
              state.isDarkMode ? 'bg-gray-700' : 'bg-gradient-to-br from-yellow-50 to-yellow-100'
            }`}>
              <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-yellow-600 mb-1">1.2s</div>
              <div className={`text-sm ${
                state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                平均响应时间
              </div>
            </div>
            
            <div className={`text-center p-6 rounded-xl ${
              state.isDarkMode ? 'bg-gray-700' : 'bg-gradient-to-br from-purple-50 to-purple-100'
            }`}>
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-purple-600 mb-1">89</div>
              <div className={`text-sm ${
                state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                活跃用户
              </div>
            </div>
          </div>
          
          {/* 占位图表区域 */}
          <div className={`p-8 rounded-lg border-2 border-dashed text-center ${
            state.isDarkMode ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'
          }`}>
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h4 className="text-lg font-medium mb-2">统计图表模块</h4>
            <p className="text-sm">
              这里将显示 API 调用趋势、性能指标和用户活跃度等图表
            </p>
            <p className="text-xs mt-2 opacity-75">
              可集成 Chart.js 或 Recharts 等图表库实现
            </p>
          </div>
        </Card>
      </div>
    );
  }
  
  /**
   * 渲染模板编辑器弹窗
   */
  function renderTemplateEditor() {
    if (!state.editingTemplate) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className={`w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl ${
          state.isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          {/* 编辑器头部 */}
          <div className={`p-6 border-b flex justify-between items-center ${
            state.isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center space-x-3">
              <Edit className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className={`text-xl font-bold ${
                  state.isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {state.editingTemplate.id ? '编辑模板' : '新建模板'}
                </h2>
                <p className={`text-sm ${
                  state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  创建或修改提示词模板内容
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={handleTemplateSave}
                disabled={adminTemplates.saving}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {adminTemplates.saving ? '保存中...' : '保存模板'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => updateState({
                  editingTemplate: null,
                  showTemplateEditor: false
                })}
                className={state.isDarkMode ? 'border-gray-600 text-gray-300' : ''}
              >
                取消
              </Button>
            </div>
          </div>
          
          {/* 编辑器内容 */}
          <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {/* 基本信息 */}
              <div className="space-y-4">
                <h3 className={`text-lg font-semibold ${
                  state.isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  基本信息
                </h3>
                
                <div>
                  <Label className={`text-sm font-medium ${
                    state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    模板名称 *
                  </Label>
                  <Input
                    value={state.editingTemplate.name || ''}
                    onChange={(e) => updateState({
                      editingTemplate: {
                        ...state.editingTemplate!,
                        name: e.target.value
                      }
                    })}
                    placeholder="请输入模板名称"
                    className={state.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                  />
                </div>
                
                <div>
                  <Label className={`text-sm font-medium ${
                    state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    所属行业 *
                  </Label>
                  <select
                    value={state.editingTemplate.industry || ''}
                    onChange={(e) => updateState({
                      editingTemplate: {
                        ...state.editingTemplate!,
                        industry: e.target.value
                      }
                    })}
                    className={`w-full p-2 border rounded-md ${
                      state.isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="">选择行业</option>
                    {INDUSTRIES.map(industry => (
                      <option key={industry.id} value={industry.id}>
                        {industry.icon} {industry.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label className={`text-sm font-medium ${
                    state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    使用场景 *
                  </Label>
                  <Input
                    value={state.editingTemplate.scenario || ''}
                    onChange={(e) => updateState({
                      editingTemplate: {
                        ...state.editingTemplate!,
                        scenario: e.target.value
                      }
                    })}
                    placeholder="如：合同审查、案例分析"
                    className={state.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                  />
                </div>
                
                <div>
                  <Label className={`text-sm font-medium ${
                    state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    模板描述
                  </Label>
                  <Textarea
                    value={state.editingTemplate.description || ''}
                    onChange={(e) => updateState({
                      editingTemplate: {
                        ...state.editingTemplate!,
                        description: e.target.value
                      }
                    })}
                    placeholder="简要描述这个模板的用途..."
                    rows={3}
                    className={state.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={state.editingTemplate.active}
                    onChange={(e) => updateState({
                      editingTemplate: {
                        ...state.editingTemplate!,
                        active: e.target.checked
                      }
                    })}
                    className="rounded"
                  />
                  <Label htmlFor="active" className={`text-sm ${
                    state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    立即激活这个模板
                  </Label>
                </div>
              </div>
              
              {/* 模板内容编辑器 */}
              <div className="md:col-span-2">
                <h3 className={`text-lg font-semibold mb-4 ${
                  state.isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  模板内容编辑
                </h3>
                
                <CodeEditor
                  value={state.editingTemplate.template || ''}
                  onChange={(value) => updateState({
                    editingTemplate: {
                      ...state.editingTemplate!,
                      template: value
                    }
                  })}
                  placeholder="请输入提示词模板内容...

示例：
作为一名专业的{industry}，请帮助我{task}。

具体要求：
1. {requirement1}
2. {requirement2}

请提供详细的分析和建议。"
                  language="text"
                  height={400}
                  showPreview
                  onSave={handleTemplateSave}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}