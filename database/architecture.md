# 律师AI工作台数据库架构设计文档
# Lawyer AI Workstation Database Architecture

## 📋 总体架构概述

```mermaid
graph TB
    subgraph "前端应用层 Frontend Application"
        A[Next.js 应用]
        B[浏览器客户端]
        C[移动端 PWA]
    end

    subgraph "API网关层 API Gateway Layer"
        D[Next.js API Routes]
        E[中间件认证]
        F[速率限制器]
        G[审计日志中间件]
    end

    subgraph "服务层 Service Layer"
        H[用户管理服务]
        I[案件管理服务]
        J[文档管理服务]
        K[AI交互服务]
        L[计费服务]
        M[合规监控服务]
    end

    subgraph "数据访问层 Data Access Layer"
        N[LawyerAI Database Client]
        O[Prisma ORM]
        P[Supabase Client]
    end

    subgraph "Supabase 基础设施 Supabase Infrastructure"
        Q[(PostgreSQL 数据库)]
        R[Realtime Engine]
        S[Storage API]
        T[Auth API]
        U[Edge Functions]
    end

    subgraph "外部集成 External Integration"
        V[OpenRouter AI API]
        W[Creem.io 支付]
        X[邮件服务]
        Y[文档生成服务]
    end

    A --> D
    B --> D
    C --> D
    
    D --> E
    E --> F
    F --> G
    
    G --> H
    G --> I
    G --> J
    G --> K
    G --> L
    G --> M
    
    H --> N
    I --> N
    J --> N
    K --> N
    L --> N
    M --> N
    
    N --> O
    N --> P
    
    P --> Q
    P --> R
    P --> S
    P --> T
    P --> U
    
    K --> V
    L --> W
    M --> X
    J --> Y
```

## 🏗️ 数据库设计架构

### 核心实体关系图 (Entity Relationship Diagram)

```mermaid
erDiagram
    LAW_FIRMS ||--o{ USERS : employs
    LAW_FIRMS ||--o{ CLIENTS : serves
    LAW_FIRMS ||--o{ CASES : handles
    LAW_FIRMS ||--o{ DOCUMENTS : owns
    LAW_FIRMS ||--o{ LEGAL_TEMPLATES : maintains
    LAW_FIRMS ||--o{ AI_PROMPTS : creates
    LAW_FIRMS ||--o{ AUDIT_LOGS : generates

    USERS ||--o{ CLIENTS : "manages as primary_attorney"
    USERS ||--o{ CASES : creates
    USERS ||--o{ CASE_PARTICIPANTS : participates
    USERS ||--o{ DOCUMENTS : creates
    USERS ||--o{ TIME_ENTRIES : records
    USERS ||--o{ AI_INTERACTIONS : initiates

    CLIENTS ||--o{ CASES : "involved in"
    
    CASES ||--o{ CASE_PARTICIPANTS : includes
    CASES ||--o{ CASE_DOCUMENTS : contains
    CASES ||--o{ TIME_ENTRIES : tracks
    CASES ||--o{ AI_INTERACTIONS : generates

    DOCUMENTS ||--o{ CASE_DOCUMENTS : "linked via"
    
    AI_PROMPTS ||--o{ AI_INTERACTIONS : uses

    LAW_FIRMS {
        uuid id PK
        varchar name
        varchar registration_number UK
        text address
        varchar phone
        varchar email
        varchar website
        varchar jurisdiction
        date founded_date
        varchar bar_association_id
        int data_retention_days
        boolean encryption_enabled
        boolean audit_enabled
        timestamptz created_at
        timestamptz updated_at
        uuid created_by FK
        boolean is_active
    }

    USERS {
        uuid id PK
        uuid law_firm_id FK
        varchar email UK
        text password_hash
        varchar full_name
        varchar first_name
        varchar last_name
        varchar middle_name
        user_role role
        varchar bar_number
        date bar_admission_date
        text[] specializations
        boolean email_verified
        varchar phone
        boolean phone_verified
        boolean two_factor_enabled
        text two_factor_secret
        timestamptz last_login_at
        inet last_login_ip
        int failed_login_attempts
        timestamptz locked_until
        varchar timezone
        varchar language
        jsonb preferences
        timestamptz created_at
        timestamptz updated_at
        boolean is_active
    }

    CLIENTS {
        uuid id PK
        uuid law_firm_id FK
        text full_name_encrypted
        text email_encrypted
        text phone_encrypted
        text address_encrypted
        varchar client_type
        text tax_id_encrypted
        date intake_date
        varchar source
        uuid referring_attorney FK
        uuid primary_attorney FK
        varchar conflict_check_status
        varchar risk_level
        varchar credit_rating
        timestamptz created_at
        timestamptz updated_at
        uuid created_by FK
        boolean is_active
    }

    CASES {
        uuid id PK
        uuid law_firm_id FK
        uuid client_id FK
        varchar case_number UK
        varchar title
        text description
        varchar case_type
        case_status status
        case_priority priority
        date opened_date
        date statute_of_limitations_date
        date closed_date
        decimal estimated_value
        varchar billing_rate_type
        decimal hourly_rate
        decimal flat_fee
        decimal contingency_percentage
        varchar court_name
        varchar judge_name
        varchar opposing_counsel
        varchar opposing_party
        timestamptz created_at
        timestamptz updated_at
        uuid created_by FK
    }

    CASE_PARTICIPANTS {
        uuid id PK
        uuid case_id FK
        uuid user_id FK
        case_participant_role role
        boolean can_view
        boolean can_edit
        boolean can_delete
        boolean can_share
        date assigned_date
        date removed_date
        decimal billable_hours
        timestamptz created_at
        uuid created_by FK
    }

    DOCUMENTS {
        uuid id PK
        uuid law_firm_id FK
        varchar title
        text description
        document_type document_type
        document_status status
        varchar file_name
        bigint file_size
        text file_path
        varchar mime_type
        varchar file_hash
        int version
        uuid parent_document_id FK
        boolean is_current_version
        text[] tags
        varchar category
        boolean is_confidential
        varchar privilege_type
        int access_level
        timestamptz created_at
        timestamptz updated_at
        uuid created_by FK
        uuid last_modified_by FK
    }

    CASE_DOCUMENTS {
        uuid id PK
        uuid case_id FK
        uuid document_id FK
        varchar relationship_type
        text notes
        timestamptz created_at
        uuid created_by FK
    }

    LEGAL_TEMPLATES {
        uuid id PK
        uuid law_firm_id FK
        varchar title
        text description
        template_category category
        varchar subcategory
        text content
        jsonb variables
        int usage_count
        decimal success_rate
        boolean is_public
        int access_level
        int version
        uuid parent_template_id FK
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
        uuid created_by FK
        uuid last_modified_by FK
    }

    AI_PROMPTS {
        uuid id PK
        uuid law_firm_id FK
        varchar title
        text description
        prompt_type prompt_type
        text system_prompt
        text user_prompt
        jsonb parameters
        int usage_count
        decimal average_rating
        int total_tokens
        int version
        uuid parent_prompt_id FK
        boolean is_active
        boolean is_public
        int access_level
        timestamptz created_at
        timestamptz updated_at
        uuid created_by FK
        uuid last_modified_by FK
    }

    AI_INTERACTIONS {
        uuid id PK
        uuid law_firm_id FK
        uuid user_id FK
        uuid case_id FK
        uuid prompt_id FK
        text input_text
        text output_text
        varchar model_name
        varchar model_version
        int input_tokens
        int output_tokens
        int total_tokens
        int processing_time_ms
        decimal cost_usd
        int user_rating
        text feedback
        timestamptz created_at
    }

    TIME_ENTRIES {
        uuid id PK
        uuid law_firm_id FK
        uuid user_id FK
        uuid case_id FK
        date entry_date
        time start_time
        time end_time
        int duration_minutes
        text description
        varchar task_type
        boolean is_billable
        decimal hourly_rate
        decimal billable_amount
        boolean is_billed
        date billing_date
        timestamptz created_at
        timestamptz updated_at
    }

    AUDIT_LOGS {
        uuid id PK
        uuid law_firm_id FK
        uuid user_id FK
        audit_action action
        varchar resource_type
        uuid resource_id
        jsonb old_values
        jsonb new_values
        text description
        uuid session_id
        inet ip_address
        text user_agent
        timestamptz timestamp
    }
```

## 🔒 安全架构设计

### Row Level Security (RLS) 策略

```sql
-- 多租户数据隔离
CREATE POLICY "law_firms_isolation" ON law_firms
    FOR ALL USING (id = get_current_law_firm_id());

-- 案件级别权限控制
CREATE POLICY "case_access_control" ON cases FOR ALL USING (
    law_firm_id = get_current_law_firm_id() AND (
        id IN (
            SELECT case_id FROM case_participants 
            WHERE user_id = auth.uid()::text AND can_view = true
        )
        OR auth.has_role('super_admin')
        OR auth.has_role('firm_admin') 
        OR auth.has_role('partner')
    )
);

-- 文档访问控制
CREATE POLICY "document_access_control" ON documents FOR ALL USING (
    law_firm_id = get_current_law_firm_id() AND (
        created_by = auth.uid()::text
        OR id IN (
            SELECT cd.document_id FROM case_documents cd
            WHERE auth.can_access_case(cd.case_id)
        )
        OR auth.has_role('super_admin')
        OR auth.has_role('firm_admin')
        OR auth.has_role('partner')
        OR (is_confidential = false AND access_level <= 2)
    )
);
```

### 权限层级模型

```mermaid
graph TD
    A[Super Admin] --> B[Firm Admin]
    B --> C[Partner]
    C --> D[Senior Attorney]
    D --> E[Attorney]
    E --> F[Paralegal]
    F --> G[Legal Assistant]
    G --> H[Intern]

    A --> I[全系统访问]
    B --> J[事务所级管理]
    C --> K[案件全权管理]
    D --> L[高级案件管理]
    E --> M[案件参与]
    F --> N[案件协助]
    G --> O[文档协助]
    H --> P[有限访问]
```

## 📊 性能优化策略

### 索引策略

```sql
-- 复合索引 - 多租户查询优化
CREATE INDEX idx_cases_law_firm_status ON cases(law_firm_id, status);
CREATE INDEX idx_documents_law_firm_type ON documents(law_firm_id, document_type);

-- 全文搜索索引
CREATE INDEX idx_cases_fulltext ON cases USING gin(
    to_tsvector('english', title || ' ' || COALESCE(description, ''))
);

-- 时间序列优化
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp) 
    WHERE timestamp > CURRENT_DATE - INTERVAL '1 year';

-- 部分索引 - 活跃数据优化
CREATE INDEX idx_active_cases ON cases(law_firm_id, opened_date) 
    WHERE status IN ('active', 'on_hold');
```

### 查询优化

```sql
-- 案件统计视图（物化视图）
CREATE MATERIALIZED VIEW active_cases_summary AS
SELECT 
    law_firm_id,
    status,
    priority,
    COUNT(*) as case_count,
    AVG(EXTRACT(days FROM NOW() - opened_date)) as avg_days_open
FROM cases
WHERE status IN ('active', 'on_hold')
GROUP BY law_firm_id, status, priority;

-- 定期刷新物化视图
CREATE OR REPLACE FUNCTION refresh_case_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY active_cases_summary;
END;
$$ LANGUAGE plpgsql;
```

### 数据分区策略

```sql
-- 审计日志按月分区
CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- 自动分区管理函数
CREATE OR REPLACE FUNCTION create_monthly_audit_partition()
RETURNS void AS $$
DECLARE
    start_date date := date_trunc('month', CURRENT_DATE);
    end_date date := start_date + INTERVAL '1 month';
    partition_name text := 'audit_logs_' || to_char(start_date, 'YYYY_MM');
BEGIN
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs
        FOR VALUES FROM (%L) TO (%L)',
        partition_name, start_date, end_date
    );
END;
$$ LANGUAGE plpgsql;
```

## 🚀 扩展性设计

### 水平扩展策略

1. **数据库读写分离**
   - 主数据库：写操作和实时查询
   - 只读副本：报表和分析查询
   - 连接池管理和负载均衡

2. **缓存策略**
   ```typescript
   // Redis缓存层
   const cacheConfig = {
     userSessions: { ttl: 3600 }, // 1小时
     legalTemplates: { ttl: 86400 }, // 24小时
     caseMetadata: { ttl: 1800 }, // 30分钟
     documentIndex: { ttl: 3600 } // 1小时
   };
   ```

3. **CDN和静态资源**
   - 文档文件通过CDN分发
   - 静态资源缓存优化
   - 图片和附件自动压缩

### 微服务架构迁移路径

```mermaid
graph LR
    A[单体应用 Monolith] --> B[模块化单体 Modular Monolith]
    B --> C[服务提取 Service Extraction]
    C --> D[微服务架构 Microservices]

    subgraph "第一阶段 Phase 1"
        B1[用户管理模块]
        B2[案件管理模块]
        B3[文档管理模块]
    end

    subgraph "第二阶段 Phase 2"
        C1[用户服务]
        C2[案件服务]
        C3[文档服务]
    end

    subgraph "第三阶段 Phase 3"
        D1[认证服务]
        D2[授权服务]
        D3[案件服务]
        D4[文档服务]
        D5[计费服务]
        D6[通知服务]
    end
```

## 💾 备份和恢复策略

### 备份策略

```sql
-- 自动备份配置
SELECT cron.schedule('daily-backup', '0 2 * * *', '
    SELECT pg_dump(
        ''postgresql://user:pass@host:5432/lawyerai'',
        ''/backups/lawyerai_'' || to_char(NOW(), ''YYYY-MM-DD'') || ''.sql''
    );
');

-- 增量备份
SELECT cron.schedule('hourly-wal-backup', '0 * * * *', '
    SELECT pg_switch_wal();
');
```

### 灾难恢复计划

1. **RPO (恢复点目标)**: 15分钟
2. **RTO (恢复时间目标)**: 4小时
3. **备份保留策略**:
   - 日备份：保留30天
   - 周备份：保留12周
   - 月备份：保留12个月
   - 年备份：保留7年（法律要求）

## 📋 数据治理和合规

### 数据保留策略

```sql
-- 数据保留策略配置
INSERT INTO data_retention_policies (law_firm_id, table_name, retention_period_days, deletion_method) 
VALUES 
    (uuid_generate_v4(), 'audit_logs', 2555, 'archive'), -- 7年
    (uuid_generate_v4(), 'ai_interactions', 1095, 'soft_delete'), -- 3年
    (uuid_generate_v4(), 'time_entries', 2555, 'archive'), -- 7年
    (uuid_generate_v4(), 'documents', 2555, 'archive'); -- 7年
```

### 合规监控

```sql
-- 自动合规检查
CREATE OR REPLACE FUNCTION run_compliance_checks()
RETURNS void AS $$
BEGIN
    -- 检查数据加密状态
    INSERT INTO compliance_checks (law_firm_id, check_type, check_name, status)
    SELECT id, 'encryption_check', 'Data Encryption Compliance', 
           CASE WHEN encryption_enabled THEN 'passed' ELSE 'failed' END
    FROM law_firms;
    
    -- 检查审计日志完整性
    INSERT INTO compliance_checks (law_firm_id, check_type, check_name, status)
    SELECT law_firm_id, 'audit_completeness', 'Audit Log Completeness',
           CASE WHEN COUNT(*) > 0 THEN 'passed' ELSE 'warning' END
    FROM audit_logs 
    WHERE timestamp > CURRENT_DATE - INTERVAL '1 day'
    GROUP BY law_firm_id;
END;
$$ LANGUAGE plpgsql;
```

## 🔧 部署和运维

### 环境配置

```bash
# 生产环境变量
export DATABASE_URL="postgresql://user:password@host:5432/lawyerai_prod"
export SHADOW_DATABASE_URL="postgresql://user:password@host:5432/lawyerai_shadow"
export SUPABASE_URL="https://project.supabase.co"
export SUPABASE_ANON_KEY="eyJ..."
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# 数据库连接池
export DB_POOL_MIN=5
export DB_POOL_MAX=20
export DB_CONNECTION_TIMEOUT=30000
```

### 监控指标

```sql
-- 关键性能指标监控
CREATE VIEW system_health_metrics AS
SELECT 
    'active_connections' as metric,
    COUNT(*) as value,
    NOW() as timestamp
FROM pg_stat_activity
WHERE state = 'active'

UNION ALL

SELECT 
    'cache_hit_ratio' as metric,
    ROUND(100 * sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)), 2) as value,
    NOW() as timestamp
FROM pg_statio_user_tables

UNION ALL

SELECT 
    'active_cases_count' as metric,
    COUNT(*) as value,
    NOW() as timestamp
FROM cases
WHERE status IN ('active', 'on_hold');
```

## 📈 成本优化

### 存储成本优化

1. **文档压缩和归档**
   ```typescript
   // 自动文档压缩
   const compressDocuments = async () => {
     const oldDocuments = await db.getDocuments({
       created_before: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1年前
       status: 'archived'
     });
     
     for (const doc of oldDocuments.data?.items || []) {
       await compressAndArchive(doc);
     }
   };
   ```

2. **数据生命周期管理**
   - 冷数据自动迁移到低成本存储
   - 过期数据自动清理
   - 压缩策略优化

### 计算成本优化

1. **连接池优化**
2. **查询缓存策略**
3. **批量操作优化**
4. **后台任务调度**

## 🚧 潜在瓶颈和解决方案

### 识别的瓶颈

1. **大文件上传**
   - 解决方案：分片上传、CDN加速
   
2. **复杂查询性能**
   - 解决方案：查询优化、索引调优、物化视图
   
3. **并发写入冲突**
   - 解决方案：乐观锁、分布式锁、队列处理
   
4. **审计日志增长**
   - 解决方案：自动分区、异步写入、压缩存储

### 扩展计划

```mermaid
timeline
    title 数据库扩展路线图
    section 第一季度
        基础架构 : 完成核心数据模型
                 : 实施RLS策略
                 : 部署监控系统
    section 第二季度  
        性能优化 : 查询优化
                 : 索引调优
                 : 缓存实施
    section 第三季度
        高级功能 : 全文搜索
                 : 实时协作
                 : 高级分析
    section 第四季度
        企业级  : 多地域部署
                : 灾难恢复
                : 高可用架构
```

## 📚 技术选型理由

### PostgreSQL vs 其他数据库

| 特性 | PostgreSQL | MongoDB | MySQL |
|------|------------|---------|--------|
| ACID事务 | ✅ 完整支持 | ⚠️ 有限支持 | ✅ 支持 |
| 复杂查询 | ✅ 优秀 | ❌ 有限 | ⚠️ 一般 |
| JSON支持 | ✅ 原生JSONB | ✅ 文档存储 | ⚠️ 有限 |
| 全文搜索 | ✅ 内置 | ✅ 支持 | ⚠️ 基础 |
| 水平扩展 | ⚠️ 需配置 | ✅ 原生 | ⚠️ 需配置 |
| 法律合规 | ✅ 优秀 | ⚠️ 一般 | ✅ 良好 |

### Supabase vs 其他BaaS

| 特性 | Supabase | Firebase | AWS RDS |
|------|----------|----------|---------|
| 开发速度 | ✅ 快速 | ✅ 快速 | ❌ 慢 |
| SQL支持 | ✅ 原生 | ❌ NoSQL | ✅ 完整 |
| 实时功能 | ✅ 内置 | ✅ 内置 | ❌ 需额外配置 |
| 成本控制 | ✅ 透明 | ⚠️ 复杂 | ⚠️ 复杂 |
| 厂商锁定 | ⚠️ 中等 | ❌ 高 | ⚠️ 中等 |
| 自主控制 | ✅ 开源 | ❌ 封闭 | ✅ 灵活 |

## 🎯 总结

本数据库架构设计充分考虑了律师AI工作台的特殊需求：

1. **合规性第一**: 符合ABA职业道德规范和数据保护要求
2. **安全性保障**: 多层次安全策略和细粒度权限控制
3. **可扩展性**: 支持从小型律所到大型企业的平滑扩展
4. **性能优化**: 针对法律行业查询模式的专门优化
5. **成本控制**: 智能化的资源管理和成本优化策略

通过这个架构，律师AI工作台能够：
- 安全可靠地管理敏感的法律数据
- 支持复杂的案件管理工作流
- 提供实时协作和AI辅助功能
- 满足长期的业务增长需求
- 确保监管合规和审计要求

该架构为系统的长期发展奠定了坚实的基础。