#!/usr/bin/env node

/**
 * 生成密码哈希值
 * 用于管理员账号密码设置
 */

const bcrypt = require('bcryptjs');

async function generateHash(password) {
  const SALT_ROUNDS = 12;
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hash = await bcrypt.hash(password, salt);
  return hash;
}

// 生成kexing账号的密码哈希
async function main() {
  const password = 'zzxxcc123';
  const hash = await generateHash(password);
  
  console.log('=== 密码哈希生成器 ===');
  console.log('密码:', password);
  console.log('哈希值:', hash);
  console.log('\n将此哈希值复制到登录API中使用');
}

main().catch(console.error);