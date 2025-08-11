-- =================================================================
-- 律师AI工作台完整数据库架构 (Lawyer AI Workstation Database Schema)
-- 基于Supabase PostgreSQL，符合ABA职业道德规范
-- 支持多租户、审计日志、权限控制
-- =================================================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =================================================================
-- 枚举类型定义 (Enum Types)
-- =================================================================

-- 用户角色枚举
CREATE TYPE user_role AS ENUM (
    'super_admin',      -- 超级管理员
    'firm_admin',       -- 事务所管理员  
    'partner',          -- 合伙人
    'senior_attorney',  -- 资深律师
    'attorney',         -- 律师
    'paralegal',        -- 律师助理
    'legal_assistant',  -- 法务助理
    'intern'           -- 实习生
);

-- 案件状态枚举
CREATE TYPE case_status AS ENUM (
    'prospective',     -- 潜在案件
    'active',          -- 进行中
    'on_hold',         -- 暂停
    'closed',          -- 已结案
    'archived'         -- 已归档
);

-- 案件优先级枚举
CREATE TYPE case_priority AS ENUM (
    'critical',        -- 紧急
    'high',           -- 高
    'medium',         -- 中
    'low'             -- 低
);

-- 案件参与人员角色
CREATE TYPE case_participant_role AS ENUM (
    'lead_attorney',   -- 主办律师
    'co_counsel',      -- 协办律师
    'paralegal',       -- 律师助理
    'consultant',      -- 顾问
    'observer'         -- 观察员
);

-- 文档类型枚举
CREATE TYPE document_type AS ENUM (
    'contract',        -- 合同
    'motion',          -- 动议
    'brief',           -- 诉讼摘要
    'memo',            -- 备忘录
    'correspondence',  -- 通信文件
    'evidence',        -- 证据
    'research',        -- 法律研究
    'template',        -- 模板
    'other'            -- 其他
);

-- 文档状态枚举
CREATE TYPE document_status AS ENUM (
    'draft',           -- 草稿
    'review',          -- 审核中
    'approved',        -- 已批准
    'final',           -- 终稿
    'archived'         -- 已归档
);

-- 模板类别枚举
CREATE TYPE template_category AS ENUM (
    'contracts',       -- 合同类
    'litigation',      -- 诉讼类
    'corporate',       -- 公司法务
    'real_estate',     -- 房地产
    'employment',      -- 劳动法
    'intellectual_property', -- 知识产权
    'family_law',      -- 家庭法
    'criminal_law',    -- 刑法
    'immigration',     -- 移民法
    'other'           -- 其他
);

-- AI提示词类型
CREATE TYPE prompt_type AS ENUM (
    'legal_research',  -- 法律研究
    'contract_review', -- 合同审查
    'document_draft',  -- 文档起草
    'case_analysis',   -- 案例分析
    'compliance_check', -- 合规检查
    'risk_assessment', -- 风险评估
    'client_advice',   -- 客户建议
    'other'           -- 其他
);

-- 操作类型枚举（审计日志用）
CREATE TYPE audit_action AS ENUM (
    'create',
    'read',
    'update',
    'delete',
    'login',
    'logout',
    'access_denied',
    'export',
    'import',
    'share'
);

-- =================================================================
-- 核心业务表 (Core Business Tables)
-- =================================================================

-- 律师事务所表
CREATE TABLE law_firms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) UNIQUE, -- 律所执业许可证号
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    jurisdiction VARCHAR(100), -- 执业司法辖区
    founded_date DATE,
    bar_association_id VARCHAR(100), -- 律师协会ID
    
    -- 合规设置
    data_retention_days INTEGER DEFAULT 2555, -- 7年数据保留期
    encryption_enabled BOOLEAN DEFAULT true,
    audit_enabled BOOLEAN DEFAULT true,
    
    -- 系统字段
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    is_active BOOLEAN DEFAULT true,
    
    -- 约束
    CONSTRAINT law_firms_name_check CHECK (length(name) >= 2),
    CONSTRAINT law_firms_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    
    -- 基本信息
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    middle_name VARCHAR(100),
    
    -- 职业信息
    role user_role NOT NULL DEFAULT 'attorney',
    bar_number VARCHAR(100), -- 律师执业证号
    bar_admission_date DATE, -- 律师资格获得日期
    specializations TEXT[], -- 专业领域数组
    
    -- 认证信息
    email_verified BOOLEAN DEFAULT false,
    phone VARCHAR(50),
    phone_verified BOOLEAN DEFAULT false,
    
    -- 安全设置
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret TEXT,
    last_login_at TIMESTAMPTZ,
    last_login_ip INET,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    
    -- 个人设置
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    preferences JSONB DEFAULT '{}',
    
    -- 系统字段
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    -- 约束
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_full_name_check CHECK (length(full_name) >= 2),
    CONSTRAINT users_failed_attempts_check CHECK (failed_login_attempts >= 0)
);

-- 客户表
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    
    -- 客户信息（加密存储）
    full_name_encrypted TEXT NOT NULL, -- 客户姓名（加密）
    email_encrypted TEXT,              -- 客户邮箱（加密）
    phone_encrypted TEXT,              -- 客户电话（加密）
    address_encrypted TEXT,            -- 客户地址（加密）
    
    -- 客户类型
    client_type VARCHAR(50) DEFAULT 'individual', -- individual, corporation, government
    tax_id_encrypted TEXT,             -- 税号或统一社会信用代码（加密）
    
    -- 业务信息
    intake_date DATE NOT NULL,
    source VARCHAR(100), -- 客户来源
    referring_attorney UUID REFERENCES users(id),
    primary_attorney UUID REFERENCES users(id),
    
    -- 风险评级
    conflict_check_status VARCHAR(50) DEFAULT 'pending', -- pending, cleared, conflicted
    risk_level VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    credit_rating VARCHAR(20),
    
    -- 系统字段
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    
    -- 索引提示
    CONSTRAINT clients_intake_date_check CHECK (intake_date <= CURRENT_DATE)
);

-- 案件表
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- 案件基本信息
    case_number VARCHAR(100) UNIQUE NOT NULL, -- 案件编号
    title VARCHAR(500) NOT NULL,
    description TEXT,
    case_type VARCHAR(100) NOT NULL, -- 案件类型
    
    -- 案件状态
    status case_status DEFAULT 'prospective',
    priority case_priority DEFAULT 'medium',
    
    -- 重要日期
    opened_date DATE NOT NULL,
    statute_of_limitations_date DATE,
    closed_date DATE,
    
    -- 财务信息
    estimated_value DECIMAL(15,2),
    billing_rate_type VARCHAR(20) DEFAULT 'hourly', -- hourly, flat_fee, contingency
    hourly_rate DECIMAL(10,2),
    flat_fee DECIMAL(15,2),
    contingency_percentage DECIMAL(5,2),
    
    -- 法庭信息
    court_name VARCHAR(255),
    judge_name VARCHAR(255),
    opposing_counsel VARCHAR(255),
    opposing_party VARCHAR(255),
    
    -- 系统字段
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- 约束
    CONSTRAINT cases_title_check CHECK (length(title) >= 3),
    CONSTRAINT cases_opened_date_check CHECK (opened_date <= CURRENT_DATE),
    CONSTRAINT cases_closed_date_check CHECK (closed_date IS NULL OR closed_date >= opened_date),
    CONSTRAINT cases_contingency_check CHECK (contingency_percentage IS NULL OR (contingency_percentage >= 0 AND contingency_percentage <= 100))
);

-- 案件参与人员表
CREATE TABLE case_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role case_participant_role NOT NULL,
    
    -- 权限设置
    can_view BOOLEAN DEFAULT true,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_share BOOLEAN DEFAULT false,
    
    -- 时间追踪
    assigned_date DATE DEFAULT CURRENT_DATE,
    removed_date DATE,
    billable_hours DECIMAL(8,2) DEFAULT 0,
    
    -- 系统字段
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- 唯一约束
    UNIQUE(case_id, user_id),
    
    -- 约束
    CONSTRAINT case_participants_removed_date_check CHECK (removed_date IS NULL OR removed_date >= assigned_date)
);

-- 文档表
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    
    -- 基本信息
    title VARCHAR(500) NOT NULL,
    description TEXT,
    document_type document_type NOT NULL,
    status document_status DEFAULT 'draft',
    
    -- 文件信息
    file_name VARCHAR(255),
    file_size BIGINT,
    file_path TEXT, -- Supabase Storage路径
    mime_type VARCHAR(100),
    file_hash VARCHAR(128), -- 文件完整性校验
    
    -- 版本控制
    version INTEGER DEFAULT 1,
    parent_document_id UUID REFERENCES documents(id),
    is_current_version BOOLEAN DEFAULT true,
    
    -- 分类和标签
    tags TEXT[],
    category VARCHAR(100),
    
    -- 安全设置
    is_confidential BOOLEAN DEFAULT true,
    privilege_type VARCHAR(50), -- attorney_client, work_product, etc.
    access_level INTEGER DEFAULT 1, -- 1-5级别，5为最高机密
    
    -- 系统字段
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    last_modified_by UUID REFERENCES users(id),
    
    -- 约束
    CONSTRAINT documents_title_check CHECK (length(title) >= 3),
    CONSTRAINT documents_version_check CHECK (version >= 1),
    CONSTRAINT documents_access_level_check CHECK (access_level >= 1 AND access_level <= 5)
);

-- 案件文档关联表
CREATE TABLE case_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    
    -- 关联信息
    relationship_type VARCHAR(50) DEFAULT 'related', -- evidence, contract, correspondence, etc.
    notes TEXT,
    
    -- 系统字段
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- 唯一约束
    UNIQUE(case_id, document_id)
);

-- 法律模板表
CREATE TABLE legal_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    
    -- 模板信息
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category template_category NOT NULL,
    subcategory VARCHAR(100),
    
    -- 模板内容
    content TEXT NOT NULL, -- 模板内容（可能包含变量占位符）
    variables JSONB DEFAULT '[]', -- 可配置变量定义
    
    -- 使用统计
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0, -- 使用成功率
    
    -- 权限设置
    is_public BOOLEAN DEFAULT false, -- 是否对事务所内公开
    access_level INTEGER DEFAULT 1,
    
    -- 版本控制
    version INTEGER DEFAULT 1,
    parent_template_id UUID REFERENCES legal_templates(id),
    is_active BOOLEAN DEFAULT true,
    
    -- 系统字段
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    last_modified_by UUID REFERENCES users(id),
    
    -- 约束
    CONSTRAINT templates_title_check CHECK (length(title) >= 3),
    CONSTRAINT templates_content_check CHECK (length(content) >= 10),
    CONSTRAINT templates_usage_count_check CHECK (usage_count >= 0),
    CONSTRAINT templates_success_rate_check CHECK (success_rate >= 0 AND success_rate <= 100)
);

-- AI提示词表
CREATE TABLE ai_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    
    -- 提示词基本信息
    title VARCHAR(500) NOT NULL,
    description TEXT,
    prompt_type prompt_type NOT NULL,
    
    -- 提示词内容
    system_prompt TEXT, -- 系统提示词
    user_prompt TEXT NOT NULL, -- 用户提示词模板
    parameters JSONB DEFAULT '{}', -- 可配置参数
    
    -- 使用统计
    usage_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0, -- 平均评分 (0-5)
    total_tokens INTEGER DEFAULT 0, -- 总消耗token数
    
    -- 版本控制
    version INTEGER DEFAULT 1,
    parent_prompt_id UUID REFERENCES ai_prompts(id),
    is_active BOOLEAN DEFAULT true,
    
    -- 权限设置
    is_public BOOLEAN DEFAULT false,
    access_level INTEGER DEFAULT 1,
    
    -- 系统字段
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    last_modified_by UUID REFERENCES users(id),
    
    -- 约束
    CONSTRAINT prompts_title_check CHECK (length(title) >= 3),
    CONSTRAINT prompts_user_prompt_check CHECK (length(user_prompt) >= 10),
    CONSTRAINT prompts_usage_count_check CHECK (usage_count >= 0),
    CONSTRAINT prompts_rating_check CHECK (average_rating >= 0 AND average_rating <= 5)
);

-- AI交互历史表
CREATE TABLE ai_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    case_id UUID REFERENCES cases(id), -- 可选，关联的案件
    prompt_id UUID REFERENCES ai_prompts(id), -- 可选，使用的提示词模板
    
    -- 交互内容
    input_text TEXT NOT NULL,
    output_text TEXT,
    
    -- AI模型信息
    model_name VARCHAR(100),
    model_version VARCHAR(50),
    
    -- 使用统计
    input_tokens INTEGER,
    output_tokens INTEGER,
    total_tokens INTEGER,
    processing_time_ms INTEGER,
    cost_usd DECIMAL(10,6), -- API调用成本
    
    -- 质量评估
    user_rating INTEGER, -- 用户评分 1-5
    feedback TEXT,
    
    -- 系统字段
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 约束
    CONSTRAINT interactions_input_check CHECK (length(input_text) >= 1),
    CONSTRAINT interactions_tokens_check CHECK (total_tokens >= 0),
    CONSTRAINT interactions_rating_check CHECK (user_rating IS NULL OR (user_rating >= 1 AND user_rating <= 5))
);

-- 工时记录表
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    case_id UUID REFERENCES cases(id),
    
    -- 时间信息
    entry_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    duration_minutes INTEGER NOT NULL, -- 工作时长（分钟）
    
    -- 工作内容
    description TEXT NOT NULL,
    task_type VARCHAR(100), -- research, drafting, meeting, court, etc.
    
    -- 计费信息
    is_billable BOOLEAN DEFAULT true,
    hourly_rate DECIMAL(10,2),
    billable_amount DECIMAL(15,2),
    
    -- 状态
    is_billed BOOLEAN DEFAULT false,
    billing_date DATE,
    
    -- 系统字段
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 约束
    CONSTRAINT time_entries_duration_check CHECK (duration_minutes > 0),
    CONSTRAINT time_entries_description_check CHECK (length(description) >= 5),
    CONSTRAINT time_entries_end_time_check CHECK (end_time IS NULL OR start_time IS NULL OR end_time > start_time),
    CONSTRAINT time_entries_billing_date_check CHECK (billing_date IS NULL OR is_billed = true)
);

-- =================================================================
-- 审计和合规表 (Audit and Compliance Tables)
-- =================================================================

-- 审计日志表（按月分表）
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    
    -- 操作信息
    user_id UUID REFERENCES users(id), -- 可为空（系统操作）
    action audit_action NOT NULL,
    resource_type VARCHAR(100) NOT NULL, -- table name or resource type
    resource_id UUID, -- 操作的资源ID
    
    -- 操作详情
    old_values JSONB, -- 修改前的值
    new_values JSONB, -- 修改后的值
    description TEXT,
    
    -- 会话信息
    session_id UUID,
    ip_address INET,
    user_agent TEXT,
    
    -- 时间戳（不可修改）
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- 约束
    CONSTRAINT audit_logs_timestamp_immutable CHECK (timestamp <= NOW())
) PARTITION BY RANGE (timestamp);

-- 创建审计日志分区表（示例：2025年月度分区）
CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE audit_logs_2025_02 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE audit_logs_2025_03 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

-- 数据保留政策表
CREATE TABLE data_retention_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    
    -- 策略信息
    table_name VARCHAR(100) NOT NULL,
    retention_period_days INTEGER NOT NULL,
    deletion_method VARCHAR(50) DEFAULT 'soft_delete', -- soft_delete, hard_delete, archive
    
    -- 执行信息
    last_cleanup_at TIMESTAMPTZ,
    next_cleanup_at TIMESTAMPTZ,
    
    -- 系统字段
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    -- 唯一约束
    UNIQUE(law_firm_id, table_name),
    
    -- 约束
    CONSTRAINT retention_period_check CHECK (retention_period_days > 0)
);

-- 合规检查记录表
CREATE TABLE compliance_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    
    -- 检查信息
    check_type VARCHAR(100) NOT NULL, -- data_backup, access_audit, encryption_status
    check_name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- 执行结果
    status VARCHAR(50) NOT NULL, -- passed, failed, warning
    result_data JSONB,
    issues_found INTEGER DEFAULT 0,
    
    -- 时间信息
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- 系统字段
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================
-- 索引定义 (Indexes)
-- =================================================================

-- 主要业务查询索引
CREATE INDEX idx_users_law_firm_id ON users(law_firm_id);
CREATE INDEX idx_users_email_hash ON users USING hash(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_last_login ON users(last_login_at);

CREATE INDEX idx_clients_law_firm_id ON clients(law_firm_id);
CREATE INDEX idx_clients_primary_attorney ON clients(primary_attorney);
CREATE INDEX idx_clients_intake_date ON clients(intake_date);

CREATE INDEX idx_cases_law_firm_id ON cases(law_firm_id);
CREATE INDEX idx_cases_client_id ON cases(client_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_opened_date ON cases(opened_date);
CREATE INDEX idx_cases_case_number ON cases(case_number);

CREATE INDEX idx_case_participants_case_id ON case_participants(case_id);
CREATE INDEX idx_case_participants_user_id ON case_participants(user_id);

CREATE INDEX idx_documents_law_firm_id ON documents(law_firm_id);
CREATE INDEX idx_documents_type_status ON documents(document_type, status);
CREATE INDEX idx_documents_created_at ON documents(created_at);
CREATE INDEX idx_documents_confidential ON documents(is_confidential);

CREATE INDEX idx_case_documents_case_id ON case_documents(case_id);
CREATE INDEX idx_case_documents_document_id ON case_documents(document_id);

CREATE INDEX idx_legal_templates_law_firm_id ON legal_templates(law_firm_id);
CREATE INDEX idx_legal_templates_category ON legal_templates(category);
CREATE INDEX idx_legal_templates_public ON legal_templates(is_public, is_active);

CREATE INDEX idx_ai_prompts_law_firm_id ON ai_prompts(law_firm_id);
CREATE INDEX idx_ai_prompts_type ON ai_prompts(prompt_type);
CREATE INDEX idx_ai_prompts_public ON ai_prompts(is_public, is_active);

CREATE INDEX idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX idx_ai_interactions_case_id ON ai_interactions(case_id);
CREATE INDEX idx_ai_interactions_created_at ON ai_interactions(created_at);

CREATE INDEX idx_time_entries_user_case ON time_entries(user_id, case_id);
CREATE INDEX idx_time_entries_date ON time_entries(entry_date);
CREATE INDEX idx_time_entries_billable ON time_entries(is_billable, is_billed);

-- 审计日志索引
CREATE INDEX idx_audit_logs_law_firm_id ON audit_logs(law_firm_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- 全文搜索索引
CREATE INDEX idx_cases_fulltext ON cases USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_documents_fulltext ON documents USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_legal_templates_fulltext ON legal_templates USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- =================================================================
-- 触发器和函数 (Triggers and Functions)
-- =================================================================

-- 更新时间戳触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表添加更新时间戳触发器
CREATE TRIGGER update_law_firms_updated_at BEFORE UPDATE ON law_firms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_legal_templates_updated_at BEFORE UPDATE ON legal_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_prompts_updated_at BEFORE UPDATE ON ai_prompts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 审计日志触发器函数
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    -- 只记录重要表的变更
    IF TG_TABLE_NAME IN ('users', 'cases', 'clients', 'documents', 'legal_templates', 'ai_prompts', 'time_entries') THEN
        INSERT INTO audit_logs (
            law_firm_id,
            user_id,
            action,
            resource_type,
            resource_id,
            old_values,
            new_values,
            session_id,
            ip_address
        ) VALUES (
            COALESCE(NEW.law_firm_id, OLD.law_firm_id),
            NULLIF(current_setting('app.current_user_id', true), '')::UUID,
            CASE 
                WHEN TG_OP = 'DELETE' THEN 'delete'::audit_action
                WHEN TG_OP = 'UPDATE' THEN 'update'::audit_action
                WHEN TG_OP = 'INSERT' THEN 'create'::audit_action
            END,
            TG_TABLE_NAME,
            COALESCE(NEW.id, OLD.id),
            CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE row_to_json(OLD) END,
            CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW) END,
            NULLIF(current_setting('app.session_id', true), '')::UUID,
            NULLIF(current_setting('app.client_ip', true), '')::INET
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 为重要表添加审计触发器
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_cases AFTER INSERT OR UPDATE OR DELETE ON cases FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_clients AFTER INSERT OR UPDATE OR DELETE ON clients FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_documents AFTER INSERT OR UPDATE OR DELETE ON documents FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_legal_templates AFTER INSERT OR UPDATE OR DELETE ON legal_templates FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_ai_prompts AFTER INSERT OR UPDATE OR DELETE ON ai_prompts FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_time_entries AFTER INSERT OR UPDATE OR DELETE ON time_entries FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- 使用统计更新函数
CREATE OR REPLACE FUNCTION update_template_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- 更新模板使用次数
    UPDATE legal_templates 
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = NEW.template_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_prompt_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- 更新AI提示词使用次数和token统计
    UPDATE ai_prompts 
    SET usage_count = usage_count + 1,
        total_tokens = total_tokens + COALESCE(NEW.total_tokens, 0),
        updated_at = NOW()
    WHERE id = NEW.prompt_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为AI交互添加使用统计触发器
CREATE TRIGGER update_prompt_usage_stats AFTER INSERT ON ai_interactions FOR EACH ROW EXECUTE FUNCTION update_prompt_usage();

-- =================================================================
-- Row Level Security (RLS) 策略
-- =================================================================

-- 启用RLS
ALTER TABLE law_firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 创建获取当前用户信息的函数
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_current_law_firm_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_law_firm_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 事务所级别的RLS策略（多租户隔离）
CREATE POLICY law_firms_isolation ON law_firms
    FOR ALL USING (id = get_current_law_firm_id());

CREATE POLICY users_isolation ON users
    FOR ALL USING (law_firm_id = get_current_law_firm_id());

CREATE POLICY clients_isolation ON clients
    FOR ALL USING (law_firm_id = get_current_law_firm_id());

CREATE POLICY cases_isolation ON cases
    FOR ALL USING (law_firm_id = get_current_law_firm_id());

CREATE POLICY documents_isolation ON documents
    FOR ALL USING (law_firm_id = get_current_law_firm_id());

CREATE POLICY legal_templates_isolation ON legal_templates
    FOR ALL USING (law_firm_id = get_current_law_firm_id() OR is_public = true);

CREATE POLICY ai_prompts_isolation ON ai_prompts
    FOR ALL USING (law_firm_id = get_current_law_firm_id() OR is_public = true);

CREATE POLICY ai_interactions_isolation ON ai_interactions
    FOR ALL USING (law_firm_id = get_current_law_firm_id());

CREATE POLICY time_entries_isolation ON time_entries
    FOR ALL USING (law_firm_id = get_current_law_firm_id());

CREATE POLICY audit_logs_isolation ON audit_logs
    FOR ALL USING (law_firm_id = get_current_law_firm_id());

-- 案件参与者权限策略
CREATE POLICY case_participants_access ON case_participants
    FOR ALL USING (
        user_id = get_current_user_id() OR
        case_id IN (
            SELECT case_id FROM case_participants 
            WHERE user_id = get_current_user_id() AND can_view = true
        )
    );

-- 案件文档权限策略
CREATE POLICY case_documents_access ON case_documents
    FOR ALL USING (
        case_id IN (
            SELECT case_id FROM case_participants 
            WHERE user_id = get_current_user_id() AND can_view = true
        )
    );

-- =================================================================
-- 初始化数据
-- =================================================================

-- 插入默认数据保留策略
INSERT INTO data_retention_policies (law_firm_id, table_name, retention_period_days, deletion_method) 
VALUES 
    (uuid_generate_v4(), 'audit_logs', 2555, 'archive'), -- 7年
    (uuid_generate_v4(), 'ai_interactions', 1095, 'soft_delete'), -- 3年
    (uuid_generate_v4(), 'time_entries', 2555, 'archive'), -- 7年（财务记录）
    (uuid_generate_v4(), 'documents', 2555, 'archive'); -- 7年

-- =================================================================
-- 性能优化视图
-- =================================================================

-- 活跃案件统计视图
CREATE VIEW active_cases_summary AS
SELECT 
    law_firm_id,
    status,
    priority,
    COUNT(*) as case_count,
    AVG(EXTRACT(days FROM NOW() - opened_date)) as avg_days_open
FROM cases
WHERE status IN ('active', 'on_hold')
GROUP BY law_firm_id, status, priority;

-- 用户工时统计视图
CREATE VIEW user_billable_hours_summary AS
SELECT 
    te.law_firm_id,
    te.user_id,
    u.full_name,
    DATE_TRUNC('month', te.entry_date) as month,
    SUM(te.duration_minutes) / 60.0 as total_hours,
    SUM(CASE WHEN te.is_billable THEN te.duration_minutes ELSE 0 END) / 60.0 as billable_hours,
    SUM(te.billable_amount) as total_revenue
FROM time_entries te
JOIN users u ON te.user_id = u.id
WHERE te.entry_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY te.law_firm_id, te.user_id, u.full_name, DATE_TRUNC('month', te.entry_date);

-- AI使用统计视图
CREATE VIEW ai_usage_summary AS
SELECT 
    ai.law_firm_id,
    ai.user_id,
    u.full_name,
    DATE_TRUNC('month', ai.created_at) as month,
    COUNT(*) as interaction_count,
    SUM(ai.total_tokens) as total_tokens,
    SUM(ai.cost_usd) as total_cost,
    AVG(ai.user_rating) as avg_rating
FROM ai_interactions ai
JOIN users u ON ai.user_id = u.id
WHERE ai.created_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY ai.law_firm_id, ai.user_id, u.full_name, DATE_TRUNC('month', ai.created_at);

-- =================================================================
-- 注释说明
-- =================================================================

COMMENT ON TABLE law_firms IS '律师事务所基本信息表，支持多租户架构';
COMMENT ON TABLE users IS '用户表，包含律师和其他法务人员';
COMMENT ON TABLE clients IS '客户信息表，敏感信息加密存储';
COMMENT ON TABLE cases IS '案件信息表，法律服务的核心业务实体';
COMMENT ON TABLE case_participants IS '案件参与人员表，控制案件级别的访问权限';
COMMENT ON TABLE documents IS '文档元数据表，实际文件存储在Supabase Storage';
COMMENT ON TABLE legal_templates IS '法律模板表，可复用的法律文档模板';
COMMENT ON TABLE ai_prompts IS 'AI提示词表，法律场景专用的AI交互模板';
COMMENT ON TABLE ai_interactions IS 'AI交互历史表，记录所有AI对话和成本';
COMMENT ON TABLE time_entries IS '工时记录表，用于律师工时追踪和计费';
COMMENT ON TABLE audit_logs IS '审计日志表，满足法律行业合规要求';

-- =================================================================
-- 数据库架构完成
-- =================================================================