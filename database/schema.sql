-- AI Prompt Generator 管理后台数据库表结构
-- 创建时间：2025-08-09
-- 作者：Claude Code (后端架构师)

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. 系统配置表（键值对存储）
CREATE TABLE IF NOT EXISTS admin_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    encrypted BOOLEAN DEFAULT false,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_config_updated_at 
    BEFORE UPDATE ON admin_config 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 2. AI模型配置表
CREATE TABLE IF NOT EXISTS ai_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    model_id VARCHAR(200) NOT NULL,
    max_tokens INTEGER DEFAULT 4000,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    cost_per_1k_tokens DECIMAL(10,6) DEFAULT 0.001,
    enabled BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 确保只有一个默认模型
    CONSTRAINT unique_default_model EXCLUDE (is_default WITH =) WHERE (is_default = true),
    -- 确保模型名称唯一
    CONSTRAINT unique_model_name UNIQUE (name)
);

CREATE TRIGGER update_ai_models_updated_at 
    BEFORE UPDATE ON ai_models 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 3. 提示词模版表
CREATE TABLE IF NOT EXISTS prompt_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    scenario VARCHAR(200) NOT NULL,
    template TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    version INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 确保同一行业场景的模版名称唯一
    CONSTRAINT unique_template_per_industry UNIQUE (industry, scenario, name)
);

CREATE TRIGGER update_prompt_templates_updated_at 
    BEFORE UPDATE ON prompt_templates 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 4. 配置变更审计表
CREATE TABLE IF NOT EXISTS config_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    admin_session_id VARCHAR(255),
    admin_ip INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX idx_admin_config_category ON admin_config(category);
CREATE INDEX idx_admin_config_key ON admin_config(key);
CREATE INDEX idx_ai_models_enabled ON ai_models(enabled);
CREATE INDEX idx_ai_models_provider ON ai_models(provider);
CREATE INDEX idx_prompt_templates_industry ON prompt_templates(industry);
CREATE INDEX idx_prompt_templates_active ON prompt_templates(active);
CREATE INDEX idx_config_audit_table_record ON config_audit(table_name, record_id);
CREATE INDEX idx_config_audit_created_at ON config_audit(created_at);

-- 插入默认配置数据
INSERT INTO admin_config (key, value, encrypted, description, category) VALUES
-- API配置
('openrouter_api_key', '', true, 'OpenRouter API密钥', 'api'),
('openrouter_base_url', 'https://openrouter.ai/api/v1', false, 'OpenRouter API基础URL', 'api'),
('api_timeout', '15000', false, 'API超时时间(毫秒)', 'api'),
('api_retry_count', '3', false, 'API重试次数', 'api'),

-- 缓存配置
('cache_ttl', '3600000', false, '缓存过期时间(毫秒)', 'cache'),
('cache_max_size', '1000', false, '缓存最大条目数', 'cache'),

-- 系统配置
('admin_password_hash', '', true, '管理员密码哈希', 'auth'),
('jwt_secret', '', true, 'JWT签名密钥', 'auth'),
('session_duration', '86400', false, '会话持续时间(秒)', 'auth'),

-- 业务配置
('default_model', 'anthropic/claude-3.5-sonnet', false, '默认AI模型', 'business'),
('default_temperature', '0.7', false, '默认温度参数', 'business'),
('default_max_tokens', '2000', false, '默认最大token数', 'business');

-- 插入默认AI模型
INSERT INTO ai_models (name, provider, model_id, max_tokens, temperature, cost_per_1k_tokens, enabled, is_default, description) VALUES
('Claude 3.5 Sonnet', 'anthropic', 'anthropic/claude-3.5-sonnet', 4000, 0.7, 0.003, true, true, 'Anthropic最新的高性能模型，适合复杂推理任务'),
('GPT-4o', 'openai', 'openai/gpt-4o', 4000, 0.7, 0.005, true, false, 'OpenAI最新多模态模型'),
('Claude 3 Haiku', 'anthropic', 'anthropic/claude-3-haiku', 4000, 0.7, 0.0005, true, false, '快速响应的轻量级模型'),
('Llama 3.3 70B', 'meta', 'meta-llama/llama-3.3-70b-instruct', 8000, 0.7, 0.0008, false, false, 'Meta开源大模型');

-- 插入默认提示词模版
INSERT INTO prompt_templates (name, industry, scenario, template, variables, active, description) VALUES
('合同审查专家', 'lawyer', '合同审查', 
'作为一名拥有15年经验的资深合同法律师，我将为你进行专业的合同审查。

请按照以下步骤分析合同：

1. **合同基本信息识别**
   - 合同类型和性质
   - 合同主体资格审查
   - 合同金额和支付条款

2. **关键条款审查**
   - 权利义务条款的对等性
   - 违约责任条款的合理性
   - 争议解决条款的可执行性

3. **风险点识别**
   - 隐含的法律风险
   - 商业风险评估
   - 执行难点预判

4. **修改建议**
   - 具体条款的修改意见
   - 新增条款的建议
   - 谈判要点提示

请提供结构化的审查报告。', 
'["合同类型", "关注重点", "风险级别"]', true, '专业合同审查提示词模版'),

('房产市场分析师', 'realtor', '市场分析',
'作为一名拥有10年经验的资深房地产市场分析师，我将为你提供专业的市场分析。

分析维度：

1. **区域市场概况**
   - 供需关系分析
   - 价格走势判断
   - 政策影响评估

2. **项目竞争力分析**
   - 地段价值评估
   - 产品力对比
   - 定价策略建议

3. **投资价值判断**
   - ROI测算
   - 风险收益比
   - 持有策略建议

请提供数据支撑的专业分析报告。',
'["地区", "价格区间", "投资目标"]', true, '房产市场分析提示词模版');

-- 5. 测试用例表
CREATE TABLE IF NOT EXISTS test_scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    industry VARCHAR(100) NOT NULL,
    scenario VARCHAR(200) NOT NULL,
    goal TEXT NOT NULL,
    requirements TEXT NOT NULL,
    expected_output TEXT,
    active BOOLEAN DEFAULT true,
    execution_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    avg_response_time INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 确保测试用例名称唯一
    CONSTRAINT unique_test_scenario_name UNIQUE (name)
);

CREATE TRIGGER update_test_scenarios_updated_at 
    BEFORE UPDATE ON test_scenarios 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 6. 测试执行结果表
CREATE TABLE IF NOT EXISTS test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_scenario_id UUID REFERENCES test_scenarios(id) ON DELETE CASCADE,
    model_used VARCHAR(200) NOT NULL,
    prompt_generated TEXT NOT NULL,
    response_time INTEGER NOT NULL,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    source VARCHAR(20) DEFAULT 'ai', -- ai, template, fallback
    config_snapshot JSONB, -- 保存测试时的配置快照
    metrics JSONB DEFAULT '{}', -- 额外的性能指标
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 系统健康监控表
CREATE TABLE IF NOT EXISTS health_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    check_type VARCHAR(50) NOT NULL, -- api, database, model, cache
    status VARCHAR(20) NOT NULL, -- healthy, degraded, failed
    response_time INTEGER NOT NULL,
    details JSONB DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为测试相关表创建索引
CREATE INDEX idx_test_scenarios_industry ON test_scenarios(industry);
CREATE INDEX idx_test_scenarios_active ON test_scenarios(active);
CREATE INDEX idx_test_scenarios_execution_count ON test_scenarios(execution_count);
CREATE INDEX idx_test_results_scenario_id ON test_results(test_scenario_id);
CREATE INDEX idx_test_results_model_used ON test_results(model_used);
CREATE INDEX idx_test_results_success ON test_results(success);
CREATE INDEX idx_test_results_created_at ON test_results(created_at);
CREATE INDEX idx_health_checks_type ON health_checks(check_type);
CREATE INDEX idx_health_checks_status ON health_checks(status);
CREATE INDEX idx_health_checks_created_at ON health_checks(created_at);

-- 插入默认测试用例
INSERT INTO test_scenarios (name, description, industry, scenario, goal, requirements, expected_output, active) VALUES
-- 律师行业测试用例
('合同审查测试 - 基础版', '测试基础合同审查提示词生成', 'lawyer', '合同审查', '审查一份商务合作协议', '重点关注违约条款、付款条件和知识产权条款', '应包含专业法律术语、具体审查步骤和风险评估', true),
('法律咨询测试 - 高级版', '测试复杂法律咨询场景', 'lawyer', '法律咨询', '为企业并购提供法律建议', '涉及税务安排、员工权益、资产评估和合规要求', '应提供结构化的法律分析框架和具体操作建议', true),

-- 房产行业测试用例  
('投资分析测试', '测试房产投资分析提示词', 'realtor', '投资分析', '评估某商业地产的投资价值', '考虑地段、租金收益、未来增值和政策风险', '应包含ROI计算、市场对比和投资建议', true),
('市场报告测试', '测试市场分析报告生成', 'realtor', '市场分析', '撰写区域房地产市场报告', '分析供需关系、价格趋势、政策影响', '应提供数据支撑的专业分析和预测', true),

-- 保险行业测试用例
('风险评估测试', '测试保险风险评估提示词', 'insurance', '风险评估', '为中小企业制定保险方案', '考虑行业特点、财务状况、风险敞口', '应包含风险识别、保障需求分析和产品推荐', true),
('理赔审核测试', '测试理赔审核指导', 'insurance', '理赔审核', '审核车险理赔案例', '判断事故责任、损失评估、理赔金额', '应提供专业的审核标准和决策依据', true),

-- 教师行业测试用例
('教学设计测试', '测试教学方案设计', 'teacher', '教学设计', '设计高中数学概率统计单元', '适合不同学习能力的学生，注重实践应用', '应包含教学目标、方法、活动设计和评估方式', true),
('学情分析测试', '测试学情分析指导', 'teacher', '学情分析', '分析班级英语学习情况', '基于测试成绩、课堂表现、学习兴趣', '应提供个性化教学建议和改进方案', true),

-- 会计行业测试用例
('财务分析测试', '测试企业财务分析', 'accountant', '财务分析', '分析制造业企业财务健康状况', '基于三大财务报表，关注盈利能力和偿债能力', '应包含关键指标计算、趋势分析和改进建议', true),
('税务筹划测试', '测试税务优化方案', 'accountant', '税务筹划', '为高新技术企业制定税务策略', '合理利用政策优惠，降低税负成本', '应提供合规的节税方案和实施步骤', true);

-- 创建RLS (Row Level Security) 策略
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_checks ENABLE ROW LEVEL SECURITY;

-- 暂时允许所有操作（后续通过应用层控制）
CREATE POLICY "Allow all for authenticated users" ON admin_config FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON ai_models FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON prompt_templates FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON config_audit FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON test_scenarios FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON test_results FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON health_checks FOR ALL USING (true);