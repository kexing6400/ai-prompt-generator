'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { INDUSTRIES, INDUSTRY_IDS, Industry } from '@/lib/constants/industries';
import { useIndustryTheme } from '@/components/providers/industry-theme-provider';
import { ArrowRight, Star, TrendingUp } from 'lucide-react';

interface IndustryCardProps {
  industry: Industry;
  onSelect: (industry: Industry) => void;
  isPopular?: boolean;
}

function IndustryCard({ industry, onSelect, isPopular }: IndustryCardProps) {
  const Icon = industry.icon;
  
  return (
    <Card 
      className="relative overflow-hidden border-2 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105"
      onClick={() => onSelect(industry)}
      style={{ 
        borderColor: industry.color.primary + '20',
        background: `linear-gradient(135deg, ${industry.color.accent}, white)`
      }}
    >
      {isPopular && (
        <div className="absolute top-4 right-4">
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Star className="w-3 h-3 mr-1" />
            热门
          </Badge>
        </div>
      )}
      
      <CardContent className="p-8">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* 行业图标 */}
          <div 
            className="p-6 rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300"
            style={{ backgroundColor: industry.color.primary }}
          >
            <Icon className="w-8 h-8 text-white" />
          </div>
          
          {/* 行业信息 */}
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-900">
              {industry.name}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {industry.description}
            </p>
          </div>
          
          {/* 特性标签 */}
          <div className="flex flex-wrap gap-2 justify-center">
            {industry.features.slice(0, 2).map((feature) => (
              <Badge 
                key={feature} 
                variant="outline" 
                className="text-xs"
                style={{ borderColor: industry.color.primary }}
              >
                {feature}
              </Badge>
            ))}
          </div>
          
          {/* 场景数量和按钮 */}
          <div className="pt-4 w-full space-y-3">
            <div className="flex items-center justify-center text-gray-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span className="text-sm">{industry.scenarios} 个专业场景</span>
            </div>
            
            <Button 
              className="w-full group-hover:shadow-md transition-all duration-300"
              style={{ backgroundColor: industry.color.primary }}
            >
              开始使用
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function IndustrySelectionPage() {
  const router = useRouter();
  const { setCurrentIndustry } = useIndustryTheme();

  const handleIndustrySelect = (industry: Industry) => {
    setCurrentIndustry(industry);
    router.push(`/industries/${industry.id}`);
  };

  // 标记热门行业
  const popularIndustries = ['lawyer', 'teacher', 'realtor'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      {/* 头部区域 */}
      <div className="relative overflow-hidden bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
                AI Prompt Builder
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {' '}Pro
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                专为专业人士打造的智能提示词生成器，30秒内完成专业AI提示词创建
              </p>
            </div>
            
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                零学习成本
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                30秒生成
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                专业定制
              </div>
            </div>
          </div>
        </div>
        
        {/* 装饰性背景 */}
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-5">
          <div className="w-full h-full bg-gradient-to-l from-blue-600 to-transparent"></div>
        </div>
      </div>

      {/* 行业选择区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            选择您的专业领域
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            每个行业都有专属的AI提示词模板和场景，让您的工作更加高效专业
          </p>
        </div>

        {/* 行业网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {INDUSTRY_IDS.map((industryId) => {
            const industry = INDUSTRIES[industryId];
            return (
              <IndustryCard
                key={industry.id}
                industry={industry}
                onSelect={handleIndustrySelect}
                isPopular={popularIndustries.includes(industry.id)}
              />
            );
          })}
        </div>

        {/* 底部信息 */}
        <div className="mt-16 text-center">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">109+</div>
              <div className="text-gray-600">专业场景模板</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">30秒</div>
              <div className="text-gray-600">平均生成时间</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-purple-600">5大</div>
              <div className="text-gray-600">垂直行业深度定制</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}