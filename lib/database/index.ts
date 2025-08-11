/**
 * 数据库服务层 - 律师AI工作台
 * Database Service Layer - Lawyer AI Workstation
 * 
 * 提供类型安全的数据库操作、查询构建器、事务管理等功能
 * Provides type-safe database operations, query builders, transaction management
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import { 
  LawFirm, User, Client, Case, Document, LegalTemplate, 
  AIPrompt, AIInteraction, TimeEntry, AuditLog,
  CreateCaseRequest, CreateDocumentRequest, CaseQueryParams,
  DocumentQueryParams, TimeEntryQueryParams, APIResponse,
  PaginatedResult, DashboardStats, UserRole, CaseStatus
} from './types';

// =================================================================
// 数据库客户端配置 (Database Client Configuration)
// =================================================================

export class LawyerAIDatabase {
  private supabase: SupabaseClient<Database>;
  private currentUserId?: string;
  private currentLawFirmId?: string;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });

    // 监听认证状态变化
    this.supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        this.setCurrentUser(session.user.id);
      } else {
        this.clearCurrentUser();
      }
    });
  }

  // =================================================================
  // 用户会话管理 (User Session Management)
  // =================================================================

  async setCurrentUser(userId: string): Promise<void> {
    this.currentUserId = userId;
    
    // 获取用户的事务所ID
    const { data: user } = await this.supabase
      .from('users')
      .select('law_firm_id')
      .eq('id', userId)
      .single();
    
    if (user) {
      this.currentLawFirmId = user.law_firm_id;
      
      // 设置RLS上下文
      await this.supabase.rpc('set_config', {
        setting_name: 'app.current_user_id',
        setting_value: userId,
        is_local: false
      });
      
      await this.supabase.rpc('set_config', {
        setting_name: 'app.current_law_firm_id', 
        setting_value: user.law_firm_id,
        is_local: false
      });
    }
  }

  clearCurrentUser(): void {
    this.currentUserId = undefined;
    this.currentLawFirmId = undefined;
  }

  getCurrentUserId(): string | undefined {
    return this.currentUserId;
  }

  getCurrentLawFirmId(): string | undefined {
    return this.currentLawFirmId;
  }

  // =================================================================
  // 认证相关方法 (Authentication Methods)
  // =================================================================

  async signUp(email: string, password: string, userData: any) {
    return await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
  }

  async signIn(email: string, password: string) {
    return await this.supabase.auth.signInWithPassword({
      email,
      password
    });
  }

  async signOut() {
    const result = await this.supabase.auth.signOut();
    this.clearCurrentUser();
    return result;
  }

  async resetPassword(email: string) {
    return await this.supabase.auth.resetPasswordForEmail(email);
  }

  // =================================================================
  // 事务所管理 (Law Firm Management)
  // =================================================================

  async createLawFirm(firmData: Partial<LawFirm>): Promise<APIResponse<LawFirm>> {
    try {
      const { data, error } = await this.supabase
        .from('law_firms')
        .insert([firmData])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: data as LawFirm };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async getLawFirm(firmId: string): Promise<APIResponse<LawFirm>> {
    try {
      const { data, error } = await this.supabase
        .from('law_firms')
        .select('*')
        .eq('id', firmId)
        .single();

      if (error) throw error;

      return { success: true, data: data as LawFirm };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Law firm not found' 
      };
    }
  }

  async updateLawFirm(firmId: string, updates: Partial<LawFirm>): Promise<APIResponse<LawFirm>> {
    try {
      const { data, error } = await this.supabase
        .from('law_firms')
        .update(updates)
        .eq('id', firmId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: data as LawFirm };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Update failed' 
      };
    }
  }

  // =================================================================
  // 用户管理 (User Management)
  // =================================================================

  async createUser(userData: Partial<User>): Promise<APIResponse<User>> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .insert([userData])
        .select(`
          *,
          law_firm:law_firms(*)
        `)
        .single();

      if (error) throw error;

      return { success: true, data: data as User };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'User creation failed' 
      };
    }
  }

  async getUser(userId: string): Promise<APIResponse<User>> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select(`
          *,
          law_firm:law_firms(*)
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;

      return { success: true, data: data as User };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'User not found' 
      };
    }
  }

  async getUsersByLawFirm(lawFirmId: string, role?: UserRole): Promise<APIResponse<User[]>> {
    try {
      let query = this.supabase
        .from('users')
        .select(`
          *,
          law_firm:law_firms(*)
        `)
        .eq('law_firm_id', lawFirmId)
        .eq('is_active', true);

      if (role) {
        query = query.eq('role', role);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data as User[] };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Users fetch failed' 
      };
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<APIResponse<User>> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select(`
          *,
          law_firm:law_firms(*)
        `)
        .single();

      if (error) throw error;

      return { success: true, data: data as User };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'User update failed' 
      };
    }
  }

  // =================================================================
  // 客户管理 (Client Management)
  // =================================================================

  async createClient(clientData: Partial<Client>): Promise<APIResponse<Client>> {
    try {
      const { data, error } = await this.supabase
        .from('clients')
        .insert([{
          ...clientData,
          law_firm_id: this.currentLawFirmId
        }])
        .select(`
          *,
          law_firm:law_firms(*),
          primary_attorney:users!primary_attorney(*)
        `)
        .single();

      if (error) throw error;

      return { success: true, data: data as Client };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Client creation failed' 
      };
    }
  }

  async getClients(limit = 20, offset = 0): Promise<APIResponse<PaginatedResult<Client>>> {
    try {
      const { data, error, count } = await this.supabase
        .from('clients')
        .select(`
          *,
          law_firm:law_firms(*),
          primary_attorney:users!primary_attorney(*)
        `, { count: 'exact' })
        .eq('law_firm_id', this.currentLawFirmId!)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        success: true,
        data: {
          items: data as Client[],
          total: count || 0,
          page: Math.floor(offset / limit) + 1,
          per_page: limit,
          total_pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Clients fetch failed' 
      };
    }
  }

  // =================================================================
  // 案件管理 (Case Management)
  // =================================================================

  async createCase(caseData: CreateCaseRequest): Promise<APIResponse<Case>> {
    try {
      // 使用数据库函数创建案件并添加主办律师
      const { data, error } = await this.supabase
        .rpc('create_case_with_lead_attorney', {
          p_law_firm_id: caseData.law_firm_id,
          p_client_id: caseData.client_id,
          p_case_number: caseData.case_number,
          p_title: caseData.title,
          p_description: caseData.description || null,
          p_case_type: caseData.case_type,
          p_priority: caseData.priority || 'medium'
        });

      if (error) throw error;

      // 获取完整的案件信息
      const caseResult = await this.getCase(data);
      return caseResult;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Case creation failed' 
      };
    }
  }

  async getCase(caseId: string): Promise<APIResponse<Case>> {
    try {
      const { data, error } = await this.supabase
        .from('cases')
        .select(`
          *,
          law_firm:law_firms(*),
          client:clients(*),
          participants:case_participants(
            *,
            user:users(*)
          )
        `)
        .eq('id', caseId)
        .single();

      if (error) throw error;

      return { success: true, data: data as Case };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Case not found' 
      };
    }
  }

  async getCases(params: CaseQueryParams = {}): Promise<APIResponse<PaginatedResult<Case>>> {
    try {
      let query = this.supabase
        .from('cases')
        .select(`
          *,
          law_firm:law_firms(*),
          client:clients(*),
          participants:case_participants(
            *,
            user:users(*)
          )
        `, { count: 'exact' })
        .eq('law_firm_id', this.currentLawFirmId!);

      // 应用筛选条件
      if (params.client_id) {
        query = query.eq('client_id', params.client_id);
      }
      if (params.status) {
        query = query.eq('status', params.status);
      }
      if (params.priority) {
        query = query.eq('priority', params.priority);
      }
      if (params.case_type) {
        query = query.eq('case_type', params.case_type);
      }
      if (params.opened_after) {
        query = query.gte('opened_date', params.opened_after.toISOString().split('T')[0]);
      }
      if (params.opened_before) {
        query = query.lte('opened_date', params.opened_before.toISOString().split('T')[0]);
      }
      if (params.search) {
        query = query.textSearch('title', params.search);
      }

      // 排序
      const sortBy = params.sort_by || 'opened_date';
      const sortOrder = params.sort_order === 'asc' ? { ascending: true } : { ascending: false };
      query = query.order(sortBy, sortOrder);

      // 分页
      const limit = Math.min(params.limit || 20, 100);
      const offset = params.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        success: true,
        data: {
          items: data as Case[],
          total: count || 0,
          page: Math.floor(offset / limit) + 1,
          per_page: limit,
          total_pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Cases fetch failed' 
      };
    }
  }

  async updateCase(caseId: string, updates: Partial<Case>): Promise<APIResponse<Case>> {
    try {
      const { data, error } = await this.supabase
        .from('cases')
        .update(updates)
        .eq('id', caseId)
        .select(`
          *,
          law_firm:law_firms(*),
          client:clients(*),
          participants:case_participants(
            *,
            user:users(*)
          )
        `)
        .single();

      if (error) throw error;

      return { success: true, data: data as Case };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Case update failed' 
      };
    }
  }

  // =================================================================
  // 文档管理 (Document Management)
  // =================================================================

  async createDocument(documentData: CreateDocumentRequest): Promise<APIResponse<Document>> {
    try {
      const { data, error } = await this.supabase
        .from('documents')
        .insert([{
          ...documentData,
          law_firm_id: this.currentLawFirmId
        }])
        .select(`
          *,
          law_firm:law_firms(*),
          creator:users!created_by(*)
        `)
        .single();

      if (error) throw error;

      return { success: true, data: data as Document };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Document creation failed' 
      };
    }
  }

  async getDocuments(params: DocumentQueryParams = {}): Promise<APIResponse<PaginatedResult<Document>>> {
    try {
      let query = this.supabase
        .from('documents')
        .select(`
          *,
          law_firm:law_firms(*),
          creator:users!created_by(*)
        `, { count: 'exact' })
        .eq('law_firm_id', this.currentLawFirmId!);

      // 应用筛选条件
      if (params.case_id) {
        query = query.in('id', 
          this.supabase
            .from('case_documents')
            .select('document_id')
            .eq('case_id', params.case_id)
        );
      }
      if (params.document_type) {
        query = query.eq('document_type', params.document_type);
      }
      if (params.status) {
        query = query.eq('status', params.status);
      }
      if (params.is_confidential !== undefined) {
        query = query.eq('is_confidential', params.is_confidential);
      }
      if (params.search) {
        query = query.textSearch('title', params.search);
      }

      // 排序和分页
      const sortBy = params.sort_by || 'created_at';
      const sortOrder = params.sort_order === 'asc' ? { ascending: true } : { ascending: false };
      query = query.order(sortBy, sortOrder);

      const limit = Math.min(params.limit || 20, 100);
      const offset = params.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        success: true,
        data: {
          items: data as Document[],
          total: count || 0,
          page: Math.floor(offset / limit) + 1,
          per_page: limit,
          total_pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Documents fetch failed' 
      };
    }
  }

  // =================================================================
  // 文件上传和存储 (File Upload and Storage)
  // =================================================================

  async uploadDocument(
    file: File, 
    documentData: Partial<Document>,
    caseId?: string
  ): Promise<APIResponse<Document>> {
    try {
      // 生成文件路径
      const fileExt = file.name.split('.').pop();
      const fileName = `${this.currentLawFirmId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // 上传文件到Supabase Storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 创建文档记录
      const docResult = await this.createDocument({
        ...documentData,
        law_firm_id: this.currentLawFirmId!,
        file_name: file.name,
        file_size: file.size,
        file_path: uploadData.path,
        mime_type: file.type,
        file_hash: await this.calculateFileHash(file)
      });

      if (!docResult.success || !docResult.data) {
        throw new Error(docResult.error);
      }

      // 如果指定了案件ID，创建案件文档关联
      if (caseId) {
        await this.supabase
          .from('case_documents')
          .insert([{
            case_id: caseId,
            document_id: docResult.data.id,
            relationship_type: 'related'
          }]);
      }

      return docResult;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'File upload failed' 
      };
    }
  }

  async downloadDocument(documentId: string): Promise<APIResponse<Blob>> {
    try {
      // 获取文档信息
      const docResult = await this.supabase
        .from('documents')
        .select('file_path')
        .eq('id', documentId)
        .single();

      if (docResult.error) throw docResult.error;

      // 下载文件
      const { data, error } = await this.supabase.storage
        .from('documents')
        .download(docResult.data.file_path);

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'File download failed' 
      };
    }
  }

  // =================================================================
  // AI交互管理 (AI Interaction Management)
  // =================================================================

  async createAIInteraction(interactionData: Partial<AIInteraction>): Promise<APIResponse<AIInteraction>> {
    try {
      const { data, error } = await this.supabase
        .from('ai_interactions')
        .insert([{
          ...interactionData,
          law_firm_id: this.currentLawFirmId,
          user_id: this.currentUserId
        }])
        .select(`
          *,
          law_firm:law_firms(*),
          user:users(*),
          case:cases(*),
          prompt:ai_prompts(*)
        `)
        .single();

      if (error) throw error;

      return { success: true, data: data as AIInteraction };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'AI interaction creation failed' 
      };
    }
  }

  async getAIInteractions(
    limit = 20, 
    offset = 0,
    caseId?: string
  ): Promise<APIResponse<PaginatedResult<AIInteraction>>> {
    try {
      let query = this.supabase
        .from('ai_interactions')
        .select(`
          *,
          law_firm:law_firms(*),
          user:users(*),
          case:cases(*),
          prompt:ai_prompts(*)
        `, { count: 'exact' })
        .eq('law_firm_id', this.currentLawFirmId!)
        .order('created_at', { ascending: false });

      if (caseId) {
        query = query.eq('case_id', caseId);
      }

      const { data, error, count } = await query.range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        success: true,
        data: {
          items: data as AIInteraction[],
          total: count || 0,
          page: Math.floor(offset / limit) + 1,
          per_page: limit,
          total_pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'AI interactions fetch failed' 
      };
    }
  }

  // =================================================================
  // 统计和报告 (Statistics and Reports)
  // =================================================================

  async getDashboardStats(): Promise<APIResponse<DashboardStats>> {
    try {
      const lawFirmId = this.currentLawFirmId!;
      
      // 并行查询各种统计数据
      const [
        totalCasesResult,
        activeCasesResult,
        totalClientsResult,
        totalDocumentsResult,
        billableHoursResult,
        aiInteractionsResult,
        recentActivitiesResult
      ] = await Promise.all([
        this.supabase
          .from('cases')
          .select('id', { count: 'exact' })
          .eq('law_firm_id', lawFirmId),
        
        this.supabase
          .from('cases')
          .select('id', { count: 'exact' })
          .eq('law_firm_id', lawFirmId)
          .in('status', ['active', 'on_hold']),
        
        this.supabase
          .from('clients')
          .select('id', { count: 'exact' })
          .eq('law_firm_id', lawFirmId)
          .eq('is_active', true),
        
        this.supabase
          .from('documents')
          .select('id', { count: 'exact' })
          .eq('law_firm_id', lawFirmId),
        
        this.supabase
          .from('time_entries')
          .select('duration_minutes, billable_amount')
          .eq('law_firm_id', lawFirmId)
          .eq('is_billable', true)
          .gte('entry_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
        
        this.supabase
          .from('ai_interactions')
          .select('id', { count: 'exact' })
          .eq('law_firm_id', lawFirmId)
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        
        this.supabase
          .from('audit_logs')
          .select('*')
          .eq('law_firm_id', lawFirmId)
          .order('timestamp', { ascending: false })
          .limit(10)
      ]);

      // 计算本月工时和收入
      const billableHoursThisMonth = billableHoursResult.data?.reduce((sum, entry) => 
        sum + (entry.duration_minutes / 60), 0) || 0;
      const revenueThisMonth = billableHoursResult.data?.reduce((sum, entry) => 
        sum + (Number(entry.billable_amount) || 0), 0) || 0;

      const stats: DashboardStats = {
        total_cases: totalCasesResult.count || 0,
        active_cases: activeCasesResult.count || 0,
        total_clients: totalClientsResult.count || 0,
        total_documents: totalDocumentsResult.count || 0,
        billable_hours_this_month: billableHoursThisMonth,
        revenue_this_month: revenueThisMonth,
        ai_interactions_this_month: aiInteractionsResult.count || 0,
        recent_activities: recentActivitiesResult.data as AuditLog[] || []
      };

      return { success: true, data: stats };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Dashboard stats fetch failed' 
      };
    }
  }

  // =================================================================
  // 实时订阅 (Realtime Subscriptions)
  // =================================================================

  subscribeToCase(caseId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel(`case:${caseId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cases',
        filter: `id=eq.${caseId}`
      }, callback)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'case_participants',
        filter: `case_id=eq.${caseId}`
      }, callback)
      .subscribe();
  }

  subscribeToDocuments(callback: (payload: any) => void) {
    return this.supabase
      .channel(`documents:${this.currentLawFirmId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'documents',
        filter: `law_firm_id=eq.${this.currentLawFirmId}`
      }, callback)
      .subscribe();
  }

  // =================================================================
  // 工具方法 (Utility Methods)
  // =================================================================

  private async calculateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async healthCheck(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('law_firms')
        .select('id')
        .limit(1);
      
      return !error;
    } catch {
      return false;
    }
  }

  async executeTransaction<T>(
    operations: ((client: SupabaseClient<Database>) => Promise<T>)[]
  ): Promise<APIResponse<T[]>> {
    try {
      // Supabase不支持原生事务，使用串行执行
      const results: T[] = [];
      for (const operation of operations) {
        const result = await operation(this.supabase);
        results.push(result);
      }
      
      return { success: true, data: results };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Transaction failed' 
      };
    }
  }
}

// =================================================================
// 单例导出 (Singleton Export)
// =================================================================

let dbInstance: LawyerAIDatabase | null = null;

export const createLawyerAIDatabase = (supabaseUrl: string, supabaseKey: string): LawyerAIDatabase => {
  if (!dbInstance) {
    dbInstance = new LawyerAIDatabase(supabaseUrl, supabaseKey);
  }
  return dbInstance;
};

export const getLawyerAIDatabase = (): LawyerAIDatabase => {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call createLawyerAIDatabase first.');
  }
  return dbInstance;
};

// =================================================================
// 数据验证工具 (Data Validation Utilities)
// =================================================================

export const validateCaseNumber = (caseNumber: string): boolean => {
  // 案件编号格式验证：字母数字组合，长度4-20
  return /^[A-Z0-9]{4,20}$/.test(caseNumber);
};

export const validateBarNumber = (barNumber: string): boolean => {
  // 律师执业证号格式验证：字母数字组合，长度5-20
  return /^[A-Z0-9]{5,20}$/.test(barNumber);
};

export const validateEmail = (email: string): boolean => {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
};

// =================================================================
// 查询构建器工具 (Query Builder Utilities)
// =================================================================

export class QueryBuilder<T> {
  private filters: Array<{ column: string; operator: string; value: any }> = [];
  private sortBy?: string;
  private sortOrder: 'asc' | 'desc' = 'desc';
  private limitValue?: number;
  private offsetValue: number = 0;

  where(column: string, operator: string, value: any): this {
    this.filters.push({ column, operator, value });
    return this;
  }

  orderBy(column: string, direction: 'asc' | 'desc' = 'desc'): this {
    this.sortBy = column;
    this.sortOrder = direction;
    return this;
  }

  limit(count: number): this {
    this.limitValue = count;
    return this;
  }

  offset(count: number): this {
    this.offsetValue = count;
    return this;
  }

  build() {
    return {
      filters: this.filters,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      limit: this.limitValue,
      offset: this.offsetValue
    };
  }
}

export { QueryBuilder as QB };

// 导出所有类型
export * from './types';
export { Database } from './database.types';