#!/usr/bin/env node

/**
 * 生成各种尺寸的 favicon 图标
 * 基于现有的 SVG 图标生成 PNG 格式
 */

const fs = require('fs');
const path = require('path');

// SVG 图标模板
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <!-- 背景渐变 -->
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#60a5fa;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#a78bfa;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 背景圆角矩形 -->
  <rect x="5" y="5" width="90" height="90" rx="20" ry="20" fill="url(#bgGradient)"/>
  
  <!-- AI 符号设计 -->
  <!-- A 字母 -->
  <path d="M 30 70 L 40 30 L 50 70 M 35 55 L 45 55" 
        stroke="white" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  
  <!-- I 字母 -->
  <line x1="60" y1="30" x2="60" y2="70" 
        stroke="white" stroke-width="4" stroke-linecap="round"/>
  <circle cx="60" cy="25" r="3" fill="white"/>
  
  <!-- 智能光点 -->
  <circle cx="75" cy="45" r="2" fill="white" opacity="0.8">
    <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite"/>
  </circle>
  <circle cx="25" cy="50" r="2" fill="white" opacity="0.8">
    <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" begin="0.5s" repeatCount="indefinite"/>
  </circle>
  <circle cx="80" cy="60" r="2" fill="white" opacity="0.8">
    <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" begin="1s" repeatCount="indefinite"/>
  </circle>
</svg>`;

// 创建 SVG 文件
function createFaviconSVG() {
  const publicDir = path.join(__dirname, '..', 'public');
  
  // 确保 public 目录存在
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // 写入主 favicon.svg
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgIcon);
  console.log('✅ 创建 favicon.svg');
  
  // 创建不同尺寸的占位 PNG（实际项目中应使用图像处理库生成）
  const sizes = [16, 32, 48, 192, 512];
  
  sizes.forEach(size => {
    // 这里创建一个简单的 HTML 文件用于手动生成 PNG
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Favicon ${size}x${size}</title>
  <style>
    body { margin: 0; padding: 20px; background: #f0f0f0; }
    .icon { width: ${size}px; height: ${size}px; }
  </style>
</head>
<body>
  <h2>Favicon ${size}x${size}</h2>
  <div class="icon">${svgIcon}</div>
  <p>右键保存图像为 favicon-${size}x${size}.png</p>
</body>
</html>`;
    
    fs.writeFileSync(path.join(publicDir, `favicon-${size}-preview.html`), html);
  });
  
  console.log('✅ 创建 favicon 预览文件');
  console.log('📌 请使用浏览器打开预览文件并手动保存为 PNG 格式');
}

// 创建 Apple Touch Icon
function createAppleTouchIcon() {
  const appleTouchIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180">
  <!-- 白色背景 -->
  <rect width="180" height="180" fill="white"/>
  
  <!-- 渐变定义 -->
  <defs>
    <linearGradient id="appleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 图标主体 -->
  <rect x="20" y="20" width="140" height="140" rx="30" ry="30" fill="url(#appleGradient)"/>
  
  <!-- AI 文字 -->
  <text x="90" y="110" font-family="SF Pro Display, system-ui, sans-serif" font-size="72" font-weight="bold" text-anchor="middle" fill="white">AI</text>
</svg>`;

  const publicDir = path.join(__dirname, '..', 'public');
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.svg'), appleTouchIcon);
  console.log('✅ 创建 apple-touch-icon.svg');
}

// 执行生成
console.log('🎨 开始生成 Favicon 图标...\n');
createFaviconSVG();
createAppleTouchIcon();

console.log('\n✨ Favicon 生成完成！');
console.log('📝 注意：需要使用图像处理工具将 SVG 转换为 PNG 格式');
console.log('💡 推荐使用在线工具：https://realfavicongenerator.net/');