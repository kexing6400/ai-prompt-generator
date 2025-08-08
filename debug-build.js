#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== 构建调试信息 ===\n');

// 1. 检查当前工作目录
console.log('1. 当前工作目录:');
console.log('   ', process.cwd());

// 2. 检查tsconfig.json
console.log('\n2. tsconfig.json存在:', fs.existsSync('./tsconfig.json'));

// 3. 检查components目录
console.log('\n3. components目录结构:');
const componentsPath = path.join(process.cwd(), 'components');
if (fs.existsSync(componentsPath)) {
  const uiPath = path.join(componentsPath, 'ui');
  console.log('   components/目录存在');
  console.log('   components/ui/目录存在:', fs.existsSync(uiPath));
  
  if (fs.existsSync(uiPath)) {
    const files = fs.readdirSync(uiPath);
    console.log('   UI组件文件:');
    files.forEach(file => {
      console.log('     -', file);
    });
  }
} else {
  console.log('   ❌ components/目录不存在！');
}

// 4. 检查lib目录
console.log('\n4. lib目录结构:');
const libPath = path.join(process.cwd(), 'lib');
if (fs.existsSync(libPath)) {
  const hooksPath = path.join(libPath, 'hooks');
  console.log('   lib/目录存在');
  console.log('   lib/hooks/目录存在:', fs.existsSync(hooksPath));
  
  if (fs.existsSync(hooksPath)) {
    const files = fs.readdirSync(hooksPath);
    console.log('   Hooks文件:');
    files.forEach(file => {
      console.log('     -', file);
    });
  }
} else {
  console.log('   ❌ lib/目录不存在！');
}

// 5. 检查package.json
console.log('\n5. package.json依赖:');
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
console.log('   dependencies数量:', Object.keys(packageJson.dependencies).length);
console.log('   devDependencies数量:', Object.keys(packageJson.devDependencies).length);

// 6. 检查node_modules
console.log('\n6. node_modules状态:');
console.log('   node_modules/目录存在:', fs.existsSync('./node_modules'));
if (fs.existsSync('./node_modules')) {
  console.log('   next安装:', fs.existsSync('./node_modules/next'));
  console.log('   tailwindcss安装:', fs.existsSync('./node_modules/tailwindcss'));
}

console.log('\n=== 调试完成 ===');