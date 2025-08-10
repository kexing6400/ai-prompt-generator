#!/usr/bin/env node

/**
 * 直接测试生成API，绕过健康检查
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3003';
const TEST_DATA = {
  prompt: '请帮我制作一个适用于法律顾问的AI提示词，用于帮助客户理解合同条款',
  industry: 'lawyer',
  template: 'basic',
  formData: {
    contractType: '服务合同',
    specificClauses: '保密条款、违约责任'
  }
};

async function testDirectGeneration() {
  console.log('🎯 直接测试提示词生成API\n');
  
  try {
    console.log('📤 发送生成请求...');
    console.log('数据:', JSON.stringify(TEST_DATA, null, 2));
    
    const startTime = Date.now();
    
    const response = await fetch(`${API_BASE}/api/generate-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_DATA)
    });
    
    const responseTime = Date.now() - startTime;
    
    console.log(`\n⏱️  响应时间: ${responseTime}ms`);
    console.log(`📊 HTTP状态: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log('📄 原始响应长度:', responseText.length);
    
    if (!response.ok) {
      console.error('❌ 响应失败');
      console.log('响应内容:', responseText.substring(0, 1000));
      return false;
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ JSON解析失败:', e.message);
      console.log('响应内容:', responseText.substring(0, 500));
      return false;
    }
    
    console.log('\n✅ API调用成功!');
    console.log('\n📋 响应数据:');
    console.log('- 成功状态:', data.success);
    console.log('- 内容长度:', data.content?.length || 0, '字符');
    console.log('- 使用模型:', data.metadata?.model);
    console.log('- 模型ID:', data.metadata?.modelId);
    console.log('- 提供商:', data.metadata?.provider);
    console.log('- 成本:', data.metadata?.cost);
    console.log('- 是否模拟:', data.metadata?.model?.includes('simulation') ? '❌ 仍在使用模拟' : '✅ 真实API');
    
    if (data.metadata?.usage) {
      console.log('- Token使用:', data.metadata.usage.tokens);
      console.log('- 剩余配额:', data.metadata.usage.remaining);
    }
    
    if (data.metadata?.attemptedModels) {
      console.log('- 尝试模型:', data.metadata.attemptedModels);
    }
    
    console.log('\n📝 生成的提示词预览:');
    if (data.content) {
      const preview = data.content.substring(0, 500) + (data.content.length > 500 ? '...' : '');
      console.log(preview);
    }
    
    // 关键验证
    const validations = [
      { name: '响应时间合理 (<15秒)', pass: responseTime < 15000 },
      { name: '返回成功状态', pass: data.success === true },
      { name: '内容不为空', pass: data.content && data.content.length > 0 },
      { name: '不是模拟生成', pass: !data.metadata?.model?.includes('simulation') },
      { name: '包含元数据', pass: !!data.metadata },
      { name: '内容质量检查', pass: data.content && data.content.length > 200 }
    ];
    
    console.log('\n🔍 质量验证:');
    validations.forEach(v => {
      console.log(`${v.pass ? '✅' : '❌'} ${v.name}`);
    });
    
    const passedCount = validations.filter(v => v.pass).length;
    console.log(`\n📊 总体质量: ${passedCount}/${validations.length} 通过`);
    
    if (passedCount >= 4) { // 至少通过4个测试
      console.log('🎉 主要功能测试通过！');
      return true;
    } else {
      console.log('⚠️  需要进一步优化');
      return false;
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('提示: 确保开发服务器正在运行 (npm run dev)');
    }
    
    return false;
  }
}

// 运行测试
testDirectGeneration().then(success => {
  if (success) {
    console.log('\n🎊 核心API功能正常！');
    process.exit(0);
  } else {
    console.log('\n❌ API测试未完全通过');
    process.exit(1);
  }
}).catch(console.error);