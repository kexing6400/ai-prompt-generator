#!/usr/bin/env node

/**
 * 文档下载功能测试脚本
 * Document Download Feature Test Script
 */

const testDocumentGeneration = async () => {
  console.log('🧪 测试文档生成API...');
  
  const testCases = [
    {
      title: '律师 - 合同审查提示词',
      content: '请帮我审查以下商业合同，重点关注：\n1. 付款条款是否合理\n2. 违约责任是否平衡\n3. 知识产权条款是否完备\n\n合同内容：\n[在此插入合同内容]',
      format: 'md',
      industry: '律师',
      template: '合同审查'
    },
    {
      title: '教师 - 课程设计提示词',
      content: '设计一个关于机器学习基础的课程大纲，包括：\n1. 学习目标\n2. 课程内容\n3. 评估方式\n4. 推荐资源\n\n目标学生：计算机科学本科生',
      format: 'txt',
      industry: '教师',
      template: '课程设计'
    },
    {
      title: '会计师 - 财务分析提示词',
      content: '分析公司Q3财务报表，重点关注：\n1. 收入增长趋势\n2. 成本控制情况\n3. 现金流状况\n4. 盈利能力指标\n\n请提供具体的改进建议',
      format: 'html',
      industry: '会计师',
      template: '财务分析'
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n📋 测试用例 ${i + 1}: ${testCase.title}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/document/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ 成功生成 ${testCase.format.toUpperCase()} 文档`);
        console.log(`📄 文件名: ${data.fileName}`);
        console.log(`📐 内容长度: ${data.content.length} 字符`);
        console.log(`🔍 MIME类型: ${data.mimeType}`);
      } else {
        console.log(`❌ 生成失败: ${data.error}`);
      }
    } catch (error) {
      console.log(`❌ 请求失败: ${error.message}`);
    }
  }
};

const testGetFormats = async () => {
  console.log('\n📋 测试获取支持的格式...');
  
  try {
    const response = await fetch('http://localhost:3000/api/document/generate');
    const data = await response.json();
    
    console.log('✅ 支持的格式:', data.supportedFormats);
    console.log('📦 API版本:', data.version);
  } catch (error) {
    console.log(`❌ 获取格式失败: ${error.message}`);
  }
};

const runTests = async () => {
  console.log('🚀 开始测试文档下载功能');
  console.log('=' * 50);
  
  try {
    await testGetFormats();
    await testDocumentGeneration();
    
    console.log('\n' + '=' * 50);
    console.log('✅ 所有测试完成！');
    console.log('\n💡 下一步：');
    console.log('1. 启动开发服务器: npm run dev');
    console.log('2. 访问应用并测试下载功能');
    console.log('3. 验证生成的文档格式和内容');
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  }
};

// 运行测试
if (require.main === module) {
  runTests();
}

module.exports = { testDocumentGeneration, testGetFormats };