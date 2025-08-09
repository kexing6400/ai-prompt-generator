# 动态配置系统集成指南

## 📋 概述

本文档描述了AI提示词生成器的动态配置系统集成，实现了管理后台配置的实时生效功能。

## 🏗️ 架构概览

### 核心组件

1. **ConfigManager** - 基础配置管理器（已存在）
2. **DynamicConfigService** - 动态配置服务层（新增）
3. **ConfigChangeNotifier** - 配置变更通知器（新增）
4. **Enhanced API** - 升级的生成API（重构）

### 架构图

```
[管理后台] → [数据库配置表] → [ConfigChangeNotifier]
                                        ↓
[前端应用] → [生成API] → [DynamicConfigService] → [ConfigManager]
                                ↑
                        [三级缓存架构]
```

## 🔧 集成功能特性

### 1. 动态配置读取
- ✅ 从数据库动态读取API配置
- ✅ 支持多AI模型配置和切换
- ✅ 动态提示词模版管理
- ✅ 配置验证和错误处理

### 2. 缓存优化
- ✅ 三级缓存（内存 → ConfigManager → 数据库）
- ✅ 智能缓存失效机制
- ✅ 配置变更实时清除相关缓存

### 3. 热更新机制
- ✅ Supabase实时订阅配置变更
- ✅ 零停机时间配置更新
- ✅ 自动重连和错误恢复

### 4. 降级策略
- ✅ 配置服务不可用时自动降级到环境变量
- ✅ AI API调用失败时使用模版生成
- ✅ 模版不可用时使用内置降级提示词

### 5. 性能监控
- ✅ API调用统计和成功率监控
- ✅ 配置使用情况统计
- ✅ 响应时间和性能指标

## 🚀 部署步骤

### 前置条件

1. 确保数据库已创建相关表：
```sql
-- 检查表是否存在
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('admin_config', 'ai_models', 'prompt_templates');
```

2. 配置环境变量：
```bash
# Supabase配置（必需）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenRouter API配置（可选，也可在数据库配置）
OPENROUTER_API_KEY=sk-or-your-api-key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

### 部署流程

1. **安装依赖**（如有新增）：
```bash
npm install
```

2. **初始化配置数据**（如果数据库为空）：
```bash
# 运行初始化脚本插入默认配置
npm run db:seed
```

3. **构建和启动**：
```bash
npm run build
npm run start
```

### 验证部署

1. **健康检查**：
```bash
curl http://localhost:3000/api/generate-prompt
```
应返回系统状态信息。

2. **配置测试**：
```bash
node scripts/test-dynamic-config.js
```

3. **功能测试**：
```bash
curl -X POST http://localhost:3000/api/generate-prompt \
  -H "Content-Type: application/json" \
  -d '{
    "industry": "lawyer",
    "scenario": "合同审查", 
    "goal": "审查商务合同",
    "requirements": "重点关注风险条款"
  }'
```

## 🔍 测试验证

### 自动化测试

运行集成测试：
```bash
# 基础功能测试
npm run test:integration

# 完整集成测试（需要服务运行）
npm run test:config-integration

# 自定义测试脚本
node scripts/test-dynamic-config.js
```

### 手动测试场景

#### 1. 配置热更新测试
1. 在管理后台修改API配置（如温度参数）
2. 立即调用生成API，验证新配置是否生效
3. 检查日志确认配置变更通知

#### 2. 模型切换测试
1. 在管理后台添加/启用新的AI模型
2. 通过API指定新模型生成提示词
3. 验证模型统计信息更新

#### 3. 降级策略测试
1. 停止Supabase服务
2. 调用API确认降级到环境变量
3. 恢复服务验证重新连接

#### 4. 性能测试
```bash
# 并发测试
VERBOSE=true node scripts/test-dynamic-config.js

# 负载测试（如有工具）
ab -n 100 -c 10 -H "Content-Type: application/json" \
   -p test-payload.json \
   http://localhost:3000/api/generate-prompt
```

## 📊 监控指标

### 关键指标

1. **配置状态**：
   - 配置有效性：`configuration.valid`
   - 可用模型数：`configuration.availableModels`
   - 配置错误：`configuration.errors`

2. **性能指标**：
   - API成功率：`metrics.successRate`
   - 平均响应时间：`metrics.avgResponseTime`
   - 配置来源：`metrics.configSource`

3. **缓存效率**：
   - 缓存命中率：通过`fromCache`字段统计
   - 缓存大小：`cache.size`

### 日志监控

关注以下日志模式：
```
[DynamicConfigService] - 配置服务操作
[ConfigNotifier] - 配置变更通知
[API] - API调用和生成过程
```

## 🔧 故障排除

### 常见问题

#### 1. 配置无法读取
**症状**：API返回降级方案，日志显示配置读取失败
**排查**：
1. 检查Supabase连接配置
2. 验证数据库表结构
3. 确认服务角色密钥权限

**解决**：
```bash
# 检查数据库连接
npm run db:test-connection

# 重新初始化配置表
npm run db:reset-config
```

#### 2. 配置变更不生效
**症状**：修改配置后API仍使用旧值
**排查**：
1. 检查实时订阅状态
2. 验证缓存失效机制
3. 确认配置变更通知

**解决**：
```bash
# 手动清除缓存
curl -X DELETE http://localhost:3000/api/admin/config

# 重启配置监听
curl -X POST http://localhost:3000/api/admin/config/refresh
```

#### 3. AI模型调用失败
**症状**：API返回降级提示词
**排查**：
1. 检查OpenRouter API密钥配置
2. 验证模型ID和参数
3. 查看API调用错误日志

**解决**：
- 在管理后台更新API密钥
- 检查并更新模型配置
- 验证网络连接和防火墙

### 调试工具

#### 1. 配置诊断
```bash
# 获取系统状态
curl http://localhost:3000/api/generate-prompt | jq

# 检查特定配置
curl "http://localhost:3000/api/admin/config?key=openrouter_api_key"
```

#### 2. 性能诊断
```bash
# 缓存状态
curl http://localhost:3000/api/generate-prompt | jq '.cache'

# 性能指标
curl http://localhost:3000/api/generate-prompt | jq '.metrics'
```

## 📈 优化建议

### 性能优化

1. **缓存策略优化**：
   - 根据使用模式调整缓存TTL
   - 实现预热机制避免冷启动

2. **数据库优化**：
   - 为频繁查询的配置添加索引
   - 考虑读写分离

3. **网络优化**：
   - 启用HTTP/2
   - 实现CDN缓存

### 安全加固

1. **配置加密**：
   - 敏感配置必须加密存储
   - 定期轮换加密密钥

2. **访问控制**：
   - 实现细粒度的配置访问权限
   - 记录配置变更审计日志

3. **监控告警**：
   - 配置异常变更告警
   - API调用失败率告警

## 📚 API文档

### 升级的API接口

#### POST /api/generate-prompt

**新增请求参数**：
```json
{
  "industry": "lawyer",
  "scenario": "合同审查",
  "goal": "审查目标",
  "requirements": "具体要求",
  "preferredModel": "anthropic/claude-3.5-sonnet" // 新增
}
```

**增强响应格式**：
```json
{
  "success": true,
  "prompt": "生成的提示词",
  "source": "ai|template|fallback",
  "modelUsed": "anthropic/claude-3.5-sonnet", // 新增
  "responseTime": "150ms",
  "fromCache": false, // 新增
  "notice": "可选通知信息"
}
```

#### GET /api/generate-prompt

**增强状态信息**：
```json
{
  "status": "healthy",
  "configuration": {
    "valid": true,
    "errors": [],
    "availableModels": 4,
    "models": [...]
  },
  "metrics": {
    "totalCalls": 1234,
    "successRate": "98.5%",
    "avgResponseTime": 156.7,
    "modelUsageStats": {...}
  },
  "cache": {
    "size": 45,
    "configServiceStats": {...}
  }
}
```

## 🔄 版本信息

**当前版本**：2.0 - 动态配置集成版本
**更新日期**：2025-08-09
**兼容性**：完全向后兼容 v1.0 API

### 变更记录

- ✅ 集成动态配置系统
- ✅ 添加多模型支持
- ✅ 实现配置热更新
- ✅ 增强错误处理和监控
- ✅ 保持向后兼容性

---

## 📞 技术支持

如遇到问题，请按以下步骤：

1. 查看日志文件确认错误信息
2. 运行测试脚本诊断问题
3. 检查配置和环境变量
4. 参考本文档的故障排除章节

**日志位置**：`/var/log/ai-prompt-generator/` 或控制台输出
**测试工具**：`scripts/test-dynamic-config.js`
**健康检查**：`GET /api/generate-prompt`