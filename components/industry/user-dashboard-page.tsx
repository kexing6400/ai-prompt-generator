'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { INDUSTRIES } from '@/lib/constants/industries';
import { useIndustryTheme } from '@/components/providers/industry-theme-provider';
import { 
  BarChart3,
  Calendar,
  Clock,
  Star,
  TrendingUp,
  Users,
  Zap,
  Target,
  Award,
  Settings,
  Crown,
  ArrowRight,
  Activity,
  BookOpen,
  Download,
  Share2
} from 'lucide-react';

interface UserStats {
  totalPrompts: number;
  thisMonthPrompts: number;
  favoriteCount: number;
  mostUsedIndustry: string;
  avgGenerationTime: string;
  streak: number;
  subscription: 'free' | 'pro' | 'enterprise';
  remainingQuota: number;
  totalQuota: number;
}

interface RecentActivity {
  id: string;
  title: string;
  industryId: string;
  createdAt: string;
  type: 'generate' | 'favorite' | 'share';
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  industryId: string;
  scenarioId: string;
  icon: React.ReactNode;
  isPopular?: boolean;
}

export function UserDashboardPage() {
  const router = useRouter();
  const { currentIndustry, setCurrentIndustry } = useIndustryTheme();
  
  const [userStats, setUserStats] = useState<UserStats>({
    totalPrompts: 0,
    thisMonthPrompts: 0,
    favoriteCount: 0,
    mostUsedIndustry: 'lawyer',
    avgGenerationTime: '2.3分钟',
    streak: 0,
    subscription: 'free',
    remainingQuota: 45,
    totalQuota: 50
  });

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [quickActions] = useState<QuickAction[]>([
    {
      id: '1',
      title: '合同审查分析',
      description: '快速审查商业合同条款',
      industryId: 'lawyer',
      scenarioId: 'contract-review',
      icon: <Target className="w-5 h-5" />,
      isPopular: true
    },
    {
      id: '2',
      title: '教学方案设计',
      description: '设计结构化教学计划',
      industryId: 'teacher',
      scenarioId: 'lesson-planning',
      icon: <BookOpen className="w-5 h-5" />,
      isPopular: true
    },
    {
      id: '3',
      title: '房产市场分析',
      description: '深度分析房产市场趋势',
      industryId: 'realtor',
      scenarioId: 'market-analysis',
      icon: <BarChart3 className="w-5 h-5" />
    }
  ]);

  // 从localStorage加载用户数据
  useEffect(() => {
    const historyItems = JSON.parse(localStorage.getItem('promptHistory') || '[]');
    const now = new Date();
    const thisMonth = historyItems.filter((item: any) => {
      const itemDate = new Date(item.createdAt);
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    });

    const industryCount: Record<string, number> = {};
    historyItems.forEach((item: any) => {
      industryCount[item.industryId] = (industryCount[item.industryId] || 0) + 1;
    });

    const mostUsedIndustry = Object.keys(industryCount).reduce((a, b) => 
      industryCount[a] > industryCount[b] ? a : b, 'lawyer'
    );

    setUserStats({
      totalPrompts: historyItems.length,
      thisMonthPrompts: thisMonth.length,
      favoriteCount: historyItems.filter((item: any) => item.isFavorite).length,
      mostUsedIndustry,
      avgGenerationTime: '2.3分钟',
      streak: 5,
      subscription: 'free',
      remainingQuota: Math.max(0, 50 - historyItems.length),
      totalQuota: 50
    });

    // 生成最近活动
    const activities = historyItems.slice(0, 5).map((item: any, index: number) => ({
      id: item.id,
      title: item.title,
      industryId: item.industryId,
      createdAt: item.createdAt,
      type: index % 3 === 0 ? 'generate' : index % 3 === 1 ? 'favorite' : 'share'
    }));
    setRecentActivities(activities);
  }, []);

  const handleQuickAction = (action: QuickAction) => {
    setCurrentIndustry(action.industryId);
    router.push(`/industries/${action.industryId}/generate?scenario=${action.scenarioId}`);
  };

  const handleIndustrySelect = (industryId: string) => {
    setCurrentIndustry(industryId);
    router.push(`/industries/${industryId}`);
  };

  const getSubscriptionBadgeColor = (subscription: string) => {
    switch (subscription) {
      case 'pro': return 'bg-blue-100 text-blue-800';
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubscriptionTitle = (subscription: string) => {
    switch (subscription) {
      case 'pro': return 'Pro会员';
      case 'enterprise': return '企业版';
      default: return '免费版';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'favorite': return <Star className="w-4 h-4 text-yellow-500" />;
      case 'share': return <Share2 className="w-4 h-4 text-blue-500" />;
      default: return <Zap className="w-4 h-4 text-green-500" />;
    }
  };

  const getActivityText = (type: string) => {
    switch (type) {
      case 'favorite': return '收藏了';
      case 'share': return '分享了';
      default: return '生成了';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return '刚刚';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}小时前`;
    } else {
      return `${Math.floor(diffInHours / 24)}天前`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      {/* 头部 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">工作台</h1>
              <p className="text-gray-600">欢迎回来！让我们继续提升您的AI工作效率</p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className={getSubscriptionBadgeColor(userStats.subscription)}>
                {userStats.subscription === 'pro' && <Crown className="w-3 h-3 mr-1" />}
                {getSubscriptionTitle(userStats.subscription)}
              </Badge>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                设置
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧主要内容 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 统计概览 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Zap className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{userStats.totalPrompts}</p>
                      <p className="text-sm text-gray-600">总生成数</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{userStats.thisMonthPrompts}</p>
                      <p className="text-sm text-gray-600">本月生成</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Star className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{userStats.favoriteCount}</p>
                      <p className="text-sm text-gray-600">收藏数量</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Award className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{userStats.streak}</p>
                      <p className="text-sm text-gray-600">连续使用</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 使用配额 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-blue-600" />
                  本月使用配额
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">已使用</span>
                    <span className="font-medium">
                      {userStats.totalQuota - userStats.remainingQuota} / {userStats.totalQuota}
                    </span>
                  </div>
                  <Progress 
                    value={((userStats.totalQuota - userStats.remainingQuota) / userStats.totalQuota) * 100} 
                    className="h-2"
                  />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      剩余 {userStats.remainingQuota} 次生成机会
                    </span>
                    {userStats.subscription === 'free' && (
                      <Button variant="outline" size="sm">
                        <Crown className="w-3 h-3 mr-1" />
                        升级Pro
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 快捷操作 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-green-600" />
                  快速开始
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action) => {
                    const industry = INDUSTRIES[action.industryId];
                    return (
                      <Card 
                        key={action.id}
                        className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-gray-300"
                        onClick={() => handleQuickAction(action)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="p-2 rounded-lg"
                              style={{ backgroundColor: industry?.color.accent || '#f3f4f6' }}
                            >
                              {action.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-gray-900">{action.title}</h4>
                                {action.isPopular && (
                                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                                    热门
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{action.description}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 行业入口 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-purple-600" />
                  专业领域
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {Object.values(INDUSTRIES).map((industry) => {
                    const Icon = industry.icon;
                    const isActive = userStats.mostUsedIndustry === industry.id;
                    
                    return (
                      <Card
                        key={industry.id}
                        className={`cursor-pointer hover:shadow-md transition-all duration-200 ${
                          isActive ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => handleIndustrySelect(industry.id)}
                      >
                        <CardContent className="p-4 text-center">
                          <div 
                            className="p-3 rounded-lg mx-auto mb-2 w-fit"
                            style={{ backgroundColor: industry.color.primary }}
                          >
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-sm font-medium text-gray-900">{industry.name}</p>
                          {isActive && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              最常用
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧边栏 */}
          <div className="space-y-6">
            {/* 最近活动 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Clock className="w-4 h-4 mr-2 text-gray-600" />
                  最近活动
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity) => {
                      const industry = INDUSTRIES[activity.industryId];
                      return (
                        <div key={activity.id} className="flex items-center space-x-3 py-2">
                          <div className="flex-shrink-0">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 truncate">
                              {getActivityText(activity.type)}{activity.title}
                            </p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              {industry && (
                                <>
                                  <div 
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: industry.color.primary }}
                                  ></div>
                                  <span>{industry.name}</span>
                                  <span>•</span>
                                </>
                              )}
                              <span>{formatDate(activity.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">暂无最近活动</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 性能统计 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <BarChart3 className="w-4 h-4 mr-2 text-gray-600" />
                  使用统计
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">平均生成时间</span>
                    <span className="text-sm font-medium">{userStats.avgGenerationTime}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">最常用行业</span>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: INDUSTRIES[userStats.mostUsedIndustry]?.color.primary }}
                      ></div>
                      <span className="text-sm font-medium">
                        {INDUSTRIES[userStats.mostUsedIndustry]?.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">连续使用天数</span>
                    <span className="text-sm font-medium">{userStats.streak} 天</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 快捷导航 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Target className="w-4 h-4 mr-2 text-gray-600" />
                  快捷导航
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start h-auto p-3"
                    onClick={() => router.push('/history')}
                  >
                    <Clock className="w-4 h-4 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">历史记录</div>
                      <div className="text-xs text-gray-500">{userStats.totalPrompts} 条记录</div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start h-auto p-3"
                    onClick={() => router.push('/favorites')}
                  >
                    <Star className="w-4 h-4 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">我的收藏</div>
                      <div className="text-xs text-gray-500">{userStats.favoriteCount} 个收藏</div>
                    </div>
                  </Button>

                  <Button 
                    variant="ghost" 
                    className="w-full justify-start h-auto p-3"
                  >
                    <Download className="w-4 h-4 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">导出数据</div>
                      <div className="text-xs text-gray-500">备份您的数据</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}