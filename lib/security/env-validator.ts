/**
 * 🔐 环境变量验证器
 * 用于确保所有必需的环境变量都已正确配置
 * 防止应用在关键环境变量缺失时启动
 */

interface EnvValidationResult {
  isValid: boolean;
  missingVars: string[];
  errors: string[];
  warnings: string[];
}

interface EnvironmentConfig {
  /** 必需的环境变量列表 */
  required: string[];
  /** 可选的环境变量列表 */
  optional?: string[];
  /** 验证规则 */
  validators?: Record<string, (value: string) => boolean>;
}

/**
 * 验证环境变量配置
 */
export function validateEnvironment(config: EnvironmentConfig): EnvValidationResult {
  const result: EnvValidationResult = {
    isValid: true,
    missingVars: [],
    errors: [],
    warnings: []
  };

  // 检查必需的环境变量
  for (const varName of config.required) {
    const value = process.env[varName];
    
    if (!value || value.trim() === '') {
      result.isValid = false;
      result.missingVars.push(varName);
      result.errors.push(`🚨 必需的环境变量 ${varName} 未设置或为空`);
    } else if (config.validators?.[varName]) {
      // 运行自定义验证器
      if (!config.validators[varName](value)) {
        result.isValid = false;
        result.errors.push(`🚨 环境变量 ${varName} 的值不符合要求`);
      }
    }
  }

  // 检查可选的环境变量
  if (config.optional) {
    for (const varName of config.optional) {
      const value = process.env[varName];
      
      if (!value || value.trim() === '') {
        result.warnings.push(`⚠️  推荐设置环境变量 ${varName}`);
      }
    }
  }

  return result;
}

/**
 * API密钥验证器
 */
export function validateApiKey(apiKey: string): boolean {
  if (!apiKey || apiKey.trim() === '') {
    return false;
  }
  
  // Anthropic API密钥应以sk-ant开头
  if (apiKey.startsWith('sk-ant-')) {
    return apiKey.length >= 50; // 基本长度检查
  }
  
  // OpenRouter API密钥应以sk-or开头
  if (apiKey.startsWith('sk-or-')) {
    return apiKey.length >= 50;
  }
  
  // 其他格式的API密钥基本长度检查
  return apiKey.length >= 20;
}

/**
 * 加密密钥验证器
 */
export function validateEncryptionKey(key: string): boolean {
  if (!key || key.trim() === '') {
    return false;
  }
  
  // 加密密钥应至少32字符长
  if (key.length < 32) {
    return false;
  }
  
  // 不能是常见的默认值
  const forbiddenDefaults = [
    'default-key-change-in-production',
    'your-encryption-key-here',
    'change-me-in-production',
    'development-only-key'
  ];
  
  return !forbiddenDefaults.includes(key);
}

/**
 * URL验证器
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 预定义的生产环境配置
 */
export const PRODUCTION_ENV_CONFIG: EnvironmentConfig = {
  required: [
    'NODE_ENV',
    'ENCRYPTION_SECRET',
  ],
  optional: [
    'ANTHROPIC_API_KEY',
    'OPENROUTER_API_KEY',
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ],
  validators: {
    ENCRYPTION_SECRET: validateEncryptionKey,
    ANTHROPIC_API_KEY: (key) => !key || validateApiKey(key),
    OPENROUTER_API_KEY: (key) => !key || validateApiKey(key),
    NEXTAUTH_URL: (url) => !url || validateUrl(url),
  }
};

/**
 * 预定义的开发环境配置
 */
export const DEVELOPMENT_ENV_CONFIG: EnvironmentConfig = {
  required: [
    'NODE_ENV',
    'ENCRYPTION_SECRET',
  ],
  optional: [
    'ANTHROPIC_API_KEY',
    'OPENROUTER_API_KEY',
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ],
  validators: {
    ENCRYPTION_SECRET: validateEncryptionKey,
    ANTHROPIC_API_KEY: (key) => !key || validateApiKey(key),
    OPENROUTER_API_KEY: (key) => !key || validateApiKey(key),
  }
};

/**
 * 检查当前环境并运行相应的验证
 */
export function validateCurrentEnvironment(): EnvValidationResult {
  const isProduction = process.env.NODE_ENV === 'production';
  const config = isProduction ? PRODUCTION_ENV_CONFIG : DEVELOPMENT_ENV_CONFIG;
  
  return validateEnvironment(config);
}

/**
 * 环境变量验证中间件
 * 在应用启动时运行，如果验证失败则终止应用
 */
export function enforceEnvironmentSecurity(exitOnFailure: boolean = true): void {
  console.log('🔐 正在验证环境变量安全配置...');
  
  const validation = validateCurrentEnvironment();
  
  if (validation.warnings.length > 0) {
    console.warn('\n⚠️  环境变量警告:');
    validation.warnings.forEach(warning => console.warn(`   ${warning}`));
  }
  
  if (!validation.isValid) {
    console.error('\n🚨 环境变量验证失败！');
    console.error('   缺失的必需环境变量:');
    validation.missingVars.forEach(varName => 
      console.error(`   - ${varName}`)
    );
    
    console.error('\n   错误详情:');
    validation.errors.forEach(error => 
      console.error(`   ${error}`)
    );
    
    console.error('\n💡 请查看 .env.example 文件了解如何配置环境变量');
    
    if (exitOnFailure) {
      console.error('\n🛑 应用启动终止，请修复环境变量配置后重试');
      process.exit(1);
    }
    
    return;
  }
  
  console.log('✅ 环境变量安全验证通过');
}

/**
 * 获取安全的API密钥
 * 自动从环境变量中选择可用的API密钥
 */
export function getSecureApiKey(): string {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  
  if (anthropicKey && validateApiKey(anthropicKey)) {
    return anthropicKey;
  }
  
  if (openrouterKey && validateApiKey(openrouterKey)) {
    return openrouterKey;
  }
  
  throw new Error(
    '🚨 未找到有效的API密钥！请设置 ANTHROPIC_API_KEY 或 OPENROUTER_API_KEY 环境变量'
  );
}