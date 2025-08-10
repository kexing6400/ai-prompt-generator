#!/usr/bin/env node

/**
 * 简化版AI聊天系统测试工具
 * 验证新的简洁对话接口功能
 */

const https = require('https');

// 测试配置
const BASE_URL = 'http://localhost:3000';
const SIMPLE_CHAT_API = `${BASE_URL}/api/simple-chat`;

// 测试用例
const testCases = [
  {
    name: '教师专家对话测试',
    request: {
      message: '我想为小学三年级学生设计一堂关于植物生长的科学课，应该如何安排课程内容？',
      expert: 'teacher'
    },
    expectKeywords: ['课程', '教学', '学生', '科学']
  },
  {
    name: '律师专家对话测试',
    request: {
      message: '我需要起草一份软件开发合同，有哪些关键条款是必须包含的？',
      expert: 'lawyer'
    },
    expectKeywords: ['合同', '条款', '法律', '风险']
  },
  {
    name: '会计师专家对话测试',
    request: {
      message: '小公司如何进行有效的成本控制和财务管理？',
      expert: 'accountant'
    },
    expectKeywords: ['财务', '成本', '管理', '分析']
  },
  {
    name: '房产专家对话测试',
    request: {
      message: '首次购房者在选择房产时应该考虑哪些因素？预算100万左右',
      expert: 'realtor'
    },
    expectKeywords: ['房产', '投资', '预算', '建议']
  },
  {
    name: '保险专家对话测试',
    request: {
      message: '30岁的IT工程师需要配置哪些保险？年收入20万',
      expert: 'insurance'
    },
    expectKeywords: ['保险', '保障', '风险', '规划']
  }
];

/**
 * 发送HTTP请求
 */
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SimpleChat-Test-Tool/1.0'
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const protocol = urlObj.protocol === 'https:' ? https : require('http');
    
    const req = protocol.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonResponse = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonResponse
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * 测试系统状态
 */
async function testSystemStatus() {
  console.log('\n🔍 测试系统状态...');
  
  try {
    const response = await makeRequest(SIMPLE_CHAT_API);
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ 系统运行正常');
      console.log(`📊 系统信息: ${response.data.system}`);
      console.log(`🤖 支持的专家: ${response.data.supportedExperts?.length || 0}个`);
      console.log(`💬 活跃对话: ${response.data.activeConversations}个`);
      
      // 显示支持的专家
      if (response.data.supportedExperts) {
        console.log('\n支持的AI专家:');
        response.data.supportedExperts.forEach(expert => {
          console.log(`  ${expert.emoji} ${expert.name}: ${expert.description}`);
        });
      }
      
      return true;
    } else {
      console.log('❌ 系统状态异常:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ 系统状态检查失败:', error.message);
    return false;
  }
}

/**
 * 测试单个对话
 */
async function testSingleChat(testCase) {
  console.log(`\n🧪 ${testCase.name}`);
  console.log(`📝 问题: ${testCase.request.message.substring(0, 50)}...`);
  console.log(`👨‍💼 专家: ${testCase.request.expert}`);
  
  const startTime = Date.now();
  
  try {
    const response = await makeRequest(SIMPLE_CHAT_API, 'POST', testCase.request);
    const responseTime = Date.now() - startTime;
    
    if (response.status === 200 && response.data.success) {
      console.log(`✅ 对话成功 (${responseTime}ms)`);
      console.log(`💬 对话ID: ${response.data.conversationId}`);
      console.log(`⏱️ 处理时间: ${response.data.responseTime}`);
      
      // 检查回复内容
      const reply = response.data.response;
      if (reply && reply.length > 0) {
        console.log(`📄 回复长度: ${reply.length}字符`);
        
        // 检查关键词
        const foundKeywords = testCase.expectKeywords.filter(keyword => 
          reply.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (foundKeywords.length > 0) {
          console.log(`🎯 关键词匹配: ${foundKeywords.join(', ')}`);
        }
        
        // 显示回复预览
        console.log(`💭 回复预览: ${reply.substring(0, 100)}...`);
        
        // 检查token使用情况
        if (response.data.usage) {
          console.log(`🔢 Token使用: 输入${response.data.usage.inputTokens}, 输出${response.data.usage.outputTokens}, 总计${response.data.usage.totalTokens}`);
        }
        
        return {
          success: true,
          conversationId: response.data.conversationId,
          responseTime,
          replyLength: reply.length,
          keywordMatches: foundKeywords.length
        };
      } else {
        console.log('⚠️ 回复内容为空');
        return { success: false, error: '回复内容为空' };
      }
    } else {
      console.log('❌ 对话失败:', response.data);
      return { success: false, error: response.data.error || '未知错误' };
    }
  } catch (error) {
    console.log('❌ 请求失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 测试对话历史功能
 */
async function testConversationHistory(conversationId) {
  console.log(`\n📚 测试对话历史 (ID: ${conversationId})`);
  
  try {
    const response = await makeRequest(`${SIMPLE_CHAT_API}?action=conversation&conversationId=${conversationId}`);
    
    if (response.status === 200 && response.data.success) {
      const conversation = response.data.conversation;
      console.log('✅ 对话历史获取成功');
      console.log(`💬 消息数量: ${conversation.messageCount}`);
      console.log(`👨‍💼 专家类型: ${conversation.expert}`);
      console.log(`⏰ 创建时间: ${conversation.createdAt}`);
      console.log(`🔄 更新时间: ${conversation.updatedAt}`);
      
      return true;
    } else {
      console.log('❌ 对话历史获取失败:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ 对话历史请求失败:', error.message);
    return false;
  }
}

/**
 * 测试连续对话
 */
async function testContinuousChat(conversationId, expert) {
  console.log(`\n🔄 测试连续对话 (ID: ${conversationId})`);
  
  const followUpQuestions = [
    '能详细说明一下吗？',
    '这个方案的实施难度如何？',
    '有什么需要特别注意的风险吗？'
  ];
  
  for (let i = 0; i < followUpQuestions.length; i++) {
    const question = followUpQuestions[i];
    console.log(`\n📝 后续问题 ${i + 1}: ${question}`);
    
    const result = await testSingleChat({
      name: `连续对话 ${i + 1}`,
      request: {
        message: question,
        expert: expert,
        conversationId: conversationId
      },
      expectKeywords: ['建议', '方案', '解决']
    });
    
    if (!result.success) {
      console.log('❌ 连续对话测试中断');
      return false;
    }
    
    // 短暂延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('✅ 连续对话测试完成');
  return true;
}

/**
 * 主测试流程
 */
async function runTests() {
  console.log('🚀 简化版AI聊天系统测试开始');
  console.log('=' .repeat(50));
  
  // 1. 测试系统状态
  const systemOk = await testSystemStatus();
  if (!systemOk) {
    console.log('\n❌ 系统状态检查失败，终止测试');
    process.exit(1);
  }
  
  // 2. 测试各专家对话
  const results = [];
  let firstConversationId = null;
  let firstExpert = null;
  
  for (const testCase of testCases) {
    const result = await testSingleChat(testCase);
    results.push({ ...result, testCase: testCase.name });
    
    // 记录第一个成功的对话ID用于后续测试
    if (result.success && !firstConversationId) {
      firstConversationId = result.conversationId;
      firstExpert = testCase.request.expert;
    }
    
    // 测试间隔
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // 3. 测试对话历史功能
  if (firstConversationId) {
    await testConversationHistory(firstConversationId);
    
    // 4. 测试连续对话
    await testContinuousChat(firstConversationId, firstExpert);
  }
  
  // 5. 生成测试报告
  console.log('\n📊 测试结果统计');
  console.log('=' .repeat(50));
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  const averageResponseTime = results
    .filter(r => r.success && r.responseTime)
    .reduce((sum, r) => sum + r.responseTime, 0) / successCount || 0;
  
  console.log(`✅ 成功: ${successCount}/${totalCount}`);
  console.log(`⏱️ 平均响应时间: ${averageResponseTime.toFixed(0)}ms`);
  console.log(`📝 平均回复长度: ${results
    .filter(r => r.success && r.replyLength)
    .reduce((sum, r) => sum + r.replyLength, 0) / successCount || 0}字符`);
  
  // 显示失败的测试
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    console.log('\n❌ 失败的测试:');
    failures.forEach(failure => {
      console.log(`  - ${failure.testCase}: ${failure.error}`);
    });
  }
  
  // 最终评估
  if (successCount === totalCount) {
    console.log('\n🎉 所有测试通过！简化版AI聊天系统运行正常');
  } else if (successCount > 0) {
    console.log('\n⚠️ 部分测试失败，但核心功能正常');
  } else {
    console.log('\n💥 所有测试失败，系统可能存在问题');
  }
  
  console.log('\n🔚 测试完成');
}

// 运行测试
if (require.main === module) {
  runTests().catch(error => {
    console.error('\n💥 测试运行失败:', error);
    process.exit(1);
  });
}

module.exports = {
  testSystemStatus,
  testSingleChat,
  testConversationHistory,
  runTests
};