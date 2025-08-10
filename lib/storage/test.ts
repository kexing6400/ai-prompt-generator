/**
 * JSON存储系统快速测试
 * 验证核心功能是否正常工作
 */

import { createNewUser, getDefaultStore } from './json-store';
import { getCurrentDateString } from './utils';

async function quickTest() {
  console.log('🧪 开始JSON存储系统快速测试...\n');

  try {
    // 获取存储实例
    const store = getDefaultStore({
      dataPath: './test-data',
      enableCache: true
    });

    // 测试1: 创建和保存用户
    console.log('1️⃣ 测试用户创建和保存...');
    const testUser = createNewUser(
      'test@example.com',
      '测试用户',
      'free'
    );
    
    const saveResult = await store.saveUser(testUser);
    console.log('✅ 用户保存:', saveResult.success ? '成功' : '失败');

    // 测试2: 读取用户
    console.log('\n2️⃣ 测试用户读取...');
    const retrievedUser = await store.getUser(testUser.id);
    console.log('✅ 用户读取:', retrievedUser ? '成功' : '失败');
    console.log('📧 邮箱匹配:', retrievedUser?.email === testUser.email ? '✓' : '✗');

    // 测试3: 更新用户
    console.log('\n3️⃣ 测试用户更新...');
    const updateResult = await store.updateUser(testUser.id, {
      name: '更新后的用户名',
      emailVerified: true
    });
    console.log('✅ 用户更新:', updateResult.success ? '成功' : '失败');

    // 测试4: 邮箱查找
    console.log('\n4️⃣ 测试邮箱查找...');
    const userByEmail = await store.getUserByEmail('test@example.com');
    console.log('✅ 邮箱查找:', userByEmail ? '成功' : '失败');
    console.log('👤 用户名匹配:', userByEmail?.name === '更新后的用户名' ? '✓' : '✗');

    // 测试5: 使用量记录
    console.log('\n5️⃣ 测试使用量记录...');
    const usageResult = await store.updateUsage(testUser.id, {
      requests: 10,
      tokens: 2500,
      generatedPrompts: 5,
      documentsProcessed: 2,
      apiCalls: {
        'openrouter-gpt4': 8,
        'openrouter-claude': 2
      },
      errors: 0,
      avgResponseTime: 1200
    });
    console.log('✅ 使用量更新:', usageResult.success ? '成功' : '失败');

    // 测试6: 读取使用量
    console.log('\n6️⃣ 测试使用量读取...');
    const usage = await store.getUsage(testUser.id);
    console.log('✅ 使用量读取:', usage ? '成功' : '失败');
    console.log('📊 请求数:', usage?.requests);
    console.log('🔢 Token数:', usage?.tokens);

    // 测试7: 系统健康检查
    console.log('\n7️⃣ 测试系统健康检查...');
    const healthCheck = await store.healthCheck();
    console.log('✅ 系统健康:', healthCheck.healthy ? '健康' : '异常');
    if (healthCheck.issues.length > 0) {
      console.log('⚠️ 发现问题:', healthCheck.issues);
    }

    // 测试8: 存储统计
    console.log('\n8️⃣ 测试存储统计...');
    const stats = await store.getStorageStats();
    console.log('📈 存储统计:');
    console.log(`   - 总用户数: ${stats.totalUsers}`);
    console.log(`   - 活跃用户: ${stats.activeUsers}`);
    console.log(`   - 系统状态: ${stats.systemHealth}`);

    console.log('\n🎉 所有测试完成！JSON存储系统运行正常');

  } catch (error: any) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('📍 错误详情:', error);
  }
}

// 导出测试函数
export { quickTest };

// 如果直接运行，执行测试
if (require.main === module) {
  quickTest().catch(console.error);
}