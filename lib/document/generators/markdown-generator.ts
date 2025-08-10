import { 
  DocumentGenerationRequest, 
  DocumentData, 
  DocumentStyle, 
  DocumentSection 
} from '@/types/document';

/**
 * 生成Markdown文档
 */
export async function generateMarkdown(
  request: DocumentGenerationRequest,
  documentId: string
): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
  try {
    // 合并默认样式和自定义样式
    const mergedStyle: DocumentStyle = {
      showHeader: true,
      showFooter: true,
      ...request.style,
    };

    // 添加时间戳和版本信息
    const documentData: DocumentData = {
      ...request.data,
      date: request.data.date || new Date().toLocaleDateString(),
      version: request.data.version || '1.0',
    };

    // 生成Markdown内容
    let markdown = '';

    // 前置元数据 (YAML Front Matter)
    markdown += '---\n';
    markdown += `title: "${documentData.title}"\n`;
    if (documentData.subtitle) {
      markdown += `subtitle: "${documentData.subtitle}"\n`;
    }
    if (documentData.author) {
      markdown += `author: "${documentData.author}"\n`;
    }
    markdown += `date: "${documentData.date}"\n`;
    if (documentData.version) {
      markdown += `version: "${documentData.version}"\n`;
    }
    markdown += `generated: "${new Date().toISOString()}"\n`;
    markdown += `document_id: "${documentId}"\n`;
    markdown += '---\n\n';

    // 文档标题
    if (mergedStyle.showHeader !== false) {
      markdown += `# ${documentData.title}\n\n`;
      
      if (documentData.subtitle) {
        markdown += `*${documentData.subtitle}*\n\n`;
      }
    }

    // 文档信息表格
    markdown += '| 项目 | 信息 |\n';
    markdown += '|------|------|\n';
    if (documentData.author) {
      markdown += `| 作者 | ${documentData.author} |\n`;
    }
    markdown += `| 日期 | ${documentData.date} |\n`;
    if (documentData.version) {
      markdown += `| 版本 | ${documentData.version} |\n`;
    }
    markdown += '\n---\n\n';

    // 目录生成（如果有多个章节）
    if (documentData.sections.length > 1) {
      markdown += '## 目录\n\n';
      markdown += generateTableOfContents(documentData.sections);
      markdown += '\n---\n\n';
    }

    // 内容章节
    markdown += generateMarkdownSections(documentData.sections, 2);

    // 页脚信息
    if (mergedStyle.showFooter !== false) {
      markdown += '\n---\n\n';
      markdown += '*本文档由 AI Prompt Generator 自动生成*\n\n';
      if (mergedStyle.companyName) {
        markdown += `**${mergedStyle.companyName}**\n\n`;
      }
      markdown += `*生成时间: ${new Date().toLocaleString()}*\n`;
      markdown += `*文档ID: ${documentId}*\n`;
    }

    // 转换为Buffer
    const buffer = Buffer.from(markdown, 'utf-8');

    // 生成文件名
    const fileName = request.options?.fileName || 
      `${documentData.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_${documentId}.md`;

    return {
      buffer,
      fileName,
      mimeType: 'text/markdown'
    };

  } catch (error) {
    console.error('Markdown generation error:', error);
    throw new Error(`Markdown generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 生成目录
 */
function generateTableOfContents(sections: DocumentSection[], level = 1): string {
  let toc = '';
  
  sections.forEach(section => {
    const indent = '  '.repeat(level - 1);
    const anchor = section.title.toLowerCase()
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5\s]/g, '')
      .replace(/\s+/g, '-');
    
    toc += `${indent}- [${section.title}](#${anchor})\n`;
    
    if (section.subsections && section.subsections.length > 0) {
      toc += generateTableOfContents(section.subsections, level + 1);
    }
  });
  
  return toc;
}

/**
 * 生成Markdown章节内容
 */
function generateMarkdownSections(sections: DocumentSection[], level = 2): string {
  let markdown = '';

  sections.forEach((section, index) => {
    // 章节标题
    const headerLevel = '#'.repeat(Math.min(level, 6));
    markdown += `${headerLevel} ${section.title}\n\n`;

    // 章节内容
    if (section.content) {
      // 处理内容格式
      let content = section.content;
      
      // 根据类型进行特殊处理
      switch (section.type) {
        case 'code':
          content = `\`\`\`\n${content}\n\`\`\``;
          break;
        case 'table':
          content = formatTableContent(content);
          break;
        case 'list':
          content = formatListContent(content);
          break;
        default:
          // 普通文本，保持段落格式
          content = content.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n\n');
      }
      
      markdown += `${content}\n\n`;
    }

    // 递归处理子章节
    if (section.subsections && section.subsections.length > 0) {
      markdown += generateMarkdownSections(section.subsections, level + 1);
    }

    // 章节分隔符（除了最后一个章节）
    if (index < sections.length - 1) {
      markdown += '---\n\n';
    }
  });

  return markdown;
}

/**
 * 格式化表格内容
 */
function formatTableContent(content: string): string {
  // 简单的表格格式化 - 假设内容是以制表符或多个空格分隔的
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) return content;
  
  // 尝试解析为表格
  const rows = lines.map(line => 
    line.split(/\t|  +/).map(cell => cell.trim()).filter(cell => cell)
  );
  
  if (rows.length === 0 || rows[0].length < 2) {
    return content; // 无法格式化为表格，返回原内容
  }
  
  let table = '';
  
  // 表头
  table += '| ' + rows[0].join(' | ') + ' |\n';
  table += '|' + rows[0].map(() => '---').join('|') + '|\n';
  
  // 数据行
  for (let i = 1; i < rows.length; i++) {
    // 确保列数一致
    const row = rows[i];
    while (row.length < rows[0].length) {
      row.push('');
    }
    table += '| ' + row.slice(0, rows[0].length).join(' | ') + ' |\n';
  }
  
  return table;
}

/**
 * 格式化列表内容
 */
function formatListContent(content: string): string {
  // 将文本转换为Markdown列表格式
  const lines = content.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  return lines.map(line => {
    // 如果已经是列表格式，保持不变
    if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\.\s/.test(line)) {
      return line;
    }
    // 否则添加列表标记
    return `- ${line}`;
  }).join('\n');
}

/**
 * 生成增强的Markdown（支持扩展语法）
 */
export async function generateEnhancedMarkdown(
  request: DocumentGenerationRequest,
  documentId: string
): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
  // 在基础Markdown基础上添加扩展功能
  const basicResult = await generateMarkdown(request, documentId);
  
  let enhancedMarkdown = basicResult.buffer.toString('utf-8');
  
  // 添加Mermaid图表支持标记
  enhancedMarkdown = enhancedMarkdown.replace(
    /```mermaid/g, 
    '```mermaid\n%%{init: {"theme": "default"}}%%'
  );
  
  // 添加数学公式支持提示
  if (enhancedMarkdown.includes('$$') || enhancedMarkdown.includes('$')) {
    enhancedMarkdown = '<!-- 本文档包含数学公式，建议使用支持KaTeX的Markdown查看器 -->\n\n' + enhancedMarkdown;
  }
  
  // 添加脚注支持
  enhancedMarkdown = enhancedMarkdown.replace(
    /\[(\d+)\]/g, 
    '[^$1]'
  );
  
  return {
    buffer: Buffer.from(enhancedMarkdown, 'utf-8'),
    fileName: basicResult.fileName.replace('.md', '_enhanced.md'),
    mimeType: basicResult.mimeType
  };
}

/**
 * Markdown样式配置
 */
export const MarkdownConfig = {
  // 基础配置
  basic: {
    useYamlFrontMatter: true,
    includeTOC: true,
    includeFooter: true,
    sectionSeparators: true,
  },
  
  // GitHub风格
  github: {
    useYamlFrontMatter: false,
    includeTOC: true,
    includeFooter: false,
    sectionSeparators: false,
    useTaskLists: true,
  },
  
  // 技术文档风格
  technical: {
    useYamlFrontMatter: true,
    includeTOC: true,
    includeFooter: true,
    sectionSeparators: true,
    useCodeBlocks: true,
    useMermaid: true,
  },
  
  // 学术论文风格
  academic: {
    useYamlFrontMatter: true,
    includeTOC: true,
    includeFooter: true,
    sectionSeparators: true,
    useFootnotes: true,
    useMath: true,
  }
};