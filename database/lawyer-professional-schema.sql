-- ============================================================================
-- 律师专业AI工作台数据库架构设计
-- 设计目标：从通用5行业平台改造为律师垂直工作台
-- 设计原则：ABA职业道德合规、数据安全、可扩展架构
-- 作者：Claude Code (Backend Architect)
-- 创建时间：2025-08-11
-- ============================================================================

-- 启用必要的PostgreSQL扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- 1. 律师事务所管理表
-- ============================================================================

-- 律师事务所表 (支持多租户架构)
CREATE TABLE law_firms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    bar_association VARCHAR(100) NOT NULL,
    jurisdiction VARCHAR(100) NOT NULL, -- federal, state, local
    address JSONB NOT NULL, -- 结构化地址信息
    contact_info JSONB NOT NULL, -- 电话、邮箱、网站等
    practice_areas TEXT[] DEFAULT '{}', -- 执业领域数组
    firm_size VARCHAR(20) CHECK (firm_size IN ('solo', 'small', 'medium', 'large')),
    
    -- ABA合规相关
    ethics_compliance_status VARCHAR(20) DEFAULT 'active' CHECK (ethics_compliance_status IN ('active', 'probation', 'suspended')),
    insurance_info JSONB, -- 职业责任保险信息
    
    -- 系统配置
    system_config JSONB DEFAULT '{}',
    subscription_plan VARCHAR(20) DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'professional', 'enterprise')),
    
    -- 审计字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    is_active BOOLEAN DEFAULT true
);

CREATE TRIGGER update_law_firms_updated_at 
    BEFORE UPDATE ON law_firms 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- 2. 用户管理表 (扩展现有用户表)
-- ============================================================================

-- 律师专业用户表
CREATE TABLE lawyer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- 关联现有用户表
    law_firm_id UUID REFERENCES law_firms(id) ON DELETE SET NULL,
    
    -- 律师基本信息
    bar_number VARCHAR(50) UNIQUE NOT NULL,
    bar_admission_date DATE NOT NULL,
    bar_associations TEXT[] DEFAULT '{}', -- 律师协会会员资格
    
    -- 专业信息
    attorney_type VARCHAR(20) NOT NULL CHECK (attorney_type IN ('partner', 'associate', 'counsel', 'paralegal', 'admin')),
    specializations TEXT[] DEFAULT '{}', -- 专业领域
    practice_years INTEGER DEFAULT 0,
    hourly_rate DECIMAL(10,2),
    
    -- 权限和访问控制
    role_permissions JSONB DEFAULT '{}',
    security_clearance VARCHAR(20) DEFAULT 'standard' CHECK (security_clearance IN ('standard', 'confidential', 'restricted')),
    
    -- 系统偏好
    preferences JSONB DEFAULT '{}',
    
    -- 审计字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

CREATE TRIGGER update_lawyer_profiles_updated_at 
    BEFORE UPDATE ON lawyer_profiles 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- 3. 客户管理表
-- ============================================================================

-- 客户信息表 (支持个人和企业客户)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    
    -- 客户基本信息 (加密敏感字段)
    client_type VARCHAR(20) NOT NULL CHECK (client_type IN ('individual', 'business', 'nonprofit', 'government')),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255), -- 法定名称(企业客户)
    
    -- 联系信息 (加密存储)
    contact_info_encrypted TEXT, -- 加密的联系方式JSON
    address_encrypted TEXT, -- 加密的地址信息
    
    -- 客户分类和状态
    client_status VARCHAR(20) DEFAULT 'active' CHECK (client_status IN ('prospect', 'active', 'inactive', 'former')),
    client_priority VARCHAR(20) DEFAULT 'normal' CHECK (client_priority IN ('low', 'normal', 'high', 'vip')),
    
    -- 商业信息
    industry_sector VARCHAR(100),
    company_size VARCHAR(20),
    annual_revenue_range VARCHAR(50),
    
    -- 风险评估
    aml_status VARCHAR(20) DEFAULT 'pending' CHECK (aml_status IN ('pending', 'cleared', 'flagged')), -- Anti-Money Laundering
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
    
    -- 关系管理
    source_of_referral VARCHAR(100),
    relationship_manager UUID REFERENCES lawyer_profiles(id),
    
    -- 审计和合规
    kyc_completed BOOLEAN DEFAULT false, -- Know Your Customer
    kyc_date TIMESTAMP WITH TIME ZONE,
    privacy_consent JSONB DEFAULT '{}', -- 隐私授权记录
    
    -- 审计字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES lawyer_profiles(id),
    is_active BOOLEAN DEFAULT true
);

CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- 4. 案件管理表
-- ============================================================================

-- 案件主表
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number VARCHAR(50) UNIQUE NOT NULL, -- 自动生成的案件编号
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- 案件基本信息
    case_title VARCHAR(255) NOT NULL,
    case_description TEXT,
    case_type VARCHAR(50) NOT NULL CHECK (case_type IN (
        'contracts', 'litigation', 'corporate', 'family', 'criminal', 
        'tax', 'immigration', 'intellectual_property', 'employment', 'real_estate'
    )),
    case_subtype VARCHAR(100), -- 更具体的案件分类
    
    -- 司法管辖和地理信息
    jurisdiction VARCHAR(50) NOT NULL CHECK (jurisdiction IN ('federal', 'state', 'local', 'international')),
    court_jurisdiction VARCHAR(100), -- 具体法院管辖区
    venue VARCHAR(100), -- 审理地点
    applicable_law VARCHAR(100), -- 适用法律
    
    -- 案件复杂度和优先级
    complexity VARCHAR(20) DEFAULT 'intermediate' CHECK (complexity IN ('simple', 'intermediate', 'complex', 'highly_complex')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- 案件状态流转
    status VARCHAR(30) DEFAULT 'intake' CHECK (status IN (
        'intake', 'active', 'discovery', 'negotiation', 'trial_preparation', 
        'trial', 'appeal', 'settlement', 'closed', 'on_hold', 'referred_out'
    )),
    status_history JSONB DEFAULT '[]', -- 状态变更历史
    
    -- 重要日期
    opened_date DATE NOT NULL DEFAULT CURRENT_DATE,
    statute_of_limitations DATE,
    trial_date DATE,
    closed_date DATE,
    
    -- 财务信息
    estimated_hours DECIMAL(10,2),
    hourly_rate DECIMAL(10,2),
    flat_fee DECIMAL(12,2),
    total_fees_billed DECIMAL(12,2) DEFAULT 0,
    total_fees_collected DECIMAL(12,2) DEFAULT 0,
    billing_type VARCHAR(20) DEFAULT 'hourly' CHECK (billing_type IN ('hourly', 'flat_fee', 'contingency', 'retainer')),
    
    -- 团队分配
    lead_attorney UUID NOT NULL REFERENCES lawyer_profiles(id),
    assigned_attorneys UUID[] DEFAULT '{}', -- 分配的律师数组
    paralegal_assigned UUID REFERENCES lawyer_profiles(id),
    
    -- 风险管理
    conflict_check_status VARCHAR(20) DEFAULT 'pending' CHECK (conflict_check_status IN ('pending', 'cleared', 'conflict_identified')),
    malpractice_risk_level VARCHAR(20) DEFAULT 'low' CHECK (malpractice_risk_level IN ('low', 'medium', 'high')),
    
    -- 系统元数据
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    
    -- 审计字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES lawyer_profiles(id),
    is_active BOOLEAN DEFAULT true
);

CREATE TRIGGER update_cases_updated_at 
    BEFORE UPDATE ON cases 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- 5. 案件文档管理表
-- ============================================================================

-- 案件文档表
CREATE TABLE case_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    
    -- 文档基本信息
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
        'contract', 'motion', 'brief', 'correspondence', 'discovery', 
        'evidence', 'pleading', 'settlement', 'court_order', 'other'
    )),
    document_subtype VARCHAR(100),
    
    -- 文件系统信息
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_extension VARCHAR(10) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    checksum VARCHAR(64) NOT NULL, -- SHA-256校验和
    
    -- 版本控制
    version_number INTEGER DEFAULT 1,
    is_current_version BOOLEAN DEFAULT true,
    parent_document_id UUID REFERENCES case_documents(id),
    
    -- 安全和访问控制
    security_classification VARCHAR(20) DEFAULT 'confidential' CHECK (security_classification IN ('public', 'internal', 'confidential', 'attorney_client_privileged')),
    access_permissions JSONB DEFAULT '{}',
    encryption_status VARCHAR(20) DEFAULT 'encrypted' CHECK (encryption_status IN ('unencrypted', 'encrypted', 'sealed')),
    
    -- 文档处理状态
    processing_status VARCHAR(20) DEFAULT 'uploaded' CHECK (processing_status IN ('uploaded', 'processing', 'indexed', 'error')),
    ocr_completed BOOLEAN DEFAULT false,
    searchable_content TEXT, -- 可搜索的文档内容
    
    -- 法律相关元数据
    privilege_claimed BOOLEAN DEFAULT false,
    work_product_doctrine BOOLEAN DEFAULT false,
    discovery_status VARCHAR(30), -- 证据开示状态
    exhibit_number VARCHAR(20),
    
    -- 审核和批准流程
    review_status VARCHAR(20) DEFAULT 'pending' CHECK (review_status IN ('pending', 'reviewed', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES lawyer_profiles(id),
    review_date TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    
    -- 系统元数据
    tags TEXT[] DEFAULT '{}',
    custom_metadata JSONB DEFAULT '{}',
    
    -- 审计字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID NOT NULL REFERENCES lawyer_profiles(id),
    is_active BOOLEAN DEFAULT true
);

CREATE TRIGGER update_case_documents_updated_at 
    BEFORE UPDATE ON case_documents 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- 6. 法律模板管理表
-- ============================================================================

-- 法律模板库表
CREATE TABLE legal_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID REFERENCES law_firms(id), -- NULL表示公共模板
    
    -- 模板基本信息
    template_name VARCHAR(255) NOT NULL,
    template_description TEXT,
    template_category VARCHAR(50) NOT NULL,
    
    -- 法律专业信息
    practice_area VARCHAR(100) NOT NULL, -- 执业领域
    document_type VARCHAR(50) NOT NULL,
    jurisdiction_specific TEXT[] DEFAULT '{}', -- 司法管辖区特定
    court_rules_compliant BOOLEAN DEFAULT true,
    
    -- 模板内容
    template_content TEXT NOT NULL, -- 模板主内容
    template_variables JSONB DEFAULT '{}', -- 变量定义
    formatting_rules JSONB DEFAULT '{}', -- 格式化规则
    
    -- 法律合规性
    ethics_compliance_verified BOOLEAN DEFAULT false,
    ethics_review_date TIMESTAMP WITH TIME ZONE,
    ethics_reviewer UUID REFERENCES lawyer_profiles(id),
    bar_association_approved BOOLEAN DEFAULT false,
    
    -- 版本管理
    version VARCHAR(10) DEFAULT '1.0',
    is_current_version BOOLEAN DEFAULT true,
    parent_template_id UUID REFERENCES legal_templates(id),
    changelog TEXT,
    
    -- 使用统计
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00, -- 使用成功率
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    
    -- 访问控制
    is_public BOOLEAN DEFAULT false,
    access_level VARCHAR(20) DEFAULT 'firm' CHECK (access_level IN ('public', 'firm', 'restricted')),
    allowed_roles TEXT[] DEFAULT '{}',
    
    -- 系统元数据
    tags TEXT[] DEFAULT '{}',
    keywords TEXT[] DEFAULT '{}',
    language VARCHAR(10) DEFAULT 'en',
    
    -- 审计字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES lawyer_profiles(id),
    is_active BOOLEAN DEFAULT true
);

CREATE TRIGGER update_legal_templates_updated_at 
    BEFORE UPDATE ON legal_templates 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- 7. AI提示词管理表
-- ============================================================================

-- AI提示词模板表
CREATE TABLE ai_prompt_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID REFERENCES law_firms(id), -- NULL表示公共提示词
    
    -- 提示词基本信息
    prompt_name VARCHAR(255) NOT NULL,
    prompt_description TEXT,
    prompt_category VARCHAR(50) NOT NULL CHECK (prompt_category IN (
        'legal_research', 'contract_analysis', 'document_drafting', 
        'case_summarization', 'legal_strategy', 'client_communication',
        'compliance_check', 'risk_assessment'
    )),
    
    -- 法律专业化信息
    practice_area VARCHAR(100) NOT NULL,
    legal_complexity VARCHAR(20) DEFAULT 'intermediate' CHECK (legal_complexity IN ('basic', 'intermediate', 'advanced', 'expert')),
    jurisdiction_focus TEXT[] DEFAULT '{}',
    
    -- 提示词内容和配置
    system_prompt TEXT NOT NULL, -- 系统提示词
    user_prompt_template TEXT NOT NULL, -- 用户提示词模板
    prompt_variables JSONB DEFAULT '{}', -- 提示词变量定义
    ai_model_config JSONB DEFAULT '{}', -- AI模型配置参数
    
    -- 质量控制
    effectiveness_score DECIMAL(4,2) DEFAULT 0.00, -- 效果评分
    accuracy_rate DECIMAL(5,2) DEFAULT 0.00, -- 准确率
    peer_review_status VARCHAR(20) DEFAULT 'pending' CHECK (peer_review_status IN ('pending', 'reviewed', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES lawyer_profiles(id),
    
    -- 使用统计和优化
    usage_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    feedback_score DECIMAL(3,2) DEFAULT 0.00,
    optimization_history JSONB DEFAULT '[]', -- 优化历史记录
    
    -- 伦理和合规
    ethics_compliant BOOLEAN DEFAULT true,
    privilege_risk_assessed BOOLEAN DEFAULT false,
    confidentiality_safeguards JSONB DEFAULT '{}',
    
    -- 版本管理
    version VARCHAR(10) DEFAULT '1.0',
    is_current_version BOOLEAN DEFAULT true,
    parent_prompt_id UUID REFERENCES ai_prompt_templates(id),
    
    -- 访问控制
    access_level VARCHAR(20) DEFAULT 'firm' CHECK (access_level IN ('public', 'firm', 'restricted', 'personal')),
    sharing_permissions JSONB DEFAULT '{}',
    
    -- 系统元数据
    tags TEXT[] DEFAULT '{}',
    language VARCHAR(10) DEFAULT 'en',
    
    -- 审计字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES lawyer_profiles(id),
    is_active BOOLEAN DEFAULT true
);

CREATE TRIGGER update_ai_prompt_templates_updated_at 
    BEFORE UPDATE ON ai_prompt_templates 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- 8. AI生成记录表
-- ============================================================================

-- AI生成的提示词和内容记录表
CREATE TABLE generated_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    template_id UUID REFERENCES ai_prompt_templates(id) ON DELETE SET NULL,
    
    -- 生成基本信息
    prompt_title VARCHAR(255) NOT NULL,
    generated_content TEXT NOT NULL,
    input_parameters JSONB NOT NULL, -- 输入参数
    ai_model_used VARCHAR(100) NOT NULL,
    model_config JSONB DEFAULT '{}',
    
    -- 质量评估
    quality_score DECIMAL(3,2),
    human_reviewed BOOLEAN DEFAULT false,
    review_feedback TEXT,
    approved_for_use BOOLEAN DEFAULT false,
    
    -- 使用和反馈
    usage_count INTEGER DEFAULT 0,
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    user_feedback TEXT,
    
    -- 法律合规性检查
    privilege_check_completed BOOLEAN DEFAULT false,
    confidentiality_verified BOOLEAN DEFAULT false,
    ethics_clearance BOOLEAN DEFAULT false,
    
    -- 系统元数据
    generation_time_ms INTEGER NOT NULL,
    token_count INTEGER,
    cost_estimate DECIMAL(10,4),
    
    -- 审计字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    generated_by UUID NOT NULL REFERENCES lawyer_profiles(id),
    is_active BOOLEAN DEFAULT true
);

CREATE TRIGGER update_generated_prompts_updated_at 
    BEFORE UPDATE ON generated_prompts 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- 9. 时间记录和计费表
-- ============================================================================

-- 时间记录表
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    attorney_id UUID NOT NULL REFERENCES lawyer_profiles(id) ON DELETE CASCADE,
    
    -- 时间记录基本信息
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    hours DECIMAL(5,2) NOT NULL CHECK (hours > 0),
    
    -- 工作内容描述
    description TEXT NOT NULL,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
        'research', 'drafting', 'review', 'client_meeting', 'court_appearance',
        'deposition', 'negotiation', 'travel', 'administrative', 'other'
    )),
    
    -- 计费信息
    billable BOOLEAN DEFAULT true,
    hourly_rate DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(12,2) GENERATED ALWAYS AS (hours * hourly_rate) STORED,
    billing_status VARCHAR(20) DEFAULT 'unbilled' CHECK (billing_status IN ('unbilled', 'billed', 'collected', 'written_off')),
    
    -- 审批和质量控制
    approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES lawyer_profiles(id),
    approval_date TIMESTAMP WITH TIME ZONE,
    
    -- 系统元数据
    entry_method VARCHAR(20) DEFAULT 'manual' CHECK (entry_method IN ('manual', 'timer', 'automated')),
    tags TEXT[] DEFAULT '{}',
    
    -- 审计字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

CREATE TRIGGER update_time_entries_updated_at 
    BEFORE UPDATE ON time_entries 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- 10. 审计日志表
-- ============================================================================

-- 系统审计日志表
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 审计基本信息
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT')),
    
    -- 变更内容
    old_values JSONB,
    new_values JSONB,
    
    -- 用户和会话信息
    user_id UUID REFERENCES lawyer_profiles(id),
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    
    -- 系统和合规信息
    compliance_flags JSONB DEFAULT '{}',
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 11. 创建索引以优化性能
-- ============================================================================

-- 主要查询索引
CREATE INDEX idx_law_firms_jurisdiction ON law_firms(jurisdiction);
CREATE INDEX idx_law_firms_practice_areas ON law_firms USING GIN(practice_areas);

CREATE INDEX idx_lawyer_profiles_bar_number ON lawyer_profiles(bar_number);
CREATE INDEX idx_lawyer_profiles_law_firm_id ON lawyer_profiles(law_firm_id);
CREATE INDEX idx_lawyer_profiles_specializations ON lawyer_profiles USING GIN(specializations);

CREATE INDEX idx_clients_law_firm_id ON clients(law_firm_id);
CREATE INDEX idx_clients_client_status ON clients(client_status);
CREATE INDEX idx_clients_relationship_manager ON clients(relationship_manager);

CREATE INDEX idx_cases_case_number ON cases(case_number);
CREATE INDEX idx_cases_law_firm_id ON cases(law_firm_id);
CREATE INDEX idx_cases_client_id ON cases(client_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_case_type ON cases(case_type);
CREATE INDEX idx_cases_lead_attorney ON cases(lead_attorney);
CREATE INDEX idx_cases_opened_date ON cases(opened_date);

CREATE INDEX idx_case_documents_case_id ON case_documents(case_id);
CREATE INDEX idx_case_documents_document_type ON case_documents(document_type);
CREATE INDEX idx_case_documents_security_classification ON case_documents(security_classification);
CREATE INDEX idx_case_documents_searchable_content ON case_documents USING GIN(to_tsvector('english', searchable_content));

CREATE INDEX idx_legal_templates_practice_area ON legal_templates(practice_area);
CREATE INDEX idx_legal_templates_law_firm_id ON legal_templates(law_firm_id);
CREATE INDEX idx_legal_templates_tags ON legal_templates USING GIN(tags);

CREATE INDEX idx_ai_prompt_templates_practice_area ON ai_prompt_templates(practice_area);
CREATE INDEX idx_ai_prompt_templates_category ON ai_prompt_templates(prompt_category);
CREATE INDEX idx_ai_prompt_templates_law_firm_id ON ai_prompt_templates(law_firm_id);

CREATE INDEX idx_generated_prompts_case_id ON generated_prompts(case_id);
CREATE INDEX idx_generated_prompts_template_id ON generated_prompts(template_id);
CREATE INDEX idx_generated_prompts_generated_by ON generated_prompts(generated_by);

CREATE INDEX idx_time_entries_case_id ON time_entries(case_id);
CREATE INDEX idx_time_entries_attorney_id ON time_entries(attorney_id);
CREATE INDEX idx_time_entries_entry_date ON time_entries(entry_date);
CREATE INDEX idx_time_entries_billing_status ON time_entries(billing_status);

CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- 12. 行级安全策略 (Row Level Security)
-- ============================================================================

-- 启用RLS
ALTER TABLE law_firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 基础RLS策略（将通过应用层进一步细化）
CREATE POLICY "律师事务所数据隔离" ON law_firms FOR ALL USING (true);
CREATE POLICY "律师档案访问控制" ON lawyer_profiles FOR ALL USING (true);
CREATE POLICY "客户数据保护" ON clients FOR ALL USING (true);
CREATE POLICY "案件访问权限" ON cases FOR ALL USING (true);
CREATE POLICY "文档安全访问" ON case_documents FOR ALL USING (true);
CREATE POLICY "模板访问控制" ON legal_templates FOR ALL USING (true);
CREATE POLICY "提示词访问管理" ON ai_prompt_templates FOR ALL USING (true);
CREATE POLICY "生成内容访问" ON generated_prompts FOR ALL USING (true);
CREATE POLICY "时间记录访问" ON time_entries FOR ALL USING (true);
CREATE POLICY "审计日志只读" ON audit_logs FOR SELECT USING (true);

-- ============================================================================
-- 13. 数据完整性约束和触发器
-- ============================================================================

-- 确保案件编号自动生成
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.case_number IS NULL OR NEW.case_number = '' THEN
        NEW.case_number := 'CASE-' || EXTRACT(YEAR FROM NOW()) || '-' || 
                          LPAD(nextval('case_number_seq')::text, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS case_number_seq START 1000;

CREATE TRIGGER generate_case_number_trigger
    BEFORE INSERT ON cases
    FOR EACH ROW EXECUTE FUNCTION generate_case_number();

-- ============================================================================
-- 14. 初始化数据
-- ============================================================================

-- 插入示例律师事务所
INSERT INTO law_firms (
    name, license_number, bar_association, jurisdiction, 
    address, contact_info, practice_areas, firm_size
) VALUES (
    'Demo Legal Professional Workstation',
    'DEMO-LAW-2025',
    'State Bar Association',
    'state',
    '{"street": "123 Legal Street", "city": "Law City", "state": "LC", "zip": "12345"}',
    '{"phone": "+1-555-LAW-FIRM", "email": "contact@demolaw.com", "website": "https://demolaw.com"}',
    ARRAY['contracts', 'litigation', 'corporate'],
    'medium'
);