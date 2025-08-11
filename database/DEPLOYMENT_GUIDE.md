# 律师AI工作台数据库部署指南
# Lawyer AI Workstation Database Deployment Guide

## 🚀 快速开始

### 前提条件
- Node.js 18+ 
- PostgreSQL 15+ (或Supabase账户)
- Git
- 基本的数据库管理知识

### 环境准备

```bash
# 1. 克隆项目（如果还没有）
git clone <repository-url>
cd lawyer-ai-workstation

# 2. 安装依赖
npm install

# 3. 安装数据库工具
npm install -g @supabase/cli
npm install -g prisma
```

## 📋 部署步骤

### Step 1: Supabase项目设置

```bash
# 1. 登录Supabase
supabase login

# 2. 初始化项目
supabase init

# 3. 启动本地开发环境（可选）
supabase start

# 4. 创建新项目（在Supabase Dashboard中）
# 访问 https://app.supabase.com
# 点击 "New project"
# 记录项目URL和API密钥
```

### Step 2: 环境变量配置

创建 `.env.local` 文件：

```bash
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 数据库配置（用于Prisma）
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres?schema=public
SHADOW_DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres?schema=shadow

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000

# AI服务配置
OPENROUTER_API_KEY=your-openrouter-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# 邮件配置（可选）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password

# 文件上传配置
MAX_FILE_SIZE=100MB
ALLOWED_FILE_TYPES=pdf,docx,doc,txt,rtf
```

### Step 3: 数据库Schema部署

```bash
# 1. 连接到Supabase项目
supabase link --project-ref YOUR_PROJECT_ID

# 2. 部署完整Schema
supabase db push --file database/lawyer-ai-complete-schema.sql

# 3. 运行Supabase特定设置
supabase db push --file database/supabase-setup.sql

# 4. 验证部署
supabase db diff
```

### Step 4: Prisma设置

```bash
# 1. 生成Prisma客户端
npx prisma generate

# 2. 同步Schema（如果使用Prisma管理Schema）
npx prisma db push

# 3. 验证连接
npx prisma db seed
```

### Step 5: 初始化数据

```bash
# 运行数据初始化脚本
npm run db:seed

# 或手动执行
psql $DATABASE_URL -f database/seed.sql
```

## 🏗️ 生产环境部署

### Step 1: 生产环境Supabase项目

```bash
# 1. 创建生产环境项目
# 在Supabase Dashboard中创建新项目

# 2. 配置生产环境变量
# 更新 .env.production 文件

# 3. 部署到生产数据库
supabase link --project-ref PROD_PROJECT_ID
supabase db push --file database/lawyer-ai-complete-schema.sql
supabase db push --file database/supabase-setup.sql
```

### Step 2: 安全配置

```sql
-- 1. 更新默认密码
ALTER USER postgres PASSWORD 'super-secure-production-password';

-- 2. 创建应用专用用户
CREATE USER lawyerai_app WITH PASSWORD 'secure-app-password';
GRANT CONNECT ON DATABASE postgres TO lawyerai_app;
GRANT USAGE ON SCHEMA public TO lawyerai_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO lawyerai_app;

-- 3. 配置连接限制
ALTER USER lawyerai_app CONNECTION LIMIT 20;
```

### Step 3: 备份策略配置

```bash
# 1. 设置自动备份
supabase backup create

# 2. 配置备份策略
cat > backup-config.json << EOF
{
  "schedule": "0 2 * * *",
  "retention": {
    "daily": 30,
    "weekly": 12,
    "monthly": 12,
    "yearly": 7
  },
  "encryption": true,
  "compression": true
}
EOF
```

## 🔧 高级配置

### 性能优化设置

```sql
-- 1. 连接池配置
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';

-- 2. 查询优化
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- 重新加载配置
SELECT pg_reload_conf();
```

### 监控配置

```sql
-- 1. 启用查询统计
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 2. 创建监控视图
CREATE VIEW system_performance AS
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    n_tup_ins,
    n_tup_upd,
    n_tup_del
FROM pg_stat_user_tables
ORDER BY seq_scan DESC;

-- 3. 慢查询监控
CREATE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    stddev_time,
    rows
FROM pg_stat_statements
WHERE mean_time > 1000  -- 超过1秒的查询
ORDER BY mean_time DESC;
```

## 🧪 测试和验证

### 数据完整性测试

```bash
# 1. 运行完整性检查
npm run test:db-integrity

# 2. 验证约束
npm run test:db-constraints

# 3. 性能测试
npm run test:db-performance
```

### 功能测试脚本

```typescript
// test/database/integration.test.ts
import { LawyerAIDatabase } from '../../lib/database';

describe('Database Integration Tests', () => {
  let db: LawyerAIDatabase;
  
  beforeAll(async () => {
    db = createLawyerAIDatabase(
      process.env.TEST_SUPABASE_URL!,
      process.env.TEST_SUPABASE_KEY!
    );
  });

  test('should create law firm and user', async () => {
    const firmResult = await db.createLawFirm({
      name: 'Test Law Firm',
      email: 'test@example.com',
      jurisdiction: 'CA'
    });
    
    expect(firmResult.success).toBe(true);
    expect(firmResult.data).toBeDefined();
    
    const userResult = await db.createUser({
      law_firm_id: firmResult.data!.id,
      email: 'lawyer@example.com',
      full_name: 'Test Lawyer',
      role: 'attorney'
    });
    
    expect(userResult.success).toBe(true);
    expect(userResult.data?.role).toBe('attorney');
  });

  test('should enforce RLS policies', async () => {
    // 测试多租户数据隔离
    await db.setCurrentUser('user1');
    const cases1 = await db.getCases();
    
    await db.setCurrentUser('user2');
    const cases2 = await db.getCases();
    
    // 不同用户应该看到不同的数据
    expect(cases1.data?.items).not.toEqual(cases2.data?.items);
  });
});
```

## 📊 监控和运维

### 日常监控检查项

```sql
-- 1. 数据库健康检查
SELECT 
    'Database Size' as metric,
    pg_size_pretty(pg_database_size(current_database())) as value
UNION ALL
SELECT 
    'Active Connections',
    COUNT(*)::text
FROM pg_stat_activity
WHERE state = 'active'
UNION ALL
SELECT 
    'Cache Hit Ratio',
    ROUND(100 * sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)), 2)::text || '%'
FROM pg_statio_user_tables;

-- 2. 表大小监控
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;

-- 3. 索引使用情况
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0  -- 未使用的索引
ORDER BY pg_relation_size(indexrelid) DESC;
```

### 自动化维护脚本

```bash
#!/bin/bash
# maintenance.sh - 数据库维护脚本

set -e

# 配置
DATABASE_URL="${DATABASE_URL}"
BACKUP_DIR="/backups"
LOG_FILE="/var/log/lawyerai-maintenance.log"

echo "[$(date)] Starting database maintenance..." >> $LOG_FILE

# 1. 数据库备份
echo "[$(date)] Creating backup..." >> $LOG_FILE
pg_dump $DATABASE_URL | gzip > "$BACKUP_DIR/lawyerai-$(date +%Y%m%d).sql.gz"

# 2. 清理过期审计日志
echo "[$(date)] Cleaning up audit logs..." >> $LOG_FILE
psql $DATABASE_URL -c "SELECT cleanup_expired_audit_logs();"

# 3. 更新统计信息
echo "[$(date)] Updating statistics..." >> $LOG_FILE
psql $DATABASE_URL -c "ANALYZE;"

# 4. 重新索引（必要时）
echo "[$(date)] Reindexing..." >> $LOG_FILE
psql $DATABASE_URL -c "REINDEX DATABASE lawyerai;"

# 5. 检查数据完整性
echo "[$(date)] Checking data integrity..." >> $LOG_FILE
psql $DATABASE_URL -c "SELECT run_compliance_checks();"

echo "[$(date)] Maintenance completed successfully!" >> $LOG_FILE
```

### 告警设置

```yaml
# alerts.yml - 监控告警配置
alerts:
  - name: high_connection_usage
    condition: "active_connections > 80% of max_connections"
    severity: warning
    action: notify_admin
    
  - name: slow_queries_detected
    condition: "queries with exec_time > 5s"
    severity: critical
    action: [notify_admin, log_query]
    
  - name: disk_space_low
    condition: "database_size > 80% of allocated space"
    severity: warning
    action: [notify_admin, suggest_cleanup]
    
  - name: backup_failed
    condition: "last_backup_age > 25 hours"
    severity: critical
    action: [notify_admin, retry_backup]
```

## 🔧 故障排除

### 常见问题解决方案

#### 1. 连接问题
```bash
# 检查连接状态
psql $DATABASE_URL -c "SELECT version();"

# 检查连接数
psql $DATABASE_URL -c "SELECT COUNT(*) FROM pg_stat_activity;"

# 杀死空闲连接
psql $DATABASE_URL -c "
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle' AND state_change < NOW() - INTERVAL '1 hour';
"
```

#### 2. 性能问题
```sql
-- 查找慢查询
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- 查找缺失索引
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    seq_tup_read / seq_scan as avg_seq_read
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC;
```

#### 3. 存储空间问题
```sql
-- 清理临时文件
SELECT pg_ls_tmpdir();

-- 查找大表
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 清理过期数据
SELECT cleanup_expired_audit_logs();
```

## 📈 扩展和升级

### 数据库版本升级

```bash
# 1. 备份当前数据
pg_dump $DATABASE_URL > backup-before-upgrade.sql

# 2. 测试升级（在测试环境）
supabase db upgrade --dry-run

# 3. 执行升级
supabase db upgrade

# 4. 验证升级
npm run test:db-integrity
```

### Schema变更管理

```sql
-- 1. 创建迁移脚本
-- migrations/001_add_new_feature.sql
BEGIN;

-- 添加新列
ALTER TABLE cases ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 0;

-- 创建索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cases_priority_score ON cases(priority_score);

-- 更新现有数据
UPDATE cases SET priority_score = 
  CASE priority
    WHEN 'critical' THEN 4
    WHEN 'high' THEN 3
    WHEN 'medium' THEN 2
    WHEN 'low' THEN 1
    ELSE 0
  END;

-- 记录迁移
INSERT INTO schema_migrations (version, applied_at) VALUES ('001', NOW());

COMMIT;
```

### 负载测试

```javascript
// loadtest.js
const { LawyerAIDatabase } = require('./lib/database');

const runLoadTest = async () => {
  const db = createLawyerAIDatabase(
    process.env.DATABASE_URL,
    process.env.SUPABASE_KEY
  );
  
  console.log('Starting load test...');
  
  const promises = [];
  for (let i = 0; i < 100; i++) {
    promises.push(
      db.getCases({ limit: 10 }).then(result => {
        if (!result.success) {
          console.error(`Request ${i} failed:`, result.error);
        }
        return result.success;
      })
    );
  }
  
  const results = await Promise.all(promises);
  const successCount = results.filter(Boolean).length;
  
  console.log(`Load test completed: ${successCount}/100 requests successful`);
};

runLoadTest();
```

## 🎯 最佳实践总结

### 开发最佳实践

1. **始终使用事务**
   ```typescript
   const result = await db.executeTransaction([
     (client) => client.from('cases').insert(caseData),
     (client) => client.from('case_participants').insert(participantData)
   ]);
   ```

2. **实施适当的错误处理**
   ```typescript
   try {
     const result = await db.createCase(caseData);
     if (!result.success) {
       throw new Error(result.error);
     }
     return result.data;
   } catch (error) {
     logger.error('Case creation failed:', error);
     throw error;
   }
   ```

3. **使用类型安全的查询**
   ```typescript
   const cases = await db.getCases({
     status: CaseStatus.ACTIVE,
     priority: CasePriority.HIGH,
     limit: 20
   });
   ```

### 安全最佳实践

1. **总是验证用户权限**
2. **使用参数化查询防止SQL注入**
3. **加密敏感数据**
4. **定期审计访问日志**
5. **实施最小权限原则**

### 性能最佳实践

1. **合理使用索引**
2. **避免N+1查询问题**
3. **使用连接池**
4. **实施查询缓存**
5. **定期分析慢查询**

通过遵循这个部署指南，您可以安全、高效地部署和运维律师AI工作台的数据库系统。记住定期备份、监控性能指标，并保持系统更新以确保最佳的安全性和性能。