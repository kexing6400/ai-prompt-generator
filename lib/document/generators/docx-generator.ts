import { 
  Document, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType, 
  Packer,
  Header,
  Footer,
  PageNumber,
  PageBreak,
  Table,
  TableRow,
  TableCell,
  WidthType
} from 'docx';
import { 
  DocumentGenerationRequest, 
  DocumentData, 
  DocumentStyle, 
  DocumentSection 
} from '@/types/document';

/**
 * 生成DOCX文档
 */
export async function generateDOCX(
  request: DocumentGenerationRequest,
  documentId: string
): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
  try {
    // 合并默认样式和自定义样式
    const mergedStyle: DocumentStyle = {
      fontSize: 12,
      lineHeight: 1.5,
      primaryColor: '#000000',
      secondaryColor: '#666666',
      textColor: '#333333',
      showHeader: true,
      showFooter: true,
      showPageNumbers: true,
      ...request.style,
    };

    // 添加时间戳和版本信息
    const documentData: DocumentData = {
      ...request.data,
      date: request.data.date || new Date().toLocaleDateString(),
      version: request.data.version || '1.0',
    };

    // 创建DOCX文档
    const doc = new Document({
      creator: documentData.author || 'AI Prompt Generator',
      title: documentData.title,
      description: documentData.subtitle || '',
      
      styles: {
        default: {
          document: {
            run: {
              size: (mergedStyle.fontSize || 12) * 2, // DOCX使用半磅单位
              font: mergedStyle.fontFamily || 'SimSun',
              color: convertColorToDocx(mergedStyle.textColor || '#333333'),
            },
            paragraph: {
              spacing: {
                line: Math.round((mergedStyle.lineHeight || 1.5) * 240), // DOCX行间距单位
              },
            },
          },
        },
        paragraphStyles: [
          {
            id: 'title',
            name: 'Title',
            basedOn: 'Normal',
            next: 'Normal',
            run: {
              size: ((mergedStyle.fontSize || 12) + 8) * 2,
              bold: true,
              color: convertColorToDocx(mergedStyle.primaryColor || '#000000'),
            },
            paragraph: {
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            },
          },
          {
            id: 'subtitle',
            name: 'Subtitle',
            basedOn: 'Normal',
            next: 'Normal',
            run: {
              size: ((mergedStyle.fontSize || 12) + 2) * 2,
              color: convertColorToDocx(mergedStyle.secondaryColor || '#666666'),
            },
            paragraph: {
              alignment: AlignmentType.CENTER,
              spacing: { after: 100 },
            },
          },
          {
            id: 'sectionTitle',
            name: 'Section Title',
            basedOn: 'Normal',
            next: 'Normal',
            run: {
              size: ((mergedStyle.fontSize || 12) + 4) * 2,
              bold: true,
              color: convertColorToDocx(mergedStyle.primaryColor || '#000000'),
            },
            paragraph: {
              spacing: { before: 200, after: 100 },
            },
          },
        ],
      },

      sections: [{
        properties: {
          page: {
            size: {
              orientation: mergedStyle.orientation === 'landscape' ? 'landscape' : 'portrait',
            },
            margin: {
              top: convertToTwips(mergedStyle.marginTop || 40),
              right: convertToTwips(mergedStyle.marginRight || 40),
              bottom: convertToTwips(mergedStyle.marginBottom || 40),
              left: convertToTwips(mergedStyle.marginLeft || 40),
            },
          },
        },

        headers: mergedStyle.showHeader !== false ? {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: documentData.title,
                    bold: true,
                    size: ((mergedStyle.fontSize || 12) + 2) * 2,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        } : undefined,

        footers: mergedStyle.showFooter !== false ? {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: mergedStyle.companyName || '',
                  }),
                  new TextRun({
                    text: mergedStyle.showPageNumbers !== false ? ' | 第 ' : '',
                  }),
                  ...(mergedStyle.showPageNumbers !== false ? [new TextRun({ children: [PageNumber.CURRENT] })] : []),
                  new TextRun({
                    text: mergedStyle.showPageNumbers !== false ? ' 页' : '',
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        } : undefined,

        children: [
          // 文档标题
          new Paragraph({
            children: [
              new TextRun({
                text: documentData.title,
                bold: true,
                size: ((mergedStyle.fontSize || 12) + 8) * 2,
                color: convertColorToDocx(mergedStyle.primaryColor || '#000000'),
              }),
            ],
            style: 'title',
          }),

          // 副标题
          ...(documentData.subtitle ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: documentData.subtitle,
                  size: ((mergedStyle.fontSize || 12) + 2) * 2,
                  color: convertColorToDocx(mergedStyle.secondaryColor || '#666666'),
                }),
              ],
              style: 'subtitle',
            }),
          ] : []),

          // 元数据表格
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: `作者: ${documentData.author || ''}` })],
                    width: { size: 33.33, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: `日期: ${documentData.date}` })],
                    width: { size: 33.33, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: `版本: ${documentData.version}` })],
                    width: { size: 33.34, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
            ],
          }),

          // 空行
          new Paragraph({ text: '' }),

          // 内容章节
          ...generateDocxSections(documentData.sections, mergedStyle),
        ],
      }],
    });

    // 生成Buffer
    const buffer = await Packer.toBuffer(doc);

    // 生成文件名
    const fileName = request.options?.fileName || 
      `${documentData.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_${documentId}.docx`;

    return {
      buffer,
      fileName,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };

  } catch (error) {
    console.error('DOCX generation error:', error);
    throw new Error(`DOCX generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 生成DOCX文档章节
 */
function generateDocxSections(sections: DocumentSection[], style: DocumentStyle): any[] {
  const elements: any[] = [];

  sections.forEach((section, index) => {
    // 章节标题
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: section.title,
            bold: true,
            size: ((style.fontSize || 12) + 4) * 2,
            color: convertColorToDocx(style.primaryColor || '#000000'),
          }),
        ],
        style: 'sectionTitle',
      })
    );

    // 章节内容 - 按段落分割
    const paragraphs = section.content.split('\n').filter(p => p.trim());
    paragraphs.forEach(paragraph => {
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: paragraph.trim(),
              size: (style.fontSize || 12) * 2,
              color: convertColorToDocx(style.textColor || '#333333'),
            }),
          ],
        })
      );
    });

    // 递归处理子章节
    if (section.subsections && section.subsections.length > 0) {
      elements.push(...generateDocxSections(section.subsections, style));
    }

    // 章节间空行
    if (index < sections.length - 1) {
      elements.push(new Paragraph({ text: '' }));
    }
  });

  return elements;
}

/**
 * 将十六进制颜色转换为DOCX格式
 */
function convertColorToDocx(color: string): string {
  // 移除#号并确保是6位十六进制
  return color.replace('#', '').toUpperCase().padEnd(6, '0');
}

/**
 * 将像素转换为缇（Twips）单位 (1 inch = 1440 twips, 72 points = 1 inch)
 */
function convertToTwips(pixels: number): number {
  // 假设72 DPI，1像素 = 20缇
  return Math.round(pixels * 20);
}

/**
 * DOCX样式预设
 */
export const DOCXStylePresets = {
  // 商务正式风格
  business: {
    primaryColor: '#1a365d',
    secondaryColor: '#4a5568',
    textColor: '#2d3748',
    fontSize: 11,
    lineHeight: 1.6,
    fontFamily: 'Calibri',
  },
  
  // 法律文档风格
  legal: {
    primaryColor: '#000000',
    secondaryColor: '#4a5568',
    textColor: '#1a202c',
    fontSize: 10,
    lineHeight: 1.8,
    fontFamily: 'Times New Roman',
    showPageNumbers: true,
    showHeader: true,
    showFooter: true,
  },
  
  // 教育学术风格
  academic: {
    primaryColor: '#2b6cb0',
    secondaryColor: '#4299e1',
    textColor: '#2d3748',
    fontSize: 12,
    lineHeight: 1.7,
    fontFamily: 'Times New Roman',
  },
  
  // 创意设计风格
  creative: {
    primaryColor: '#9f7aea',
    secondaryColor: '#b794f6',
    textColor: '#322659',
    fontSize: 12,
    lineHeight: 1.5,
    fontFamily: 'Calibri',
  }
};