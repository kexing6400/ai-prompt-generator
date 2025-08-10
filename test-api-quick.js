/**
 * 快速API测试脚本
 * 测试前端AI对话功能
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testAPI() {
  console.log('🔍 开始测试API功能...\n');
  
  // 测试1: 健康检查
  console.log('1. 测试API健康检查 (GET /api/generate-prompt)');
  try {
    const response = await fetch(`${BASE_URL}/api/generate-prompt`);
    const data = await response.json();
    console.log('✅ 健康检查成功');
    console.log('📊 API状态:', data.status);
    console.log('🤖 可用模型数量:', data.openrouter?.availableModels || 0);
  } catch (error) {
    console.log('❌ 健康检查失败:', error.message);
    return;
  }

  console.log('\n');

  // 测试2: 生成AI提示词
  console.log('2. 测试AI提示词生成 (POST /api/generate-prompt)');
  try {
    const testPrompt = {
      prompt: "请为法律文书起草生成一个专业的AI提示词",
      industry: "lawyer",
      template: "legal_document"
    };

    const response = await fetch(`${BASE_URL}/api/generate-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPrompt)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ 生成失败:', errorData.error);
      return;
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ AI提示词生成成功');
      console.log('🤖 使用模型:', result.metadata?.model || 'unknown');
      console.log('📝 生成内容长度:', result.content?.length || 0, '字符');
      console.log('⏱️ 响应时间:', result.metadata?.responseTime || 'unknown');
      console.log('💰 使用量:', result.metadata?.usage?.remaining || 'unknown', '/', result.metadata?.usage?.limit || 'unknown');
    } else {
      console.log('❌ 生成失败:', result.error);
    }
  } catch (error) {
    console.log('❌ 请求失败:', error.message);
  }

  console.log('\n🎉 API测试完成！');
}

// 等待服务器启动后再测试
setTimeout(() => {
  testAPI().catch(console.error);
}, 3000);