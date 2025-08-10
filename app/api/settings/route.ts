/**
 * OpenRouter设置管理API
 * 
 * 功能：
 * - 保存用户的OpenRouter配置
 * - 读取用户的OpenRouter配置
 * - 重置为默认配置
 * - 导入/导出配置
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

// 设置文件路径
const SETTINGS_FILE = join(process.cwd(), 'data', 'openrouter-settings.json');

// 默认设置
const DEFAULT_SETTINGS = {
  openrouter: {
    apiKey: 'sk-ant-oat01-ee0f35df8f630aae92f9a6561dd9be32edfe84a1e5f0f6e4636923a0e7ad5aca',
    selectedModel: 'openai/gpt-4o',
    systemPrompts: {
      teacher: `你是一位拥有15年教学经验的资深教育专家李明教授。

专业背景：
- 高等教育15年经验，培养学生3000+名  
- 擅长课程设计、教学方法创新、学习效果评估
- 深度理解教育心理学和数字化教学

服务风格：
- 耐心细致，循循善诱
- 注重个性化学习方案设计
- 善于激发学生学习兴趣和潜能

请以专业、耐心的态度为用户提供教育相关的专业建议和解决方案。`,
      
      lawyer: `你是一位拥有18年执业经验的资深律师王建华。

专业背景：
- 18年执业经验，处理案件1500+起
- 精通合同法、公司法、知识产权、劳动法、诉讼实务
- 在商业法律事务领域具有丰富实战经验

服务风格：
- 严谨专业，逻辑清晰
- 善于风险识别和预防
- 注重实用性和操作性

请以专业、严谨的态度为用户提供法律相关的咨询和建议，但请注意这仅供参考，不构成正式法律意见。`,
      
      accountant: `你是一位拥有12年财务管理经验的注册会计师张会计师。

专业背景：
- 12年财务管理经验，服务企业500+家
- 精通财务分析、税务筹划、审计、成本控制、投资分析
- 具备深厚的财务规划和税务优化经验

服务风格：
- 数据驱动，逻辑严密
- 注重实用性和合规性
- 善于将复杂财务概念简化解释

请以专业、精准的态度为用户提供财务和会计相关的专业建议。`,
      
      realtor: `你是一位拥有10年房地产经验的资深房产顾问刘房产专家。

专业背景：  
- 10年房地产经验，成交额10亿+
- 精通市场分析、投资策略、交易流程、房产评估、政策解读
- 对房地产市场趋势有敏锐洞察

服务风格：
- 市场敏感度高，数据分析能力强
- 注重投资回报和风险控制
- 善于为客户制定个性化投资策略

请以专业、实用的态度为用户提供房地产相关的投资建议和市场分析。`,
      
      insurance: `你是一位拥有8年保险行业经验的保险规划师陈保险专家。

专业背景：
- 8年保险行业经验，服务客户2000+名
- 精通风险评估、保险产品设计、理赔服务、保险规划、风险管理
- 具备丰富的个人和企业保险规划经验

服务风格：
- 风险意识强，保障意识深
- 注重客户需求分析和个性化方案设计
- 善于将保险知识通俗化解释

请以专业、贴心的态度为用户提供保险规划和风险管理相关的建议。`
    },
    quotas: {
      dailyLimit: 100,
      monthlyLimit: 1000,
      currentUsage: {
        daily: 0,
        monthly: 0
      }
    },
    lastUpdated: new Date().toISOString()
  }
};

// 确保数据目录存在
function ensureDataDirectory() {
  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) {
    const { mkdirSync } = require('fs');
    mkdirSync(dataDir, { recursive: true });
  }
}

// 读取设置
function readSettings() {
  try {
    if (!existsSync(SETTINGS_FILE)) {
      return DEFAULT_SETTINGS;
    }
    const data = readFileSync(SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(data);
    
    // 合并默认设置（处理新增字段）
    return {
      ...DEFAULT_SETTINGS,
      ...settings,
      openrouter: {
        ...DEFAULT_SETTINGS.openrouter,
        ...settings.openrouter
      }
    };
  } catch (error) {
    console.error('读取设置文件失败:', error);
    return DEFAULT_SETTINGS;
  }
}

// 保存设置
function saveSettings(settings: any) {
  try {
    ensureDataDirectory();
    
    // 加密API密钥（简单的base64编码）
    const settingsToSave = {
      ...settings,
      openrouter: {
        ...settings.openrouter,
        apiKey: settings.openrouter.apiKey ? Buffer.from(settings.openrouter.apiKey).toString('base64') : '',
        lastUpdated: new Date().toISOString()
      }
    };
    
    writeFileSync(SETTINGS_FILE, JSON.stringify(settingsToSave, null, 2));
    return true;
  } catch (error) {
    console.error('保存设置文件失败:', error);
    return false;
  }
}

// 解密API密钥
function decryptApiKey(encryptedKey: string): string {
  try {
    return Buffer.from(encryptedKey, 'base64').toString('utf8');
  } catch (error) {
    return encryptedKey; // 如果解密失败，可能是明文
  }
}

// GET - 获取当前设置
export async function GET(req: NextRequest) {
  try {
    const settings = readSettings();
    
    // 解密API密钥
    if (settings.openrouter.apiKey) {
      settings.openrouter.apiKey = decryptApiKey(settings.openrouter.apiKey);
    }
    
    return NextResponse.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('获取设置失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取设置失败',
      code: 'SETTINGS_READ_ERROR'
    }, { status: 500 });
  }
}

// POST - 保存设置
export async function POST(req: NextRequest) {
  try {
    const newSettings = await req.json();
    
    // 验证设置格式
    if (!newSettings.openrouter) {
      return NextResponse.json({
        success: false,
        error: '设置格式无效',
        code: 'INVALID_SETTINGS_FORMAT'
      }, { status: 400 });
    }

    // 验证必需字段
    const { apiKey, selectedModel, systemPrompts, quotas } = newSettings.openrouter;
    
    if (!apiKey || !selectedModel || !systemPrompts || !quotas) {
      return NextResponse.json({
        success: false,
        error: '缺少必需的设置字段',
        code: 'MISSING_REQUIRED_FIELDS'
      }, { status: 400 });
    }

    // 验证专家prompt
    const requiredExperts = ['teacher', 'lawyer', 'accountant', 'realtor', 'insurance'];
    for (const expert of requiredExperts) {
      if (!systemPrompts[expert]) {
        return NextResponse.json({
          success: false,
          error: `缺少${expert}专家的系统提示词`,
          code: 'MISSING_EXPERT_PROMPT'
        }, { status: 400 });
      }
    }

    // 验证配额设置
    if (!quotas.dailyLimit || !quotas.monthlyLimit || quotas.dailyLimit < 1 || quotas.monthlyLimit < 1) {
      return NextResponse.json({
        success: false,
        error: '配额设置无效',
        code: 'INVALID_QUOTA_SETTINGS'
      }, { status: 400 });
    }

    // 保存设置
    const saveResult = saveSettings(newSettings);
    
    if (!saveResult) {
      return NextResponse.json({
        success: false,
        error: '保存设置失败',
        code: 'SETTINGS_SAVE_ERROR'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '设置保存成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('保存设置失败:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json({
        success: false,
        error: '请求数据格式错误',
        code: 'INVALID_JSON'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: '保存设置失败',
      code: 'SETTINGS_SAVE_ERROR'
    }, { status: 500 });
  }
}

// PUT - 重置为默认设置
export async function PUT(req: NextRequest) {
  try {
    const saveResult = saveSettings(DEFAULT_SETTINGS);
    
    if (!saveResult) {
      return NextResponse.json({
        success: false,
        error: '重置设置失败',
        code: 'SETTINGS_RESET_ERROR'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '设置已重置为默认值',
      data: DEFAULT_SETTINGS
    });

  } catch (error) {
    console.error('重置设置失败:', error);
    return NextResponse.json({
      success: false,
      error: '重置设置失败',
      code: 'SETTINGS_RESET_ERROR'
    }, { status: 500 });
  }
}

// DELETE - 清除所有设置
export async function DELETE(req: NextRequest) {
  try {
    const { unlinkSync } = require('fs');
    
    if (existsSync(SETTINGS_FILE)) {
      unlinkSync(SETTINGS_FILE);
    }

    return NextResponse.json({
      success: true,
      message: '所有设置已清除'
    });

  } catch (error) {
    console.error('清除设置失败:', error);
    return NextResponse.json({
      success: false,
      error: '清除设置失败',
      code: 'SETTINGS_DELETE_ERROR'
    }, { status: 500 });
  }
}