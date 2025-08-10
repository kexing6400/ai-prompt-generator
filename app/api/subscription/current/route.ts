/**
 * 当前用户订阅状态API端点
 * 使用JSON存储系统
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDefaultStore } from '@/lib/storage'
import { cookies } from 'next/headers'

const store = getDefaultStore();


// 强制动态路由 - 防止Vercel部署时的静态生成错误
export const dynamic = 'force-dynamic'
/**
 * 获取当前用户订阅状态
 */
export async function GET(request: NextRequest) {
  try {
    // 从cookie获取用户ID
    const cookieStore = cookies();
    const userId = cookieStore.get('userId')?.value;
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: '未登录',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }
    
    // 获取用户信息
    const user = await store.getUser(userId);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: '用户不存在',
        code: 'USER_NOT_FOUND'
      }, { status: 404 });
    }
    
    // 获取使用量信息
    const usage = await store.getUsage(userId);
    const currentMonth = new Date().toISOString().substring(0, 7);
    const monthlyUsage = usage?.month === currentMonth ? usage : { requests: 0, tokens: 0 };
    
    // 获取订阅限制
    const limits = user.subscription?.limits || {
      generationsPerMonth: 50,
      templatesAccess: 'basic',
      historyDays: 7
    };
    
    // 计算剩余额度
    const remaining = Math.max(0, (limits as any).generationsPerMonth - monthlyUsage.requests);
    
    // 构建响应
    return NextResponse.json({
      success: true,
      data: {
        subscription: {
          id: user.subscription?.id || `sub_${userId}`,
          userEmail: user.email,
          plan: user.plan || 'free',
          status: user.subscription?.status || 'active',
          currentPeriodStart: user.subscription?.startDate || user.createdAt,
          currentPeriodEnd: user.subscription?.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancelAtPeriodEnd: user.subscription?.cancelAtPeriodEnd || false,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        usage: {
          current: monthlyUsage.requests,
          limit: (limits as any).generationsPerMonth,
          remaining,
          percentage: limits.generationsPerMonth > 0 
            ? Math.round((monthlyUsage.requests / limits.generationsPerMonth) * 100)
            : 0,
          resetDate: new Date(Date.now() + (30 - new Date().getDate()) * 24 * 60 * 60 * 1000).toISOString()
        },
        permissions: {
          canGenerate: remaining > 0 || user.plan !== 'free',
          canAccessPremiumTemplates: user.plan !== 'free',
          canExportHistory: user.plan !== 'free',
          canUseAdvancedModels: user.plan === 'team',
          maxHistoryDays: limits.historyDays,
          templatesAccess: limits.templatesAccess
        },
        availableUpgrades: user.plan === 'free' 
          ? [
              {
                plan: 'pro',
                price: 4.99,
                features: ['500次生成/月', '高级模板', '30天历史记录', '优先支持']
              },
              {
                plan: 'team',
                price: 19.99,
                features: ['无限生成', '所有模板', '无限历史', 'GPT-4模型', '团队协作']
              }
            ]
          : user.plan === 'pro'
          ? [
              {
                plan: 'team',
                price: 19.99,
                features: ['无限生成', 'GPT-4模型', '团队协作', 'API访问']
              }
            ]
          : []
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('[Subscription API] 获取订阅状态失败:', error);
    
    return NextResponse.json({
      success: false,
      error: '获取订阅状态失败',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

/**
 * 更新用户订阅偏好设置
 */
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get('userId')?.value;
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: '未登录',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }
    
    const body = await request.json();
    const { preferences } = body;
    
    // 验证偏好设置
    const allowedPreferences = [
      'emailNotifications',
      'usageAlerts', 
      'upgradeReminders',
      'theme',
      'language'
    ];
    
    if (preferences && typeof preferences === 'object') {
      const invalidKeys = Object.keys(preferences).filter(
        key => !allowedPreferences.includes(key)
      );
      
      if (invalidKeys.length > 0) {
        return NextResponse.json({
          success: false,
          error: `无效的偏好设置: ${invalidKeys.join(', ')}`,
          code: 'INVALID_PREFERENCES'
        }, { status: 400 });
      }
    }
    
    // 获取并更新用户
    const user = await store.getUser(userId);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: '用户不存在',
        code: 'USER_NOT_FOUND'
      }, { status: 404 });
    }
    
    // 更新偏好设置
    user.preferences = {
      ...user.preferences,
      ...preferences
    };
    user.updatedAt = new Date().toISOString();
    
    await store.saveUser(user);
    
    return NextResponse.json({
      success: true,
      message: '偏好设置已更新',
      data: {
        userId,
        preferences: user.preferences,
        updatedAt: user.updatedAt
      }
    });
    
  } catch (error: any) {
    console.error('[Subscription API] 更新偏好失败:', error);
    
    return NextResponse.json({
      success: false,
      error: '更新偏好设置失败',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}