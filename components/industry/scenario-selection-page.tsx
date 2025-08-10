'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIndustryTheme } from '@/components/providers/industry-theme-provider';
import { 
  Search, 
  ArrowRight, 
  Clock, 
  Star, 
  Filter,
  ChevronLeft,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react';

interface Scenario {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  isPopular?: boolean;
  isFavorite?: boolean;
  tags: string[];
}

// 模拟场景数据 - 实际项目中应该从API获取
const SCENARIO_DATA: Record<string, Scenario[]> = {
  lawyer: [
    {
      id: 'contract-review',
      title: '合同审查分析',
      description: '全面审查商业合同条款，识别风险点和改进建议',
      category: '合同管理',
      difficulty: 'intermediate',
      estimatedTime: '3-5分钟',
      isPopular: true,
      tags: ['合同', '风险评估', '条款分析']
    },
    {
      id: 'legal-research',
      title: '法律条文研究',
      description: '深入研究相关法律条文，提供案例引用和解释',
      category: '法律研究',
      difficulty: 'advanced',
      estimatedTime: '5-8分钟',
      tags: ['法条', '案例', '研究']
    },
    {
      id: 'document-drafting',
      title: '法律文书起草',
      description: '起草各类法律文书，确保格式规范和内容完整',
      category: '文书起草',
      difficulty: 'beginner',
      estimatedTime: '2-4分钟',
      isPopular: true,
      tags: ['文书', '格式', '起草']
    }
  ],
  teacher: [
    {
      id: 'lesson-planning',
      title: '教学方案设计',
      description: '设计结构化教学方案，包含目标、活动和评估',
      category: '教学设计',
      difficulty: 'intermediate',
      estimatedTime: '4-6分钟',
      isPopular: true,
      tags: ['教案', '目标', '活动']
    },
    {
      id: 'student-assessment',
      title: '学生能力评估',
      description: '制定多维度学生评估方案和评价标准',
      category: '学生评估',
      difficulty: 'advanced',
      estimatedTime: '3-5分钟',
      tags: ['评估', '标准', '多维度']
    }
  ],
  // 其他行业的场景数据...
};

interface ScenarioCardProps {
  scenario: Scenario;
  industryColor: string;
  onSelect: (scenario: Scenario) => void;
}

function ScenarioCard({ scenario, industryColor, onSelect }: ScenarioCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '入门';
      case 'intermediate': return '中级';
      case 'advanced': return '高级';
      default: return '未知';
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-gray-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 group-hover:text-gray-700">
                {scenario.title}
              </h3>
              {scenario.isPopular && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  热门
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Badge variant="outline" className={getDifficultyColor(scenario.difficulty)}>
                {getDifficultyText(scenario.difficulty)}
              </Badge>
              <Badge variant="outline" className="text-gray-600">
                {scenario.category}
              </Badge>
            </div>
          </div>

          {scenario.isFavorite && (
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            {scenario.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-1" />
              {scenario.estimatedTime}
            </div>

            <Button
              size="sm"
              onClick={() => onSelect(scenario)}
              style={{ backgroundColor: industryColor }}
              className="group-hover:shadow-md transition-shadow duration-300"
            >
              使用模板
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </div>

          {/* 标签 */}
          {scenario.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-100">
              {scenario.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs bg-gray-50">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ScenarioSelectionPageProps {
  industryId: string;
}

export function ScenarioSelectionPage({ industryId }: ScenarioSelectionPageProps) {
  const router = useRouter();
  const { currentIndustry } = useIndustryTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const scenarios = SCENARIO_DATA[industryId] || [];

  // 获取所有分类
  const categories = useMemo(() => {
    const cats = Array.from(new Set(scenarios.map(s => s.category)));
    return ['all', ...cats];
  }, [scenarios]);

  // 过滤场景
  const filteredScenarios = useMemo(() => {
    return scenarios.filter(scenario => {
      const matchesSearch = scenario.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          scenario.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || scenario.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [scenarios, searchTerm, selectedCategory]);

  const handleScenarioSelect = (scenario: Scenario) => {
    router.push(`/industries/${industryId}/generate?scenario=${scenario.id}`);
  };

  const handleBackToIndustries = () => {
    router.push('/');
  };

  if (!currentIndustry) {
    return <div>加载中...</div>;
  }

  const industryColor = currentIndustry.color.primary;

  return (
    <div 
      className="min-h-screen"
      style={{ background: `linear-gradient(135deg, ${currentIndustry.color.accent}, white)` }}
    >
      {/* 头部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToIndustries}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                返回行业选择
              </Button>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: currentIndustry.color.primary }}
                >
                  <currentIndustry.icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="font-semibold text-gray-900">{currentIndustry.name}</h1>
                  <p className="text-sm text-gray-600">专业场景模板</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜索和筛选区域 */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 搜索框 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索场景模板..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 分类筛选 */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有分类</option>
                {categories.slice(1).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              找到 <span className="font-medium text-gray-900">{filteredScenarios.length}</span> 个场景模板
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4" />
                快速生成
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                专业定制
              </div>
            </div>
          </div>
        </div>

        {/* 场景网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              industryColor={industryColor}
              onSelect={handleScenarioSelect}
            />
          ))}
        </div>

        {filteredScenarios.length === 0 && (
          <div className="text-center py-16">
            <div className="space-y-4">
              <div className="text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-4" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">未找到匹配的场景</h3>
              <p className="text-gray-600">
                尝试调整搜索关键词或选择不同的分类
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}