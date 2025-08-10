'use client';

/**
 * 垂直行业专家AI系统组件
 * 为不同行业提供专业化的AI专家服务
 * 
 * 支持行业：
 * - 教师AI：课程设计、教学评估、学生辅导
 * - 律师AI：法律文书、案例分析、合同审查
 * - 会计AI：财务报表、税务规划、审计报告
 * - 房产AI：市场分析、客户沟通、交易文档
 * - 保险AI：风险评估、理赔处理、产品推荐
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  Scale, 
  Calculator, 
  Home, 
  Shield,
  Briefcase,
  Stethoscope,
  TrendingUp,
  User,
  MessageCircle,
  Sparkles,
  CheckCircle
} from 'lucide-react';

// 专家类型定义
interface ExpertProfile {
  id: string;
  name: string;
  title: string;
  icon: React.ComponentType<any>;
  description: string;
  expertise: string[];
  experience: string;
  specialties: string[];
  successRate: number;
  avgResponseTime: string;
  color: string;
  bgColor: string;
}

// 专家配置数据
const EXPERT_PROFILES: ExpertProfile[] = [
  {
    id: 'teacher',
    name: '李明教授',
    title: '教育专家AI',
    icon: GraduationCap,
    description: '资深教育专家，专注课程设计与教学创新',
    expertise: ['课程设计', '教学方法', '学习评估', '教育心理学', '数字化教学'],
    experience: '15年高等教育经验，培养学生3000+名',
    specialties: [
      '个性化学习方案设计',
      '在线课程开发',
      '学习效果评估',
      '教学质量提升',
      '学生心理辅导'
    ],
    successRate: 94,
    avgResponseTime: '2分钟',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200'
  },
  {
    id: 'lawyer',
    name: '王建华律师',
    title: '法律专家AI',
    icon: Scale,
    description: '资深律师，精通商业法律事务',
    expertise: ['合同法', '公司法', '知识产权', '劳动法', '诉讼实务'],
    experience: '18年执业经验，处理案件1500+起',
    specialties: [
      '合同起草与审查',
      '公司法律事务',
      '知识产权保护',
      '劳动纠纷处理',
      '诉讼策略制定'
    ],
    successRate: 96,
    avgResponseTime: '3分钟',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200'
  },
  {
    id: 'accountant',
    name: '张会计师',
    title: '财务专家AI',
    icon: Calculator,
    description: '注册会计师，财务规划与税务专家',
    expertise: ['财务分析', '税务筹划', '审计', '成本控制', '投资分析'],
    experience: '12年财务管理经验，服务企业500+家',
    specialties: [
      '财务报表分析',
      '税务优化策略',
      '成本控制方案',
      '投资决策分析',
      '内控制度设计'
    ],
    successRate: 93,
    avgResponseTime: '2.5分钟',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200'
  },
  {
    id: 'realtor',
    name: '刘房产专家',
    title: '房产专家AI',
    icon: Home,
    description: '资深房地产顾问，市场分析专家',
    expertise: ['市场分析', '投资策略', '交易流程', '房产评估', '政策解读'],
    experience: '10年房地产经验，成交额10亿+',
    specialties: [
      '房产投资分析',
      '市场趋势预测',
      '交易风险评估',
      '房产价值评估',
      '购房策略制定'
    ],
    successRate: 91,
    avgResponseTime: '3.5分钟',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200'
  },
  {
    id: 'insurance',
    name: '陈保险专家',
    title: '保险专家AI',
    icon: Shield,
    description: '保险规划师，风险管理专家',
    expertise: ['风险评估', '保险产品', '理赔服务', '保险规划', '风险管理'],
    experience: '8年保险行业经验，服务客户2000+名',
    specialties: [
      '个人保险规划',
      '企业风险管理',
      '理赔流程优化',
      '保险产品设计',
      '风险识别评估'
    ],
    successRate: 92,
    avgResponseTime: '2.8分钟',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200'
  }
];

interface ExpertAIProps {
  onSelectExpert?: (expertId: string) => void;
  selectedExpertId?: string;
}

const ExpertAI: React.FC<ExpertAIProps> = ({ onSelectExpert, selectedExpertId }) => {
  const [hoveredExpert, setHoveredExpert] = useState<string | null>(null);

  const handleExpertSelect = (expertId: string) => {
    onSelectExpert?.(expertId);
  };

  const renderExpertCard = (expert: ExpertProfile) => {
    const isSelected = selectedExpertId === expert.id;
    const isHovered = hoveredExpert === expert.id;

    return (
      <Card 
        key={expert.id}
        className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
          isSelected 
            ? `${expert.bgColor} border-2 shadow-lg` 
            : isHovered 
            ? 'shadow-md' 
            : ''
        }`}
        onMouseEnter={() => setHoveredExpert(expert.id)}
        onMouseLeave={() => setHoveredExpert(null)}
        onClick={() => handleExpertSelect(expert.id)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isSelected ? expert.color.replace('text-', 'bg-').replace('-600', '-100') : 'bg-gray-100'
            }`}>
              <expert.icon className={`w-6 h-6 ${isSelected ? expert.color : 'text-gray-600'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{expert.name}</CardTitle>
                {isSelected && (
                  <Badge variant="default" className="bg-green-500">
                    已选中
                  </Badge>
                )}
              </div>
              <p className={`text-sm font-medium ${expert.color}`}>
                {expert.title}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">{expert.successRate}%</span>
              </div>
              <p className="text-xs text-gray-500">成功率</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <p className="text-gray-600 text-sm mb-4">{expert.description}</p>
          
          {/* 专业经验 */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">专业经验</span>
            </div>
            <p className="text-xs text-gray-600 pl-6">{expert.experience}</p>
          </div>

          {/* 核心技能 */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">核心技能</span>
            </div>
            <div className="flex flex-wrap gap-1 pl-6">
              {expert.expertise.slice(0, 3).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {expert.expertise.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{expert.expertise.length - 3}
                </Badge>
              )}
            </div>
          </div>

          {/* 专业特长 */}
          {(isSelected || isHovered) && (
            <div className="mb-4 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">专业特长</span>
              </div>
              <div className="space-y-1 pl-6">
                {expert.specialties.slice(0, 3).map((specialty, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${expert.color.replace('text-', 'bg-')}`}></div>
                    <span className="text-xs text-gray-600">{specialty}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 响应时间 */}
          <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-3">
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              <span>平均响应：{expert.avgResponseTime}</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>在线</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* 选择按钮 */}
          <Button 
            className={`w-full mt-4 ${
              isSelected 
                ? `${expert.color.replace('text-', 'bg-').replace('-600', '-500')} text-white`
                : ''
            }`}
            variant={isSelected ? 'default' : 'outline'}
            onClick={(e) => {
              e.stopPropagation();
              handleExpertSelect(expert.id);
            }}
          >
            {isSelected ? '开始对话' : `选择${expert.title}`}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* 标题部分 */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          选择您的专属AI专家
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          我们的AI专家团队拥有丰富的行业经验和专业知识，
          能够为您提供精准、实用的专业服务和解决方案。
        </p>
      </div>

      {/* 专家卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {EXPERT_PROFILES.map(renderExpertCard)}
      </div>

      {/* 选中专家的详细信息 */}
      {selectedExpertId && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <CheckCircle className="w-5 h-5" />
              已选择专家
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const selectedExpert = EXPERT_PROFILES.find(e => e.id === selectedExpertId);
              if (!selectedExpert) return null;

              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedExpert.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                      <selectedExpert.icon className={`w-5 h-5 ${selectedExpert.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{selectedExpert.name}</h3>
                      <p className={`text-sm ${selectedExpert.color}`}>{selectedExpert.title}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">专业领域</h4>
                      <div className="space-y-1">
                        {selectedExpert.specialties.map((specialty, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${selectedExpert.color.replace('text-', 'bg-')}`}></div>
                            <span className="text-sm text-gray-600">{specialty}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">核心能力</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedExpert.expertise.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>专业经验：</strong>{selectedExpert.experience}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>成功率：{selectedExpert.successRate}%</span>
                      <span>平均响应：{selectedExpert.avgResponseTime}</span>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>在线服务中</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* 提示信息 */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
          <Sparkles className="w-4 h-4" />
          <span>选择专家后将开启专业对话模式，享受个性化服务</span>
        </div>
      </div>
    </div>
  );
};

export default ExpertAI;