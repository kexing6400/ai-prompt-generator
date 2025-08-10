import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  pdf, 
  Font,
  Image
} from '@react-pdf/renderer';
import { 
  DocumentGenerationRequest, 
  DocumentData, 
  DocumentStyle, 
  DocumentSection 
} from '@/types/document';

// 注册中文字体（使用系统字体）
Font.register({
  family: 'SimSun',
  src: '/fonts/SimSun.ttf', // 需要在public/fonts目录下放置字体文件
});

/**
 * PDF文档组件
 */
const PDFDocument: React.FC<{ data: DocumentData; style: DocumentStyle }> = ({ 
  data, 
  style 
}) => {
  // 创建样式
  const styles = StyleSheet.create({
    page: {
      fontFamily: 'SimSun',
      fontSize: style.fontSize || 12,
      lineHeight: style.lineHeight || 1.5,
      padding: {
        top: style.marginTop || 40,
        right: style.marginRight || 40,
        bottom: style.marginBottom || 40,
        left: style.marginLeft || 40,
      },
      backgroundColor: style.backgroundColor || '#ffffff',
    },
    header: {
      marginBottom: 20,
      borderBottom: 1,
      borderBottomColor: style.primaryColor || '#000000',
      paddingBottom: 10,
    },
    title: {
      fontSize: (style.fontSize || 12) + 8,
      fontWeight: 'bold',
      color: style.primaryColor || '#000000',
      textAlign: 'center',
      marginBottom: 10,
    },
    subtitle: {
      fontSize: (style.fontSize || 12) + 2,
      color: style.secondaryColor || '#666666',
      textAlign: 'center',
      marginBottom: 5,
    },
    metadata: {
      fontSize: (style.fontSize || 12) - 1,
      color: style.textColor || '#333333',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    section: {
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: (style.fontSize || 12) + 4,
      fontWeight: 'bold',
      color: style.primaryColor || '#000000',
      marginBottom: 8,
      borderBottom: 1,
      borderBottomColor: style.secondaryColor || '#cccccc',
      paddingBottom: 3,
    },
    sectionContent: {
      fontSize: style.fontSize || 12,
      color: style.textColor || '#333333',
      textAlign: 'justify',
      lineHeight: style.lineHeight || 1.5,
    },
    footer: {
      position: 'absolute',
      bottom: 30,
      left: 0,
      right: 0,
      textAlign: 'center',
      fontSize: (style.fontSize || 12) - 2,
      color: style.secondaryColor || '#666666',
      borderTop: 1,
      borderTopColor: style.secondaryColor || '#cccccc',
      paddingTop: 5,
    },
    watermark: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%) rotate(-45deg)',
      fontSize: 48,
      color: 'rgba(0,0,0,0.1)',
      zIndex: -1,
    },
  });

  return (
    <Document>
      <Page size={style.pageSize || 'A4'} orientation={style.orientation || 'portrait'} style={styles.page}>
        {/* 水印 */}
        {style.watermark && (
          <Text style={styles.watermark}>{style.watermark}</Text>
        )}
        
        {/* 头部 */}
        {style.showHeader !== false && (
          <View style={styles.header}>
            <Text style={styles.title}>{data.title}</Text>
            {data.subtitle && (
              <Text style={styles.subtitle}>{data.subtitle}</Text>
            )}
          </View>
        )}

        {/* 元数据 */}
        <View style={styles.metadata}>
          <Text>{data.author ? `作者: ${data.author}` : ''}</Text>
          <Text>{data.date ? `日期: ${data.date}` : `日期: ${new Date().toLocaleDateString()}`}</Text>
          <Text>{data.version ? `版本: ${data.version}` : ''}</Text>
        </View>

        {/* 内容章节 */}
        {data.sections.map((section, index) => (
          <PDFSection key={section.id || index} section={section} styles={styles} />
        ))}

        {/* 页脚 */}
        {style.showFooter !== false && (
          <Text style={styles.footer} render={({ pageNumber, totalPages }) => 
            style.showPageNumbers !== false 
              ? `${style.companyName || ''} | 第 ${pageNumber} 页 共 ${totalPages} 页`
              : style.companyName || ''
          } fixed />
        )}
      </Page>
    </Document>
  );
};

/**
 * PDF章节组件
 */
const PDFSection: React.FC<{ 
  section: DocumentSection; 
  styles: any; 
  level?: number 
}> = ({ section, styles, level = 0 }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionContent}>{section.content}</Text>
      
      {/* 递归渲染子章节 */}
      {section.subsections && section.subsections.map((subsection, index) => (
        <PDFSection 
          key={subsection.id || index} 
          section={subsection} 
          styles={styles} 
          level={level + 1} 
        />
      ))}
    </View>
  );
};

/**
 * 生成PDF文档
 */
export async function generatePDF(
  request: DocumentGenerationRequest,
  documentId: string
): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
  try {
    // 合并默认样式和自定义样式
    const mergedStyle: DocumentStyle = {
      fontSize: 12,
      lineHeight: 1.5,
      marginTop: 40,
      marginRight: 40,
      marginBottom: 40,
      marginLeft: 40,
      primaryColor: '#000000',
      secondaryColor: '#666666',
      textColor: '#333333',
      backgroundColor: '#ffffff',
      pageSize: 'A4',
      orientation: 'portrait',
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

    // 生成PDF
    const pdfDocument = (
      <PDFDocument data={documentData} style={mergedStyle} />
    );

    const asPdf = pdf(pdfDocument);
    const buffer = await asPdf.toBuffer();

    // 生成文件名
    const fileName = request.options?.fileName || 
      `${documentData.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_${documentId}.pdf`;

    return {
      buffer,
      fileName,
      mimeType: 'application/pdf'
    };

  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 获取PDF样式预设
 */
export const PDFStylePresets = {
  // 商务正式风格
  business: {
    primaryColor: '#1a365d',
    secondaryColor: '#4a5568',
    textColor: '#2d3748',
    fontSize: 11,
    lineHeight: 1.6,
  },
  
  // 法律文档风格
  legal: {
    primaryColor: '#000000',
    secondaryColor: '#4a5568',
    textColor: '#1a202c',
    fontSize: 10,
    lineHeight: 1.8,
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
  },
  
  // 创意设计风格
  creative: {
    primaryColor: '#9f7aea',
    secondaryColor: '#b794f6',
    textColor: '#322659',
    fontSize: 12,
    lineHeight: 1.5,
  }
};