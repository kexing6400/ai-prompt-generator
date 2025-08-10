# JSON数据存储系统

一个为AI提示词生成器设计的企业级本地JSON存储解决方案，支持用户管理、订阅管理、使用量追踪等核心功能。

## 🚀 特性

- **完整的用户管理**: 创建、读取、更新、删除用户数据
- **订阅管理**: 支持免费、专业版、企业版等多种订阅计划
- **使用量追踪**: 详细的API调用、Token使用、文档处理统计
- **原子操作**: 防止数据竞争和并发问题
- **内存缓存**: LRU缓存机制提升读取性能
- **数据加密**: 可选的数据加密保护
- **自动备份**: 支持定期备份和数据恢复
- **健康检查**: 系统监控和数据完整性验证
- **TypeScript**: 完整的类型定义和类型安全

## 📦 安装和配置

```typescript
import { getDefaultStore, createNewUser } from '@/lib/storage';

// 获取默认存储实例
const store = getDefaultStore();

// 或者使用自定义配置
const store = getDefaultStore({
  dataPath: './data',
  enableCache: true,
  cacheSize: 1000,
  encryptionKey: 'your-secret-key'
});
```

## 📁 目录结构

```
data/
├── users/           # 用户数据文件
│   └── user_xxx.json
├── usage/           # 使用量统计文件  
│   └── user_xxx-YYYY-MM.json
├── locks/           # 文件锁目录
└── backups/         # 备份目录
    └── backup-xxx/
```

## 🔧 核心API

### 用户管理

```typescript
// 创建新用户
const newUser = createNewUser('user@example.com', '张三', 'free');
await store.saveUser(newUser);

// 获取用户
const user = await store.getUser(userId);

// 更新用户信息
await store.updateUser(userId, {
  name: '新名字',
  emailVerified: true
});

// 通过邮箱查找用户
const user = await store.getUserByEmail('user@example.com');

// 删除用户
await store.deleteUser(userId);
```

### 使用量管理

```typescript
// 更新使用量
await store.updateUsage(userId, {
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

// 获取使用量
const usage = await store.getUsage(userId);

// 获取月度统计
const summary = await store.getMonthlyUsageSummary(userId);
```

### 订阅管理

```typescript
// 更新订阅信息
await store.updateSubscription(userId, {
  plan: 'pro',
  status: 'active',
  endDate: new Date('2024-12-31'),
  autoRenew: true
});

// 获取活跃订阅
const activeUsers = await store.getActiveSubscriptions();

// 获取即将过期的订阅
const expiring = await store.getExpiringSubscriptions(7); // 7天内过期
```

### 系统管理

```typescript
// 数据备份
const backupResult = await store.backup('每日备份');

// 数据恢复
await store.restore(backupId);

// 获取系统统计
const stats = await store.getStorageStats();

// 健康检查
const health = await store.healthCheck();
```

## 🎯 完整使用示例

```typescript
import { getDefaultStore, createNewUser } from '@/lib/storage';

async function example() {
  const store = getDefaultStore();
  
  // 1. 创建用户
  const user = createNewUser(
    'zhang.san@example.com',
    '张三',
    'free' // 免费版用户
  );
  
  await store.saveUser(user);
  console.log('用户创建成功:', user.id);
  
  // 2. 记录API使用
  await store.updateUsage(user.id, {
    requests: 5,
    tokens: 1200,
    generatedPrompts: 3,
    apiCalls: {
      'openrouter-gpt4': 3,
      'openrouter-claude': 2
    }
  });
  
  // 3. 检查配额
  const summary = await store.getMonthlyUsageSummary(user.id);
  const remainingRequests = summary?.remainingQuota.dailyRequests;
  
  if (remainingRequests && remainingRequests > 0) {
    console.log('剩余请求数:', remainingRequests);
  } else {
    console.log('已达到配额限制');
  }
  
  // 4. 升级订阅
  if (remainingRequests === 0) {
    await store.updateSubscription(user.id, {
      plan: 'pro',
      status: 'active',
      limits: {
        dailyRequests: 1000,
        monthlyRequests: 30000,
        maxTokensPerRequest: 8000,
        maxPromptsPerDay: 500,
        maxDocumentSize: 50
      }
    });
    console.log('升级到专业版');
  }
}
```

## 🔒 安全特性

### 数据加密
```typescript
const store = getDefaultStore({
  encryptionKey: process.env.ENCRYPTION_KEY // 推荐使用环境变量
});
```

### 文件锁机制
系统自动处理并发访问，确保数据一致性。

### 数据验证
所有输入数据都会进行严格的验证：
- 邮箱格式验证
- 用户ID格式验证
- 数据类型验证
- 业务逻辑验证

## 📊 性能特性

### 内存缓存
```typescript
const store = getDefaultStore({
  enableCache: true,
  cacheSize: 1000 // 缓存1000个对象
});
```

### 性能监控
```typescript
import { performanceMonitor } from '@/lib/storage';

// 获取性能指标
const metrics = performanceMonitor.getMetrics();
console.log('平均响应时间:', metrics.saveUser?.avgTime);
```

## 🛠️ 环境配置

### 开发环境
```typescript
const store = getDefaultStore({
  dataPath: './data',           // 本地数据目录
  enableCache: true,            // 启用缓存
  autoBackup: false            // 开发时禁用自动备份
});
```

### 生产环境
```typescript
const store = getDefaultStore({
  dataPath: '/tmp/data',        // Vercel兼容路径
  backupPath: '/tmp/backups',   // 备份路径
  enableCache: true,
  cacheSize: 2000,
  encryptionKey: process.env.ENCRYPTION_KEY,
  autoBackup: true,
  backupInterval: 24           // 24小时备份一次
});
```

## 🚀 快速测试

```bash
# 运行测试
npm run test:storage

# 或者直接运行测试文件
npx ts-node lib/storage/test.ts
```

## 🎨 订阅计划配置

### 免费版限制
```typescript
{
  dailyRequests: 50,
  monthlyRequests: 1000,
  maxTokensPerRequest: 4000,
  maxPromptsPerDay: 20,
  maxDocumentSize: 5 // MB
}
```

### 专业版限制
```typescript
{
  dailyRequests: 1000,
  monthlyRequests: 30000,
  maxTokensPerRequest: 8000,
  maxPromptsPerDay: 500,
  maxDocumentSize: 50 // MB
}
```

## 🔄 迁移到数据库

当用户规模增长时，可以轻松迁移到PostgreSQL/MySQL：

```typescript
// 1. 导出现有数据
const { users } = await store.listUsers(1, 10000);
const backupResult = await store.backup('迁移前备份');

// 2. 迁移数据到数据库
for (const user of users) {
  await migrateUserToDatabase(user);
}

// 3. 切换到数据库存储
// 只需替换存储实现，API接口保持不变
```

## 📝 注意事项

1. **文件权限**: 确保应用有读写数据目录的权限
2. **磁盘空间**: 监控存储空间使用情况
3. **备份策略**: 定期检查备份完整性
4. **加密密钥**: 生产环境必须使用强密钥
5. **并发限制**: 单文件操作，不适合高并发场景

## 🆘 故障排除

### 常见问题

**权限错误**
```bash
# 确保数据目录权限
chmod 755 ./data
```

**文件锁超时**
```typescript
// 增加锁超时时间
const store = getDefaultStore({
  lockTimeout: 10000 // 10秒
});
```

**缓存问题**
```typescript
// 清除缓存
store.userCache.clear();
store.usageCache.clear();
```

## 📞 技术支持

如需技术支持，请查看：
- 示例代码: `lib/storage/example.ts`
- 测试代码: `lib/storage/test.ts`
- 类型定义: `lib/storage/types.ts`

---

*这个存储系统是为MVP阶段设计的可靠解决方案，能够支持前期1000个用户的需求，同时为未来的扩展预留了接口。*