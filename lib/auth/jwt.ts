/**
 * 🔐 企业级JWT认证服务
 * 提供安全的Token生成、验证和管理功能
 * 支持访问Token和刷新Token机制
 */

import jwt from 'jsonwebtoken'
import { generateSecureRandom } from './encryption'

// 🔐 JWT配置
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'change-this-secret-key'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'change-this-refresh-secret-key'
const JWT_ACCESS_EXPIRES_IN = '24h'  // 访问Token有效期24小时
const JWT_REFRESH_EXPIRES_IN = '30d' // 刷新Token有效期30天

// 🔐 用户信息接口
export interface UserPayload {
  userId: string
  username: string
  role: 'admin' | 'user'
  permissions: string[]
  lastLogin?: Date
}

// 🔐 Token对象接口
export interface TokenPair {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: Date
  refreshTokenExpiresAt: Date
}

// 🔐 JWT载荷接口
export interface JWTPayload extends UserPayload {
  iat: number
  exp: number
  jti: string  // JWT ID
  type: 'access' | 'refresh'
}

/**
 * 生成访问Token
 * @param user 用户信息
 * @returns 访问Token
 */
export function generateAccessToken(user: UserPayload): string {
  const payload: Partial<JWTPayload> = {
    ...user,
    type: 'access',
    jti: generateSecureRandom(16)
  }
  
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN,
    issuer: 'ai-prompt-generator',
    audience: 'admin-panel'
  })
}

/**
 * 生成刷新Token
 * @param user 用户信息
 * @returns 刷新Token
 */
export function generateRefreshToken(user: UserPayload): string {
  const payload: Partial<JWTPayload> = {
    userId: user.userId,
    username: user.username,
    role: user.role,
    type: 'refresh',
    jti: generateSecureRandom(16)
  }
  
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'ai-prompt-generator',
    audience: 'admin-panel'
  })
}

/**
 * 生成Token对
 * @param user 用户信息
 * @returns Token对和过期时间
 */
export function generateTokenPair(user: UserPayload): TokenPair {
  const accessToken = generateAccessToken(user)
  const refreshToken = generateRefreshToken(user)
  
  const now = new Date()
  const accessTokenExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24小时
  const refreshTokenExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30天
  
  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt
  }
}

/**
 * 验证访问Token
 * @param token 访问Token
 * @returns 解码的用户信息
 */
export function verifyAccessToken(token: string): UserPayload {
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET, {
      issuer: 'ai-prompt-generator',
      audience: 'admin-panel'
    }) as JWTPayload
    
    // 验证Token类型
    if (decoded.type !== 'access') {
      throw new Error('无效的Token类型')
    }
    
    return {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      permissions: decoded.permissions,
      lastLogin: decoded.lastLogin
    }
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('无效的访问Token')
    } else if (error instanceof jwt.TokenExpiredError) {
      throw new Error('访问Token已过期')
    } else {
      throw new Error('Token验证失败')
    }
  }
}

/**
 * 验证刷新Token
 * @param token 刷新Token
 * @returns 解码的用户信息
 */
export function verifyRefreshToken(token: string): Partial<UserPayload> {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'ai-prompt-generator',
      audience: 'admin-panel'
    }) as JWTPayload
    
    // 验证Token类型
    if (decoded.type !== 'refresh') {
      throw new Error('无效的Token类型')
    }
    
    return {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role
    }
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('无效的刷新Token')
    } else if (error instanceof jwt.TokenExpiredError) {
      throw new Error('刷新Token已过期')
    } else {
      throw new Error('刷新Token验证失败')
    }
  }
}

/**
 * 从Token中提取用户ID（不验证签名）
 * @param token JWT Token
 * @returns 用户ID
 */
export function extractUserIdFromToken(token: string): string | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload
    return decoded?.userId || null
  } catch {
    return null
  }
}

/**
 * 检查Token是否即将过期
 * @param token JWT Token
 * @param thresholdMinutes 阈值（分钟）
 * @returns 是否即将过期
 */
export function isTokenExpiringSoon(token: string, thresholdMinutes: number = 30): boolean {
  try {
    const decoded = jwt.decode(token) as JWTPayload
    if (!decoded?.exp) return true
    
    const expirationTime = decoded.exp * 1000 // 转换为毫秒
    const thresholdTime = Date.now() + (thresholdMinutes * 60 * 1000)
    
    return expirationTime <= thresholdTime
  } catch {
    return true
  }
}

/**
 * 获取Token剩余有效时间
 * @param token JWT Token
 * @returns 剩余时间（毫秒）
 */
export function getTokenRemainingTime(token: string): number {
  try {
    const decoded = jwt.decode(token) as JWTPayload
    if (!decoded?.exp) return 0
    
    const expirationTime = decoded.exp * 1000
    const remainingTime = expirationTime - Date.now()
    
    return Math.max(0, remainingTime)
  } catch {
    return 0
  }
}

/**
 * 创建无状态会话信息
 * @param user 用户信息
 * @returns 会话Token
 */
export function createSessionToken(user: UserPayload): string {
  const sessionData = {
    ...user,
    sessionId: generateSecureRandom(32),
    createdAt: new Date(),
    lastActivity: new Date()
  }
  
  return jwt.sign(sessionData, JWT_ACCESS_SECRET, {
    expiresIn: '1h' // 会话Token短期有效
  })
}

/**
 * 验证会话Token
 * @param sessionToken 会话Token
 * @returns 会话信息
 */
export function verifySessionToken(sessionToken: string): any {
  try {
    return jwt.verify(sessionToken, JWT_ACCESS_SECRET)
  } catch (error) {
    throw new Error('会话已过期，请重新登录')
  }
}