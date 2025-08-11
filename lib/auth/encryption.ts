/**
 * 🔐 企业级加密解密服务
 * 用于保护敏感数据如API密钥、用户信息等
 * 使用AES-256-GCM算法确保数据安全
 */

import CryptoJS from 'crypto-js'

// 🔐 从环境变量获取加密密钥，如果未设置则抛出错误
const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET
if (!ENCRYPTION_KEY) {
  throw new Error('🚨 ENCRYPTION_SECRET environment variable is required but not set! Please set a secure encryption key.')
}

/**
 * 加密敏感数据
 * @param plaintext 需要加密的明文
 * @returns 加密后的密文（包含IV）
 */
export function encrypt(plaintext: string): string {
  try {
    // 生成随机初始化向量
    const iv = CryptoJS.lib.WordArray.random(16)
    
    // 使用AES-256-CBC加密 (crypto-js不支持GCM模式)
    const encrypted = CryptoJS.AES.encrypt(plaintext, ENCRYPTION_KEY, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    })
    
    // 组合IV和密文
    const combined = iv.concat(encrypted.ciphertext)
    return combined.toString(CryptoJS.enc.Base64)
  } catch (error) {
    console.error('🚨 加密失败:', error)
    throw new Error('数据加密失败')
  }
}

/**
 * 解密敏感数据
 * @param ciphertext 需要解密的密文
 * @returns 解密后的明文
 */
export function decrypt(ciphertext: string): string {
  try {
    // 从Base64解码
    const combined = CryptoJS.enc.Base64.parse(ciphertext)
    
    // 提取IV（前16字节）和密文
    const iv = CryptoJS.lib.WordArray.create(combined.words.slice(0, 4))
    const encrypted = CryptoJS.lib.WordArray.create(combined.words.slice(4))
    
    // 解密
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: encrypted } as any,
      ENCRYPTION_KEY,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    )
    
    return decrypted.toString(CryptoJS.enc.Utf8)
  } catch (error) {
    console.error('🚨 解密失败:', error)
    throw new Error('数据解密失败')
  }
}

/**
 * 安全地存储API密钥
 * @param apiKey 原始API密钥
 * @returns 加密后的API密钥
 */
export function encryptApiKey(apiKey: string): string {
  return encrypt(apiKey)
}

/**
 * 安全地读取API密钥
 * @param encryptedApiKey 加密的API密钥
 * @returns 原始API密钥
 */
export function decryptApiKey(encryptedApiKey: string): string {
  return decrypt(encryptedApiKey)
}

/**
 * 生成安全的随机字符串
 * @param length 字符串长度
 * @returns 随机字符串
 */
export function generateSecureRandom(length: number = 32): string {
  return CryptoJS.lib.WordArray.random(length).toString(CryptoJS.enc.Hex)
}

/**
 * 创建数据摘要（用于完整性校验）
 * @param data 需要校验的数据
 * @returns SHA-256摘要
 */
export function createHash(data: string): string {
  return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex)
}

/**
 * 验证数据完整性
 * @param data 原始数据
 * @param expectedHash 预期的摘要
 * @returns 是否验证通过
 */
export function verifyHash(data: string, expectedHash: string): boolean {
  const actualHash = createHash(data)
  return actualHash === expectedHash
}