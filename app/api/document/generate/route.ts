import { NextRequest, NextResponse } from 'next/server';
import { 
  SimpleDocumentFormat, 
  SimpleDocumentRequest, 
  SimpleDocumentResponse 
} from '@/types/document';

// 强制动态渲染 - 确保每次请求都重新执行
export const dynamic = 'force-dynamic';

/**
 * 简化的文档生成API端点
 * Simplified Document Generation API Endpoint
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 解析请求数据
    const requestData: SimpleDocumentRequest = await request.json();
    
    // 验证请求数据
    if (!requestData.title || !requestData.content || !requestData.format) {
      return NextResponse.json({
        success: false,
        error: 'Title, content, and format are required'
      } as SimpleDocumentResponse, { status: 400 });
    }

    // 生成文档内容
    const result = await generateSimpleDocument(requestData);
    
    return NextResponse.json(result, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });

  } catch (error) {
    console.error('Document generation error:', error);
    
    const errorResponse: SimpleDocumentResponse = {
      success: false,
      content: '',
      fileName: '',
      mimeType: '',
      error: error instanceof Error ? error.message : '文档生成失败'
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * 获取支持的文档格式列表
 */
export async function GET(): Promise<NextResponse> {
  try {
    const supportedFormats = Object.values(SimpleDocumentFormat);
    
    return NextResponse.json({
      supportedFormats,
      version: '2.0.0-simplified'
    });

  } catch (error) {
    console.error('Error fetching document info:', error);
    return NextResponse.json({ error: 'Failed to fetch document info' }, { status: 500 });
  }
}

/**
 * 简化的文档生成函数
 */
async function generateSimpleDocument(request: SimpleDocumentRequest): Promise<SimpleDocumentResponse> {
  const { title, content, format, industry, template, customFileName } = request;
  
  // 生成文件名
  const timestamp = new Date().toISOString().slice(0, 10);
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
  const defaultFileName = `${sanitizedTitle}_${timestamp}`;
  const fileName = customFileName || defaultFileName;
  
  let documentContent: string;
  let mimeType: string;
  let fullFileName: string;
  
  // 根据格式生成内容
  switch (format) {
    case SimpleDocumentFormat.MARKDOWN:
      documentContent = generateMarkdownContent(title, content, industry, template);
      mimeType = 'text/markdown';
      fullFileName = `${fileName}.md`;
      break;
      
    case SimpleDocumentFormat.TEXT:
      documentContent = generateTextContent(title, content, industry, template);
      mimeType = 'text/plain';
      fullFileName = `${fileName}.txt`;
      break;
      
    case SimpleDocumentFormat.HTML:
      documentContent = generateHTMLContent(title, content, industry, template);
      mimeType = 'text/html';
      fullFileName = `${fileName}.html`;
      break;
      
    default:
      throw new Error(`不支持的格式: ${format}`);
  }
  
  return {
    success: true,
    content: documentContent,
    fileName: fullFileName,
    mimeType
  };
}

/**
 * 生成Markdown格式文档
 */
function generateMarkdownContent(title: string, content: string, industry?: string, template?: string): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN');
  const timeStr = now.toLocaleTimeString('zh-CN');
  
  return `# ${title}

---

**生成时间**: ${dateStr} ${timeStr}\n**行业**: ${industry || '通用'}\n**模板**: ${template || '自定义'}\n\n---

## AI 提示词内容

${content}

---

## 使用说明

1. 将此提示词复制到您的AI助手中使用
2. 根据具体需求调整提示词内容
3. 建议在使用前先进行小规模测试

## 最佳实践

- 保持提示词简洁明确
- 提供具体的上下文信息
- 设定明确的输出要求
- 必要时添加示例格式

---

*此文档由 AI 提示词生成器自动生成*`;
}

/**
 * 生成纯文本格式文档
 */
function generateTextContent(title: string, content: string, industry?: string, template?: string): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN');
  const timeStr = now.toLocaleTimeString('zh-CN');
  
  return `${title}\n${'='.repeat(title.length)}\n\n生成时间: ${dateStr} ${timeStr}\n行业: ${industry || '通用'}\n模板: ${template || '自定义'}\n\n${'-'.repeat(50)}\n\nAI 提示词内容:\n\n${content}\n\n${'-'.repeat(50)}\n\n使用说明:\n\n1. 将此提示词复制到您的AI助手中使用\n2. 根据具体需求调整提示词内容\n3. 建议在使用前先进行小规模测试\n\n最佳实践:\n\n- 保持提示词简洁明确\n- 提供具体的上下文信息\n- 设定明确的输出要求\n- 必要时添加示例格式\n\n${'-'.repeat(50)}\n\n此文档由 AI 提示词生成器自动生成`;
}

/**
 * 生成HTML格式文档（用于打印PDF）
 */
function generateHTMLContent(title: string, content: string, industry?: string, template?: string): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN');
  const timeStr = now.toLocaleTimeString('zh-CN');
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; border-bottom: 3px solid #007bff; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .meta { background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0; }
        .content { background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 0.9em; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    <h1>${title}</h1>
    
    <div class="meta">
        <strong>生成时间:</strong> ${dateStr} ${timeStr}<br>
        <strong>行业:</strong> ${industry || '通用'}<br>
        <strong>模板:</strong> ${template || '自定义'}
    </div>
    
    <h2>AI 提示词内容</h2>
    <div class="content">
        <pre style="white-space: pre-wrap; font-family: inherit;">${content}</pre>
    </div>
    
    <h2>使用说明</h2>
    <ol>
        <li>将此提示词复制到您的AI助手中使用</li>
        <li>根据具体需求调整提示词内容</li>
        <li>建议在使用前先进行小规模测试</li>
    </ol>
    
    <h2>最佳实践</h2>
    <ul>
        <li>保持提示词简洁明确</li>
        <li>提供具体的上下文信息</li>
        <li>设定明确的输出要求</li>
        <li>必要时添加示例格式</li>
    </ul>
    
    <div class="footer">
        此文档由 AI 提示词生成器自动生成
    </div>
</body>
</html>`;
}