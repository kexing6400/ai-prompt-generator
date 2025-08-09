/**
 * 🔐 企业级密码安全服务
 * 使用bcrypt算法进行密码哈希和验证
 * 符合OWASP密码存储指南
 */

import bcrypt from 'bcryptjs'

// 🔐 哈希轮数（12轮符合企业级安全要求）
const SALT_ROUNDS = 12

// 🔐 密码复杂度要求
const PASSWORD_MIN_LENGTH = 12
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/

/**
 * 验证密码强度
 * @param password 待验证的密码
 * @returns 验证结果
 */
export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
}

export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = []
  
  // 检查长度
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`密码长度至少需要 ${PASSWORD_MIN_LENGTH} 个字符`)
  }
  
  // 检查复杂度
  if (!PASSWORD_REGEX.test(password)) {
    if (!/[a-z]/.test(password)) {
      errors.push('密码必须包含至少一个小写字母')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('密码必须包含至少一个大写字母')
    }
    if (!/\d/.test(password)) {
      errors.push('密码必须包含至少一个数字')
    }
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('密码必须包含至少一个特殊字符 (@$!%*?&)')
    }
  }
  
  // 检查常见弱密码
  const commonPasswords = [
    'password', '123456', 'admin', 'administrator', 
    '12345678', 'qwerty', 'letmein', 'welcome'
  ]
  
  if (commonPasswords.some(weak => password.toLowerCase().includes(weak))) {
    errors.push('密码不能包含常见的弱密码模式')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 安全地哈希密码
 * @param password 原始密码
 * @returns 哈希后的密码
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    // 首先验证密码强度
    const validation = validatePasswordStrength(password)
    if (!validation.isValid) {
      throw new Error(`密码不符合安全要求: ${validation.errors.join(', ')}`)
    }
    
    // 生成盐并哈希
    const salt = await bcrypt.genSalt(SALT_ROUNDS)
    const hashedPassword = await bcrypt.hash(password, salt)
    
    return hashedPassword
  } catch (error) {
    console.error('🚨 密码哈希失败:', error)
    throw error
  }
}

/**
 * 验证密码
 * @param password 原始密码
 * @param hashedPassword 哈希后的密码
 * @returns 是否验证通过
 */
export async function verifyPassword(
  password: string, 
  hashedPassword: string
): Promise<boolean> {
  try {
    // 直接使用bcrypt验证，不检查密码强度
    // 因为这是用于验证已有密码，而非创建新密码
    return await bcrypt.compare(password, hashedPassword)
  } catch (error) {
    console.error('🚨 密码验证失败:', error)
    return false
  }
}

/**
 * 生成临时密码（用于密码重置）
 * @param length 密码长度
 * @returns 临时密码
 */
export function generateTemporaryPassword(length: number = 16): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '@$!%*?&'
  const allChars = lowercase + uppercase + numbers + symbols
  
  let password = ''
  
  // 确保至少包含每种类型的字符
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // 填充剩余长度
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // 打乱字符顺序
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

/**
 * 检查密码是否已过期
 * @param lastPasswordChange 上次密码更改时间
 * @param maxAgeInDays 最大有效期（天）
 * @returns 是否过期
 */
export function isPasswordExpired(
  lastPasswordChange: Date, 
  maxAgeInDays: number = 90
): boolean {
  const now = new Date()
  const expirationDate = new Date(lastPasswordChange)
  expirationDate.setDate(expirationDate.getDate() + maxAgeInDays)
  
  return now > expirationDate
}

/**
 * 计算密码安全分数
 * @param password 待评估的密码
 * @returns 安全分数（0-100）
 */
export function calculatePasswordScore(password: string): number {
  let score = 0
  
  // 长度评分
  if (password.length >= 12) score += 25
  else if (password.length >= 8) score += 10
  
  // 复杂度评分
  if (/[a-z]/.test(password)) score += 15
  if (/[A-Z]/.test(password)) score += 15
  if (/\d/.test(password)) score += 15
  if (/[@$!%*?&]/.test(password)) score += 15
  
  // 多样性评分
  const uniqueChars = new Set(password).size
  score += Math.min(15, uniqueChars)
  
  return Math.min(100, score)
}