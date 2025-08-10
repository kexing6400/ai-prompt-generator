/**
 * 当前用户订阅状态API端点
 * 使用JSON存储系统
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDefaultStore } from '@/lib/storage'
import { cookies } from 'next/headers'

const store = getDefaultStore();

/**
 * 获取当前用户订阅状态
 */
export async function GET(request: NextRequest) {
  try {
    // 完全免费策略：不需要认证，返回默认免费无限状态
    const cookieStore = cookies();
    const userId = cookieStore.get('userId')?.value || 'anonymous';
    
    // 获取使用量信息（仅用于统计，不影响使用）
    let monthlyUsage = { requests: 0, tokens: 0 };
    if (userId !== 'anonymous') {
      try {
        const user = await store.getUser(userId);
        if (user) {
          const usage = await store.getUsage(userId);
          monthlyUsage = usage ? { requests: usage.requests || 0, tokens: usage.tokens || 0 } : { requests: 0, tokens: 0 };
        }
      } catch (error) {
        // 忽略错误，使用默认值
        console.log('[Subscription API] 获取使用量失败，使用默认值');
      }
    }
    
    // 完全免费：无限制
    const limits = {
      generationsPerMonth: 999999, // 显示为无限
      templatesAccess: 'all',
      historyDays: 999999
    };
    
    // 剩余额度：始终显示为无限
    const remaining = 999999;
    
    // 构建响应
    return NextResponse.json({
      success: true,
      data: {
        subscription: {
          id: `sub_free_unlimited`,
          userEmail: 'free@aiprompts.ink',
          plan: 'free',
          status: 'active',
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 一年后
          cancelAtPeriodEnd: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        usage: {
          current: monthlyUsage.requests,
          limit: limits.generationsPerMonth,
          remaining,
          percentage: limits.generationsPerMonth > 0 
            ? Math.round((monthlyUsage.requests / limits.generationsPerMonth) * 100)
            : 0,
          resetDate: new Date(Date.now() + (30 - new Date().getDate()) * 24 * 60 * 60 * 1000).toISOString()
        },
        permissions: {
          canGenerate: true, // 完全免费，始终可以生成
          canAccessPremiumTemplates: true, // 所有模板免费
          canExportHistory: true, // 可以导出
          canUseAdvancedModels: true, // 可以使用所有模型
          maxHistoryDays: 999999,
          templatesAccess: 'all'
        },
        availableUpgrades: [] // 不需要升级，已经是完全免费
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