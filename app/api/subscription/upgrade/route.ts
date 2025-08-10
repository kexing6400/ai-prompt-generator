/**
 * 订阅升级API端点
 * 使用JSON存储系统
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDefaultStore } from '@/lib/storage'
import { cookies } from 'next/headers'

const store = getDefaultStore();

// 订阅计划配置
const SUBSCRIPTION_PLANS = {
  free: {
    name: '免费版',
    price: 0,
    limits: {
      generationsPerMonth: 50,
      templatesAccess: 'basic',
      historyDays: 7
    }
  },
  pro: {
    name: '专业版',
    price: 4.99,
    limits: {
      generationsPerMonth: 500,
      templatesAccess: 'premium',
      historyDays: 30
    }
  },
  team: {
    name: '团队版',
    price: 19.99,
    limits: {
      generationsPerMonth: -1, // 无限
      templatesAccess: 'all',
      historyDays: -1 // 无限
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
    if (user.plan === plan) {
      return NextResponse.json({
        success: false,
        error: '您已经是该计划用户',
        code: 'ALREADY_SUBSCRIBED'
      }, { status: 400 });
    }
    
    // 检查是否降级
    const planOrder = { free: 0, pro: 1, team: 2 };
    if (planOrder[plan] < planOrder[user.plan || 'free']) {
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
    
    user.plan = plan as 'free' | 'pro' | 'team';
    user.subscription = {
      id: `sub_${Date.now()}`,
      plan,
      status: 'active',
      startDate: now,
      endDate: endDate.toISOString(),
      cancelAtPeriodEnd: false,
      limits: SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS].limits
    };
    user.updatedAt = now;
    
    // 保存更新
    await store.saveUser(user);
    
    // 记录订阅事件
    await store.addActivity(userId, {
      type: 'subscription_upgraded',
      description: `升级到${SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS].name}`,
      metadata: {
        from_plan: user.plan,
        to_plan: plan,
        price: SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS].price
      }
    });
    
    return NextResponse.json({
      success: true,
      message: '订阅升级成功',
      data: {
        subscription: user.subscription,
        previousPlan: user.plan,
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
    
    if (user.plan === 'free') {
      return NextResponse.json({
        success: false,
        error: '免费用户无需取消订阅',
        code: 'FREE_PLAN'
      }, { status: 400 });
    }
    
    // 设置为期末取消
    if (user.subscription) {
      user.subscription.cancelAtPeriodEnd = true;
      user.subscription.status = 'canceling';
      user.updatedAt = new Date().toISOString();
      
      await store.saveUser(user);
      
      // 记录活动
      await store.addActivity(userId, {
        type: 'subscription_canceled',
        description: '订阅已设置为期末取消',
        metadata: {
          plan: user.plan,
          cancelDate: user.subscription.endDate
        }
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