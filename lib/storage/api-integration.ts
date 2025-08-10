/**
 * JSON存储系统与Next.js API集成示例
 * 演示如何在API路由中使用存储系统
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDefaultStore, createNewUser, JsonStoreError, ErrorCodes } from './json-store';
import { getCurrentDateString } from './utils';

// 获取存储实例
const store = getDefaultStore({
  dataPath: process.env.NODE_ENV === 'production' ? '/tmp/data' : './data',
  enableCache: true,
  encryptionKey: process.env.STORAGE_ENCRYPTION_KEY
});

/**
 * 用户注册API
 * POST /api/users/register
 */
export async function handleUserRegister(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, plan = 'free' } = body;

    // 验证输入
    if (!email || !name) {
      return NextResponse.json(
        { error: '邮箱和姓名是必需的' },
        { status: 400 }
      );
    }

    // 检查用户是否已存在
    const existingUser = await store.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 409 }
      );
    }

    // 创建新用户
    const newUser = createNewUser(email, name, plan);
    const result = await store.saveUser(newUser);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          plan: newUser.subscription.plan,
          limits: newUser.subscription.limits
        }
      }, { status: 201 });
    } else {
      throw new Error('Failed to create user');
    }

  } catch (error: any) {
    console.error('User registration error:', error);
    
    if (error instanceof JsonStoreError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * 获取用户信息API
 * GET /api/users/[id]
 */
export async function handleGetUser(userId: string) {
  try {
    const user = await store.getUser(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 不返回敏感信息
    const publicUserData = {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      subscription: {
        plan: user.subscription.plan,
        status: user.subscription.status,
        limits: user.subscription.limits
      },
      preferences: user.preferences
    };

    return NextResponse.json({
      success: true,
      data: publicUserData
    });

  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: '获取用户信息失败' },
      { status: 500 }
    );
  }
}

/**
 * 更新用户信息API
 * PATCH /api/users/[id]
 */
export async function handleUpdateUser(userId: string, request: NextRequest) {
  try {
    const body = await request.json();
    const { name, preferences, emailVerified } = body;

    // 构建更新数据
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (preferences !== undefined) updates.preferences = preferences;
    if (emailVerified !== undefined) updates.emailVerified = emailVerified;

    const result = await store.updateUser(userId, updates);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          id: result.data!.id,
          email: result.data!.email,
          name: result.data!.name,
          updatedAt: result.data!.updatedAt
        }
      });
    } else {
      throw new Error('Failed to update user');
    }

  } catch (error: any) {
    console.error('Update user error:', error);
    
    if (error instanceof JsonStoreError) {
      if (error.code === ErrorCodes.USER_NOT_FOUND) {
        return NextResponse.json(
          { error: '用户不存在' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: '更新用户信息失败' },
      { status: 500 }
    );
  }
}

/**
 * 记录API使用量
 * POST /api/usage/track
 */
export async function handleTrackUsage(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      apiCall, 
      tokens = 0, 
      responseTime = 0,
      error = false 
    } = body;

    if (!userId || !apiCall) {
      return NextResponse.json(
        { error: '用户ID和API调用类型是必需的' },
        { status: 400 }
      );
    }

    // 获取当前使用量
    const currentUsage = await store.getUsage(userId) || {
      userId,
      date: getCurrentDateString(),
      month: getCurrentDateString().substring(0, 7),
      requests: 0,
      tokens: 0,
      generatedPrompts: 0,
      documentsProcessed: 0,
      apiCalls: {},
      errors: 0,
      avgResponseTime: 0
    };

    // 更新使用量
    const updatedUsage = {
      ...currentUsage,
      requests: currentUsage.requests + 1,
      tokens: currentUsage.tokens + tokens,
      apiCalls: {
        ...currentUsage.apiCalls,
        [apiCall]: (currentUsage.apiCalls[apiCall] || 0) + 1
      },
      errors: error ? currentUsage.errors + 1 : currentUsage.errors,
      avgResponseTime: responseTime > 0 
        ? ((currentUsage.avgResponseTime * currentUsage.requests) + responseTime) / (currentUsage.requests + 1)
        : currentUsage.avgResponseTime
    };

    const result = await store.updateUsage(userId, updatedUsage);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          dailyRequests: result.data!.requests,
          dailyTokens: result.data!.tokens,
          apiCalls: result.data!.apiCalls
        }
      });
    } else {
      throw new Error('Failed to track usage');
    }

  } catch (error: any) {
    console.error('Track usage error:', error);
    return NextResponse.json(
      { error: '记录使用量失败' },
      { status: 500 }
    );
  }
}

/**
 * 检查用户配额
 * GET /api/usage/quota/[userId]
 */
export async function handleCheckQuota(userId: string) {
  try {
    const user = await store.getUser(userId);
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    const monthlySummary = await store.getMonthlyUsageSummary(userId);
    const dailyUsage = await store.getUsage(userId);

    const quotaInfo = {
      plan: user.subscription.plan,
      limits: user.subscription.limits,
      usage: {
        daily: {
          requests: dailyUsage?.requests || 0,
          tokens: dailyUsage?.tokens || 0,
          prompts: dailyUsage?.generatedPrompts || 0
        },
        monthly: {
          requests: monthlySummary?.totalRequests || 0,
          tokens: monthlySummary?.totalTokens || 0,
          prompts: monthlySummary?.totalPrompts || 0
        }
      },
      remaining: {
        dailyRequests: Math.max(0, user.subscription.limits.dailyRequests - (dailyUsage?.requests || 0)),
        monthlyRequests: Math.max(0, user.subscription.limits.monthlyRequests - (monthlySummary?.totalRequests || 0))
      },
      isQuotaExceeded: {
        daily: (dailyUsage?.requests || 0) >= user.subscription.limits.dailyRequests,
        monthly: (monthlySummary?.totalRequests || 0) >= user.subscription.limits.monthlyRequests
      }
    };

    return NextResponse.json({
      success: true,
      data: quotaInfo
    });

  } catch (error: any) {
    console.error('Check quota error:', error);
    return NextResponse.json(
      { error: '检查配额失败' },
      { status: 500 }
    );
  }
}

/**
 * 升级订阅
 * POST /api/subscription/upgrade
 */
export async function handleUpgradeSubscription(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, plan, paymentMethod } = body;

    if (!userId || !plan) {
      return NextResponse.json(
        { error: '用户ID和订阅计划是必需的' },
        { status: 400 }
      );
    }

    // 验证订阅计划
    const validPlans = ['free', 'pro', 'enterprise'];
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { error: '无效的订阅计划' },
        { status: 400 }
      );
    }

    // 设置新的限制
    const newLimits = plan === 'pro' ? {
      dailyRequests: 1000,
      monthlyRequests: 30000,
      maxTokensPerRequest: 8000,
      maxPromptsPerDay: 500,
      maxDocumentSize: 50
    } : plan === 'enterprise' ? {
      dailyRequests: 5000,
      monthlyRequests: 150000,
      maxTokensPerRequest: 16000,
      maxPromptsPerDay: 2000,
      maxDocumentSize: 200
    } : {
      dailyRequests: 50,
      monthlyRequests: 1000,
      maxTokensPerRequest: 4000,
      maxPromptsPerDay: 20,
      maxDocumentSize: 5
    };

    // 更新订阅
    const subscriptionUpdates = {
      plan,
      status: 'active' as const,
      startDate: new Date(),
      endDate: plan !== 'free' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined,
      limits: newLimits,
      billingCycle: plan !== 'free' ? 'monthly' as const : undefined,
      autoRenew: plan !== 'free',
      paymentMethod: paymentMethod || undefined
    };

    const result = await store.updateSubscription(userId, subscriptionUpdates);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          plan: result.data!.subscription.plan,
          status: result.data!.subscription.status,
          limits: result.data!.subscription.limits,
          upgradeDate: new Date().toISOString()
        }
      });
    } else {
      throw new Error('Failed to upgrade subscription');
    }

  } catch (error: any) {
    console.error('Upgrade subscription error:', error);
    
    if (error instanceof JsonStoreError) {
      if (error.code === ErrorCodes.USER_NOT_FOUND) {
        return NextResponse.json(
          { error: '用户不存在' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: '升级订阅失败' },
      { status: 500 }
    );
  }
}

/**
 * 系统统计API
 * GET /api/admin/stats
 */
export async function handleSystemStats() {
  try {
    const stats = await store.getStorageStats();
    const healthCheck = await store.healthCheck();

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        health: healthCheck,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('System stats error:', error);
    return NextResponse.json(
      { error: '获取系统统计失败' },
      { status: 500 }
    );
  }
}

/**
 * 中间件：验证用户配额
 */
export async function quotaMiddleware(userId: string, requiredRequests = 1) {
  try {
    const user = await store.getUser(userId);
    if (!user) {
      return { allowed: false, error: '用户不存在', code: 404 };
    }

    const dailyUsage = await store.getUsage(userId);
    const currentRequests = dailyUsage?.requests || 0;

    if (currentRequests + requiredRequests > user.subscription.limits.dailyRequests) {
      return { 
        allowed: false, 
        error: '已达到每日请求限制', 
        code: 429,
        quotaInfo: {
          current: currentRequests,
          limit: user.subscription.limits.dailyRequests,
          plan: user.subscription.plan
        }
      };
    }

    return { allowed: true };

  } catch (error: any) {
    console.error('Quota middleware error:', error);
    return { allowed: false, error: '配额检查失败', code: 500 };
  }
}

export default {
  handleUserRegister,
  handleGetUser,
  handleUpdateUser,
  handleTrackUsage,
  handleCheckQuota,
  handleUpgradeSubscription,
  handleSystemStats,
  quotaMiddleware
};