import { 
  DocumentTemplate, 
  DocumentTemplateType, 
  DocumentData, 
  DocumentStyle 
} from '@/types/document';

/**
 * 法律合同模板
 * Legal Contract Template
 */
export const legalContractTemplate: DocumentTemplate = {
  id: 'legal-contract',
  name: '法律合同',
  type: DocumentTemplateType.LEGAL_CONTRACT,
  description: '标准法律合同模板，包含完整的条款和条件，适用于各种商业合作协议',
  category: '法律文件',
  thumbnail: '/templates/legal-contract-thumb.png',
  
  defaultStyle: {
    fontSize: 11,
    lineHeight: 1.8,
    fontFamily: 'SimSun',
    primaryColor: '#000000',
    secondaryColor: '#4a5568',
    textColor: '#1a202c',
    backgroundColor: '#ffffff',
    pageSize: 'A4',
    orientation: 'portrait',
    marginTop: 50,
    marginRight: 45,
    marginBottom: 50,
    marginLeft: 45,
    showHeader: true,
    showFooter: true,
    showPageNumbers: true,
    companyName: '法律事务所',
  },
  
  requiredFields: [
    'title',
    'contractPartyA',
    'contractPartyB',
    'contractDate',
    'contractType',
    'contractSubject',
    'contractTerms',
    'paymentTerms',
    'liabilityTerms',
    'disputeResolution'
  ],
  
  optionalFields: [
    'subtitle',
    'witnessInfo',
    'attachments',
    'specialTerms',
    'effectiveDate',
    'expirationDate'
  ],
  
  structure: {
    sections: [
      {
        id: 'contract-header',
        title: '合同标题',
        required: true,
        type: 'text',
        placeholder: '请输入合同标题，如"软件开发服务合同"',
        validation: {
          minLength: 5,
          maxLength: 100
        }
      },
      {
        id: 'parties-info',
        title: '合同双方信息',
        required: true,
        type: 'text',
        placeholder: '甲方：[公司名称、地址、法定代表人等]\n乙方：[公司名称、地址、法定代表人等]',
        validation: {
          minLength: 50
        }
      },
      {
        id: 'contract-background',
        title: '合同背景与目的',
        required: true,
        type: 'text',
        placeholder: '说明签订本合同的背景、目的和依据...'
      },
      {
        id: 'contract-subject',
        title: '合同标的',
        required: true,
        type: 'text',
        placeholder: '详细描述合同的服务内容、产品规格、质量标准等...'
      },
      {
        id: 'contract-terms',
        title: '合同条款',
        required: true,
        type: 'text',
        placeholder: '第一条：...\n第二条：...\n（详细列出所有合同条款）'
      },
      {
        id: 'payment-terms',
        title: '付款条款',
        required: true,
        type: 'text',
        placeholder: '付款方式、付款时间、付款比例等详细规定...'
      },
      {
        id: 'liability-terms',
        title: '违约责任',
        required: true,
        type: 'text',
        placeholder: '明确双方违约责任、赔偿标准、免责条款等...'
      },
      {
        id: 'dispute-resolution',
        title: '争议解决',
        required: true,
        type: 'text',
        placeholder: '协商、调解、仲裁或诉讼等争议解决方式...'
      },
      {
        id: 'contract-validity',
        title: '合同生效与终止',
        required: false,
        type: 'text',
        placeholder: '合同生效条件、有效期、终止条件等...'
      },
      {
        id: 'other-terms',
        title: '其他条款',
        required: false,
        type: 'text',
        placeholder: '保密条款、知识产权、不可抗力等其他重要条款...'
      }
    ],
    allowCustomSections: true
  },
  
  sampleData: {
    title: '软件开发服务合同',
    subtitle: 'Software Development Service Agreement',
    author: '法律顾问',
    date: '2024年1月15日',
    version: 'V1.0',
    sections: [
      {
        id: 'contract-header',
        title: '合同标题',
        content: '软件开发服务合同\nSoftware Development Service Agreement',
        type: 'text'
      },
      {
        id: 'parties-info',
        title: '合同双方',
        content: `甲方（委托方）：
公司名称：北京科技创新有限公司
注册地址：北京市朝阳区创新大街123号
法定代表人：张三
联系电话：010-12345678
统一社会信用代码：91110000000000000X

乙方（承接方）：
公司名称：上海软件开发有限公司
注册地址：上海市浦东新区软件园456号
法定代表人：李四
联系电话：021-87654321
统一社会信用代码：91310000000000000Y`,
        type: 'text'
      },
      {
        id: 'contract-background',
        title: '合同背景与目的',
        content: `鉴于：
1. 甲方需要开发一套企业管理系统软件，以提升公司运营效率；
2. 乙方具备相应的技术实力和开发经验，能够满足甲方的开发需求；
3. 双方本着平等自愿、互利共赢的原则，经友好协商，就软件开发服务事宜达成如下协议。`,
        type: 'text'
      },
      {
        id: 'contract-subject',
        title: '合同标的',
        content: `1. 项目名称：企业管理系统
2. 项目内容：
   - 用户管理模块
   - 财务管理模块  
   - 库存管理模块
   - 报表分析模块
   - 系统管理模块
3. 技术要求：
   - 开发语言：Java + Spring Boot
   - 数据库：MySQL
   - 前端框架：Vue.js
   - 部署方式：云服务器部署
4. 交付标准：
   - 系统功能完整，符合需求规格书要求
   - 通过甲方验收测试
   - 提供完整的技术文档和用户手册`,
        type: 'text'
      },
      {
        id: 'contract-terms',
        title: '合同条款',
        content: `第一条 项目周期
项目开发周期为6个月，自合同签订之日起计算。

第二条 工作方式
1. 乙方派遣专业技术团队到甲方现场进行开发；
2. 甲方提供必要的工作环境和配合支持；
3. 双方建立项目沟通机制，定期汇报项目进展。

第三条 知识产权
1. 本项目开发的所有软件著作权归甲方所有；
2. 乙方保证不侵犯任何第三方知识产权；
3. 甲方有权对软件进行修改、升级和二次开发。

第四条 保密义务
1. 双方对在合同履行过程中获知的对方商业秘密负有保密义务；
2. 保密期限为合同终止后3年；
3. 违反保密义务的一方应承担相应法律责任。`,
        type: 'text'
      },
      {
        id: 'payment-terms',
        title: '付款条款',
        content: `1. 合同总价：人民币50万元整（￥500,000.00）
2. 付款方式：
   - 合同签订后7日内，甲方支付30%预付款（15万元）
   - 项目完成50%时，甲方支付40%进度款（20万元）
   - 项目验收通过后，甲方支付剩余30%款项（15万元）
3. 付款方式：银行转账
4. 发票：乙方应及时向甲方开具相应金额的增值税专用发票`,
        type: 'text'
      },
      {
        id: 'liability-terms',
        title: '违约责任',
        content: `1. 甲方违约责任：
   - 未按约定时间付款的，每逾期一日按欠款金额的0.5‰向乙方支付违约金
   - 无正当理由终止合同的，应向乙方支付合同总价20%的违约金

2. 乙方违约责任：
   - 未按约定时间交付的，每逾期一日按合同总价的0.5‰向甲方支付违约金
   - 交付的软件不符合约定标准的，应无偿修改直至符合要求
   - 严重违约导致合同无法继续履行的，应向甲方退还已收款项并支付合同总价20%的违约金`,
        type: 'text'
      },
      {
        id: 'dispute-resolution',
        title: '争议解决',
        content: `1. 双方因履行本合同发生争议，应首先通过友好协商解决；
2. 协商不成的，可向项目所在地人民调解委员会申请调解；
3. 调解不成的，提交北京仲裁委员会按照其仲裁规则进行仲裁；
4. 仲裁裁决为终局裁决，对双方均有约束力。`,
        type: 'text'
      },
      {
        id: 'contract-validity',
        title: '合同生效与终止',
        content: `1. 本合同自双方签字盖章之日起生效；
2. 本合同有效期至项目验收通过并完成最终付款后终止；
3. 合同履行期间，任何一方不得随意解除合同；
4. 因不可抗力因素导致合同无法履行的，双方可协商解除合同。`,
        type: 'text'
      },
      {
        id: 'other-terms',
        title: '其他条款',
        content: `1. 本合同未尽事宜，双方可签署补充协议，补充协议与本合同具有同等法律效力；
2. 本合同一式两份，甲乙双方各执一份，具有同等法律效力；
3. 合同的修改或补充须经双方书面同意；
4. 本合同适用中华人民共和国法律。

甲方（盖章）：                    乙方（盖章）：
法定代表人：                      法定代表人：
签订日期：                        签订日期：`,
        type: 'text'
      }
    ],
    metadata: {
      contractType: '服务合同',
      jurisdiction: '北京市',
      governing_law: '中华人民共和国法律'
    }
  }
};

/**
 * 法律合同字段验证规则
 */
export const legalContractValidationRules = {
  contractPartyA: {
    required: true,
    minLength: 10,
    pattern: /.*公司名称.*法定代表人.*/,
    message: '甲方信息必须包含公司名称和法定代表人'
  },
  contractPartyB: {
    required: true,
    minLength: 10,
    pattern: /.*公司名称.*法定代表人.*/,
    message: '乙方信息必须包含公司名称和法定代表人'
  },
  contractSubject: {
    required: true,
    minLength: 100,
    message: '合同标的描述不得少于100字符'
  },
  paymentTerms: {
    required: true,
    minLength: 50,
    pattern: /.*金额.*付款方式.*/,
    message: '付款条款必须包含具体金额和付款方式'
  }
};

/**
 * 生成法律合同专用样式
 */
export const legalContractStyles: DocumentStyle = {
  fontSize: 11,
  lineHeight: 1.8,
  fontFamily: 'SimSun',
  primaryColor: '#000000',
  secondaryColor: '#4a5568',
  textColor: '#1a202c',
  backgroundColor: '#ffffff',
  pageSize: 'A4',
  orientation: 'portrait',
  marginTop: 50,
  marginRight: 45,
  marginBottom: 50,
  marginLeft: 45,
  showHeader: true,
  showFooter: true,
  showPageNumbers: true,
  companyName: '法律事务所',
  watermark: '合同草案'
};

/**
 * 法律合同条款检查工具
 */
export class LegalContractValidator {
  /**
   * 检查合同必备条款
   */
  static validateEssentialClauses(data: DocumentData): { isValid: boolean; missing: string[] } {
    const requiredClauses = [
      '合同双方',
      '合同标的', 
      '付款条款',
      '违约责任',
      '争议解决'
    ];
    
    const missing: string[] = [];
    const sectionTitles = data.sections.map(s => s.title);
    
    requiredClauses.forEach(clause => {
      if (!sectionTitles.some(title => title.includes(clause))) {
        missing.push(clause);
      }
    });
    
    return {
      isValid: missing.length === 0,
      missing
    };
  }
  
  /**
   * 检查金额条款的完整性
   */
  static validatePaymentClauses(content: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!content.includes('人民币') && !content.includes('￥')) {
      issues.push('缺少明确的货币单位');
    }
    
    if (!/\d+/.test(content)) {
      issues.push('缺少具体金额数字');
    }
    
    if (!content.includes('付款方式')) {
      issues.push('缺少付款方式说明');
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

/**
 * 法律合同模板工厂
 */
export class LegalContractTemplateFactory {
  /**
   * 创建服务合同模板
   */
  static createServiceContract(): DocumentTemplate {
    return {
      ...legalContractTemplate,
      id: 'service-contract',
      name: '服务合同',
      description: '通用服务合同模板，适用于各类服务外包项目'
    };
  }
  
  /**
   * 创建销售合同模板
   */
  static createSalesContract(): DocumentTemplate {
    return {
      ...legalContractTemplate,
      id: 'sales-contract',
      name: '销售合同',
      description: '商品销售合同模板，适用于产品买卖交易'
    };
  }
  
  /**
   * 创建租赁合同模板
   */
  static createLeaseContract(): DocumentTemplate {
    return {
      ...legalContractTemplate,
      id: 'lease-contract', 
      name: '租赁合同',
      description: '房屋租赁合同模板，适用于房产租赁业务'
    };
  }
}