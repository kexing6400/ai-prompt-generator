-- =================================================================
-- Supabase专用设置脚本
-- Supabase-specific Setup Script
-- 
-- 为律师AI工作台配置Supabase特有的功能
-- RLS策略、存储桶、边缘函数等
-- =================================================================

-- =================================================================
-- 1. 存储桶设置 (Storage Buckets)
-- =================================================================

-- 创建文档存储桶
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false);

-- 创建模板存储桶
INSERT INTO storage.buckets (id, name, public) 
VALUES ('templates', 'templates', false);

-- 创建头像存储桶
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- =================================================================
-- 2. 存储策略 (Storage Policies)
-- =================================================================

-- 文档存储策略：只有同事务所用户可以访问
CREATE POLICY "Law firm document access" ON storage.objects FOR ALL USING (
  bucket_id = 'documents' AND 
  auth.uid()::text IN (
    SELECT id FROM users 
    WHERE law_firm_id = (
      SELECT law_firm_id FROM users WHERE id = auth.uid()::text
    )
  )
);

-- 模板存储策略：支持公共模板访问
CREATE POLICY "Law firm template access" ON storage.objects FOR ALL USING (
  bucket_id = 'templates' AND (
    auth.uid()::text IN (
      SELECT id FROM users 
      WHERE law_firm_id = (
        SELECT law_firm_id FROM users WHERE id = auth.uid()::text
      )
    ) OR 
    -- 公共模板允许所有人访问
    (metadata->>'is_public')::boolean = true
  )
);

-- 头像存储策略：用户可以管理自己的头像
CREATE POLICY "User avatar access" ON storage.objects FOR ALL USING (
  bucket_id = 'avatars' AND 
  (owner = auth.uid() OR auth.uid()::text = (storage.foldername(name))[1])
);

-- =================================================================
-- 3. 实时订阅设置 (Realtime Subscriptions)
-- =================================================================

-- 启用重要表的实时更新
ALTER PUBLICATION supabase_realtime ADD TABLE cases;
ALTER PUBLICATION supabase_realtime ADD TABLE case_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE documents;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_interactions;
ALTER PUBLICATION supabase_realtime ADD TABLE time_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;

-- =================================================================
-- 4. 增强的RLS策略 (Enhanced RLS Policies)
-- =================================================================

-- 创建获取当前用户法律事务所的函数
CREATE OR REPLACE FUNCTION auth.get_current_law_firm_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT law_firm_id FROM users WHERE id = auth.uid()::text;
$$;

-- 创建检查用户角色的函数
CREATE OR REPLACE FUNCTION auth.has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 FROM users 
    WHERE id = auth.uid()::text 
    AND role::text = required_role
  );
$$;

-- 创建检查案件访问权限的函数
CREATE OR REPLACE FUNCTION auth.can_access_case(case_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 FROM case_participants cp
    JOIN cases c ON cp.case_id = c.id
    WHERE c.id = case_id 
    AND cp.user_id = auth.uid()::text
    AND cp.can_view = true
  ) OR EXISTS(
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()::text
    AND u.role IN ('super_admin', 'firm_admin', 'partner')
    AND u.law_firm_id = (SELECT law_firm_id FROM cases WHERE id = case_id)
  );
$$;

-- 案件数据的细粒度访问控制
CREATE POLICY "Case access control" ON cases FOR ALL USING (
  law_firm_id = auth.get_current_law_firm_id() AND (
    -- 案件参与者可以访问
    id IN (
      SELECT case_id FROM case_participants 
      WHERE user_id = auth.uid()::text AND can_view = true
    )
    -- 或者高级用户可以访问所有案件
    OR auth.has_role('super_admin')
    OR auth.has_role('firm_admin') 
    OR auth.has_role('partner')
  )
);

-- 文档访问控制：基于案件权限和文档级别权限
CREATE POLICY "Document access control" ON documents FOR ALL USING (
  law_firm_id = auth.get_current_law_firm_id() AND (
    -- 文档创建者可以访问
    created_by = auth.uid()::text
    -- 或者有案件访问权限
    OR id IN (
      SELECT cd.document_id FROM case_documents cd
      WHERE auth.can_access_case(cd.case_id)
    )
    -- 或者管理员权限
    OR auth.has_role('super_admin')
    OR auth.has_role('firm_admin')
    OR auth.has_role('partner')
    -- 或者文档不机密且用户在同一事务所
    OR (is_confidential = false AND access_level <= 2)
  )
);

-- 时间记录访问控制：用户只能查看自己的记录或有权限的案件记录
CREATE POLICY "Time entry access control" ON time_entries FOR ALL USING (
  law_firm_id = auth.get_current_law_firm_id() AND (
    -- 用户自己的时间记录
    user_id = auth.uid()::text
    -- 或者有案件访问权限
    OR (case_id IS NOT NULL AND auth.can_access_case(case_id))
    -- 或者管理员权限
    OR auth.has_role('super_admin')
    OR auth.has_role('firm_admin')
    OR auth.has_role('partner')
  )
);

-- AI交互历史访问控制
CREATE POLICY "AI interaction access control" ON ai_interactions FOR ALL USING (
  law_firm_id = auth.get_current_law_firm_id() AND (
    -- 用户自己的AI交互
    user_id = auth.uid()::text
    -- 或者有关联案件的访问权限
    OR (case_id IS NOT NULL AND auth.can_access_case(case_id))
    -- 或者管理员权限（用于统计分析）
    OR auth.has_role('super_admin')
    OR auth.has_role('firm_admin')
  )
);

-- 审计日志只有管理员可以访问
CREATE POLICY "Audit log admin access" ON audit_logs FOR ALL USING (
  law_firm_id = auth.get_current_law_firm_id() AND (
    auth.has_role('super_admin') OR auth.has_role('firm_admin')
  )
);

-- =================================================================
-- 5. 数据库函数和触发器 (Database Functions and Triggers)
-- =================================================================

-- 自动设置当前用户信息的函数
CREATE OR REPLACE FUNCTION set_current_user_info()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 设置当前用户ID
    NEW.created_by = COALESCE(NEW.created_by, auth.uid()::uuid);
    
    -- 设置当前用户的事务所ID（如果没有指定）
    IF TG_TABLE_NAME != 'users' AND NEW.law_firm_id IS NULL THEN
        NEW.law_firm_id = auth.get_current_law_firm_id();
    END IF;
    
    RETURN NEW;
END;
$$;

-- 为相关表添加自动设置用户信息的触发器
CREATE TRIGGER set_user_info_clients BEFORE INSERT ON clients 
    FOR EACH ROW EXECUTE FUNCTION set_current_user_info();
    
CREATE TRIGGER set_user_info_cases BEFORE INSERT ON cases 
    FOR EACH ROW EXECUTE FUNCTION set_current_user_info();
    
CREATE TRIGGER set_user_info_documents BEFORE INSERT ON documents 
    FOR EACH ROW EXECUTE FUNCTION set_current_user_info();

CREATE TRIGGER set_user_info_templates BEFORE INSERT ON legal_templates 
    FOR EACH ROW EXECUTE FUNCTION set_current_user_info();
    
CREATE TRIGGER set_user_info_prompts BEFORE INSERT ON ai_prompts 
    FOR EACH ROW EXECUTE FUNCTION set_current_user_info();

-- 自动计算工时费用的触发器
CREATE OR REPLACE FUNCTION calculate_billable_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- 如果是计费时间且设置了小时费率
    IF NEW.is_billable = true AND NEW.hourly_rate IS NOT NULL THEN
        NEW.billable_amount = (NEW.duration_minutes / 60.0) * NEW.hourly_rate;
    ELSE
        NEW.billable_amount = 0;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER calculate_time_entry_amount BEFORE INSERT OR UPDATE ON time_entries
    FOR EACH ROW EXECUTE FUNCTION calculate_billable_amount();

-- =================================================================
-- 6. 数据验证函数 (Data Validation Functions)
-- =================================================================

-- 验证律师执业证号的函数
CREATE OR REPLACE FUNCTION validate_bar_number(bar_num TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    -- 基本格式验证（可根据具体司法辖区调整）
    RETURN bar_num ~ '^[A-Z0-9]{5,20}$';
END;
$$;

-- 验证案件编号唯一性的函数
CREATE OR REPLACE FUNCTION validate_case_number(firm_id UUID, case_num TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
AS $$
    SELECT NOT EXISTS(
        SELECT 1 FROM cases 
        WHERE law_firm_id = firm_id 
        AND case_number = case_num
    );
$$;

-- =================================================================
-- 7. 数据清理和维护函数 (Data Cleanup and Maintenance)
-- =================================================================

-- 清理过期审计日志的函数
CREATE OR REPLACE FUNCTION cleanup_expired_audit_logs()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER := 0;
    firm_record RECORD;
BEGIN
    -- 为每个事务所执行清理
    FOR firm_record IN 
        SELECT id, data_retention_days FROM law_firms WHERE audit_enabled = true
    LOOP
        DELETE FROM audit_logs 
        WHERE law_firm_id = firm_record.id 
        AND timestamp < NOW() - INTERVAL '1 day' * firm_record.data_retention_days;
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
        -- 记录清理操作
        INSERT INTO audit_logs (law_firm_id, action, resource_type, description)
        VALUES (
            firm_record.id, 
            'delete'::audit_action, 
            'audit_logs', 
            'Cleaned up ' || deleted_count || ' expired audit log entries'
        );
    END LOOP;
    
    RETURN deleted_count;
END;
$$;

-- 统计活跃案件的函数
CREATE OR REPLACE FUNCTION get_active_cases_stats(firm_id UUID)
RETURNS TABLE(
    status case_status,
    priority case_priority,
    case_count BIGINT,
    avg_days_open NUMERIC
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        c.status,
        c.priority,
        COUNT(*) as case_count,
        AVG(EXTRACT(days FROM NOW() - c.opened_date))::NUMERIC as avg_days_open
    FROM cases c
    WHERE c.law_firm_id = firm_id 
    AND c.status IN ('active', 'on_hold')
    GROUP BY c.status, c.priority
    ORDER BY c.priority, c.status;
$$;

-- =================================================================
-- 8. API和应用集成函数 (API and Application Integration)
-- =================================================================

-- 创建新案件并自动添加创建者为主办律师
CREATE OR REPLACE FUNCTION create_case_with_lead_attorney(
    p_law_firm_id UUID,
    p_client_id UUID,
    p_case_number TEXT,
    p_title TEXT,
    p_description TEXT DEFAULT NULL,
    p_case_type TEXT DEFAULT 'general',
    p_priority case_priority DEFAULT 'medium'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_case_id UUID;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid()::UUID;
    
    -- 创建案件
    INSERT INTO cases (
        law_firm_id, client_id, case_number, title, description, 
        case_type, priority, opened_date, created_by
    ) VALUES (
        p_law_firm_id, p_client_id, p_case_number, p_title, p_description,
        p_case_type, p_priority, CURRENT_DATE, current_user_id
    ) RETURNING id INTO new_case_id;
    
    -- 添加创建者为主办律师
    INSERT INTO case_participants (
        case_id, user_id, role, can_view, can_edit, can_delete, can_share
    ) VALUES (
        new_case_id, current_user_id, 'lead_attorney'::case_participant_role, 
        true, true, true, true
    );
    
    RETURN new_case_id;
END;
$$;

-- 批量创建AI交互记录的函数（用于批量处理）
CREATE OR REPLACE FUNCTION batch_create_ai_interactions(
    interactions JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    interaction_record RECORD;
    inserted_count INTEGER := 0;
BEGIN
    FOR interaction_record IN 
        SELECT * FROM jsonb_to_recordset(interactions) AS x(
            law_firm_id UUID,
            user_id UUID,
            case_id UUID,
            prompt_id UUID,
            input_text TEXT,
            output_text TEXT,
            model_name TEXT,
            total_tokens INTEGER,
            cost_usd NUMERIC
        )
    LOOP
        INSERT INTO ai_interactions (
            law_firm_id, user_id, case_id, prompt_id, input_text, 
            output_text, model_name, total_tokens, cost_usd
        ) VALUES (
            interaction_record.law_firm_id,
            interaction_record.user_id,
            interaction_record.case_id,
            interaction_record.prompt_id,
            interaction_record.input_text,
            interaction_record.output_text,
            interaction_record.model_name,
            interaction_record.total_tokens,
            interaction_record.cost_usd
        );
        
        inserted_count := inserted_count + 1;
    END LOOP;
    
    RETURN inserted_count;
END;
$$;

-- =================================================================
-- 9. 定期任务计划 (Scheduled Tasks)
-- =================================================================

-- 创建pg_cron扩展（如果Supabase支持）
-- SELECT cron.schedule('cleanup-audit-logs', '0 2 * * *', 'SELECT cleanup_expired_audit_logs();');

-- 创建合规检查任务
-- SELECT cron.schedule('monthly-compliance-check', '0 1 1 * *', '
--     INSERT INTO compliance_checks (law_firm_id, check_type, check_name, status)
--     SELECT id, ''monthly_review'', ''Monthly Data Compliance Review'', ''scheduled''
--     FROM law_firms WHERE audit_enabled = true;
-- ');

-- =================================================================
-- 10. 性能优化设置 (Performance Optimization)
-- =================================================================

-- 创建部分索引以提高查询性能
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cases_active_status 
    ON cases (law_firm_id, opened_date) 
    WHERE status IN ('active', 'on_hold');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_confidential_recent
    ON documents (law_firm_id, created_at)
    WHERE is_confidential = true AND created_at > CURRENT_DATE - INTERVAL '1 year';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_entries_billable_recent
    ON time_entries (law_firm_id, user_id, entry_date)
    WHERE is_billable = true AND entry_date > CURRENT_DATE - INTERVAL '3 months';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_interactions_monthly
    ON ai_interactions (law_firm_id, user_id, DATE_TRUNC('month', created_at))
    WHERE created_at > CURRENT_DATE - INTERVAL '1 year';

-- =================================================================
-- 11. 安全配置 (Security Configuration)
-- =================================================================

-- 创建受限访问的视图
CREATE VIEW secure_user_info AS
SELECT 
    id, law_firm_id, email, full_name, role, 
    specializations, timezone, language, 
    created_at, is_active
FROM users
WHERE law_firm_id = auth.get_current_law_firm_id();

-- 启用视图的RLS
ALTER VIEW secure_user_info SET (security_barrier = on);

-- 创建案件摘要视图（隐藏敏感信息）
CREATE VIEW case_summary AS
SELECT 
    c.id, c.law_firm_id, c.case_number, c.title, c.case_type,
    c.status, c.priority, c.opened_date, c.closed_date,
    cl.full_name_encrypted as client_name_encrypted,
    u.full_name as created_by_name
FROM cases c
LEFT JOIN clients cl ON c.client_id = cl.id
LEFT JOIN users u ON c.created_by = u.id
WHERE c.law_firm_id = auth.get_current_law_firm_id();

-- =================================================================
-- 12. 初始化数据和测试数据 (Initialization and Test Data)
-- =================================================================

-- 创建默认系统用户（用于系统操作）
DO $$
BEGIN
    -- 只在表为空时创建
    IF NOT EXISTS (SELECT 1 FROM law_firms LIMIT 1) THEN
        INSERT INTO law_firms (
            id, name, registration_number, address, 
            jurisdiction, data_retention_days, encryption_enabled, audit_enabled
        ) VALUES (
            '00000000-0000-0000-0000-000000000000'::UUID,
            'System Law Firm',
            'SYSTEM000',
            'System Address',
            'System Jurisdiction',
            2555,
            true,
            true
        );
    END IF;
END $$;

-- 创建系统配置表
CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入默认系统配置
INSERT INTO system_config (key, value, description) VALUES
('max_file_size_mb', '100', 'Maximum file upload size in MB'),
('supported_file_types', '["pdf", "docx", "doc", "txt", "rtf"]', 'Supported document file types'),
('ai_model_config', '{"default_model": "gpt-4", "max_tokens": 4000}', 'Default AI model configuration'),
('security_settings', '{"session_timeout_minutes": 480, "max_failed_logins": 5}', 'Security settings'),
('billing_settings', '{"default_hourly_rate": 350, "currency": "USD"}', 'Default billing settings')
ON CONFLICT (key) DO NOTHING;

-- =================================================================
-- 设置完成通知
-- =================================================================

-- 记录设置完成
INSERT INTO audit_logs (
    law_firm_id, action, resource_type, description, timestamp
) VALUES (
    '00000000-0000-0000-0000-000000000000'::UUID,
    'create'::audit_action,
    'system',
    'Supabase database setup completed successfully',
    NOW()
);

COMMENT ON SCHEMA public IS 'Lawyer AI Workstation database schema with Supabase integration completed';

-- =================================================================
-- Supabase设置脚本完成
-- =================================================================