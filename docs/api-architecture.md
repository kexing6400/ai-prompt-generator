# 🚀 API架构设计文档

## 📋 目录
- [1. API设计原则](#1-api设计原则)
- [2. 认证与授权](#2-认证与授权)  
- [3. 核心API端点](#3-核心api端点)
- [4. 响应格式标准](#4-响应格式标准)
- [5. 错误处理](#5-错误处理)
- [6. 限流与缓存](#6-限流与缓存)
- [7. API版本控制](#7-api版本控制)

## 1. API设计原则

### 🎯 核心原则
- **RESTful设计**：资源导向，动词使用HTTP方法
- **一致性**：统一的命名规范和响应格式
- **性能优先**：所有API响应时间 < 500ms
- **安全第一**：完整的认证、授权和数据验证
- **可扩展性**：支持API版本控制和向后兼容

### 📏 设计标准
```typescript
// 统一的API响应接口
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    timestamp: string
    requestId: string
    pagination?: PaginationMeta
  }
}

// 分页元数据
interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}
```

## 2. 认证与授权

### 🔐 认证机制
- **JWT Token**：基于JSON Web Token的无状态认证
- **API Key**：企业级用户的API密钥认证
- **Session**：管理后台的会话认证

```typescript
// 认证头部格式
Authorization: Bearer <jwt_token>
X-API-Key: <api_key>
```

### 🛡️ 权限级别
```typescript
enum AccessLevel {
  FREE = 'free',        // 免费用户
  PRO = 'pro',          // 付费用户  
  ENTERPRISE = 'enterprise', // 企业用户
  ADMIN = 'admin'       // 管理员
}

// 权限检查中间件
interface UserPermissions {
  canAccessTemplate: (templateId: string) => boolean
  canGeneratePrompts: () => boolean
  canDownloadFiles: () => boolean
  canUseAIDirect: () => boolean
  monthlyLimit: number
  dailyLimit: number
}
```

## 3. 核心API端点

### 👤 用户认证 `/api/v1/auth`

#### POST `/api/v1/auth/register`
用户注册
```json
// Request
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "company": "Law Firm LLC"
}

// Response
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "subscriptionStatus": "free"
    },
    "token": "jwt_token",
    "expiresIn": 86400
  }
}
```

#### POST `/api/v1/auth/login`
用户登录
```json
// Request
{
  "email": "user@example.com", 
  "password": "securePassword123"
}

// Response  
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "subscriptionStatus": "pro",
      "permissions": {
        "monthlyLimit": 100,
        "dailyLimit": 20,
        "canDownload": true,
        "canUseAIDirect": true
      }
    },
    "token": "jwt_token",
    "expiresIn": 86400
  }
}
```

### 📚 模板管理 `/api/v1/templates`

#### GET `/api/v1/templates`
获取模板列表（支持过滤和分页）
```json
// Query Parameters
?industry=lawyer&scenario=contract-review&page=1&limit=20&accessLevel=free

// Response
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "合同审查专家",
      "industry": {
        "id": "uuid", 
        "code": "lawyer",
        "name": "法律服务"
      },
      "scenario": {
        "id": "uuid",
        "code": "contract-review", 
        "name": "合同审查"
      },
      "description": "专业的合同条款分析...",
      "difficulty": 3,
      "estimatedTime": 10,
      "usageCount": 1250,
      "rating": 4.8,
      "accessLevel": "free",
      "parametersSchema": {
        "type": "object",
        "properties": {
          "contractType": {
            "type": "string",
            "title": "合同类型",
            "enum": ["劳动合同", "服务合同", "买卖合同"]
          }
        }
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### ⚡ 提示词生成 `/api/v1/generate`

#### POST `/api/v1/generate/prompt`
生成提示词（核心API）
```json
// Request
{
  "templateId": "uuid",
  "parameters": {
    "contractType": "服务合同",
    "focusArea": "违约条款",
    "clientName": "ABC公司"
  },
  "options": {
    "model": "claude-3-5-sonnet",
    "temperature": 0.7,
    "maxTokens": 2000,
    "includeExamples": true
  }
}

// Response
{
  "success": true,
  "data": {
    "id": "generation_uuid",
    "prompt": "作为一名资深合同律师，我将为ABC公司的服务合同进行专业审查...",
    "metadata": {
      "templateUsed": "合同审查专家",
      "parametersApplied": {...},
      "generationTime": 450,
      "tokenCount": 1850,
      "model": "claude-3-5-sonnet"
    },
    "suggestions": {
      "improvements": ["建议增加终止条款的描述"],
      "relatedTemplates": ["合同起草专家", "合同谈判顾问"]
    }
  }
}
```

---
**文档维护**：此文档随API更新持续维护
**最后更新**：2025-01-10
**负责人**：Claude Code (后端架构师)