import { NextRequest, NextResponse } from 'next/server';
import { 
  DocumentGenerationRequest, 
  DocumentGenerationResponse, 
  DocumentFormat 
} from '@/types/document';
import { generatePDF } from '@/lib/document/generators/pdf-generator';
import { generateDOCX } from '@/lib/document/generators/docx-generator';
import { generateMarkdown } from '@/lib/document/generators/markdown-generator';

/**
 * 文档生成API端点
 * Document Generation API Endpoint
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 解析请求数据
    const requestData: DocumentGenerationRequest = await request.json();
    
    // 验证请求数据
    const validation = validateGenerationRequest(requestData);
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: `Invalid request: ${validation.errors.join(', ')}`
      } as DocumentGenerationResponse, { status: 400 });
    }

    // 生成唯一文档ID
    const documentId = generateDocumentId();
    
    let result: { buffer: Buffer; fileName: string; mimeType: string };

    // 根据格式选择生成器
    switch (requestData.format) {
      case DocumentFormat.PDF:
        result = await generatePDF(requestData, documentId);
        break;
        
      case DocumentFormat.DOCX:
        result = await generateDOCX(requestData, documentId);
        break;
        
      case DocumentFormat.MD:
        result = await generateMarkdown(requestData, documentId);
        break;
        
      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported format: ${requestData.format}`
        } as DocumentGenerationResponse, { status: 400 });
    }

    // 返回base64编码的文档数据（适合小文档）
    // 对于大文档，应该使用云存储并返回下载链接
    const base64 = result.buffer.toString('base64');
    
    const response: DocumentGenerationResponse = {
      success: true,
      documentId,
      base64,
      fileName: result.fileName,
      fileSize: result.buffer.length
    };

    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });

  } catch (error) {
    console.error('Document generation error:', error);
    
    const errorResponse: DocumentGenerationResponse = {
      success: false,
      documentId: '',
      fileName: '',
      fileSize: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * 获取支持的文档格式和模板列表
 */
export async function GET(): Promise<NextResponse> {
  try {
    const supportedFormats = Object.values(DocumentFormat);
    const availableTemplates = await getAvailableTemplates();

    return NextResponse.json({
      supportedFormats,
      availableTemplates,
      version: '1.0.0'
    });

  } catch (error) {
    console.error('Error fetching document info:', error);
    return NextResponse.json({ error: 'Failed to fetch document info' }, { status: 500 });
  }
}

/**
 * 验证文档生成请求
 */
function validateGenerationRequest(request: DocumentGenerationRequest) {
  const errors: string[] = [];

  // 检查必需字段
  if (!request.templateId) {
    errors.push('Template ID is required');
  }

  if (!request.format || !Object.values(DocumentFormat).includes(request.format)) {
    errors.push('Valid format is required');
  }

  if (!request.data) {
    errors.push('Document data is required');
  } else {
    // 检查文档数据
    if (!request.data.title?.trim()) {
      errors.push('Document title is required');
    }

    if (!request.data.sections || request.data.sections.length === 0) {
      errors.push('At least one section is required');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 生成唯一文档ID
 */
function generateDocumentId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `doc_${timestamp}_${random}`;
}

/**
 * 获取可用模板列表（临时实现，后续从数据库获取）
 */
async function getAvailableTemplates() {
  // 临时实现，返回硬编码的模板列表
  // TODO: 从数据库或文件系统动态获取
  return [
    {
      id: 'legal-contract',
      name: '法律合同',
      type: 'legal-contract',
      description: '标准法律合同模板，包含完整的条款和条件'
    },
    {
      id: 'business-proposal',
      name: '商业提案',
      type: 'business-proposal',
      description: '专业的商业提案模板，适合项目投标和合作提案'
    },
    {
      id: 'research-report',
      name: '研究报告',
      type: 'research-report',
      description: '学术和商业研究报告模板，支持数据图表展示'
    },
    {
      id: 'education-plan',
      name: '教育计划',
      type: 'education-plan',
      description: '教学计划和课程大纲模板，适合教育工作者'
    },
    {
      id: 'financial-report',
      name: '财务报告',
      type: 'financial-report',
      description: '财务分析和报告模板，支持财务数据表格'
    }
  ];
}