-- AI Prompt Builder Pro - 生产级数据库架构设计
-- 架构师：Claude Code (后端架构师)
-- 创建时间：2025-01-10
-- 版本：v2.0 "Enterprise"

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- 性能监控

-- =================================================================
-- 核心业务表设计
-- =================================================================

-- 1. 用户管理系统
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company VARCHAR(200),
    role VARCHAR(50) DEFAULT 'professional',
    
    -- 验证和状态
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    
    -- 订阅状态
    subscription_status VARCHAR(20) DEFAULT 'free' CHECK (subscription_status IN ('free', 'pro', 'enterprise', 'cancelled')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- 使用统计
    prompts_generated_today INTEGER DEFAULT 0,
    prompts_generated_month INTEGER DEFAULT 0,
    prompts_generated_total INTEGER DEFAULT 0,
    last_generation_at TIMESTAMP WITH TIME ZONE,
    
    -- 审计字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- 索引约束
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 2. 行业分类表
CREATE TABLE industries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL, -- 'lawyer', 'realtor'等
    name VARCHAR(200) NOT NULL,
    name_en VARCHAR(200) NOT NULL,
    description TEXT,
    icon VARCHAR(100), -- 图标名称
    color VARCHAR(7) DEFAULT '#3B82F6', -- 主题色
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 场景分类表
CREATE TABLE scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    industry_id UUID REFERENCES industries(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL, -- '合同审查', 'contract-review'等
    name VARCHAR(200) NOT NULL,
    name_en VARCHAR(200) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    estimated_time_minutes INTEGER DEFAULT 5,
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    
    -- 使用统计
    usage_count INTEGER DEFAULT 0,
    avg_satisfaction_score DECIMAL(3,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 确保同一行业内场景代码唯一
    CONSTRAINT unique_scenario_per_industry UNIQUE (industry_id, code)
);

-- 4. 提示词模板表（核心业务逻辑）
CREATE TABLE prompt_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
    
    -- 基础信息
    name VARCHAR(300) NOT NULL,
    description TEXT,
    version INTEGER DEFAULT 1,
    
    -- 模板内容（核心）
    template_content TEXT NOT NULL,
    example_output TEXT,
    
    -- 参数配置（JSON Schema格式）
    parameters_schema JSONB NOT NULL DEFAULT '{"type":"object","properties":{},"required":[]}',
    default_values JSONB DEFAULT '{}',
    
    -- 模板配置
    max_tokens INTEGER DEFAULT 2000,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    suggested_models JSONB DEFAULT '[]', -- ["claude-3-5-sonnet", "gpt-4"]
    
    -- 质量控制
    quality_score DECIMAL(3,2) DEFAULT 0,
    review_status VARCHAR(20) DEFAULT 'draft' CHECK (review_status IN ('draft', 'review', 'approved', 'deprecated')),
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- 使用统计
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(3,2) DEFAULT 0,
    avg_generation_time INTEGER DEFAULT 0, -- 毫秒
    
    -- 权限控制
    access_level VARCHAR(20) DEFAULT 'free' CHECK (access_level IN ('free', 'pro', 'enterprise')),
    
    -- 审计字段
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- 确保模板名称在场景内唯一
    CONSTRAINT unique_template_name_per_scenario UNIQUE (scenario_id, name) WHERE deleted_at IS NULL
);

-- 5. 用户生成历史表
CREATE TABLE prompt_generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES prompt_templates(id) ON DELETE SET NULL,
    
    -- 生成内容
    input_parameters JSONB NOT NULL DEFAULT '{}',
    generated_prompt TEXT NOT NULL,
    generation_source VARCHAR(20) DEFAULT 'template' CHECK (generation_source IN ('template', 'ai', 'manual')),
    
    -- AI配置快照
    model_used VARCHAR(200),
    temperature DECIMAL(3,2),
    max_tokens INTEGER,
    
    -- 性能数据
    generation_time_ms INTEGER NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    
    -- 用户反馈
    user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
    user_feedback TEXT,
    
    -- 使用情况
    downloaded BOOLEAN DEFAULT false,
    download_format VARCHAR(20), -- 'md', 'txt', 'html', 'pdf'
    shared BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 订阅管理表
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- 订阅信息
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('free', 'pro', 'enterprise')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'suspended')),
    
    -- 时间管理
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- 使用限制
    monthly_prompt_limit INTEGER NOT NULL DEFAULT 10,
    daily_prompt_limit INTEGER NOT NULL DEFAULT 3,
    can_download BOOLEAN DEFAULT false,
    can_use_ai_direct BOOLEAN DEFAULT false,
    can_access_pro_templates BOOLEAN DEFAULT false,
    
    -- 支付信息（Creem.io）
    creem_subscription_id VARCHAR(255),
    creem_customer_id VARCHAR(255),
    payment_method VARCHAR(50),
    amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 使用限制追踪表
CREATE TABLE usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- 时间窗口
    tracking_date DATE NOT NULL,
    tracking_hour INTEGER NOT NULL CHECK (tracking_hour BETWEEN 0 AND 23),
    
    -- 使用计数
    prompts_generated INTEGER DEFAULT 0,
    tokens_consumed INTEGER DEFAULT 0,
    api_calls_made INTEGER DEFAULT 0,
    
    -- 成本追踪
    estimated_cost DECIMAL(10,6) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 确保每用户每小时只有一条记录
    CONSTRAINT unique_usage_per_user_hour UNIQUE (user_id, tracking_date, tracking_hour)
);

-- 8. 用户收藏和偏好
CREATE TABLE user_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES prompt_templates(id) ON DELETE CASCADE,
    
    -- 个人定制
    custom_name VARCHAR(300),
    custom_parameters JSONB DEFAULT '{}',
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 确保用户不能重复收藏同一模板
    CONSTRAINT unique_favorite_per_user UNIQUE (user_id, template_id)
);

-- 9. API密钥管理（企业级功能）
CREATE TABLE user_api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- 密钥信息
    key_name VARCHAR(200) NOT NULL,
    api_key VARCHAR(64) UNIQUE NOT NULL, -- 将生成secure random key
    api_secret VARCHAR(64) NOT NULL,
    
    -- 权限控制
    permissions JSONB DEFAULT '["generate_prompt"]',
    rate_limit INTEGER DEFAULT 100, -- 每小时请求数
    
    -- 状态管理
    active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 确保用户的API密钥名称唯一
    CONSTRAINT unique_api_key_name_per_user UNIQUE (user_id, key_name)
);

-- =================================================================
-- 性能优化索引
-- =================================================================

-- 用户表索引
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_subscription_status ON users(subscription_status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- 模板相关索引
CREATE INDEX idx_prompt_templates_scenario_id ON prompt_templates(scenario_id);
CREATE INDEX idx_prompt_templates_access_level ON prompt_templates(access_level);
CREATE INDEX idx_prompt_templates_review_status ON prompt_templates(review_status);
CREATE INDEX idx_prompt_templates_usage_count ON prompt_templates(usage_count DESC);

-- 生成历史索引
CREATE INDEX idx_prompt_generations_user_id ON prompt_generations(user_id);
CREATE INDEX idx_prompt_generations_template_id ON prompt_generations(template_id);
CREATE INDEX idx_prompt_generations_created_at ON prompt_generations(created_at DESC);
CREATE INDEX idx_prompt_generations_user_created ON prompt_generations(user_id, created_at DESC);

-- 使用追踪索引
CREATE INDEX idx_usage_tracking_user_date ON usage_tracking(user_id, tracking_date);
CREATE INDEX idx_usage_tracking_date ON usage_tracking(tracking_date);

-- 订阅管理索引
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_expires_at ON subscriptions(expires_at);

-- 复合索引（高频查询优化）
CREATE INDEX idx_templates_scenario_access_active ON prompt_templates(scenario_id, access_level, review_status) 
    WHERE deleted_at IS NULL;

-- =================================================================
-- 触发器函数
-- =================================================================

-- 更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 使用统计更新函数
CREATE OR REPLACE FUNCTION update_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- 更新模板使用统计
    IF TG_OP = 'INSERT' AND NEW.template_id IS NOT NULL THEN
        UPDATE prompt_templates 
        SET usage_count = usage_count + 1,
            updated_at = NOW()
        WHERE id = NEW.template_id;
        
        -- 更新用户总生成数
        UPDATE users 
        SET prompts_generated_today = prompts_generated_today + 1,
            prompts_generated_month = prompts_generated_month + 1,
            prompts_generated_total = prompts_generated_total + 1,
            last_generation_at = NOW(),
            updated_at = NOW()
        WHERE id = NEW.user_id;
        
        -- 更新场景使用统计
        UPDATE scenarios 
        SET usage_count = usage_count + 1,
            updated_at = NOW()
        WHERE id = (SELECT scenario_id FROM prompt_templates WHERE id = NEW.template_id);
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 应用触发器
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_industries_updated_at 
    BEFORE UPDATE ON industries 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_scenarios_updated_at 
    BEFORE UPDATE ON scenarios 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_prompt_templates_updated_at 
    BEFORE UPDATE ON prompt_templates 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON subscriptions 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at 
    BEFORE UPDATE ON user_api_keys 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 使用统计触发器
CREATE TRIGGER update_generation_stats 
    AFTER INSERT ON prompt_generations 
    FOR EACH ROW EXECUTE PROCEDURE update_usage_stats();

-- =================================================================
-- 初始数据插入
-- =================================================================

-- 插入默认行业数据
INSERT INTO industries (code, name, name_en, description, icon, color, sort_order) VALUES
('lawyer', '法律服务', 'Legal Services', '为律师、法务人员提供专业的法律文档和咨询提示词', 'scale', '#1F2937', 1),
('realtor', '房地产', 'Real Estate', '为房产经纪人、投资顾问提供市场分析和客户服务提示词', 'home', '#10B981', 2),
('insurance', '保险服务', 'Insurance', '为保险顾问、理赔专员提供风险评估和产品推荐提示词', 'shield', '#3B82F6', 3),
('teacher', '教育培训', 'Education', '为教师、培训师提供教学设计和学情分析提示词', 'academic-cap', '#8B5CF6', 4),
('accountant', '财务会计', 'Accounting', '为会计师、财务分析师提供专业的财务分析提示词', 'calculator', '#F59E0B', 5);

-- 为每个行业插入默认场景
INSERT INTO scenarios (industry_id, code, name, name_en, description, icon, difficulty_level, estimated_time_minutes, sort_order) VALUES
-- 律师行业场景
((SELECT id FROM industries WHERE code = 'lawyer'), 'contract-review', '合同审查', 'Contract Review', '专业的合同条款分析和风险评估', 'document-text', 3, 10, 1),
((SELECT id FROM industries WHERE code = 'lawyer'), 'legal-consultation', '法律咨询', 'Legal Consultation', '为客户提供专业的法律建议和解决方案', 'chat', 4, 15, 2),
((SELECT id FROM industries WHERE code = 'lawyer'), 'litigation-prep', '诉讼准备', 'Litigation Prep', '诉讼材料准备和策略制定', 'briefcase', 5, 20, 3),

-- 房地产行业场景
((SELECT id FROM industries WHERE code = 'realtor'), 'market-analysis', '市场分析', 'Market Analysis', '区域房地产市场趋势分析', 'chart-bar', 3, 8, 1),
((SELECT id FROM industries WHERE code = 'realtor'), 'property-valuation', '房产评估', 'Property Valuation', '专业的房产价值评估和定价建议', 'currency-dollar', 4, 12, 2),
((SELECT id FROM industries WHERE code = 'realtor'), 'client-consultation', '客户咨询', 'Client Consultation', '为买卖双方提供专业咨询服务', 'users', 2, 5, 3),

-- 保险行业场景
((SELECT id FROM industries WHERE code = 'insurance'), 'risk-assessment', '风险评估', 'Risk Assessment', '全面的风险识别和评估分析', 'exclamation-triangle', 4, 15, 1),
((SELECT id FROM industries WHERE code = 'insurance'), 'product-recommendation', '产品推荐', 'Product Recommendation', '个性化保险产品配置建议', 'gift', 3, 10, 2),
((SELECT id FROM industries WHERE code = 'insurance'), 'claims-processing', '理赔处理', 'Claims Processing', '理赔案例分析和处理指导', 'clipboard-check', 3, 8, 3),

-- 教育行业场景
((SELECT id FROM industries WHERE code = 'teacher'), 'lesson-planning', '教学设计', 'Lesson Planning', '系统性的教学方案设计和课程规划', 'book-open', 3, 12, 1),
((SELECT id FROM industries WHERE code = 'teacher'), 'student-assessment', '学情分析', 'Student Assessment', '学生学习情况分析和个性化指导', 'chart-pie', 4, 10, 2),
((SELECT id FROM industries WHERE code = 'teacher'), 'parent-communication', '家校沟通', 'Parent Communication', '有效的家长沟通策略和技巧', 'phone', 2, 5, 3),

-- 会计行业场景  
((SELECT id FROM industries WHERE code = 'accountant'), 'financial-analysis', '财务分析', 'Financial Analysis', '企业财务状况深度分析', 'presentation-chart-line', 4, 18, 1),
((SELECT id FROM industries WHERE code = 'accountant'), 'tax-planning', '税务筹划', 'Tax Planning', '合规的税务优化策略制定', 'receipt-tax', 5, 25, 2),
((SELECT id FROM industries WHERE code = 'accountant'), 'audit-preparation', '审计准备', 'Audit Preparation', '审计前的准备工作和注意事项', 'clipboard-list', 3, 15, 3);

-- 创建默认的免费订阅计划
INSERT INTO subscriptions (user_id, plan_type, status, starts_at, expires_at, monthly_prompt_limit, daily_prompt_limit, can_download, can_use_ai_direct, can_access_pro_templates)
SELECT 
    id,
    'free',
    'active',
    NOW(),
    NOW() + INTERVAL '1 year',
    10, -- 每月10次
    3,  -- 每天3次
    false,
    false,
    false
FROM users
WHERE subscription_status = 'free';

-- =================================================================
-- 视图定义（简化复杂查询）
-- =================================================================

-- 用户订阅状态视图
CREATE VIEW user_subscription_view AS
SELECT 
    u.id,
    u.email,
    u.subscription_status,
    s.plan_type,
    s.monthly_prompt_limit,
    s.daily_prompt_limit,
    s.can_download,
    s.can_use_ai_direct,
    s.can_access_pro_templates,
    s.expires_at,
    u.prompts_generated_today,
    u.prompts_generated_month,
    CASE 
        WHEN s.expires_at < NOW() THEN 'expired'
        WHEN s.status = 'cancelled' THEN 'cancelled'
        ELSE s.status 
    END as current_status
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id 
WHERE u.deleted_at IS NULL
AND (s.id IS NULL OR s.status IN ('active', 'cancelled'));

-- 模板统计视图
CREATE VIEW template_stats_view AS
SELECT 
    pt.id,
    pt.name,
    i.name as industry_name,
    sc.name as scenario_name,
    pt.usage_count,
    pt.quality_score,
    pt.access_level,
    pt.review_status,
    COUNT(pg.id) as total_generations,
    AVG(pg.user_rating) as avg_rating,
    AVG(pg.generation_time_ms) as avg_generation_time
FROM prompt_templates pt
JOIN scenarios sc ON pt.scenario_id = sc.id
JOIN industries i ON sc.industry_id = i.id
LEFT JOIN prompt_generations pg ON pt.id = pg.template_id
WHERE pt.deleted_at IS NULL
GROUP BY pt.id, pt.name, i.name, sc.name, pt.usage_count, pt.quality_score, pt.access_level, pt.review_status;

-- =================================================================
-- RLS (行级安全) 策略
-- =================================================================

-- 启用RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的数据
CREATE POLICY "Users can only access their own data" ON users
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can only access their own generations" ON prompt_generations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own subscriptions" ON subscriptions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own favorites" ON user_favorites
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own usage tracking" ON usage_tracking
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own API keys" ON user_api_keys
    FOR ALL USING (auth.uid() = user_id);

-- 公共表可以被所有认证用户读取
CREATE POLICY "Authenticated users can read industries" ON industries
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read scenarios" ON scenarios
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read templates" ON prompt_templates
    FOR SELECT USING (auth.role() = 'authenticated');

-- =================================================================
-- 数据库性能和维护
-- =================================================================

-- 自动清理过期数据函数
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
    -- 清理30天前的使用追踪数据
    DELETE FROM usage_tracking 
    WHERE tracking_date < CURRENT_DATE - INTERVAL '30 days';
    
    -- 清理6个月前的prompt生成记录（保留用户评分数据）
    DELETE FROM prompt_generations 
    WHERE created_at < NOW() - INTERVAL '6 months' 
    AND user_rating IS NULL;
    
    -- 软删除1年未登录的免费用户
    UPDATE users 
    SET deleted_at = NOW() 
    WHERE subscription_status = 'free' 
    AND last_generation_at < NOW() - INTERVAL '1 year'
    AND deleted_at IS NULL;
    
END;
$$ LANGUAGE plpgsql;

-- 创建定期清理任务（需要pg_cron扩展）
-- SELECT cron.schedule('cleanup-expired-data', '0 2 * * 0', 'SELECT cleanup_expired_data();');

COMMENT ON DATABASE postgres IS 'AI Prompt Builder Pro - 生产级数据库架构 v2.0';