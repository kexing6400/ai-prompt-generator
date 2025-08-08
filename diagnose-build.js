#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== 🔍 完整构建诊断 ===\n');

// 1. Node版本
console.log('1️⃣ Node版本:');
console.log('   当前:', process.version);
console.log('   推荐: v18.x 或 v20.x (Vercel默认)');

// 2. 检查所有导入
console.log('\n2️⃣ 检查所有页面的导入:');
const pagesDir = path.join(process.cwd(), 'app');
const checkImports = (dir) => {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory() && !file.startsWith('api')) {
      checkImports(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const imports = content.match(/import.*from\s+['"]([^'"]+)['"]/g);
      if (imports) {
        const aliasImports = imports.filter(imp => imp.includes('@/'));
        if (aliasImports.length > 0) {
          console.log(`   📄 ${filePath.replace(process.cwd(), '.')}`);
          aliasImports.forEach(imp => {
            const match = imp.match(/from\s+['"]([^'"]+)['"]/);
            if (match) {
              const importPath = match[1];
              const resolvedPath = importPath.replace('@/', './');
              const fullPath = path.join(process.cwd(), resolvedPath);
              
              // 检查文件是否存在（尝试多个扩展名）
              const extensions = ['.ts', '.tsx', '.js', '.jsx', ''];
              let exists = false;
              for (const ext of extensions) {
                if (fs.existsSync(fullPath + ext) || fs.existsSync(path.join(fullPath, 'index' + ext))) {
                  exists = true;
                  break;
                }
              }
              
              if (!exists) {
                console.log(`      ❌ ${importPath} -> 文件不存在!`);
              } else {
                console.log(`      ✅ ${importPath}`);
              }
            }
          });
        }
      }
    }
  });
};

try {
  checkImports(pagesDir);
} catch (e) {
  console.log('   检查失败:', e.message);
}

// 3. 检查tsconfig.json
console.log('\n3️⃣ tsconfig.json配置:');
const tsconfig = JSON.parse(fs.readFileSync('./tsconfig.json', 'utf8'));
console.log('   baseUrl:', tsconfig.compilerOptions.baseUrl);
console.log('   paths:', JSON.stringify(tsconfig.compilerOptions.paths));
console.log('   moduleResolution:', tsconfig.compilerOptions.moduleResolution);

// 4. 检查package.json中的依赖
console.log('\n4️⃣ 关键依赖版本:');
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const keyDeps = ['next', 'react', 'react-dom', 'typescript', 'tailwindcss'];
keyDeps.forEach(dep => {
  const version = packageJson.dependencies[dep] || packageJson.devDependencies[dep];
  console.log(`   ${dep}: ${version || '未找到'}`);
});

// 5. 检查是否有.vercel目录
console.log('\n5️⃣ Vercel配置:');
console.log('   .vercel目录存在:', fs.existsSync('./.vercel'));
console.log('   vercel.json存在:', fs.existsSync('./vercel.json'));

// 6. 检查环境变量文件
console.log('\n6️⃣ 环境变量文件:');
const envFiles = ['.env', '.env.local', '.env.production', '.env.development'];
envFiles.forEach(file => {
  console.log(`   ${file}: ${fs.existsSync(file) ? '✅ 存在' : '❌ 不存在'}`);
});

// 7. 检查Git状态
console.log('\n7️⃣ Git状态:');
try {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  if (gitStatus) {
    console.log('   ⚠️ 有未提交的更改:');
    console.log(gitStatus.split('\n').map(line => '      ' + line).join('\n'));
  } else {
    console.log('   ✅ 工作区干净');
  }
} catch (e) {
  console.log('   ❌ Git错误:', e.message);
}

// 8. 检查package-lock.json
console.log('\n8️⃣ Lock文件:');
console.log('   package-lock.json存在:', fs.existsSync('./package-lock.json'));
console.log('   yarn.lock存在:', fs.existsSync('./yarn.lock'));
console.log('   pnpm-lock.yaml存在:', fs.existsSync('./pnpm-lock.yaml'));

// 9. 建议
console.log('\n💡 建议:');
console.log('   1. 确保Node版本与Vercel一致（18.x或20.x）');
console.log('   2. 删除node_modules和package-lock.json，重新安装');
console.log('   3. 确保所有文件都已提交到Git');
console.log('   4. 考虑在Vercel上删除项目并重新导入');

console.log('\n=== 诊断完成 ===');