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
import { useAdminModels } from '@/lib/hooks/use-admin-models';
import { useAdminRoles } from '@/lib/hooks/use-admin-roles';
import { useAdminDocuments } from '@/lib/hooks/use-admin-documents';
import { PROFESSIONAL_ROLES, INDUSTRIES as PROFESSIONAL_INDUSTRIES, getRoleById, getRolesByIndustry } from '@/lib/config/professional-roles';
import { AVAILABLE_MODELS } from '@/types/professional';
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
  Clock,
  Layers,
  UserCheck,
  FileStack,
  Star,
  Tag,
  Copy,
  ExternalLink,
  Workflow,
  Target,
  Brain,
  Palette,
  MessageCircle,
  ArrowRight
} from 'lucide-react';

// 管理后台模块定义
const ADMIN_MODULES = {
  api: {
    name: 'API配置管理',
    icon: Key,
    description: 'OpenRouter API密钥、模型选择和参数配置',
    color: 'bg-blue-500'
  },
  models: {
    name: '模型管理中心',
    icon: Layers,
    description: '318个OpenRouter模型的分类视图和管理',
    color: 'bg-indigo-500'
  },
  roles: {
    name: '专业角色管理',
    icon: UserCheck,
    description: '42个细分专业AI角色的配置和管理',
    color: 'bg-cyan-500'
  },
  templates: {
    name: '提示词模板',
    icon: FileText,
    description: '行业提示词模板的创建、编辑和管理',
    color: 'bg-green-500'
  },
  documents: {
    name: '文档模板库',
    icon: FileStack,
    description: '各行业文档生成模板的管理和使用',
    color: 'bg-amber-500'
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

// 模型分类标签
const MODEL_CATEGORIES = {
  free: { label: '💰 免费模型', color: 'text-green-600' },
  costEffective: { label: '🏆 性价比之王', color: 'text-blue-600' },
  premium: { label: '💎 顶级效果', color: 'text-purple-600' },
  latest: { label: '🚀 最新模型', color: 'text-orange-600' },
  fastest: { label: '⚡ 最快响应', color: 'text-yellow-600' },
  longContext: { label: '📄 长文档处理', color: 'text-indigo-600' }
};

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
  const [username, setUsername] = useState('');
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
  
  // 测试状态管理 - 移到主组件顶层
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
  
  // 使用自定义hooks
  const adminConfig = useAdminConfig();
  const adminTemplates = useAdminTemplates();
  const adminModels = useAdminModels();
  const adminRoles = useAdminRoles();
  const adminDocuments = useAdminDocuments();

  // 状态更新辅助函数
  const updateState = (updates: Partial<AdminPageState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // 获取角色系统提示词 - 使用新的专业角色配置系统
  const getRoleSystemPrompt = (roleId: string): string => {
    const role = getRoleById(roleId);
    return role?.systemPrompt || '你是一位专业的AI助手，请提供准确、有用的建议。';
  };

  // 获取角色默认模型 - 使用新的专业角色配置系统
  const getRoleModel = (roleId: string): string => {
    const role = getRoleById(roleId);
    return role?.recommendedModel || 'openai/gpt-3.5-turbo';
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
          adminTemplates.loadTemplates(),
          adminModels.loadModels(),
          adminRoles.loadRoles(),
          adminDocuments.loadTemplates()
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
          adminTemplates.loadTemplates(),
          adminModels.loadModels(),
          adminRoles.loadRoles(),
          adminDocuments.loadTemplates()
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
            版权所有 © 2025 AI Prompt Generator
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
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`}>
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
          {activeModule === 'models' && renderModelsModule()}
          {activeModule === 'roles' && renderRolesModule()}
          {activeModule === 'templates' && renderTemplatesModule()}
          {activeModule === 'documents' && renderDocumentsModule()}
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
            {/* 默认模型 - 318个OpenRouter模型选择 */}
            <div>
              <Label className={`block text-sm font-medium mb-3 ${
                state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                选择 AI 模型（从318个OpenRouter模型中选择）
              </Label>
              
              {/* 模型加载状态 */}
              {adminModels.loading ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                  <span className={state.isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    正在加载318个AI模型...
                  </span>
                </div>
              ) : (adminModels as any).error ? (
                <div className="text-red-500 p-4 border border-red-300 rounded-lg">
                  加载模型失败: {(adminModels as any).error}
                  <Button 
                    onClick={() => adminModels.loadModels()} 
                    className="ml-4"
                    size="sm"
                  >
                    重试
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 当前选中的模型信息 */}
                  {adminConfig.getConfigValue('api', 'default_model') && (
                    <div className={`p-4 rounded-lg border ${
                      state.isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-medium ${
                            state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            当前选中模型：
                          </p>
                          <p className={`text-lg font-bold ${
                            state.isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {adminConfig.getConfigValue('api', 'default_model_name') || adminConfig.getConfigValue('api', 'default_model')}
                          </p>
                          <p className={`text-sm ${
                            state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {adminConfig.getConfigValue('api', 'default_model_pricing') || '价格信息加载中...'}
                          </p>
                        </div>
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  )}
                  
                  {/* 分类下拉选择器 */}
                  <div>
                    <select
                      value={adminConfig.getConfigValue('api', 'default_model') || ''}
                      onChange={(e) => {
                        const modelId = e.target.value;
                        adminConfig.updateConfig('default_model', modelId);
                        
                        // 查找模型详细信息
                        const allModels = adminModels.categories ? Object.values(adminModels.categories).flat() : [];
                        const selectedModel = allModels.find(m => m.id === modelId);
                        if (selectedModel) {
                          adminConfig.updateConfig('default_model_name', selectedModel.name || modelId);
                          const promptPrice = parseFloat(selectedModel.pricing?.prompt || '0');
                          const completionPrice = parseFloat(selectedModel.pricing?.completion || '0');
                          adminConfig.updateConfig('default_model_pricing', 
                            `输入: $${promptPrice}/1K tokens | 输出: $${completionPrice}/1K tokens`
                          );
                        }
                      }}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        state.isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="">请选择一个AI模型...</option>
                      
                      {/* 按分类显示模型 */}
                      {adminModels.categories && Object.entries(adminModels.categories).map(([category, models]) => {
                        const categoryInfo = MODEL_CATEGORIES[category as keyof typeof MODEL_CATEGORIES];
                        if (!categoryInfo || !models || models.length === 0) return null;
                        
                        return (
                          <optgroup key={category} label={categoryInfo.label}>
                            {models.slice(0, 15).map((model: any) => {
                              const promptPrice = parseFloat(model.pricing?.prompt || '0');
                              const completionPrice = parseFloat(model.pricing?.completion || '0');
                              const priceDisplay = promptPrice === 0 && completionPrice === 0 
                                ? '免费' 
                                : `$${promptPrice.toFixed(6)}/$${completionPrice.toFixed(6)}`;
                              
                              return (
                                <option key={model.id} value={model.id}>
                                  {model.name || model.id} ({priceDisplay})
                                </option>
                              );
                            })}
                          </optgroup>
                        );
                      })}
                    </select>
                  </div>
                  
                  {/* 模型统计信息 */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                    <div className={`p-3 rounded-lg ${
                      state.isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <p className={`text-xs ${
                        state.isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>总模型数</p>
                      <p className={`text-lg font-bold ${
                        state.isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{adminModels.totalModels}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${
                      state.isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <p className={`text-xs ${
                        state.isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>免费模型</p>
                      <p className={`text-lg font-bold text-green-600`}>
                        {adminModels.categories?.free?.length || 0}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${
                      state.isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <p className={`text-xs ${
                        state.isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>顶级模型</p>
                      <p className={`text-lg font-bold text-purple-600`}>
                        {adminModels.categories?.premium?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
    // 测试状态现在在主组件中管理

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
              { key: 'dialogue', label: '连续对话', icon: MessageCircle },
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
                🧪 专业AI角色测试 - 使用真实模型和配置
              </h4>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {/* 选择专业角色 */}
                  <div>
                    <Label className={`text-sm font-medium ${
                      state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      🎯 选择专业AI角色（6个预设角色）
                    </Label>
                    <select 
                      id="test-role-selector"
                      className={`w-full mt-2 p-2 border rounded-md ${
                        state.isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                      onChange={(e) => {
                        const roleId = e.target.value;
                        const selectedRole = adminRoles.roles.find(r => r.id === roleId);
                        if (selectedRole) {
                          // 显示角色配置信息
                          const roleInfo = document.getElementById('selected-role-info');
                          if (roleInfo) {
                            roleInfo.innerHTML = `
                              <div class="p-3 rounded-lg ${state.isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}">
                                <p class="font-medium">${selectedRole.name}</p>
                                <p class="text-sm opacity-75">模型: ${selectedRole.model}</p>
                                <p class="text-sm opacity-75">温度: ${selectedRole.temperature} | Token: ${selectedRole.maxTokens}</p>
                              </div>
                            `;
                          }
                        }
                      }}
                    >
                      <option value="">请选择一个专业角色...</option>
                      <optgroup label="⚖️ 法律行业">
                        <option value="lawyer_civil_disputes_master">民事纠纷专家律师</option>
                        <option value="lawyer_contract_expert">合同审查专家律师</option>
                      </optgroup>
                      <optgroup label="🏠 房地产行业">
                        <option value="realtor_sales_expert">房产买卖交易专家</option>
                      </optgroup>
                      <optgroup label="🛡️ 保险行业">
                        <option value="insurance_claims_expert">保险理赔专家</option>
                      </optgroup>
                      <optgroup label="🎓 教育行业">
                        <option value="teacher_curriculum_designer">课程设计专家教师</option>
                      </optgroup>
                      <optgroup label="💰 会计行业">
                        <option value="accountant_tax_expert">税务专家会计师</option>
                      </optgroup>
                      {/* 动态加载用户自定义角色 */}
                      {adminRoles.roles.filter(r => !r.id.includes('_')).length > 0 && (
                        <optgroup label="🔧 自定义角色">
                          {adminRoles.roles.filter(r => !r.id.includes('_')).map(role => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  {/* 显示选中角色的配置信息 */}
                  <div id="selected-role-info" className="min-h-[80px]">
                    <div className={`p-3 rounded-lg border ${
                      state.isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'
                    }`}>
                      <p className="text-sm opacity-75">请选择一个专业角色查看其配置</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className={`text-sm font-medium ${
                      state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      测试场景输入
                    </Label>
                    <Textarea
                      id="test-input"
                      placeholder="示例：我需要起草一份房屋买卖合同，买方是张三，卖方是李四，房产位于北京市朝阳区..."
                      rows={4}
                      className={state.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                    />
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    disabled={testingState.generateTesting}
                    onClick={async () => {
                      const roleSelector = document.getElementById('test-role-selector') as HTMLSelectElement;
                      const testInput = document.getElementById('test-input') as HTMLTextAreaElement;
                      const roleId = roleSelector?.value;
                      const input = testInput?.value;
                      
                      if (!roleId) {
                        showMessage('请先选择一个专业角色', 'error');
                        return;
                      }
                      
                      if (!input) {
                        showMessage('请输入测试场景', 'error');
                        return;
                      }
                      
                      // 获取角色配置
                      const selectedRole = adminRoles.roles.find(r => r.id === roleId) || 
                        // 如果不在自定义角色中，使用预设角色数据
                        {
                          id: roleId,
                          name: roleSelector.options[roleSelector.selectedIndex].text,
                          model: adminConfig.getConfigValue('api', 'default_model') || 'anthropic/claude-3-sonnet',
                          systemPrompt: '你是一位专业的AI助手。',
                          temperature: 0.7,
                          maxTokens: 2000
                        };
                      
                      setTestingState(prev => ({ ...prev, generateTesting: true }));
                      
                      try {
                        // 调用OpenRouter API进行实际测试
                        const response = await fetch('/api/admin/test/generate', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            roleId: selectedRole.id,
                            model: selectedRole.model,
                            systemPrompt: selectedRole.systemPrompt,
                            userInput: input,
                            temperature: selectedRole.temperature,
                            maxTokens: selectedRole.maxTokens
                          })
                        });
                        
                        const result = await response.json();
                        
                        // 显示结果
                        const resultDiv = document.getElementById('test-result');
                        if (resultDiv) {
                          resultDiv.innerHTML = result.success 
                            ? `<div class="space-y-3">
                                <div class="font-medium text-green-600">✅ 测试成功</div>
                                <div class="text-sm opacity-75">模型: ${selectedRole.model}</div>
                                <div class="text-sm opacity-75">响应时间: ${result.responseTime}ms</div>
                                <div class="border-t pt-3 mt-3">${result.content || '生成内容...'}</div>
                              </div>`
                            : `<div class="text-red-500">❌ 测试失败: ${result.error}</div>`;
                        }
                        
                        showMessage(result.success ? '测试成功' : '测试失败', result.success ? 'success' : 'error');
                      } catch (error: any) {
                        showMessage(`测试失败: ${error.message}`, 'error');
                      } finally {
                        setTestingState(prev => ({ ...prev, generateTesting: false }));
                      }
                    }}
                  >
                    {testingState.generateTesting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        正在使用专业角色测试...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        开始专业角色测试
                      </>
                    )}
                  </Button>
                </div>

                <div>
                  <Label className={`text-sm font-medium mb-3 block ${
                    state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    🎯 AI生成结果（使用真实模型）
                  </Label>
                  <div id="test-result" className={`h-96 p-4 border rounded-lg overflow-y-auto ${
                    state.isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-300'
                  }`}>
                    <div className="text-center text-gray-400 py-8">
                      <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>选择专业角色并点击"开始测试"</p>
                      <p className="text-sm mt-2">将使用角色配置的AI模型和提示词生成内容</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 连续对话面板 */}
          {activeTab === 'dialogue' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className={`text-lg font-semibold ${
                  state.isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  💬 专业角色连续对话 - 带上下文记忆的智能对话
                </h4>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                {/* 对话控制面板 */}
                <div className="space-y-4">
                  {/* 选择角色 */}
                  <div>
                    <Label className={`text-sm font-medium ${
                      state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      🎯 选择对话角色
                    </Label>
                    <select 
                      id="dialogue-role-selector"
                      className={`w-full mt-2 p-2 border rounded-md ${
                        state.isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="">选择专业角色...</option>
                      {Object.entries(PROFESSIONAL_INDUSTRIES).map(([industryKey, industryInfo]) => (
                        <optgroup key={industryKey} label={industryInfo.name}>
                          {getRolesByIndustry(industryKey as keyof typeof PROFESSIONAL_INDUSTRIES).map(role => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {/* 对话控制按钮 */}
                  <div className="space-y-2">
                    <Button
                      id="start-dialogue-btn"
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={async () => {
                        const roleSelector = document.getElementById('dialogue-role-selector') as HTMLSelectElement;
                        const roleId = roleSelector?.value;
                        
                        if (!roleId) {
                          showMessage('请先选择一个专业角色', 'error');
                          return;
                        }
                        
                        try {
                          const role = getRoleById(roleId);
                          const roleName = role?.name || roleSelector.options[roleSelector.selectedIndex].text;
                          
                          const response = await fetch('/api/admin/test/dialogue', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              action: 'new',
                              roleName: roleName,
                              systemPrompt: getRoleSystemPrompt(roleId),
                              model: getRoleModel(roleId)
                            })
                          });
                          
                          const result = await response.json();
                          
                          if (result.success) {
                            // 存储会话ID
                            (document.getElementById('current-session-id') as HTMLInputElement).value = result.data.sessionId;
                            
                            // 显示欢迎消息
                            const chatHistory = document.getElementById('chat-history');
                            if (chatHistory) {
                              chatHistory.innerHTML = `
                                <div class="mb-4 p-3 rounded-lg ${state.isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'} border border-blue-200">
                                  <div class="flex items-center text-sm text-blue-600 mb-1">
                                    <MessageCircle class="h-4 w-4 mr-1" />
                                    ${result.data.roleName}
                                  </div>
                                  <div class="text-sm">${result.data.greeting}</div>
                                </div>
                              `;
                            }
                            
                            showMessage('对话会话已创建', 'success');
                          } else {
                            showMessage(result.error || '创建对话失败', 'error');
                          }
                        } catch (error: any) {
                          showMessage(`创建对话失败: ${error.message}`, 'error');
                        }
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      开始新对话
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={async () => {
                        const sessionId = (document.getElementById('current-session-id') as HTMLInputElement).value;
                        if (!sessionId) {
                          showMessage('没有活跃的对话会话', 'error');
                          return;
                        }
                        
                        try {
                          const response = await fetch('/api/admin/test/dialogue', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              action: 'clear',
                              sessionId: sessionId
                            })
                          });
                          
                          const result = await response.json();
                          
                          if (result.success) {
                            const chatHistory = document.getElementById('chat-history');
                            if (chatHistory) {
                              chatHistory.innerHTML = '<div class="text-center text-gray-400 py-8">对话历史已清空</div>';
                            }
                            showMessage('对话历史已清空', 'success');
                          }
                        } catch (error: any) {
                          showMessage(`清空失败: ${error.message}`, 'error');
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      清空历史
                    </Button>
                  </div>

                  {/* 隐藏的会话ID存储 */}
                  <input type="hidden" id="current-session-id" />
                </div>
                
                {/* 对话历史 */}
                <div className="md:col-span-2 space-y-4">
                  <Label className={`text-sm font-medium ${
                    state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    💬 对话历史
                  </Label>
                  
                  <div
                    id="chat-history"
                    className={`h-96 p-4 border rounded-lg overflow-y-auto ${
                      state.isDarkMode 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    <div className="text-center text-gray-400 py-8">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>选择角色并开始新对话</p>
                      <p className="text-sm mt-2">支持上下文记忆的连续对话</p>
                    </div>
                  </div>
                  
                  {/* 消息输入 */}
                  <div className="flex space-x-2">
                    <Textarea
                      id="message-input"
                      placeholder="输入您的问题或需求..."
                      rows={2}
                      className={`flex-1 ${state.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          (document.getElementById('send-message-btn') as HTMLButtonElement).click();
                        }
                      }}
                    />
                    <Button
                      id="send-message-btn"
                      className="px-6 bg-blue-600 hover:bg-blue-700"
                      onClick={async () => {
                        const sessionId = (document.getElementById('current-session-id') as HTMLInputElement).value;
                        const messageInput = document.getElementById('message-input') as HTMLTextAreaElement;
                        const message = messageInput?.value?.trim();
                        
                        if (!sessionId) {
                          showMessage('请先开始新对话', 'error');
                          return;
                        }
                        
                        if (!message) {
                          showMessage('请输入消息内容', 'error');
                          return;
                        }
                        
                        // 显示用户消息
                        const chatHistory = document.getElementById('chat-history');
                        if (chatHistory) {
                          const userMessageHtml = `
                            <div class="mb-4 flex justify-end">
                              <div class="max-w-[80%] p-3 rounded-lg bg-blue-600 text-white">
                                <div class="text-sm">${message}</div>
                              </div>
                            </div>
                          `;
                          chatHistory.innerHTML += userMessageHtml;
                          chatHistory.scrollTop = chatHistory.scrollHeight;
                        }
                        
                        // 清空输入框
                        messageInput.value = '';
                        
                        // 显示正在输入状态
                        const typingIndicator = `
                          <div id="typing-indicator" class="mb-4">
                            <div class="max-w-[80%] p-3 rounded-lg ${state.isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}">
                              <div class="flex items-center text-sm">
                                <div class="flex space-x-1 mr-2">
                                  <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                  <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                                  <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                                </div>
                                正在思考...
                              </div>
                            </div>
                          </div>
                        `;
                        if (chatHistory) {
                          chatHistory.innerHTML += typingIndicator;
                          chatHistory.scrollTop = chatHistory.scrollHeight;
                        }
                        
                        try {
                          const roleSelector = document.getElementById('dialogue-role-selector') as HTMLSelectElement;
                          const selectedRoleId = roleSelector.value;
                          const role = getRoleById(selectedRoleId);
                          const roleName = role?.name || roleSelector.options[roleSelector.selectedIndex].text;
                          
                          const response = await fetch('/api/admin/test/dialogue', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              action: 'send',
                              sessionId: sessionId,
                              message: message,
                              model: getRoleModel(selectedRoleId),
                              systemPrompt: getRoleSystemPrompt(selectedRoleId),
                              roleName: roleName
                            })
                          });
                          
                          const result = await response.json();
                          
                          // 移除正在输入指示器
                          const indicator = document.getElementById('typing-indicator');
                          if (indicator) indicator.remove();
                          
                          if (result.success) {
                            // 显示AI回复
                            const aiMessageHtml = `
                              <div class="mb-4">
                                <div class="max-w-[80%] p-3 rounded-lg ${state.isDarkMode ? 'bg-gray-600 text-white' : 'bg-gray-200'}">
                                  <div class="flex items-center text-sm text-blue-600 mb-1">
                                    <Brain class="h-4 w-4 mr-1" />
                                    ${result.data.metadata.roleName}
                                  </div>
                                  <div class="text-sm whitespace-pre-wrap">${result.data.assistantReply}</div>
                                  <div class="text-xs text-gray-500 mt-2">
                                    ${result.data.usage.totalTokens} tokens | ${result.data.metadata.model}
                                  </div>
                                </div>
                              </div>
                            `;
                            if (chatHistory) {
                              chatHistory.innerHTML += aiMessageHtml;
                              chatHistory.scrollTop = chatHistory.scrollHeight;
                            }
                          } else {
                            // 显示错误消息
                            const errorMessageHtml = `
                              <div class="mb-4">
                                <div class="max-w-[80%] p-3 rounded-lg bg-red-100 text-red-700">
                                  <div class="text-sm">❌ ${result.error}</div>
                                </div>
                              </div>
                            `;
                            if (chatHistory) {
                              chatHistory.innerHTML += errorMessageHtml;
                              chatHistory.scrollTop = chatHistory.scrollHeight;
                            }
                          }
                        } catch (error: any) {
                          // 移除正在输入指示器
                          const indicator = document.getElementById('typing-indicator');
                          if (indicator) indicator.remove();
                          
                          showMessage(`发送消息失败: ${error.message}`, 'error');
                        }
                      }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
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

  /**
   * 渲染模型管理模块
   */
  function renderModelsModule() {
    return (
      <div className="space-y-6">
        {/* 模型管理头部 */}
        <Card className={`p-6 ${
          state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
        }`}>
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div className="flex items-center space-x-3">
              <Layers className="h-6 w-6 text-indigo-600" />
              <div>
                <h3 className={`text-xl font-bold ${
                  state.isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  OpenRouter模型管理中心
                </h3>
                <p className={`text-sm ${
                  state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  318个AI模型的分类视图和智能推荐
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={adminModels.loadModels}
                disabled={adminModels.loading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${
                  adminModels.loading ? 'animate-spin' : ''
                }`} />
                刷新模型
              </Button>
            </div>
          </div>
          
          {/* 模型统计 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className={`text-center p-4 rounded-lg ${
              state.isDarkMode ? 'bg-gray-700' : 'bg-indigo-50'
            }`}>
              <div className="text-2xl font-bold text-indigo-600">
                {adminModels.totalModels}
              </div>
              <div className={`text-sm ${
                state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                总模型数
              </div>
            </div>
            
            <div className={`text-center p-4 rounded-lg ${
              state.isDarkMode ? 'bg-gray-700' : 'bg-green-50'
            }`}>
              <div className="text-2xl font-bold text-green-600">
                {adminModels.categories?.free?.length || 0}
              </div>
              <div className={`text-sm ${
                state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                免费模型
              </div>
            </div>
            
            <div className={`text-center p-4 rounded-lg ${
              state.isDarkMode ? 'bg-gray-700' : 'bg-blue-50'
            }`}>
              <div className="text-2xl font-bold text-blue-600">
                {adminModels.categories?.premium?.length || 0}
              </div>
              <div className={`text-sm ${
                state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                顶级模型
              </div>
            </div>
            
            <div className={`text-center p-4 rounded-lg ${
              state.isDarkMode ? 'bg-gray-700' : 'bg-purple-50'
            }`}>
              <div className="text-2xl font-bold text-purple-600">
                {adminModels.categories?.latest?.length || 0}
              </div>
              <div className={`text-sm ${
                state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                最新模型
              </div>
            </div>
          </div>
        </Card>

        {/* 模型分类标签 */}
        <Card className={`p-4 ${
          state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
        }`}>
          <div className="flex flex-wrap gap-2">
            {adminModels.categories && Object.keys(adminModels.categories).map((category) => {
              const isSelected = adminModels.selectedCategory === category;
              const Icon = adminModels.getCategoryIcon(category as any);
              return (
                <Button
                  key={category}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => adminModels.setSelectedCategory(category as any)}
                  className={`${
                    !isSelected && state.isDarkMode ? 'border-gray-600 text-gray-300' : ''
                  }`}
                >
                  <span className="mr-2">{Icon}</span>
                  {category}
                  <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                    {adminModels.categories[category as keyof typeof adminModels.categories]?.length || 0}
                  </span>
                </Button>
              );
            })}
          </div>
        </Card>

        {/* 搜索和排序 */}
        <Card className={`p-4 ${
          state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
        }`}>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索模型名称、提供商或描述..."
                  value={adminModels.searchQuery}
                  onChange={(e) => adminModels.setSearchQuery(e.target.value)}
                  className={`pl-10 ${
                    state.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''
                  }`}
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <select
                value={adminModels.sortBy}
                onChange={(e) => adminModels.setSortBy(e.target.value as any)}
                className={`px-3 py-2 border rounded-md text-sm ${
                  state.isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="name">按名称排序</option>
                <option value="price">按价格排序</option>
                <option value="context">按上下文排序</option>
                <option value="provider">按提供商排序</option>
              </select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => adminModels.setSortOrder(
                  adminModels.sortOrder === 'asc' ? 'desc' : 'asc'
                )}
                className={state.isDarkMode ? 'border-gray-600 text-gray-300' : ''}
              >
                {adminModels.sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </Card>

        {/* 模型列表 */}
        <div className="grid gap-4">
          {adminModels.getFilteredModels().map((model, index) => {
            const priceLevel = adminModels.getModelPriceLevel(model);
            const contextLevel = adminModels.getModelContextLevel(model);
            
            return (
              <Card key={`${model.id}_${index}`} className={`p-6 hover:shadow-lg transition-shadow ${
                state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
              }`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h4 className={`text-lg font-semibold ${
                        state.isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {model.name}
                      </h4>
                      
                      {/* 价格标签 */}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        priceLevel === 'free' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : priceLevel === 'low'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        : priceLevel === 'medium'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : priceLevel === 'high'
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                      }`}>
                        {priceLevel === 'free' ? '免费' 
                        : priceLevel === 'low' ? '低价'
                        : priceLevel === 'medium' ? '中价'
                        : priceLevel === 'high' ? '高价'
                        : '顶级'}
                      </span>
                      
                      {/* 上下文标签 */}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        contextLevel === 'ultra'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {model.context_length ? `${(model.context_length / 1000).toFixed(0)}K` : '未知'}
                      </span>
                      
                      {/* 提供商标签 */}
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400 rounded-full text-xs font-medium">
                        {model.top_provider?.name || '未知'}
                      </span>
                    </div>
                    
                    <p className={`text-sm mb-2 ${
                      state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      ID: {model.id}
                    </p>
                    
                    {model.description && (
                      <p className={`text-sm mb-3 ${
                        state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {model.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-6 text-xs text-gray-500">
                      <span>
                        输入: ${model.pricing?.prompt || '0'}/1K tokens
                      </span>
                      <span>
                        输出: ${model.pricing?.completion || '0'}/1K tokens
                      </span>
                      {model.architecture?.modality && (
                        <span>
                          模态: {model.architecture.modality}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // 设置为默认模型
                        adminConfig.updateConfig('default_model', model.id);
                        showMessage(`已设置 ${model.name} 为默认模型`, 'success');
                      }}
                      className={state.isDarkMode ? 'border-gray-600 text-gray-300' : ''}
                    >
                      <Target className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // 查看详情
                        console.log('模型详情:', model);
                        showMessage('模型详情已输出到控制台', 'info');
                      }}
                      className={state.isDarkMode ? 'border-gray-600 text-gray-300' : ''}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
          
          {adminModels.categories && adminModels.getFilteredModels().length === 0 && (
            <div className={`text-center py-12 ${
              state.isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>没有找到匹配的模型</p>
              <p className="text-sm">试试调整搜索条件或选择其他分类</p>
            </div>
          )}
        </div>

        {/* 模型分析面板 */}
        {adminModels.analysis && (
          <Card className={`p-6 ${
            state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              state.isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              深度分析报告
            </h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className={`font-medium mb-3 ${
                  state.isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  提供商分布
                </h4>
                <div className="space-y-2">
                  {adminModels.analysis.providers.distribution.slice(0, 5).map((provider, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className={state.isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                        {provider.provider}
                      </span>
                      <span className={state.isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                        {provider.modelCount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className={`font-medium mb-3 ${
                  state.isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  价格分析
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className={state.isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                      免费模型比例
                    </span>
                    <span className="text-green-600 font-medium">
                      {adminModels.analysis.pricing.analysis.freeModels}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={state.isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                      经济实惠
                    </span>
                    <span className="text-blue-600 font-medium">
                      {adminModels.analysis.pricing.analysis.budgetFriendly}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={state.isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                      企业级
                    </span>
                    <span className="text-purple-600 font-medium">
                      {adminModels.analysis.pricing.analysis.enterprise}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className={`font-medium mb-3 ${
                  state.isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  上下文分布
                </h4>
                <div className="space-y-2">
                  {adminModels.analysis.contextLength.distribution.slice(0, 5).map((ctx, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className={state.isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                        {ctx.length}
                      </span>
                      <span className={state.isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                        {ctx.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  }

  /**
   * 渲染专业角色管理模块
   */
  function renderRolesModule() {
    return (
      <div className="space-y-6">
        {/* 角色管理头部 */}
        <Card className={`p-6 ${
          state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
        }`}>
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div className="flex items-center space-x-3">
              <UserCheck className="h-6 w-6 text-cyan-600" />
              <div>
                <h3 className={`text-xl font-bold ${
                  state.isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  专业AI角色管理
                </h3>
                <p className={`text-sm ${
                  state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  管理6个预设专业AI角色的配置和参数
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={() => {
                  adminRoles.setEditingRole({
                    name: '',
                    industry: '',
                    icon: '🤖',
                    description: '',
                    expertise: [],
                    defaultModel: 'anthropic/claude-3.5-sonnet',
                    modelConfig: {
                      temperature: 0.7,
                      maxTokens: 2000
                    },
                    systemPrompt: '',
                    contextPrompts: {
                      greeting: '',
                      instructions: '',
                      examples: []
                    },
                    tools: [],
                    active: true
                  });
                  adminRoles.setShowRoleEditor(true);
                }}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                新建角色
              </Button>
              
              <Button
                variant="outline"
                onClick={adminRoles.loadRoles}
                disabled={adminRoles.loading}
                className={state.isDarkMode ? 'border-gray-600 text-gray-300' : ''}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${
                  adminRoles.loading ? 'animate-spin' : ''
                }`} />
                刷新
              </Button>
            </div>
          </div>
          
          {/* 角色统计 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className={`text-center p-4 rounded-lg ${
              state.isDarkMode ? 'bg-gray-700' : 'bg-cyan-50'
            }`}>
              <div className="text-2xl font-bold text-cyan-600">
                {adminRoles.roles.length}
              </div>
              <div className={`text-sm ${
                state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                总角色数
              </div>
            </div>
            
            <div className={`text-center p-4 rounded-lg ${
              state.isDarkMode ? 'bg-gray-700' : 'bg-green-50'
            }`}>
              <div className="text-2xl font-bold text-green-600">
                {adminRoles.roles.filter(r => r.active).length}
              </div>
              <div className={`text-sm ${
                state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                活跃角色
              </div>
            </div>
            
            <div className={`text-center p-4 rounded-lg ${
              state.isDarkMode ? 'bg-gray-700' : 'bg-orange-50'
            }`}>
              <div className="text-2xl font-bold text-orange-600">
                {adminRoles.stats?.totalUsage || 0}
              </div>
              <div className={`text-sm ${
                state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                总使用次数
              </div>
            </div>
            
            <div className={`text-center p-4 rounded-lg ${
              state.isDarkMode ? 'bg-gray-700' : 'bg-purple-50'
            }`}>
              <div className="text-2xl font-bold text-purple-600">
                {adminRoles.getIndustries().length}
              </div>
              <div className={`text-sm ${
                state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                覆盖行业
              </div>
            </div>
          </div>
        </Card>

        {/* 搜索和过滤 */}
        <Card className={`p-4 ${
          state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
        }`}>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索角色名称、行业或专长..."
                  value={adminRoles.searchQuery}
                  onChange={(e) => adminRoles.setSearchQuery(e.target.value)}
                  className={`pl-10 ${
                    state.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''
                  }`}
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <select
                value={adminRoles.filterIndustry}
                onChange={(e) => adminRoles.setFilterIndustry(e.target.value)}
                className={`px-3 py-2 border rounded-md text-sm ${
                  state.isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="">所有行业</option>
                {adminRoles.getIndustries().map(industry => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
              
              <Button
                variant={adminRoles.sortOrder === 'desc' ? 'default' : 'outline'}
                size="sm"
                onClick={() => adminRoles.setSortOrder(
                  adminRoles.sortOrder === 'asc' ? 'desc' : 'asc'
                )}
                className={adminRoles.sortOrder !== 'desc' && state.isDarkMode ? 'border-gray-600 text-gray-300' : ''}
              >
                {adminRoles.sortBy === 'usage' ? '使用量' : '名称'} {adminRoles.sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </Card>

        {/* 角色列表 */}
        <div className="grid gap-6">
          {adminRoles.getFilteredRoles().map((role) => (
            <Card key={role.id} className={`p-6 hover:shadow-lg transition-shadow ${
              state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
            }`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="text-3xl">{role.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className={`text-xl font-semibold ${
                          state.isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {role.name}
                        </h4>
                        
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          role.active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {role.active ? '活跃' : '停用'}
                        </span>
                        
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-medium">
                          {role.industry}
                        </span>
                      </div>
                      
                      <p className={`text-sm mb-3 ${
                        state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {role.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* 专长领域 */}
                  <div className="mb-4">
                    <h5 className={`text-sm font-medium mb-2 ${
                      state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      专长领域:
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {role.expertise.slice(0, 5).map((exp, index) => (
                        <span key={index} className={`px-2 py-1 text-xs rounded ${
                          state.isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {exp}
                        </span>
                      ))}
                      {role.expertise.length > 5 && (
                        <span className={`px-2 py-1 text-xs rounded ${
                          state.isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                        }`}>
                          +{role.expertise.length - 5}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* 配置信息 */}
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className={`font-medium ${
                        state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        默认模型: 
                      </span>
                      <span className={state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                        {role.defaultModel.split('/').pop()}
                      </span>
                    </div>
                    <div>
                      <span className={`font-medium ${
                        state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        创意度: 
                      </span>
                      <span className={state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                        {role.modelConfig.temperature}
                      </span>
                    </div>
                    <div>
                      <span className={`font-medium ${
                        state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        使用次数: 
                      </span>
                      <span className="text-blue-600 font-medium">
                        {role.usageCount}
                      </span>
                    </div>
                    <div>
                      <span className={`font-medium ${
                        state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        更新时间: 
                      </span>
                      <span className={state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                        {new Date(role.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      adminRoles.setEditingRole(role);
                      adminRoles.setShowRoleEditor(true);
                    }}
                    className={state.isDarkMode ? 'border-gray-600 text-gray-300' : ''}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adminRoles.duplicateRole(role.id)}
                    className={state.isDarkMode ? 'border-gray-600 text-gray-300' : ''}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adminRoles.toggleRoleStatus(role.id)}
                    className={state.isDarkMode ? 'border-gray-600 text-gray-300' : ''}
                  >
                    {role.active ? 
                      <EyeOff className="h-4 w-4" /> : 
                      <Eye className="h-4 w-4" />
                    }
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('确定要删除这个角色吗？此操作不可撤销。')) {
                        adminRoles.deleteRole(role.id);
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
          
          {adminRoles.getFilteredRoles().length === 0 && (
            <div className={`text-center py-12 ${
              state.isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>没有找到匹配的角色</p>
              <p className="text-sm">试试调整搜索条件或创建新角色</p>
            </div>
          )}
        </div>

        {/* 角色编辑器弹窗 */}
        {adminRoles.showRoleEditor && adminRoles.editingRole && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className={`w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl ${
              state.isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className={`p-6 border-b flex justify-between items-center ${
                state.isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <UserCheck className="h-6 w-6 text-cyan-600" />
                  <div>
                    <h2 className={`text-xl font-bold ${
                      state.isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {adminRoles.editingRole.id ? '编辑角色' : '新建角色'}
                    </h2>
                    <p className={`text-sm ${
                      state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      配置专业AI角色的参数和行为
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    onClick={async () => {
                      const isNew = !adminRoles.editingRole?.id;
                      const success = isNew 
                        ? await adminRoles.createRole(adminRoles.editingRole!)
                        : await adminRoles.updateRole(adminRoles.editingRole!.id!, adminRoles.editingRole!);

                      if (success) {
                        showMessage(`角色${isNew ? '创建' : '更新'}成功`, 'success');
                        adminRoles.setShowRoleEditor(false);
                        adminRoles.setEditingRole(null);
                      }
                    }}
                    disabled={adminRoles.saving}
                    className="bg-cyan-600 hover:bg-cyan-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {adminRoles.saving ? '保存中...' : '保存角色'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      adminRoles.setShowRoleEditor(false);
                      adminRoles.setEditingRole(null);
                    }}
                    className={state.isDarkMode ? 'border-gray-600 text-gray-300' : ''}
                  >
                    取消
                  </Button>
                </div>
              </div>
              
              <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
                <div className="space-y-6">
                  {/* 基本信息 */}
                  <div>
                    <h3 className={`text-lg font-semibold mb-4 ${
                      state.isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      基本信息
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>角色名称 *</Label>
                        <Input
                          value={adminRoles.editingRole?.name || ''}
                          onChange={(e) => adminRoles.setEditingRole({
                            ...adminRoles.editingRole!,
                            name: e.target.value
                          })}
                          placeholder="如：法律专家"
                          className={state.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                        />
                      </div>
                      
                      <div>
                        <Label>所属行业 *</Label>
                        <Input
                          value={adminRoles.editingRole?.industry || ''}
                          onChange={(e) => adminRoles.setEditingRole({
                            ...adminRoles.editingRole!,
                            industry: e.target.value
                          })}
                          placeholder="如：legal"
                          className={state.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                        />
                      </div>
                      
                      <div>
                        <Label>角色图标</Label>
                        <Input
                          value={adminRoles.editingRole?.icon || ''}
                          onChange={(e) => adminRoles.setEditingRole({
                            ...adminRoles.editingRole!,
                            icon: e.target.value
                          })}
                          placeholder="⚖️"
                          className={state.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                        />
                      </div>
                      
                      <div>
                        <Label>默认模型</Label>
                        <select
                          value={adminRoles.editingRole?.defaultModel || ''}
                          onChange={(e) => adminRoles.setEditingRole({
                            ...adminRoles.editingRole!,
                            defaultModel: e.target.value
                          })}
                          className={`w-full p-2 border rounded-md ${
                            state.isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          {AVAILABLE_MODELS.map(model => (
                            <option key={model.id} value={model.id}>
                              {model.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Label>角色描述</Label>
                      <Textarea
                        value={adminRoles.editingRole?.description || ''}
                        onChange={(e) => adminRoles.setEditingRole({
                          ...adminRoles.editingRole!,
                          description: e.target.value
                        })}
                        placeholder="描述这个角色的职责和能力..."
                        rows={3}
                        className={state.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                      />
                    </div>
                  </div>
                  
                  {/* 模型配置 */}
                  <div>
                    <h3 className={`text-lg font-semibold mb-4 ${
                      state.isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      模型参数配置
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>创意度 (Temperature)</Label>
                        <div className="mt-2">
                          <Slider
                            value={adminRoles.editingRole?.modelConfig?.temperature || 0.7}
                            onChange={(value) => adminRoles.setEditingRole({
                              ...adminRoles.editingRole!,
                              modelConfig: {
                                ...adminRoles.editingRole!.modelConfig!,
                                temperature: value
                              }
                            })}
                            min={0}
                            max={2}
                            step={0.1}
                            className={state.isDarkMode ? 'text-white' : ''}
                          />
                          <div className="text-sm text-gray-500 mt-1">
                            当前值: {adminRoles.editingRole?.modelConfig?.temperature || 0.7}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label>最大令牌数</Label>
                        <Input
                          type="number"
                          value={adminRoles.editingRole?.modelConfig?.maxTokens || 2000}
                          onChange={(e) => adminRoles.setEditingRole({
                            ...adminRoles.editingRole!,
                            modelConfig: {
                              ...adminRoles.editingRole!.modelConfig!,
                              maxTokens: parseInt(e.target.value)
                            }
                          })}
                          min={100}
                          max={8000}
                          className={state.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* 系统提示词 */}
                  <div>
                    <h3 className={`text-lg font-semibold mb-4 ${
                      state.isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      系统提示词
                    </h3>
                    
                    <Textarea
                      value={adminRoles.editingRole?.systemPrompt || ''}
                      onChange={(e) => adminRoles.setEditingRole({
                        ...adminRoles.editingRole!,
                        systemPrompt: e.target.value
                      })}
                      placeholder="定义这个AI角色的身份、性格和专业能力..."
                      rows={6}
                      className={state.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /**
   * 渲染文档模板库模块
   */
  function renderDocumentsModule() {
    return (
      <div className="space-y-6">
        {/* 文档模板头部 */}
        <Card className={`p-6 ${
          state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
        }`}>
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div className="flex items-center space-x-3">
              <FileStack className="h-6 w-6 text-amber-600" />
              <div>
                <h3 className={`text-xl font-bold ${
                  state.isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  文档模板库管理
                </h3>
                <p className={`text-sm ${
                  state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  各行业专业文档生成模板的管理和使用
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={() => {
                  adminDocuments.setEditingTemplate({
                    name: '',
                    category: '',
                    industry: '',
                    description: '',
                    templateType: 'other',
                    content: '',
                    variables: [],
                    format: 'markdown',
                    language: 'zh',
                    tags: [],
                    complexity: 'simple',
                    estimatedTime: 10,
                    requirements: [],
                    examples: [],
                    active: true,
                    featured: false
                  });
                  adminDocuments.setShowTemplateEditor(true);
                }}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                新建模板
              </Button>
              
              <Button
                variant="outline"
                onClick={adminDocuments.loadTemplates}
                disabled={adminDocuments.loading}
                className={state.isDarkMode ? 'border-gray-600 text-gray-300' : ''}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${
                  adminDocuments.loading ? 'animate-spin' : ''
                }`} />
                刷新
              </Button>
            </div>
          </div>
          
          {/* 文档统计 */}
          {adminDocuments.stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className={`text-center p-4 rounded-lg ${
                state.isDarkMode ? 'bg-gray-700' : 'bg-amber-50'
              }`}>
                <div className="text-2xl font-bold text-amber-600">
                  {adminDocuments.stats.totalTemplates}
                </div>
                <div className={`text-sm ${
                  state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  总模板数
                </div>
              </div>
              
              <div className={`text-center p-4 rounded-lg ${
                state.isDarkMode ? 'bg-gray-700' : 'bg-green-50'
              }`}>
                <div className="text-2xl font-bold text-green-600">
                  {adminDocuments.stats.activeTemplates}
                </div>
                <div className={`text-sm ${
                  state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  活跃模板
                </div>
              </div>
              
              <div className={`text-center p-4 rounded-lg ${
                state.isDarkMode ? 'bg-gray-700' : 'bg-blue-50'
              }`}>
                <div className="text-2xl font-bold text-blue-600">
                  {adminDocuments.stats.totalUsage}
                </div>
                <div className={`text-sm ${
                  state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  总使用次数
                </div>
              </div>
              
              <div className={`text-center p-4 rounded-lg ${
                state.isDarkMode ? 'bg-gray-700' : 'bg-purple-50'
              }`}>
                <div className="text-2xl font-bold text-purple-600">
                  {adminDocuments.stats.avgRating.toFixed(1)}
                </div>
                <div className={`text-sm ${
                  state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  平均评分
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* 搜索和过滤 */}
        <Card className={`p-4 ${
          state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
        }`}>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索模板名称、分类、标签..."
                  value={adminDocuments.searchQuery}
                  onChange={(e) => adminDocuments.setSearchQuery(e.target.value)}
                  className={`pl-10 ${
                    state.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''
                  }`}
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <select
                value={adminDocuments.filterCategory}
                onChange={(e) => adminDocuments.setFilterCategory(e.target.value)}
                className={`px-3 py-2 border rounded-md text-sm ${
                  state.isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="">所有分类</option>
                {adminDocuments.getCategories().map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              
              <select
                value={adminDocuments.filterIndustry}
                onChange={(e) => adminDocuments.setFilterIndustry(e.target.value)}
                className={`px-3 py-2 border rounded-md text-sm ${
                  state.isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="">所有行业</option>
                {adminDocuments.getIndustries().map(industry => (
                  <option key={industry} value={industry}>
                    {INDUSTRIES.find(i => i.id === industry)?.name || industry}
                  </option>
                ))}
              </select>
              
              <Button
                variant={adminDocuments.sortOrder === 'desc' ? 'default' : 'outline'}
                size="sm"
                onClick={() => adminDocuments.setSortOrder(
                  adminDocuments.sortOrder === 'asc' ? 'desc' : 'asc'
                )}
                className={adminDocuments.sortOrder !== 'desc' && state.isDarkMode ? 'border-gray-600 text-gray-300' : ''}
              >
                {adminDocuments.sortBy === 'rating' ? '评分' : '名称'} {adminDocuments.sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </Card>

        {/* 模板列表 */}
        <div className="grid gap-6">
          {adminDocuments.getFilteredTemplates().map((template) => (
            <Card key={template.id} className={`p-6 hover:shadow-lg transition-shadow ${
              state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
            }`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h4 className={`text-xl font-semibold ${
                      state.isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {template.name}
                    </h4>
                    
                    {template.featured && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full text-xs font-medium">
                        <Star className="h-3 w-3 inline mr-1" />
                        推荐
                      </span>
                    )}
                    
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      template.active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {template.active ? '活跃' : '停用'}
                    </span>
                    
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-medium">
                      {template.category}
                    </span>
                    
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      template.complexity === 'simple' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      template.complexity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {template.complexity === 'simple' ? '简单' : template.complexity === 'medium' ? '中等' : '复杂'}
                    </span>
                  </div>
                  
                  <p className={`text-sm mb-3 ${
                    state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {template.description}
                  </p>
                  
                  {/* 标签 */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {template.tags.slice(0, 5).map((tag, index) => (
                        <span key={index} className={`px-2 py-1 text-xs rounded flex items-center ${
                          state.isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                      {template.tags.length > 5 && (
                        <span className={`px-2 py-1 text-xs rounded ${
                          state.isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                        }`}>
                          +{template.tags.length - 5}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* 统计信息 */}
                  <div className="grid md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className={`font-medium ${
                        state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        行业: 
                      </span>
                      <span className={state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                        {INDUSTRIES.find(i => i.id === template.industry)?.name || template.industry}
                      </span>
                    </div>
                    <div>
                      <span className={`font-medium ${
                        state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        格式: 
                      </span>
                      <span className={state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                        {template.format.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className={`font-medium ${
                        state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        使用次数: 
                      </span>
                      <span className="text-blue-600 font-medium">
                        {template.usageCount}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className={`font-medium mr-2 ${
                        state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        评分: 
                      </span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="ml-1 text-yellow-600 font-medium">
                          {template.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      adminDocuments.setEditingTemplate(template);
                      adminDocuments.setShowTemplateEditor(true);
                    }}
                    className={state.isDarkMode ? 'border-gray-600 text-gray-300' : ''}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adminDocuments.duplicateTemplate(template.id)}
                    className={state.isDarkMode ? 'border-gray-600 text-gray-300' : ''}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adminDocuments.toggleFeaturedStatus(template.id)}
                    className={state.isDarkMode ? 'border-gray-600 text-gray-300' : ''}
                    title="切换推荐状态"
                  >
                    <Star className={`h-4 w-4 ${template.featured ? 'fill-current text-yellow-500' : ''}`} />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // 预览模板
                      console.log('预览模板:', template);
                      showMessage('模板预览功能开发中...', 'info');
                    }}
                    className={state.isDarkMode ? 'border-gray-600 text-gray-300' : ''}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('确定要删除这个模板吗？此操作不可撤销。')) {
                        adminDocuments.deleteTemplate(template.id);
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
          
          {adminDocuments.getFilteredTemplates().length === 0 && (
            <div className={`text-center py-12 ${
              state.isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <FileStack className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>没有找到匹配的文档模板</p>
              <p className="text-sm">试试调整搜索条件或创建新模板</p>
            </div>
          )}
        </div>

        {/* 模板编辑器弹窗 */}
        {adminDocuments.showTemplateEditor && adminDocuments.editingTemplate && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className={`w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl ${
              state.isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className={`p-6 border-b flex justify-between items-center ${
                state.isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <FileStack className="h-6 w-6 text-amber-600" />
                  <div>
                    <h2 className={`text-xl font-bold ${
                      state.isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {adminDocuments.editingTemplate.id ? '编辑模板' : '新建模板'}
                    </h2>
                    <p className={`text-sm ${
                      state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      创建或修改文档生成模板
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    onClick={async () => {
                      const isNew = !adminDocuments.editingTemplate?.id;
                      const success = isNew 
                        ? await adminDocuments.createTemplate(adminDocuments.editingTemplate!)
                        : await adminDocuments.updateTemplate(adminDocuments.editingTemplate!.id!, adminDocuments.editingTemplate!);

                      if (success) {
                        showMessage(`模板${isNew ? '创建' : '更新'}成功`, 'success');
                        adminDocuments.setShowTemplateEditor(false);
                        adminDocuments.setEditingTemplate(null);
                      }
                    }}
                    disabled={adminDocuments.saving}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {adminDocuments.saving ? '保存中...' : '保存模板'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      adminDocuments.setShowTemplateEditor(false);
                      adminDocuments.setEditingTemplate(null);
                    }}
                    className={state.isDarkMode ? 'border-gray-600 text-gray-300' : ''}
                  >
                    取消
                  </Button>
                </div>
              </div>
              
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
                      <Label>模板名称 *</Label>
                      <Input
                        value={adminDocuments.editingTemplate?.name || ''}
                        onChange={(e) => adminDocuments.setEditingTemplate({
                          ...adminDocuments.editingTemplate!,
                          name: e.target.value
                        })}
                        placeholder="请输入模板名称"
                        className={state.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                      />
                    </div>
                    
                    <div>
                      <Label>模板分类 *</Label>
                      <Input
                        value={adminDocuments.editingTemplate?.category || ''}
                        onChange={(e) => adminDocuments.setEditingTemplate({
                          ...adminDocuments.editingTemplate!,
                          category: e.target.value
                        })}
                        placeholder="如：法律文件"
                        className={state.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                      />
                    </div>
                    
                    <div>
                      <Label>所属行业 *</Label>
                      <select
                        value={adminDocuments.editingTemplate?.industry || ''}
                        onChange={(e) => adminDocuments.setEditingTemplate({
                          ...adminDocuments.editingTemplate!,
                          industry: e.target.value
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
                      <Label>模板类型</Label>
                      <select
                        value={adminDocuments.editingTemplate?.templateType || 'other'}
                        onChange={(e) => adminDocuments.setEditingTemplate({
                          ...adminDocuments.editingTemplate!,
                          templateType: e.target.value as any
                        })}
                        className={`w-full p-2 border rounded-md ${
                          state.isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="contract">合同</option>
                        <option value="report">报告</option>
                        <option value="proposal">提案</option>
                        <option value="letter">信函</option>
                        <option value="form">表单</option>
                        <option value="policy">政策</option>
                        <option value="guide">指南</option>
                        <option value="other">其他</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label>模板描述</Label>
                      <Textarea
                        value={adminDocuments.editingTemplate?.description || ''}
                        onChange={(e) => adminDocuments.setEditingTemplate({
                          ...adminDocuments.editingTemplate!,
                          description: e.target.value
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
                        checked={adminDocuments.editingTemplate?.active}
                        onChange={(e) => adminDocuments.setEditingTemplate({
                          ...adminDocuments.editingTemplate!,
                          active: e.target.checked
                        })}
                        className="rounded"
                      />
                      <Label htmlFor="active">立即激活</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="featured"
                        checked={adminDocuments.editingTemplate?.featured}
                        onChange={(e) => adminDocuments.setEditingTemplate({
                          ...adminDocuments.editingTemplate!,
                          featured: e.target.checked
                        })}
                        className="rounded"
                      />
                      <Label htmlFor="featured">设为推荐</Label>
                    </div>
                  </div>
                  
                  {/* 模板内容编辑器 */}
                  <div className="md:col-span-2">
                    <h3 className={`text-lg font-semibold mb-4 ${
                      state.isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      模板内容编辑
                    </h3>
                    
                    <Textarea
                      value={adminDocuments.editingTemplate?.content || ''}
                      onChange={(e) => adminDocuments.setEditingTemplate({
                        ...adminDocuments.editingTemplate!,
                        content: e.target.value
                      })}
                      placeholder="请输入文档模板内容...

示例：
# 合同标题

**甲方：** {clientName}
**乙方：** {providerName}

## 第一条 合同内容
{contractContent}

..."
                      rows={20}
                      className={`font-mono text-sm ${
                        state.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''
                      }`}
                    />
                    
                    <div className="mt-4 text-xs text-gray-500">
                      <p>💡 提示：使用 {`{变量名}`} 格式定义可替换变量</p>
                      <p>支持 Markdown 格式，可使用标题、列表、表格等语法</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}