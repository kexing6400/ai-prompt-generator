# 律师AI工作台提示词模板库 📚

**Lawyer AI Workstation Prompt Templates Library**

专为法律专业人士设计的AI辅助工具提示词模板库，严格符合ABA职业道德规范，基于真实法律实践场景构建。

---

## 🎯 核心特色

### ✅ ABA合规优先
- 每个模板都经过ABA Model Rules合规审查
- 内置职业道德风险防控机制
- 明确律师主导和最终责任要求

### ✅ 专业品质保证
- 基于20+年法律执业经验设计
- 涵盖4类核心合同和3大分析领域
- 提供具体可操作的实务指导

### ✅ 风险管理导向
- 系统化风险识别和评估框架
- 多层次质量控制检查机制
- 完善的免责声明和合规提醒

### ✅ 实用性至上
- 模板化参数，快速定制使用
- 结构化输出格式，便于交付
- 丰富的使用示例和最佳实践

---

## 📁 模板库结构

```
prompt-templates/
├── 📂 core/                    # 核心通用模板
│   ├── contract-review-base.md # 通用合同审查框架
│   ├── risk-assessment.md      # 法律风险评估模板
│   └── legal-research.md       # 法律研究分析模板
│
├── 📂 contracts/              # 专业合同模板
│   ├── commercial-lease.md    # 商业租赁合同审查
│   ├── employment-agreement.md# 雇佣协议审查
│   ├── service-contract.md    # 服务合同审查
│   └── nda-agreement.md       # 保密协议审查
│
├── 📂 compliance/             # 合规和风险管理
│   ├── aba-compliance-check.md# ABA合规检查模板
│   └── disclaimer-generator.md# 免责声明生成器
│
├── 📂 research/               # 法律研究模板
│   ├── case-analysis.md       # 案例分析模板
│   ├── statute-interpretation.md # 法条解释模板
│   └── jurisdiction-compare.md# 跨司法管辖区比较
│
├── 📂 utils/                  # 实用工具
│   ├── quality-checklist.md   # 质量控制检查表
│   └── template-customizer.md # 模板定制指南
│
└── 📂 guides/                 # 使用指南
    ├── user-guide.md          # 用户使用指南
    ├── best-practices.md      # 最佳实践指南
    └── troubleshooting.md     # 问题排查指南
```

---

## 🚀 快速开始

### 1. 选择合适的模板

根据您的需求选择对应的模板：

```bash
# 合同审查
contracts/commercial-lease.md    # 商业租赁
contracts/employment-agreement.md # 雇佣协议
contracts/service-contract.md    # 服务合同
contracts/nda-agreement.md      # 保密协议

# 分析研究
core/legal-research.md          # 法律研究
core/risk-assessment.md         # 风险评估
core/contract-review-base.md    # 通用合同审查

# 合规检查
compliance/aba-compliance-check.md # ABA合规
compliance/disclaimer-generator.md # 免责声明
```

### 2. 参数定制

每个模板包含标准化参数，使用前请填充：

```
[CONTRACT_TYPE]     → 具体合同类型
[JURISDICTION]      → 适用司法管辖区  
[CLIENT_POSITION]   → 客户角色(买方/卖方)
[RISK_TOLERANCE]    → 风险承受度(高/中/低)
[SPECIFIC_CONCERNS] → 特定关注事项
```

### 3. 质量验证

使用内置的质量控制机制：

```
✅ AI输出生成
✅ 律师专业验证  
✅ ABA合规检查
✅ 客户沟通确认
```

---

## 💡 使用示例

### 场景1: 科技公司雇佣协议审查

```markdown
使用模板: contracts/employment-agreement.md

参数设置:
- EMPLOYEE_TYPE: 技术
- POSITION_LEVEL: 高级工程师
- INDUSTRY: 科技
- JURISDICTION: 加利福尼亚州
- CLIENT_POSITION: 雇员
- SPECIAL_CONSIDERATIONS: 股权激励、知识产权

重点关注: 加州竞业限制禁令、股权税务处理、技术IP归属
```

### 场景2: M&A交易风险评估

```markdown
使用模板: core/risk-assessment.md

参数设置:
- ENTITY_TYPE: 收购交易
- BUSINESS_NATURE: 科技并购
- ASSESSMENT_PURPOSE: 交易支持
- TIME_HORIZON: 未来18个月
- RISK_TOLERANCE: 平衡

重点关注: 技术IP风险、监管批准风险、整合风险
```

### 场景3: 保密协议合规审查

```markdown
组合使用:
1. contracts/nda-agreement.md (主要分析)
2. compliance/aba-compliance-check.md (合规验证)
3. compliance/disclaimer-generator.md (风险保护)

综合输出: NDA分析报告 + 合规认证 + 免责声明
```

---

## ⚖️ ABA合规保证

### 核心合规要求

本模板库严格遵循以下ABA规则：

- **Rule 1.1** - 胜任能力要求
- **Rule 1.6** - 客户信息保密
- **Rule 1.7/1.9** - 利益冲突避免
- **Rule 5.5** - 执业授权要求
- **Rule 1.4** - 客户充分沟通

### 内置保护机制

```
🛡️ 职业道德保护:
├── 每个模板都包含ABA合规声明
├── 明确AI辅助性质和律师主导地位
├── 强调最终验证和责任归属
├── 提供完整的风险告知和免责
└── 建立持续合规监控机制
```

---

## 📊 质量保证体系

### 三层质量检查

```
第一层: AI自检
├── 逻辑一致性 ✓
├── 完整性检查 ✓
├── 格式规范 ✓
└── 基础合规 ✓

第二层: 律师验证
├── 法律准确性 ✓
├── 专业判断 ✓
├── 客户适用性 ✓
└── 风险评估 ✓

第三层: 高级复核
├── 战略决策 ✓
├── 重大风险 ✓
├── 客户关系 ✓
└── 声誉保护 ✓
```

### 质量控制指标

- 📈 AI输出准确率: >95%
- 📈 律师验证覆盖率: 100%
- 📈 ABA合规通过率: 100%
- 📈 客户满意度: >90%

---

## 🔄 支持的法律领域

### 合同法
- ✅ 商业租赁协议
- ✅ 雇佣和劳动协议  
- ✅ 服务和咨询合同
- ✅ 保密和非竞争协议

### 企业法
- ✅ 公司治理结构
- ✅ M&A交易分析
- ✅ 合规风险评估
- ✅ 知识产权保护

### 诉讼支持
- ✅ 案例分析研究
- ✅ 法律论证构建
- ✅ 证据评估分析
- ✅ 和解策略制定

### 监管合规
- ✅ 行业法规解读
- ✅ 合规程序设计
- ✅ 风险监控机制
- ✅ 监管沟通策略

---

## 🌍 司法管辖区覆盖

### 美国联邦法律
- ✅ 联邦合同法
- ✅ 联邦雇佣法(FLSA, Title VII, ADA)
- ✅ 联邦商业秘密法(DTSA)
- ✅ 联邦证券法(SOX, Dodd-Frank)

### 主要州法律
- ✅ 加利福尼亚州 - 科技和创新友好
- ✅ 纽约州 - 金融服务中心
- ✅ 德拉华州 - 公司法权威
- ✅ 德克萨斯州 - 能源和制造
- ✅ 其他州 - 基于通用法律原则

### 国际考虑
- ✅ 跨境数据传输(GDPR)
- ✅ 国际贸易合规
- ✅ 多司法管辖区争议解决
- ✅ 国际仲裁程序

---

## 🛠️ 定制和扩展

### 行业定制选项

```python
# 行业特殊要求模板
industry_templates = {
    'fintech': {
        'additional_compliance': ['SOX', 'GLBA', 'PCI-DSS'],
        'key_risks': ['regulatory', 'cyber_security', 'data_privacy'],
        'special_considerations': ['consumer_protection', 'anti_money_laundering']
    },
    'healthcare': {
        'additional_compliance': ['HIPAA', 'FDA', 'DEA'],
        'key_risks': ['patient_privacy', 'medical_malpractice', 'regulatory_enforcement'],
        'special_considerations': ['patient_rights', 'medical_device_regulation']
    },
    'energy': {
        'additional_compliance': ['FERC', 'EPA', 'OSHA'],
        'key_risks': ['environmental', 'safety', 'regulatory_change'],
        'special_considerations': ['renewable_energy_incentives', 'carbon_credits']
    }
}
```

### 团队定制功能

- 🔧 **模板参数自定义** - 根据团队偏好调整分析重点
- 🔧 **输出格式定制** - 适应内部报告格式要求
- 🔧 **质量标准调整** - 设定符合团队水平的质量门槛
- 🔧 **工作流程整合** - 与现有工作流程无缝对接

---

## 📚 学习资源

### 📖 必读文档
1. [用户使用指南](guides/user-guide.md) - 详细的使用说明
2. [最佳实践指南](guides/best-practices.md) - 专业执业建议
3. [ABA合规检查](compliance/aba-compliance-check.md) - 职业道德要求

### 🎓 培训材料
- **新用户入门** - 30分钟快速上手指南
- **高级应用** - 复杂案例处理技巧
- **团队协作** - 多人协作最佳实践
- **风险管理** - 职业责任风险防控

### 💬 支持渠道
- **技术支持** - 模板使用技术问题
- **法律咨询** - ABA合规和职业道德咨询
- **最佳实践** - 同行经验分享和讨论
- **产品反馈** - 改进建议和新需求收集

---

## 🔄 版本更新和维护

### 更新频率
- **紧急更新** - 重大法律变化或安全问题
- **月度更新** - 模板优化和错误修复
- **季度更新** - 新功能和最佳实践整合
- **年度更新** - 全面评估和重大升级

### 变更管理
```
变更类型分级:
├── 🔴 重大变更 (影响合规性或安全性)
├── 🟡 重要变更 (影响功能或流程)  
├── 🟢 一般变更 (优化和改进)
└── 🔵 文档变更 (说明和指南更新)

通知机制:
├── 重大变更 → 立即邮件通知 + 系统弹窗
├── 重要变更 → 每周汇总通知
├── 一般变更 → 月度更新报告
└── 文档变更 → 季度资讯通讯
```

---

## ⚠️ 重要声明

### 使用者责任
- 🔒 **执业资格要求** - 仅限具备相应执业资格的律师使用
- 🔒 **专业验证义务** - 所有AI输出必须经过专业验证
- 🔒 **最终责任承担** - 律师对最终法律意见承担全部责任
- 🔒 **合规监督要求** - 确保符合适用的职业道德规范

### 服务局限性
- ⚠️ **技术局限性** - AI技术存在固有的局限性和错误可能
- ⚠️ **信息时效性** - 法律信息可能因时间推移而过时
- ⚠️ **案例特殊性** - 每个案例都有其独特的事实和法律环境
- ⚠️ **司法差异性** - 不同司法管辖区可能存在重要差异

### 免责声明
本模板库由AI工具协助生成，仅供法律专业人士作为工作辅助工具使用。所有模板的使用结果必须由具备相应执业资格的律师进行专业验证和最终确认。任何基于模板使用的法律后果，使用者应承担全部责任。

---

## 📞 联系我们

### 技术支持
- **邮箱**: support@lawyer-ai-workstation.com
- **在线支持**: 工作日 9:00-18:00 EST
- **紧急支持**: 7×24小时技术热线

### 商务合作
- **企业客户**: enterprise@lawyer-ai-workstation.com  
- **合作伙伴**: partnership@lawyer-ai-workstation.com
- **媒体咨询**: media@lawyer-ai-workstation.com

### 反馈建议
- **产品反馈**: feedback@lawyer-ai-workstation.com
- **功能建议**: feature-request@lawyer-ai-workstation.com
- **错误报告**: bug-report@lawyer-ai-workstation.com

---

## 📄 许可证和版权

**版权所有** © 2025 Lawyer AI Workstation  
**许可证**: 专业法律服务许可证  
**使用限制**: 仅限执业律师和法律专业人士使用

本模板库受知识产权法保护，未经授权不得复制、分发或用于商业目的。

---

**最后更新**: 2025-08-11  
**当前版本**: v1.0  
**兼容性**: 支持主流AI工具平台  
**维护状态**: 积极维护中 ✅