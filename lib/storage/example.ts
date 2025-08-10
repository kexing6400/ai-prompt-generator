/**
 * JSON存储系统使用示例
 * 演示如何使用各种功能进行用户管理、订阅管理和使用量追踪
 */

import { 
  JsonStore, getDefaultStore, createNewUser, createStore,
  User, Usage, JsonStoreConfig 
} from './json-store';

/**
 * 基础使用示例
 */
export async function basicUsageExample() {
  console.log('🚀 JSON存储系统基础使用示例');

  // 获取默认存储实例
  const store = getDefaultStore();

  try {
    // 1. 创建新用户
    const newUser = createNewUser(
      'zhang.san@example.com',
      '张三',
      'free'
    );
    
    console.log('📝 创建新用户:', newUser.email);
    const saveResult = await store.saveUser(newUser);
    console.log('✅ 用户保存成功:', saveResult.success);

    // 2. 获取用户信息
    const retrievedUser = await store.getUser(newUser.id);
    console.log('📖 获取用户信息:', retrievedUser?.email);

    // 3. 更新用户信息
    await store.updateUser(newUser.id, {
      name: '张三丰',
      emailVerified: true,
      lastLoginAt: new Date()
    });
    console.log('🔄 用户信息更新完成');

    // 4. 通过邮箱查找用户
    const userByEmail = await store.getUserByEmail('zhang.san@example.com');
    console.log('🔍 通过邮箱查找用户:', userByEmail?.name);

    // 5. 更新使用量
    const usageUpdate: Partial<Usage> = {
      requests: 10,
      tokens: 2500,
      generatedPrompts: 5,
      documentsProcessed: 2,
      apiCalls: {
        'openai-gpt4': 8,
        'anthropic-claude': 2
      },
      errors: 0,
      avgResponseTime: 1500
    };

    console.log('📊 更新使用量统计...');
    await store.updateUsage(newUser.id, usageUpdate);
    console.log('✅ 使用量更新完成');

    // 6. 获取使用量统计
    const usage = await store.getUsage(newUser.id);
    console.log('📈 当前使用量:', {
      requests: usage?.requests,
      tokens: usage?.tokens,
      prompts: usage?.generatedPrompts
    });

    // 7. 获取月度摘要
    const monthlySummary = await store.getMonthlyUsageSummary(newUser.id);
    console.log('📅 月度使用摘要:', {
      totalRequests: monthlySummary?.totalRequests,
      remainingQuota: monthlySummary?.remainingQuota.dailyRequests
    });

  } catch (error) {
    console.error('❌ 示例执行错误:', error);
  }
}

/**
 * 高级功能示例
 */
export async function advancedFeaturesExample() {
  console.log('🔧 JSON存储系统高级功能示例');

  // 使用自定义配置创建存储实例
  const customConfig: Partial<JsonStoreConfig> = {
    dataPath: './custom-data',
    enableCache: true,
    cacheSize: 500,
    encryptionKey: 'my-secret-key-change-in-production',
    autoBackup: true
  };

  const customStore = createStore(customConfig);

  try {
    // 1. 批量创建用户
    const users = [
      createNewUser('user1@test.com', '用户1', 'free'),
      createNewUser('user2@test.com', '用户2', 'pro'),
      createNewUser('user3@test.com', '用户3', 'free')
    ];

    console.log('👥 批量创建用户...');
    for (const user of users) {
      await customStore.saveUser(user);
    }
    console.log('✅ 批量用户创建完成');

    // 2. 获取用户列表
    const { users: userList, total } = await customStore.listUsers(1, 10);
    console.log(`📋 用户列表 (${total}个用户):`, userList.map(u => u.email));

    // 3. 搜索用户
    const searchResults = await customStore.searchUsers('用户');
    console.log('🔍 搜索结果:', searchResults.map(u => u.name));

    // 4. 订阅管理示例
    const proUser = users[1]; // 专业版用户

    // 更新订阅状态
    await customStore.updateSubscription(proUser.id, {
      status: 'active',
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后过期
      billingCycle: 'monthly',
      autoRenew: true
    });
    console.log('💳 订阅状态更新完成');

    // 获取活跃订阅
    const activeSubscriptions = await customStore.getActiveSubscriptions();
    console.log('📊 活跃订阅用户:', activeSubscriptions.length);

    // 获取即将过期的订阅
    const expiring = await customStore.getExpiringSubscriptions(30);
    console.log('⏰ 即将过期订阅:', expiring.length);

    // 5. 系统管理功能
    console.log('💾 执行数据备份...');
    const backupResult = await customStore.backup('示例备份');
    if (backupResult.success) {
      console.log('✅ 备份完成:', backupResult.data?.id);
    }

    // 获取备份列表
    const backups = await customStore.listBackups();
    console.log('📁 备份列表:', backups.map(b => b.id));

    // 6. 获取存储统计
    const stats = await customStore.getStorageStats();
    console.log('📈 存储统计:', {
      总用户数: stats.totalUsers,
      活跃用户数: stats.activeUsers,
      存储大小: `${(stats.storageSize / 1024).toFixed(2)} KB`,
      系统健康: stats.systemHealth
    });

    // 7. 健康检查
    const healthCheck = await customStore.healthCheck();
    console.log('🏥 系统健康检查:', {
      健康状态: healthCheck.healthy ? '健康' : '异常',
      问题数量: healthCheck.issues.length
    });

    // 8. 数据验证
    const validation = await customStore.validateData();
    console.log('✅ 数据完整性验证:', {
      数据有效: validation.valid ? '有效' : '无效',
      错误数量: validation.errors.length
    });

  } catch (error) {
    console.error('❌ 高级功能示例执行错误:', error);
  }
}

/**
 * 性能测试示例
 */
export async function performanceTestExample() {
  console.log('⚡ JSON存储系统性能测试');

  const store = getDefaultStore();
  const startTime = Date.now();

  try {
    // 1. 批量用户操作性能测试
    console.log('👥 批量用户操作测试 (100个用户)...');
    const batchStartTime = Date.now();
    
    const batchUsers: User[] = [];
    for (let i = 1; i <= 100; i++) {
      const user = createNewUser(`test${i}@example.com`, `测试用户${i}`, 'free');
      batchUsers.push(user);
    }

    // 并发保存用户
    await Promise.all(batchUsers.map(user => store.saveUser(user)));
    const batchEndTime = Date.now();
    
    console.log(`✅ 100个用户创建耗时: ${batchEndTime - batchStartTime}ms`);
    console.log(`   平均每个用户: ${(batchEndTime - batchStartTime) / 100}ms`);

    // 2. 读取性能测试
    console.log('📖 批量读取测试...');
    const readStartTime = Date.now();
    
    await Promise.all(batchUsers.map(user => store.getUser(user.id)));
    const readEndTime = Date.now();
    
    console.log(`✅ 100个用户读取耗时: ${readEndTime - readStartTime}ms`);
    console.log(`   平均每个用户: ${(readEndTime - readStartTime) / 100}ms`);

    // 3. 使用量更新性能测试
    console.log('📊 批量使用量更新测试...');
    const usageStartTime = Date.now();
    
    const usagePromises = batchUsers.map(user => 
      store.updateUsage(user.id, {
        requests: Math.floor(Math.random() * 50) + 1,
        tokens: Math.floor(Math.random() * 5000) + 100,
        generatedPrompts: Math.floor(Math.random() * 20) + 1
      })
    );
    
    await Promise.all(usagePromises);
    const usageEndTime = Date.now();
    
    console.log(`✅ 100个使用量更新耗时: ${usageEndTime - usageStartTime}ms`);
    console.log(`   平均每个更新: ${(usageEndTime - usageStartTime) / 100}ms`);

    // 4. 邮箱查找性能测试
    console.log('🔍 邮箱查找性能测试...');
    const searchStartTime = Date.now();
    
    const searchPromises = batchUsers.slice(0, 10).map(user => 
      store.getUserByEmail(user.email)
    );
    
    await Promise.all(searchPromises);
    const searchEndTime = Date.now();
    
    console.log(`✅ 10次邮箱查找耗时: ${searchEndTime - searchStartTime}ms`);
    console.log(`   平均每次查找: ${(searchEndTime - searchStartTime) / 10}ms`);

    const totalTime = Date.now() - startTime;
    console.log(`🏁 性能测试总耗时: ${totalTime}ms`);

  } catch (error) {
    console.error('❌ 性能测试执行错误:', error);
  }
}

/**
 * 错误处理示例
 */
export async function errorHandlingExample() {
  console.log('🚨 错误处理示例');

  const store = getDefaultStore();

  try {
    // 1. 尝试获取不存在的用户
    console.log('❓ 尝试获取不存在的用户...');
    const nonExistentUser = await store.getUser('user_nonexistent_123');
    console.log('📄 结果:', nonExistentUser === null ? '用户不存在 (正常)' : '异常');

    // 2. 尝试更新不存在的用户
    console.log('❓ 尝试更新不存在的用户...');
    try {
      await store.updateUser('user_nonexistent_456', { name: '测试' });
      console.log('❌ 应该抛出错误但没有');
    } catch (error: any) {
      console.log('✅ 正确捕获错误:', error.message);
    }

    // 3. 尝试保存无效数据
    console.log('❓ 尝试保存无效用户数据...');
    try {
      const invalidUser = {
        id: 'invalid-id-format',
        email: 'invalid-email',
        name: '测试用户',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        emailVerified: false
      } as any;
      
      await store.saveUser(invalidUser);
      console.log('❌ 应该抛出验证错误但没有');
    } catch (error: any) {
      console.log('✅ 正确捕获验证错误:', error.message);
    }

    // 4. 尝试恢复不存在的备份
    console.log('❓ 尝试恢复不存在的备份...');
    try {
      await store.restore('backup-nonexistent');
      console.log('❌ 应该抛出错误但没有');
    } catch (error: any) {
      console.log('✅ 正确捕获错误:', error.message);
    }

    console.log('🎉 错误处理测试完成');

  } catch (error) {
    console.error('❌ 错误处理示例执行错误:', error);
  }
}

/**
 * 完整的示例运行器
 */
export async function runAllExamples() {
  console.log('🎯 开始运行所有JSON存储系统示例\n');

  try {
    await basicUsageExample();
    console.log('\n' + '='.repeat(60) + '\n');

    await advancedFeaturesExample();
    console.log('\n' + '='.repeat(60) + '\n');

    await performanceTestExample();
    console.log('\n' + '='.repeat(60) + '\n');

    await errorHandlingExample();
    console.log('\n' + '='.repeat(60) + '\n');

    console.log('🎉 所有示例运行完成!');

  } catch (error) {
    console.error('❌ 示例运行器执行错误:', error);
  }
}

// 如果直接运行此文件，则执行所有示例
if (require.main === module) {
  runAllExamples().catch(console.error);
}

export default {
  basicUsageExample,
  advancedFeaturesExample,
  performanceTestExample,
  errorHandlingExample,
  runAllExamples
};