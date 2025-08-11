/**
 * 律师专业AI生成API - 企业级法律工作流
 * 集成完整的法律AI专业组件栈
 * 
 * 功能特性：
 * 1. 专业法律AI生成和质量控制
 * 2. 客户数据零保留和隐私保护
 * 3. ABA合规性验证和术语准确性检查
 * 4. 多维质量评分和风险评估
 * 5. 专业模板引擎和文书标准
 */

import { NextRequest, NextResponse } from 'next/server';
import { createOpenRouterClient } from '@/lib/openrouter-client';
import { LegalAIService, LegalAIOptions, LegalPracticeArea, LegalDocumentType } from '@/lib/ai/legal-ai-service';
import { getDefaultStore } from '@/lib/storage';
import { cookies } from 'next/headers';

// 强制动态渲染
export const dynamic = 'force-dynamic';

// 初始化服务
if (!process.env.OPENROUTER_API_KEY) {
  throw new Error('OPENROUTER_API_KEY环境变量未设置');
}

const openRouterClient = createOpenRouterClient({
  apiKey: process.env.OPENROUTER_API_KEY!,
  siteUrl: 'https://lawyer-ai-workstation.vercel.app',
  siteName: 'Lawyer AI Workstation',
  debug: process.env.NODE_ENV === 'development'
});

// 初始化专业法律AI服务
const legalAIService = new LegalAIService(openRouterClient, {
  jurisdiction: 'US',
  firmName: 'AI Legal Assistant',
  debugMode: process.env.NODE_ENV === 'development'
});

const store = getDefaultStore();

// 请求缓存和去重
const requestCache = new Map<string, Promise<any>>();
const responseCache = new Map<string, {
  response: any;
  timestamp: number;
  expiresAt: number;
}>();

/**
 * 律师专业AI生成请求接口
 */
interface LegalGenerateRequest {
  prompt: string;
  practiceArea: LegalPracticeArea;
  documentType: LegalDocumentType;
  jurisdiction?: string;
  clientDataSensitivity?: 'low' | 'medium' | 'high' | 'privileged';
  urgency?: 'routine' | 'urgent' | 'emergency';
  reviewLevel?: 'draft' | 'senior_review' | 'partner_approval';
  templateOptions?: {
    includeBoilerplate?: boolean;
    addComplianceNotes?: boolean;
    includeReviewChecklist?: boolean;
    targetAudience?: 'legal_professional' | 'general_counsel' | 'compliance_officer';
    formality?: 'formal' | 'business_formal' | 'professional';
  };
  qualityTargets?: {
    minimumScore?: number;
    requiredConfidence?: 'medium' | 'high';
  };
}

/**
 * POST - 专业法律AI生成
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json() as LegalGenerateRequest;
    const {
      prompt,
      practiceArea,
      documentType,
      jurisdiction = 'US',
      clientDataSensitivity = 'low',
      urgency = 'routine',
      reviewLevel = 'senior_review',
      templateOptions = {},
      qualityTargets = {}
    } = body;
    
    console.log('[LegalAI] 收到律师专业AI生成请求:', {
      practiceArea,
      documentType,
      jurisdiction,
      sensitivity: clientDataSensitivity,
      urgency,
      timestamp: new Date().toISOString(),
      promptLength: prompt?.length
    });
    
    // 验证必填字段
    if (!prompt || !practiceArea || !documentType) {
      return NextResponse.json({
        success: false,
        error: '请提供完整的法律生成参数：提示内容、执业领域和文书类型'
      }, { status: 400 });
    }
    
    // 特权信息严格检查
    if (clientDataSensitivity === 'privileged' && !process.env.ENABLE_PRIVILEGED_PROCESSING) {
      return NextResponse.json({
        success: false,
        error: '特权信息处理需要特殊授权，请联系系统管理员',
        code: 'PRIVILEGED_ACCESS_DENIED'
      }, { status: 403 });
    }
    
    // 获取用户会话
    const userId = await getUserSession(request);
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: '用户会话创建失败，请刷新页面重试'
      }, { status: 401 });
    }
    
    // 检查使用限制
    const user = await store.getUser(userId);
    const userPlan = user?.subscription?.plan || 'free';
    
    const usageCheck = await checkLegalAIUsageLimit(userId, userPlan, clientDataSensitivity);
    if (!usageCheck.allowed) {
      return NextResponse.json({
        success: false,
        error: usageCheck.message,
        code: 'USAGE_LIMIT_EXCEEDED',
        usage: {
          remaining: usageCheck.remaining,
          limit: usageCheck.limit,
          resetDate: usageCheck.resetDate
        }
      }, { status: 429 });
    }
    
    // 生成缓存键（排除敏感信息）
    const cacheKey = generateCacheKey({
      practiceArea,
      documentType,
      jurisdiction,
      promptHash: hashString(prompt),
      templateOptions,
      userPlan
    });
    
    // 检查响应缓存（仅限非特权内容）
    if (clientDataSensitivity !== 'privileged' && clientDataSensitivity !== 'high') {
      const cached = responseCache.get(cacheKey);
      if (cached && Date.now() < cached.expiresAt) {
        console.log('[LegalAI] 返回缓存的专业法律内容');
        
        // 记录缓存使用
        await recordLegalAIUsage(userId, {
          practiceArea,
          documentType,
          cached: true,
          processingTime: Date.now() - startTime
        });
        
        return NextResponse.json({
          ...cached.response,
          metadata: {
            ...cached.response.metadata,
            cached: true,
            retrievedAt: new Date().toISOString()
          }
        });
      }
    }
    
    // 请求去重检查
    const requestKey = `${userId}-${cacheKey}`;
    if (requestCache.has(requestKey)) {
      console.log('[LegalAI] 检测到重复请求，等待现有处理完成...');
      return await requestCache.get(requestKey);
    }
    
    // 创建处理Promise
    const processingPromise = (async () => {
      try {
        // 构建专业法律AI选项
        const legalOptions: LegalAIOptions = {
          practiceArea,
          documentType,
          jurisdiction,
          clientDataSensitivity,
          urgency,
          reviewLevel,
          clientId: user?.id // 仅用于审计，不存储敏感内容
        };
        
        console.log('[LegalAI] 开始专业法律AI生成处理...');
        
        // 调用专业法律AI服务
        const legalResult = await legalAIService.generateLegalContent(prompt, legalOptions);
        
        console.log('[LegalAI] 法律AI生成完成:', {
          qualityScore: legalResult.metadata.qualityScore,
          confidenceLevel: legalResult.metadata.confidenceLevel,
          complianceStatus: legalResult.metadata.complianceStatus.abaCompliant,
          processingTime: legalResult.metadata.processingTime
        });
        
        // 记录使用统计
        await recordLegalAIUsage(userId, {
          practiceArea,
          documentType,
          model: legalResult.metadata.model,
          qualityScore: legalResult.metadata.qualityScore,
          tokenUsage: legalResult.metadata.tokenUsage,
          cost: legalResult.metadata.cost,
          processingTime: legalResult.metadata.processingTime,
          complianceStatus: legalResult.metadata.complianceStatus,
          riskAssessment: legalResult.metadata.riskAssessment,
          cached: false
        });
        
        // 构建专业响应
        const response = {
          success: true,
          
          // 法律内容
          content: legalResult.content,
          
          // 专业元数据
          metadata: {
            // 基础信息
            practiceArea: legalResult.metadata.practiceArea,
            documentType: legalResult.metadata.documentType,
            jurisdiction: legalResult.metadata.jurisdiction,
            
            // AI模型信息
            model: legalResult.metadata.model,
            generatedAt: legalResult.metadata.generatedAt,
            processingTime: legalResult.metadata.processingTime,
            
            // 质量评估
            qualityMetrics: {
              overallScore: legalResult.metadata.qualityScore,
              confidenceLevel: legalResult.metadata.confidenceLevel,
              riskAssessment: legalResult.metadata.riskAssessment,
              legalAccuracy: legalResult.metadata.legalAccuracy,
              reviewRequired: legalResult.metadata.reviewRequired
            },
            
            // 合规状态
            compliance: {
              abaCompliant: legalResult.metadata.complianceStatus.abaCompliant,
              stateCompliant: legalResult.metadata.complianceStatus.stateRulesCompliant,
              ethicsReviewRequired: legalResult.metadata.complianceStatus.ethicsReviewRequired,
              disclaimerRequired: legalResult.metadata.complianceStatus.disclaimerRequired
            },
            
            // 使用统计
            usage: {
              tokens: legalResult.metadata.tokenUsage,
              cost: legalResult.metadata.cost,
              remaining: usageCheck.remaining - 1,
              limit: usageCheck.limit
            },
            
            // 专业建议
            recommendations: legalResult.metadata.recommendations,
            humanVerificationPoints: legalResult.metadata.humanVerificationPoints,
            
            // 系统信息
            generationId: generateRequestId(),
            cached: false
          },
          
          // 法律声明和提醒
          legalNotices: legalResult.legalNotices,
          
          // 质量保证信息
          qualityAssurance: {
            meetsMinimumStandards: legalResult.metadata.qualityScore >= (qualityTargets.minimumScore || 70),
            confidenceMeetsTarget: meetsConfidenceTarget(
              legalResult.metadata.confidenceLevel,
              qualityTargets.requiredConfidence
            ),
            readyForUse: legalResult.metadata.qualityScore >= 80 && 
                        legalResult.metadata.complianceStatus.abaCompliant &&
                        legalResult.metadata.riskAssessment !== 'critical',
            recommendedNextSteps: generateNextSteps(legalResult)
          }
        };
        
        // 缓存响应（非特权内容）
        if (clientDataSensitivity !== 'privileged' && clientDataSensitivity !== 'high') {
          const cacheExpiry = getCacheExpiry(practiceArea, documentType, urgency);
          responseCache.set(cacheKey, {
            response,
            timestamp: Date.now(),
            expiresAt: Date.now() + cacheExpiry
          });
          
          // 定期清理缓存
          if (Math.random() < 0.1) {
            cleanExpiredCache();
          }
        }
        
        // 设置用户会话Cookie
        const responseObj = NextResponse.json(response);
        responseObj.cookies.set('userId', userId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60 // 30天
        });
        
        return responseObj;
        
      } finally {
        // 移除请求处理记录
        requestCache.delete(requestKey);
      }
    })();
    
    // 注册处理Promise
    requestCache.set(requestKey, processingPromise);
    
    return await processingPromise;
    
  } catch (error: any) {
    console.error('[LegalAI] 专业法律AI生成失败:', error);
    
    // 清理缓存中的失败请求
    const errorRequestKey = Array.from(requestCache.keys()).find(key => 
      requestCache.get(key) === Promise.resolve(error)
    );
    if (errorRequestKey) {
      requestCache.delete(errorRequestKey);
    }
    
    // 详细错误分类和处理
    let errorMessage = '专业法律AI生成失败，请稍后重试';
    let errorCode = 'LEGAL_GENERATION_FAILED';
    let statusCode = 500;
    
    if (error.message?.includes('特权信息')) {
      errorMessage = '特权信息处理失败，请确认数据保护设置';
      errorCode = 'PRIVILEGED_DATA_ERROR';
      statusCode = 403;
    } else if (error.message?.includes('合规')) {
      errorMessage = '合规检查失败，请审查请求内容';
      errorCode = 'COMPLIANCE_ERROR';
      statusCode = 400;
    } else if (error.message?.includes('API')) {
      errorMessage = 'AI服务暂时不可用，请稍后重试';
      errorCode = 'AI_SERVICE_UNAVAILABLE';
      statusCode = 503;
    } else if (error.message?.includes('质量')) {
      errorMessage = '生成内容未达到专业质量标准';
      errorCode = 'QUALITY_THRESHOLD_NOT_MET';
      statusCode = 422;
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      code: errorCode,
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack?.split('\\n').slice(0, 5)
      } : undefined,
      timestamp: new Date().toISOString(),
      support: {
        message: '如问题持续，请联系技术支持',
        contact: 'support@lawyer-ai-workstation.com'
      }
    }, { status: statusCode });
  }
}

/**
 * GET - 健康检查和状态信息
 */
export async function GET() {
  try {
    // 检查专业法律AI服务健康状态
    const legalAIHealth = await legalAIService.healthCheck();
    
    // 获取OpenRouter连接状态
    const openRouterHealth = await openRouterClient.healthCheck();
    
    // 获取存储统计
    const storeStats = await store.getStatistics();
    
    return NextResponse.json({
      status: legalAIHealth.status,
      timestamp: new Date().toISOString(),
      version: '2.0.0-professional',
      
      // 专业法律AI状态
      legalAI: {
        status: legalAIHealth.status,
        components: legalAIHealth.components,
        features: {
          termValidation: true,
          complianceChecking: true,
          qualityScoring: true,
          dataProtection: true,
          templateEngine: true
        }
      },
      
      // OpenRouter API状态
      aiService: {
        connected: openRouterHealth.connected,
        responseTime: openRouterHealth.responseTime,
        provider: 'OpenRouter',
        models: ['claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus']
      },
      
      // 缓存统计
      cache: {
        responseEntries: responseCache.size,
        activeRequests: requestCache.size,
        hitRate: calculateCacheHitRate()
      },
      
      // 支持的法律领域
      supportedPracticeAreas: [
        'corporate_law', 'contract_law', 'litigation', 'real_estate',
        'intellectual_property', 'employment_law', 'criminal_defense',
        'family_law', 'estate_planning', 'immigration', 'tax_law',
        'environmental_law', 'healthcare_law', 'securities_law', 'banking_finance'
      ],
      
      // 支持的文书类型
      supportedDocumentTypes: [
        'contract_draft', 'contract_review', 'legal_memo', 'motion_brief',
        'discovery_request', 'settlement_agreement', 'compliance_checklist',
        'client_letter', 'court_filing', 'due_diligence', 'opinion_letter',
        'cease_desist', 'privacy_policy', 'terms_service', 'regulatory_analysis'
      ],
      
      // 质量保证
      qualityAssurance: {
        minimumScore: 70,
        targetScore: 85,
        professionalScore: 90,
        complianceRequired: true,
        humanReviewRequired: true
      },
      
      // 存储状态
      storage: storeStats,
      
      message: '✅ 专业律师AI工作台运行正常'
    });
    
  } catch (error: any) {
    console.error('[LegalAI] 健康检查失败:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      message: '❌ 专业法律AI服务异常'
    }, { status: 503 });
  }
}

// 辅助函数

async function getUserSession(request: NextRequest): Promise<string | null> {
  try {
    const cookieStore = cookies();
    let userId = cookieStore.get('userId')?.value;
    
    if (!userId) {
      const timestamp = Date.now();
      userId = `lawyer_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newUser = {
        id: userId,
        email: `${userId}@lawyer-workstation.local`,
        name: '律师用户',
        createdAt: new Date(),
        updatedAt: new Date(),
        preferences: {
          language: 'zh' as const,
          theme: 'professional' as const,
          defaultModel: 'claude-3-sonnet',
          autoSave: true,
          notifications: {
            email: false,
            browser: true,
            quotaWarning: true,
            complianceAlert: true
          }
        },
        isActive: true,
        emailVerified: false,
        subscription: {
          plan: 'professional' as const, // 律师版本默认专业版
          status: 'active' as const,
          startDate: new Date(),
          autoRenew: false,
          limits: {
            dailyRequests: 50,
            monthlyRequests: 500,
            maxTokensPerRequest: 4000,
            maxPromptsPerDay: 50,
            maxDocumentSize: 20,
            privilegedContentAccess: false // 需要特殊授权
          }
        }
      };
      
      await store.saveUser(newUser);
      console.log('[LegalAI] 创建律师用户:', userId);
    }
    
    return userId;
  } catch (error) {
    console.error('[LegalAI] 获取用户会话失败:', error);
    return null;
  }
}

async function checkLegalAIUsageLimit(
  userId: string,
  plan: string,
  sensitivity: string
): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  message?: string;
  resetDate?: string;
}> {
  try {
    const user = await store.getUser(userId);
    if (!user) {
      return { allowed: false, remaining: 0, limit: 0, message: '用户不存在' };
    }
    
    // 特权内容访问检查
    if (sensitivity === 'privileged' && !user.subscription.limits?.privilegedContentAccess) {
      return {
        allowed: false,
        remaining: 0,
        limit: 0,
        message: '特权内容访问需要升级到企业版或获得特殊授权'
      };
    }
    
    const usage = await store.getUsage(userId);
    const currentMonth = new Date().toISOString().substring(0, 7);
    const monthlyUsage = usage?.month === currentMonth ? usage : { requests: 0, tokens: 0 };
    
    const limit = user.subscription?.limits?.monthlyRequests || 500;
    const remaining = Math.max(0, limit - monthlyUsage.requests);
    
    if (monthlyUsage.requests >= limit) {
      const resetDate = new Date();
      resetDate.setMonth(resetDate.getMonth() + 1, 1);
      resetDate.setHours(0, 0, 0, 0);
      
      return {
        allowed: false,
        remaining: 0,
        limit,
        message: `本月专业法律AI使用额度已用完（${limit}次）。将于${resetDate.toLocaleDateString()}重置。`,
        resetDate: resetDate.toISOString()
      };
    }
    
    return { allowed: true, remaining, limit };
    
  } catch (error) {
    console.error('[LegalAI] 检查使用限制失败:', error);
    return { allowed: true, remaining: 100, limit: 500 };
  }
}

async function recordLegalAIUsage(
  userId: string,
  usageData: {
    practiceArea: string;
    documentType: string;
    model?: string;
    qualityScore?: number;
    tokenUsage?: number;
    cost?: number;
    processingTime: number;
    complianceStatus?: any;
    riskAssessment?: string;
    cached: boolean;
  }
): Promise<void> {
  try {
    await store.updateUsage(userId, {
      requests: 1,
      tokens: usageData.tokenUsage || 0,
      apiCalls: usageData.model ? { [usageData.model]: 1 } : {},
      metadata: {
        practiceArea: usageData.practiceArea,
        documentType: usageData.documentType,
        qualityScore: usageData.qualityScore,
        processingTime: usageData.processingTime,
        complianceStatus: usageData.complianceStatus,
        riskAssessment: usageData.riskAssessment,
        cached: usageData.cached
      }
    });
    
    console.log('[LegalAI] 记录专业使用量:', {
      userId,
      practiceArea: usageData.practiceArea,
      documentType: usageData.documentType,
      qualityScore: usageData.qualityScore,
      cached: usageData.cached
    });
    
  } catch (error) {
    console.error('[LegalAI] 记录使用量失败:', error);
  }
}

function generateCacheKey(params: {
  practiceArea: string;
  documentType: string;
  jurisdiction: string;
  promptHash: string;
  templateOptions: any;
  userPlan: string;
}): string {
  const keyData = {
    pa: params.practiceArea,
    dt: params.documentType,
    j: params.jurisdiction,
    ph: params.promptHash,
    to: JSON.stringify(params.templateOptions),
    up: params.userPlan
  };
  
  return `legal_${hashString(JSON.stringify(keyData))}`;
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return Math.abs(hash).toString(36).substr(0, 8);
}

function getCacheExpiry(
  practiceArea: string,
  documentType: string,
  urgency: string
): number {
  // 基于紧急程度和复杂性调整缓存时间
  if (urgency === 'emergency') {
    return 5 * 60 * 1000; // 5分钟
  } else if (urgency === 'urgent') {
    return 15 * 60 * 1000; // 15分钟
  }
  
  // 复杂文书类型缓存时间较短
  const complexTypes = ['motion_brief', 'regulatory_analysis', 'due_diligence'];
  if (complexTypes.includes(documentType)) {
    return 30 * 60 * 1000; // 30分钟
  }
  
  return 60 * 60 * 1000; // 1小时
}

function cleanExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of responseCache.entries()) {
    if (entry.expiresAt < now) {
      responseCache.delete(key);
    }
  }
}

function meetsConfidenceTarget(
  actualConfidence: 'low' | 'medium' | 'high',
  requiredConfidence?: 'medium' | 'high'
): boolean {
  if (!requiredConfidence) return true;
  
  const confidenceLevels = { low: 1, medium: 2, high: 3 };
  return confidenceLevels[actualConfidence] >= confidenceLevels[requiredConfidence];
}

function generateNextSteps(legalResult: any): string[] {
  const steps: string[] = [];
  
  if (legalResult.metadata.reviewRequired) {
    steps.push('由执业律师进行专业审查');
  }
  
  if (legalResult.metadata.complianceStatus.ethicsReviewRequired) {
    steps.push('进行律师职业道德合规审查');
  }
  
  if (legalResult.metadata.qualityScore < 80) {
    steps.push('根据改进建议优化内容质量');
  }
  
  if (legalResult.metadata.riskAssessment !== 'minimal') {
    steps.push('评估和缓解已识别的风险因素');
  }
  
  steps.push('在正式使用前进行最终确认');
  
  return steps;
}

function generateRequestId(): string {
  return `legal_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

function calculateCacheHitRate(): number {
  // 简化的缓存命中率计算
  return 0.75; // 75% 示例值
}