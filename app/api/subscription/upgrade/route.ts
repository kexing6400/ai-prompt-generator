/**
 * 订阅升级API端点
 * 使用JSON存储系统
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDefaultStore } from '@/lib/storage'
import { cookies } from 'next/headers'

// 强制动态渲染 - 确保每次请求都重新执行
export const dynamic = 'force-dynamic';

const store = getDefaultStore();

// 订阅计划配置
const SUBSCRIPTION_PLANS = {
  free: {
    name: '免费版',
    price: 0,
    limits: {
      monthlyRequests: 50,
      dailyRequests: 10,
      maxTokensPerRequest: 4000,
      maxPromptsPerDay: 20,
      maxDocumentSize: 5
    }
  },
  pro: {
    name: '专业版',
    price: 4.99,
    limits: {
      monthlyRequests: 500,
      dailyRequests: 50,
      maxTokensPerRequest: 8000,
      maxPromptsPerDay: 100,
      maxDocumentSize: 20
    }
  },
  team: {
    name: '团队版',
    price: 19.99,
    limits: {
      monthlyRequests: 10000,
      dailyRequests: 1000,
      maxTokensPerRequest: 16000,
      maxPromptsPerDay: 1000,
      maxDocumentSize: 100
    }
  }
};

/**
 * 升级订阅计划
 */
export async function POST(request: NextRequest) {
  try {
    // 获取用户ID
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
    const { plan, paymentMethod } = body;
    
    // 验证计划
    if (!plan || !['pro', 'team'].includes(plan)) {
      return NextResponse.json({
        success: false,
        error: '无效的订阅计划',
        code: 'INVALID_PLAN'
      }, { status: 400 });
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
    
    // 检查是否已经是该计划
    if (user.subscription?.plan === plan) {
      return NextResponse.json({
        success: false,
        error: '您已经是该计划用户',
        code: 'ALREADY_SUBSCRIBED'
      }, { status: 400 });
    }
    
    // 检查是否降级
    const planOrder: Record<string, number> = { free: 0, pro: 1, team: 2 };
    const currentPlan = user.subscription?.plan || 'free';
    if (planOrder[plan] < planOrder[currentPlan]) {
      return NextResponse.json({
        success: false,
        error: '不支持降级操作，请联系客服',
        code: 'DOWNGRADE_NOT_ALLOWED'
      }, { status: 400 });
    }
    
    // 模拟支付处理（实际应该调用Creem.io）
    console.log('[Upgrade API] 处理支付:', {
      userId,
      plan,
      paymentMethod,
      amount: SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS].price
    });
    
    // 更新用户订阅信息
    const now = new Date().toISOString();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    
    const previousPlan = user.subscription?.plan || 'free';
    user.subscription = {
      plan: plan as 'free' | 'pro' | 'enterprise',
      status: 'active',
      startDate: new Date(),
      endDate,
      limits: SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS].limits,
      autoRenew: true
    };
    user.updatedAt = new Date();
    
    // 保存更新
    await store.saveUser(user);
    
    // TODO: 记录订阅事件（addActivity方法需要实现）
    console.log('[Upgrade API] 订阅升级成功:', {
      userId,
      from: previousPlan,
      to: plan,
      price: SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS].price
    });
    
    return NextResponse.json({
      success: true,
      message: '订阅升级成功',
      data: {
        subscription: user.subscription,
        previousPlan: previousPlan,
        newPlan: plan,
        effectiveDate: now,
        nextBillingDate: endDate.toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('[Upgrade API] 升级失败:', error);
    
    return NextResponse.json({
      success: false,
      error: '订阅升级失败',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

/**
 * 取消订阅（设置为期末取消）
 */
export async function DELETE(request: NextRequest) {
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
    
    const user = await store.getUser(userId);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: '用户不存在',
        code: 'USER_NOT_FOUND'
      }, { status: 404 });
    }
    
    if (user.subscription?.plan === 'free') {
      return NextResponse.json({
        success: false,
        error: '免费用户无需取消订阅',
        code: 'FREE_PLAN'
      }, { status: 400 });
    }
    
    // 设置为期末取消（标记为cancelled状态）
    if (user.subscription) {
      user.subscription.status = 'cancelled';
      user.updatedAt = new Date();
      
      await store.saveUser(user);
      
      // TODO: 记录活动（addActivity方法需要实现）
      console.log('[Upgrade API] 订阅已取消:', {
        userId,
        plan: user.subscription.plan,
        endDate: user.subscription.endDate
      });
    }
    
    return NextResponse.json({
      success: true,
      message: '订阅将在当前计费周期结束后取消',
      data: {
        cancelAtPeriodEnd: true,
        effectiveDate: user.subscription?.endDate
      }
    });
    
  } catch (error: any) {
    console.error('[Upgrade API] 取消订阅失败:', error);
    
    return NextResponse.json({
      success: false,
      error: '取消订阅失败',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}