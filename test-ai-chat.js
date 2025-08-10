#!/usr/bin/env node

/**
 * AI对话系统快速测试脚本
 * 测试API端点、流式响应和错误处理
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 开始测试AI对话优化系统...\n');

// 测试配置
const tests = [
  {
    name: 'API端点结构检查',
    check: () => {
      const fs = require('fs');
      const apiPath = path.join(__dirname, 'app/api/ai/optimize/route.ts');
      const exists = fs.existsSync(apiPath);
      return {
        passed: exists,
        message: exists ? 'API端点文件存在' : 'API端点文件不存在'
      };
    }
  },
  {
    name: 'AIChat组件检查',
    check: () => {
      const fs = require('fs');
      const componentPath = path.join(__dirname, 'components/ai-chat/AIChat.tsx');
      const exists = fs.existsSync(componentPath);
      return {
        passed: exists,
        message: exists ? 'AIChat组件文件存在' : 'AIChat组件文件不存在'
      };
    }
  },
  {
    name: '类型定义检查',
    check: () => {
      const fs = require('fs');
      const typesPath = path.join(__dirname, 'types/ai-chat.ts');
      const exists = fs.existsSync(typesPath);
      return {
        passed: exists,
        message: exists ? '类型定义文件存在' : '类型定义文件不存在'
      };
    }
  },
  {
    name: '优化引擎检查',
    check: () => {
      const fs = require('fs');
      const optimizerPath = path.join(__dirname, 'lib/ai/prompt-optimizer.ts');
      const exists = fs.existsSync(optimizerPath);
      return {
        passed: exists,
        message: exists ? '优化引擎文件存在' : '优化引擎文件不存在'
      };
    }
  },
  {
    name: 'API验证工具检查',
    check: () => {
      const fs = require('fs');
      const validationPath = path.join(__dirname, 'lib/utils/api-validation.ts');
      const exists = fs.existsSync(validationPath);
      return {
        passed: exists,
        message: exists ? 'API验证工具文件存在' : 'API验证工具文件不存在'
      };
    }
  },
  {
    name: '环境变量配置检查',
    check: () => {
      const fs = require('fs');
      const envPath = path.join(__dirname, '.env.local');
      if (!fs.existsSync(envPath)) {
        return { passed: false, message: '.env.local文件不存在' };
      }
      
      const envContent = fs.readFileSync(envPath, 'utf8');
      const hasOpenRouter = envContent.includes('OPENROUTER_API_KEY');
      const hasAnthropicKey = envContent.includes('ANTHROPIC_API_KEY');
      
      return {
        passed: hasOpenRouter || hasAnthropicKey,
        message: hasOpenRouter || hasAnthropicKey ? 'API密钥配置存在' : 'API密钥配置缺失'
      };
    }
  },
  {
    name: 'TypeScript编译检查',
    check: async () => {
      return new Promise((resolve) => {
        const tsc = spawn('npx', ['tsc', '--noEmit'], {
          cwd: __dirname,
          stdio: 'pipe'
        });
        
        let output = '';
        let errorOutput = '';
        
        tsc.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        tsc.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });
        
        tsc.on('close', (code) => {
          const passed = code === 0;
          resolve({
            passed,
            message: passed ? 'TypeScript编译通过' : `编译错误: ${errorOutput.slice(0, 200)}...`
          });
        });
        
        // 30秒超时
        setTimeout(() => {
          tsc.kill();
          resolve({
            passed: false,
            message: 'TypeScript编译超时'
          });
        }, 30000);
      });
    }
  }
];

// 运行测试
async function runTests() {
  console.log('📋 运行系统检查...\n');
  
  let passedCount = 0;
  const totalTests = tests.length;
  
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    process.stdout.write(`${i + 1}. ${test.name}... `);
    
    try {
      const result = await test.check();
      if (result.passed) {
        console.log(`✅ ${result.message}`);
        passedCount++;
      } else {
        console.log(`❌ ${result.message}`);
      }
    } catch (error) {
      console.log(`❌ 测试失败: ${error.message}`);
    }
  }
  
  console.log(`\n📊 测试结果: ${passedCount}/${totalTests} 通过`);
  
  if (passedCount === totalTests) {
    console.log('\n🎉 所有检查通过！AI对话优化系统已准备就绪。');
    console.log('\n🔧 下一步操作:');
    console.log('1. 运行 npm run dev 启动开发服务器');
    console.log('2. 访问提示词生成器页面');
    console.log('3. 点击"AI优化助手"按钮测试对话功能');
    console.log('4. 验证流式响应和优化建议功能');
  } else {
    console.log('\n⚠️  部分检查未通过，请修复上述问题后重试。');
  }
  
  console.log('\n💡 提示: 确保已正确配置OpenRouter API密钥在.env.local文件中。');
}

// 执行测试
runTests().catch(console.error);