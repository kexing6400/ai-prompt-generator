'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { INDUSTRIES } from '@/lib/constants/industries';
import { useIndustryTheme } from '@/components/providers/industry-theme-provider';
import { 
  Scale, 
  FileText, 
  Search, 
  Users, 
  Shield, 
  ArrowRight,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

// 律师专业模块定义
interface LawyerModule {
  id: string;
  title: string;
  description: string;
  icon: typeof FileText;
  color: string;
  features: string[];
  templateCount: number;
  path: string;
}

const lawyerModules: LawyerModule[] = [
  {
    id: 'contract-review',
    title: '合同审查',
    description: '专业合同条款审查、风险识别与修改建议',
    icon: FileText,
    color: 'bg-blue-500',
    features: ['风险识别', '条款优化', '合规检查', '修改建议'],
    templateCount: 8,
    path: '/industries/lawyer/contract-review'
  },
  {
    id: 'litigation',
    title: '诉讼案件',
    description: '诉讼策略制定、文书起草与程序指导',
    icon: Scale,
    color: 'bg-indigo-500',
    features: ['策略制定', '文书起草', '证据分析', '程序指导'],
    templateCount: 6,
    path: '/industries/lawyer/litigation'
  },
  {
    id: 'legal-research',
    title: '法律研究',
    description: '案例分析、判例检索与法理研究',
    icon: Search,
    color: 'bg-purple-500',
    features: ['案例分析', '判例检索', '法理研究', '观点总结'],
    templateCount: 5,
    path: '/industries/lawyer/research'
  },
  {
    id: 'compliance',
    title: '合规咨询',
    description: '企业合规建议、政策解读与风险防控',
    icon: Shield,
    color: 'bg-green-500',
    features: ['合规建议', '政策解读', '风险防控', '制度设计'],
    templateCount: 4,
    path: '/industries/lawyer/compliance'
  },
  {
    id: 'client-communication',
    title: '客户沟通',
    description: '专业法律咨询回复与客户服务',
    icon: Users,
    color: 'bg-orange-500',
    features: ['咨询回复', '方案制定', '风险告知', '服务建议'],
    templateCount: 6,
    path: '/industries/lawyer/client-communication'
  }
];

interface ModuleCardProps {
  module: LawyerModule;
  onSelect: (module: LawyerModule) => void;
}

function ModuleCard({ module, onSelect }: ModuleCardProps) {
  const Icon = module.icon;
  
  return (
    <Card 
      className="relative overflow-hidden border-2 border-blue-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105"
      onClick={() => onSelect(module)}
    >
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          {/* 模块图标与标题 */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-xl ${module.color} shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{module.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{module.description}</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
              {module.templateCount} 模板
            </Badge>
          </div>
          
          {/* 功能特性 */}
          <div className="grid grid-cols-2 gap-2">
            {module.features.map((feature) => (
              <div key={feature} className="flex items-center text-sm text-gray-600">
                <CheckCircle2 className="w-3 h-3 mr-2 text-green-500" />
                {feature}
              </div>
            ))}
          </div>
          
          {/* 进入按钮 */}
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white group-hover:shadow-md transition-all duration-300"
          >
            进入模块
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function IndustrySelectionPage() {
  const router = useRouter();
  const { setCurrentIndustry } = useIndustryTheme();

  // 设置律师主题
  React.useEffect(() => {
    const lawyerIndustry = INDUSTRIES.lawyer;
    if (lawyerIndustry) {
      setCurrentIndustry(lawyerIndustry);
    }
  }, [setCurrentIndustry]);

  const handleModuleSelect = (module: LawyerModule) => {
    router.push(module.path);
  };

  const handleQuickStart = () => {
    // 直接进入律师通用AI助手
    router.push('/industries/lawyer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* 头部区域 */}
      <div className="relative overflow-hidden bg-white border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center mb-6">
                <div className="p-4 bg-blue-600 rounded-2xl shadow-lg mr-4">
                  <Scale className="w-8 h-8 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
                    律师AI工作台
                  </h1>
                  <p className="text-lg text-blue-600 font-semibold mt-2">
                    Legal AI Assistant Platform
                  </p>
                </div>
              </div>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                专为法律从业者打造的智能工作助手，涵盖合同审查、诉讼支持、法律研究等核心业务场景
              </p>
            </div>
            
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-yellow-500" />
                专业法律模板
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-blue-500" />
                秒级智能生成
              </div>
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2 text-green-500" />
                合规风险控制
              </div>
            </div>

            {/* 快速开始按钮 */}
            <div className="pt-4">
              <Button 
                onClick={handleQuickStart}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                快速开始 - 通用AI助手
              </Button>
            </div>
          </div>
        </div>
        
        {/* 装饰性背景 */}
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
          <div className="w-full h-full bg-gradient-to-l from-blue-600 to-transparent"></div>
        </div>
      </div>

      {/* 专业模块区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            专业法律业务模块
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            针对律师日常工作的不同场景，提供专业化的AI助手服务
          </p>
        </div>

        {/* 模块网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {lawyerModules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              onSelect={handleModuleSelect}
            />
          ))}
        </div>

        {/* 法律声明与统计信息 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-12">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">法律声明</h3>
              <p className="text-yellow-700 text-sm leading-relaxed">
                本AI助手仅提供法律信息参考和工作辅助，不构成正式法律建议。任何重要法律决策应咨询执业律师。
                生成的内容需要专业律师审核确认后方可正式使用。本系统不承担因使用生成内容而产生的任何法律责任。
              </p>
            </div>
          </div>
        </div>

        {/* 底部统计信息 */}
        <div className="text-center">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">29+</div>
              <div className="text-gray-600">专业法律模板</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">5大</div>
              <div className="text-gray-600">核心业务模块</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-purple-600">24/7</div>
              <div className="text-gray-600">智能助手服务</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}