'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Briefcase, FileText, Users, Clock } from 'lucide-react';
import Link from 'next/link';
import { LawyerPromptGenerator } from '@/components/lawyer-prompt-generator';

interface ScenarioDetailPageProps {
  industryId: string;
  scenarioId: string;
}

// 场景配置数据
const SCENARIO_CONFIG = {
  litigation: {
    title: '诉讼案件',
    description: '处理民事、刑事和商业诉讼案件的AI助手',
    icon: <Briefcase className="w-6 h-6" />,
    color: 'bg-red-500',
    features: ['案件分析', '证据整理', '辩护策略', '法庭文书'],
    tools: [
      {
        name: '案件分析助手',
        description: '分析案件事实，识别关键法律问题',
        difficulty: '中等',
        estimatedTime: '15-30分钟'
      },
      {
        name: '证据评估工具',
        description: '评估证据效力，制定举证策略',
        difficulty: '高级',
        estimatedTime: '30-45分钟'
      },
      {
        name: '法庭文书生成器',
        description: '生成起诉书、答辩书等诉讼文书',
        difficulty: '中等',
        estimatedTime: '20-40分钟'
      }
    ]
  },
  'contract-review': {
    title: '合同审查',
    description: '智能合同条款分析与风险评估',
    icon: <FileText className="w-6 h-6" />,
    color: 'bg-blue-500',
    features: ['条款分析', '风险识别', '修改建议', '合规检查'],
    tools: [
      {
        name: '合同条款分析器',
        description: '深度分析合同条款，识别潜在风险',
        difficulty: '中等',
        estimatedTime: '10-20分钟'
      },
      {
        name: '风险评估报告',
        description: '生成详细的合同风险评估报告',
        difficulty: '高级',
        estimatedTime: '25-35分钟'
      },
      {
        name: '修改建议生成器',
        description: '提供具体的合同修改建议',
        difficulty: '中等',
        estimatedTime: '15-25分钟'
      }
    ]
  },
  'legal-research': {
    title: '法律研究',
    description: '智能法律条文检索与案例分析',
    icon: <Users className="w-6 h-6" />,
    color: 'bg-green-500',
    features: ['条文检索', '案例分析', '判例研究', '法规更新'],
    tools: [
      {
        name: '法条智能检索',
        description: '基于关键词智能检索相关法律条文',
        difficulty: '简单',
        estimatedTime: '5-15分钟'
      },
      {
        name: '案例相似度分析',
        description: '找出与当前案件相似的历史判例',
        difficulty: '高级',
        estimatedTime: '20-30分钟'
      },
      {
        name: '法规变更追踪',
        description: '追踪相关法规的最新变更',
        difficulty: '中等',
        estimatedTime: '10-20分钟'
      }
    ]
  }
};

export function ScenarioDetailPage({ industryId, scenarioId }: ScenarioDetailPageProps) {
  const [showGenerator, setShowGenerator] = useState(false);
  const scenario = SCENARIO_CONFIG[scenarioId as keyof typeof SCENARIO_CONFIG];

  if (!scenario) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">场景不存在</h1>
          <Link href={`/industries/${industryId}`}>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回行业页面
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (showGenerator) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setShowGenerator(false)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回场景详情
          </Button>
        </div>
        <LawyerPromptGenerator scenario={scenarioId} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 导航 */}
      <div className="mb-6">
        <Link href={`/industries/${industryId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回律师工具
          </Button>
        </Link>
      </div>

      {/* 场景概览 */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 rounded-lg ${scenario.color} text-white`}>
            {scenario.icon}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{scenario.title}</h1>
            <p className="text-gray-600 mt-1">{scenario.description}</p>
          </div>
        </div>

        {/* 功能特性 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(scenario.features || []).map((feature, index) => (
            <Badge key={index} variant="secondary">
              {feature}
            </Badge>
          ))}
        </div>
      </div>

      {/* AI工具列表 */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">可用的AI工具</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(scenario.tools || []).map((tool, index) => (
            <Card key={index} className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">{tool.name}</CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{tool.difficulty}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{tool.estimatedTime}</span>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => setShowGenerator(true)}
                >
                  开始使用
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 快速开始 */}
      <Card>
        <CardHeader>
          <CardTitle>快速开始</CardTitle>
          <CardDescription>
            直接使用我们的智能法律助手生成专业的{scenario.title}相关内容
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            size="lg" 
            onClick={() => setShowGenerator(true)}
            className="w-full md:w-auto"
          >
            启动{scenario.title}AI助手
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}