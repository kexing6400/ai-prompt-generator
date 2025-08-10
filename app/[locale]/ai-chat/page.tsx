'use client';

/**
 * 智能AI对话页面
 * 完全替代传统的模板选择器，提供真正的AI对话体验
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import IntelligentChat from '@/components/ai-conversation/IntelligentChat';
import ExpertAI from '@/components/ai-conversation/ExpertAI';
import { 
  Brain, 
  MessageCircle, 
  Users, 
  Sparkles, 
  ArrowRight,
  CheckCircle,
  Zap,
  Star,
  Clock
} from 'lucide-react';

const AIChatPage: React.FC = () => {
  const [selectedExpert, setSelectedExpert] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'chat' | 'experts'>('chat');

  const handleExpertSelect = (expertId: string) => {
    setSelectedExpert(expertId);
    setActiveTab('chat'); // 选择专家后自动切换到对话
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 顶部导航横幅 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">5层智能AI对话系统</h1>
                <p className="text-blue-100 text-sm">革新的专业AI助手体验</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">实时AI响应</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="text-sm">专家级服务</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                <span className="text-sm">95%满意度</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 系统介绍卡片 */}
        <Card className="mb-8 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              告别传统模板选择器，体验智能AI对话
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Brain className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">需求洞察AI</h3>
                <p className="text-sm text-gray-600">心理学专家深度分析您的真实需求</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">专家匹配AI</h3>
                <p className="text-sm text-gray-600">智能选择最适合的行业专家</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">专业对话AI</h3>
                <p className="text-sm text-gray-600">与行业专家深度对话收集信息</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">内容生成AI</h3>
                <p className="text-sm text-gray-600">基于对话生成专业定制内容</p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full border shadow-sm">
                <Clock className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-900">平均2-3分钟完成专业对话</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <span className="text-green-600 font-medium">获得高质量专业内容</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 主要功能标签页 */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'chat' | 'experts')}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              智能对话
              {selectedExpert && (
                <Badge variant="secondary" className="ml-2">
                  已选专家
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="experts" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              选择专家
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-6">
            {!selectedExpert ? (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    请先选择专家
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    选择最适合您需求的AI专家，开启专业对话体验
                  </p>
                  <Button 
                    onClick={() => setActiveTab('experts')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  >
                    选择AI专家
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <IntelligentChat />
            )}
          </TabsContent>

          <TabsContent value="experts" className="space-y-6">
            <ExpertAI 
              onSelectExpert={handleExpertSelect} 
              selectedExpertId={selectedExpert}
            />
          </TabsContent>
        </Tabs>

        {/* 底部特色展示 */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">即时响应</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                平均响应时间2-3分钟，告别漫长等待，享受即时专业服务
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">专业保障</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                每位AI专家都具备丰富的行业经验，确保提供专业级服务质量
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">满意保证</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                95%用户满意度，7天内不满意可重新对话，直到您满意为止
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 使用流程指引 */}
        <Card className="mt-8 bg-gradient-to-r from-gray-50 to-blue-50">
          <CardHeader>
            <CardTitle className="text-center">
              🚀 三步开启专业AI对话
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                  1
                </div>
                <h3 className="font-semibold mb-2">选择专家</h3>
                <p className="text-sm text-gray-600">
                  根据您的需求选择最适合的行业AI专家
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                  2
                </div>
                <h3 className="font-semibold mb-2">描述需求</h3>
                <p className="text-sm text-gray-600">
                  详细描述您的具体需求和期望效果
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                  3
                </div>
                <h3 className="font-semibold mb-2">获得结果</h3>
                <p className="text-sm text-gray-600">
                  获得专业、定制化的解决方案和内容
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIChatPage;