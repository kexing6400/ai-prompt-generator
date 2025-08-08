#!/usr/bin/env node

/**
 * Chrome扩展图标转换脚本（Node.js版本）
 * 将SVG图标转换为PNG格式
 */

const fs = require('fs');
const path = require('path');

// 图标配置
const iconConfigs = [
  {
    source: 'chrome-extension/assets/icons/icon16.svg',
    target: 'chrome-extension/assets/icons/icon16.png',
    size: '16x16'
  },
  {
    source: 'chrome-extension/assets/icons/icon48.svg', 
    target: 'chrome-extension/assets/icons/icon48.png',
    size: '48x48'
  },
  {
    source: 'chrome-extension/assets/icons/icon128.svg',
    target: 'chrome-extension/assets/icons/icon128.png', 
    size: '128x128'
  }
];

console.log('🎨 Chrome扩展图标转换脚本');
console.log('=====================================');

// 检查SVG文件是否存在
const projectRoot = '/home/kexing/09-ai-prompt-generator';

iconConfigs.forEach((config, index) => {
  const sourcePath = path.join(projectRoot, config.source);
  const targetPath = path.join(projectRoot, config.target);
  
  console.log(`${index + 1}. 检查 ${config.source}`);
  
  if (fs.existsSync(sourcePath)) {
    console.log(`   ✅ 源文件存在: ${config.size}`);
    
    // 读取SVG内容
    const svgContent = fs.readFileSync(sourcePath, 'utf8');
    
    // 创建HTML文件用于浏览器转换
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Icon Converter</title>
    <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
        .icon-container { margin: 20px 0; }
        svg { border: 1px solid #ccc; }
    </style>
</head>
<body>
    <h2>${config.size} Icon</h2>
    <div class="icon-container">
        ${svgContent}
    </div>
    
    <h3>转换说明:</h3>
    <ol>
        <li>右键点击上方图标</li>
        <li>选择"将图像另存为"或"保存图片"</li>
        <li>保存为: <code>${path.basename(config.target)}</code></li>
        <li>放置到: <code>${path.dirname(config.target)}</code></li>
    </ol>
    
    <h3>在线转换工具:</h3>
    <ul>
        <li><a href="https://cloudconvert.com/svg-to-png" target="_blank">CloudConvert</a></li>
        <li><a href="https://convertio.co/svg-png/" target="_blank">Convertio</a></li>
        <li><a href="https://www.freeconvert.com/svg-to-png" target="_blank">FreeConvert</a></li>
    </ul>
</body>
</html>`;
    
    // 保存HTML预览文件
    const htmlPath = path.join(projectRoot, 'scripts', `icon-${config.size.replace('x', 'x')}-preview.html`);
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`   📄 预览文件: ${htmlPath}`);
    
  } else {
    console.log(`   ❌ 源文件不存在`);
  }
  
  console.log('');
});

console.log('🎯 转换方案:');
console.log('=====================================');
console.log('');
console.log('方案1 - 浏览器手动转换:');
console.log('1. 打开生成的HTML预览文件');
console.log('2. 右键保存图标为PNG格式');
console.log('');
console.log('方案2 - 在线工具转换:');
console.log('1. 上传SVG文件到在线转换工具');
console.log('2. 设置对应的尺寸');
console.log('3. 下载PNG文件');
console.log('');
console.log('方案3 - 安装转换工具:');
console.log('Ubuntu/Debian: sudo apt install imagemagick');
console.log('然后运行: ./scripts/convert-icons.sh');
console.log('');
console.log('✨ SVG文件已创建完成，可直接用作Chrome扩展图标!');
console.log('(某些情况下Chrome也支持SVG格式)');

// 检查manifest.json并给出建议
const manifestPath = path.join(projectRoot, 'chrome-extension', 'manifest.json');
if (fs.existsSync(manifestPath)) {
  console.log('');
  console.log('📋 Manifest.json 配置建议:');
  console.log('=====================================');
  console.log('"icons": {');
  console.log('  "16": "assets/icons/icon16.png",');
  console.log('  "48": "assets/icons/icon48.png",'); 
  console.log('  "128": "assets/icons/icon128.png"');
  console.log('}');
}