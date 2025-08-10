/**
 * 订阅计划定义
 * 
 * 三层订阅体系的核心配置
 * 🆓 免费版：50次/月生成限制，核心功能完全免费
 * 💎 专业版：$4.99/月，500次/月，高级功能
 * 🏢 团队版：$19.99/月，无限制，团队协作
 */

import { SubscriptionPlan, SubscriptionPlanType, SubscriptionFeatures } from '@/types/subscription'

// ============ 功能权限配置 ============

/**
 * 免费版功能权限
 */
const FREE_FEATURES: SubscriptionFeatures = {
  // 核心功能权限
  promptGeneration: true,          // ✅ 基础prompt生成
  advancedTemplates: false,        // ❌ 高级模板访问
  customTemplates: false,          // ❌ 自定义模板创建
  
  // AI功能权限
  aiChatAccess: true,              // ✅ AI对话功能 (限制使用次数)
  advancedAiModels: false,         // ❌ 高级AI模型访问
  priorityProcessing: false,       // ❌ 优先处理队列
  
  // 数据与导出
  historyAccess: true,             // ✅ 历史记录访问 (限制条数)
  unlimitedHistory: false,         // ❌ 无限历史记录
  dataExport: false,               // ❌ 数据导出功能
  bulkOperations: false,           // ❌ 批量操作
  
  // 协作功能
  teamCollaboration: false,        // ❌ 团队协作
  shareTemplates: false,           // ❌ 模板分享
  teamAnalytics: false,            // ❌ 团队分析
  
  // 支持服务
  emailSupport: true,              // ✅ 邮件支持
  prioritySupport: false,          // ❌ 优先支持
  phoneSupport: false,             // ❌ 电话支持
  
  // 技术限制
  apiRateLimit: 10,                // 10 请求/分钟
  maxTeamMembers: 1,               // 只有自己
}

/**
 * 专业版功能权限
 */
const PRO_FEATURES: SubscriptionFeatures = {
  // 核心功能权限
  promptGeneration: true,          // ✅ 基础prompt生成
  advancedTemplates: true,         // ✅ 高级模板访问
  customTemplates: true,           // ✅ 自定义模板创建
  
  // AI功能权限
  aiChatAccess: true,              // ✅ AI对话功能 (更高限制)
  advancedAiModels: true,          // ✅ 高级AI模型访问
  priorityProcessing: true,        // ✅ 优先处理队列
  
  // 数据与导出
  historyAccess: true,             // ✅ 历史记录访问
  unlimitedHistory: true,          // ✅ 无限历史记录
  dataExport: true,                // ✅ 数据导出功能
  bulkOperations: true,            // ✅ 批量操作
  
  // 协作功能
  teamCollaboration: false,        // ❌ 团队协作 (个人版)
  shareTemplates: true,            // ✅ 模板分享
  teamAnalytics: false,            // ❌ 团队分析
  
  // 支持服务
  emailSupport: true,              // ✅ 邮件支持
  prioritySupport: true,           // ✅ 优先支持
  phoneSupport: false,             // ❌ 电话支持
  
  // 技术限制
  apiRateLimit: 50,                // 50 请求/分钟
  maxTeamMembers: 1,               // 只有自己
}

/**
 * 团队版功能权限
 */
const TEAM_FEATURES: SubscriptionFeatures = {
  // 核心功能权限
  promptGeneration: true,          // ✅ 基础prompt生成
  advancedTemplates: true,         // ✅ 高级模板访问
  customTemplates: true,           // ✅ 自定义模板创建
  
  // AI功能权限
  aiChatAccess: true,              // ✅ AI对话功能 (无限制)
  advancedAiModels: true,          // ✅ 高级AI模型访问
  priorityProcessing: true,        // ✅ 优先处理队列
  
  // 数据与导出
  historyAccess: true,             // ✅ 历史记录访问
  unlimitedHistory: true,          // ✅ 无限历史记录
  dataExport: true,                // ✅ 数据导出功能
  bulkOperations: true,            // ✅ 批量操作
  
  // 协作功能
  teamCollaboration: true,         // ✅ 团队协作
  shareTemplates: true,            // ✅ 模板分享
  teamAnalytics: true,             // ✅ 团队分析
  
  // 支持服务
  emailSupport: true,              // ✅ 邮件支持
  prioritySupport: true,           // ✅ 优先支持
  phoneSupport: true,              // ✅ 电话支持
  
  // 技术限制
  apiRateLimit: 200,               // 200 请求/分钟
  maxTeamMembers: 10,              // 最多10人团队
}

// ============ 订阅计划配置 ============

/**
 * 免费版计划
 */
export const FREE_PLAN: SubscriptionPlan = {
  id: 'free-plan',
  name: 'free',
  displayName: 'Free',
  description: '适合个人用户开始探索AI Prompt生成功能',
  type: 'free',
  
  // 完全免费
  priceMonthly: 0,
  priceCurrency: 'USD',
  
  // 50次/月限制
  monthlyQuota: 50,
  
  features: FREE_FEATURES,
  
  isActive: true,
  isPopular: false,
  
  createdAt: new Date(),
  updatedAt: new Date(),
}

/**
 * 专业版计划
 */
export const PRO_PLAN: SubscriptionPlan = {
  id: 'pro-plan',
  name: 'pro',
  displayName: 'Professional',
  description: '适合专业用户，解锁高级功能和更高配额',
  type: 'pro',
  
  // $4.99/月 (以分为单位存储)
  priceMonthly: 499,
  priceCurrency: 'USD',
  
  // 500次/月配额
  monthlyQuota: 500,
  
  features: PRO_FEATURES,
  
  isActive: true,
  isPopular: true,  // 推荐计划
  
  createdAt: new Date(),
  updatedAt: new Date(),
}

/**
 * 团队版计划
 */
export const TEAM_PLAN: SubscriptionPlan = {
  id: 'team-plan',
  name: 'team',
  displayName: 'Team',
  description: '适合团队协作，无限制使用和高级协作功能',
  type: 'team',
  
  // $19.99/月 (以分为单位存储)
  priceMonthly: 1999,
  priceCurrency: 'USD',
  
  // 无限制配额
  monthlyQuota: -1,
  
  features: TEAM_FEATURES,
  
  isActive: true,
  isPopular: false,
  
  createdAt: new Date(),
  updatedAt: new Date(),
}

// ============ 计划管理 ============

/**
 * 所有可用的订阅计划
 */
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  FREE_PLAN,
  PRO_PLAN,
  TEAM_PLAN,
]

/**
 * 按类型索引的计划映射
 */
export const PLANS_BY_TYPE: Record<SubscriptionPlanType, SubscriptionPlan> = {
  free: FREE_PLAN,
  pro: PRO_PLAN,
  team: TEAM_PLAN,
}

/**
 * 按ID索引的计划映射
 */
export const PLANS_BY_ID: Record<string, SubscriptionPlan> = {
  'free-plan': FREE_PLAN,
  'pro-plan': PRO_PLAN,
  'team-plan': TEAM_PLAN,
}

// ============ 工具函数 ============

/**
 * 根据类型获取订阅计划
 */
export function getPlanByType(type: SubscriptionPlanType): SubscriptionPlan {
  const plan = PLANS_BY_TYPE[type]
  if (!plan) {
    throw new Error(`Subscription plan not found for type: ${type}`)
  }
  return plan
}

/**
 * 根据ID获取订阅计划
 */
export function getPlanById(id: string): SubscriptionPlan | null {
  return PLANS_BY_ID[id] || null
}

/**
 * 获取所有激活的计划
 */
export function getActivePlans(): SubscriptionPlan[] {
  return SUBSCRIPTION_PLANS.filter(plan => plan.isActive)
}

/**
 * 检查计划是否支持特定功能
 */
export function checkFeatureAccess(
  planType: SubscriptionPlanType,
  feature: keyof SubscriptionFeatures
): boolean {
  const plan = getPlanByType(planType)
  return plan.features[feature] as boolean
}

/**
 * 获取计划的月度配额
 */
export function getPlanQuota(planType: SubscriptionPlanType): number {
  const plan = getPlanByType(planType)
  return plan.monthlyQuota
}

/**
 * 获取计划的月度价格 (美元)
 */
export function getPlanPrice(planType: SubscriptionPlanType): number {
  const plan = getPlanByType(planType)
  return plan.priceMonthly / 100 // 转换分为美元
}

/**
 * 检查是否为付费计划
 */
export function isPaidPlan(planType: SubscriptionPlanType): boolean {
  return planType !== 'free'
}

/**
 * 获取升级建议 (基于当前计划推荐下一级)
 */
export function getUpgradeSuggestion(currentPlan: SubscriptionPlanType): SubscriptionPlan | null {
  switch (currentPlan) {
    case 'free':
      return PRO_PLAN // 免费用户推荐专业版
    case 'pro':
      return TEAM_PLAN // 专业版用户推荐团队版
    case 'team':
      return null // 团队版已是最高级
    default:
      return PRO_PLAN // 默认推荐专业版
  }
}

/**
 * 获取计划比较数据 (用于定价页面)
 */
export function getPlanComparisonData() {
  return SUBSCRIPTION_PLANS.map(plan => ({
    ...plan,
    priceDisplay: plan.priceMonthly === 0 ? 'Free' : `$${getPlanPrice(plan.type)}/month`,
    quotaDisplay: plan.monthlyQuota === -1 ? 'Unlimited' : `${plan.monthlyQuota} prompts/month`,
    features: Object.entries(plan.features)
      .filter(([_, value]) => typeof value === 'boolean' && value)
      .map(([key]) => key),
  }))
}