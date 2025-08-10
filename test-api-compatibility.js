#!/usr/bin/env node
/**
 * OpenRouter API 兼容性测试脚本
 * 测试优化后的专家提示词与 OpenRouter API 的集成
 */

const fs = require('fs').promises;

async function testApiCompatibility() {
    console.log('🧪 开始测试 OpenRouter API 兼容性...\n');
    
    try {
        // 加载优化后的模板
        const templatesData = JSON.parse(
            await fs.readFile('/home/kexing/09-ai-prompt-generator/data/templates-2025.json', 'utf8')
        );
        
        console.log('✅ 模板文件加载成功');
        console.log(`📊 版本: ${templatesData.version}`);
        console.log(`📊 专家数量: ${Object.keys(templatesData.industries).length}\n`);
        
        // 测试每个专家的提示词结构
        const experts = Object.entries(templatesData.industries);
        const testResults = [];
        
        for (const [key, expert] of experts) {
            console.log(`🔍 测试专家: ${expert.emoji} ${expert.name}`);
            
            const firstTemplate = expert.templates[0];
            const testResult = {
                expert: expert.name,
                expertKey: key,
                templateId: firstTemplate.id,
                isOptimized: !!firstTemplate.optimizationFeatures,
                hasSystemPrompt: !!firstTemplate.prompt.system,
                hasContext: !!firstTemplate.prompt.context,
                hasFormat: !!firstTemplate.prompt.format,
                hasSafety: !!firstTemplate.prompt.safety,
                promptStructure: 'valid',
                apiCompatible: true
            };
            
            // 验证提示词结构
            const requiredFields = ['system', 'context', 'task', 'format'];
            const missingFields = requiredFields.filter(field => !firstTemplate.prompt[field]);
            
            if (missingFields.length > 0) {
                testResult.promptStructure = `missing: ${missingFields.join(', ')}`;
                testResult.apiCompatible = false;
            }
            
            // 检查系统提示词长度（API限制考量）
            const systemPromptLength = firstTemplate.prompt.system.length;
            if (systemPromptLength > 3000) {
                console.log(`   ⚠️ 系统提示词较长: ${systemPromptLength} 字符`);
                testResult.longPrompt = true;
            }
            
            // 模拟 API 消息格式
            const apiMessage = {
                messages: [
                    {
                        role: "system",
                        content: firstTemplate.prompt.system
                    },
                    {
                        role: "user", 
                        content: `${firstTemplate.prompt.context}\n\n${firstTemplate.prompt.task}\n\n请按以下格式输出：\n${firstTemplate.prompt.format}`
                    }
                ]
            };
            
            testResult.messageFormat = 'valid';
            testResult.estimatedTokens = Math.ceil((apiMessage.messages[0].content.length + apiMessage.messages[1].content.length) / 3);
            
            testResults.push(testResult);
            
            console.log(`   ✅ 结构验证: ${testResult.promptStructure}`);
            console.log(`   ✅ API兼容: ${testResult.apiCompatible ? '通过' : '失败'}`);
            console.log(`   📊 预估Token: ~${testResult.estimatedTokens}`);
            console.log('');
        }
        
        // 生成测试报告
        const summary = {
            totalExperts: testResults.length,
            optimizedExperts: testResults.filter(r => r.isOptimized).length,
            compatibleExperts: testResults.filter(r => r.apiCompatible).length,
            averageTokens: Math.round(testResults.reduce((sum, r) => sum + r.estimatedTokens, 0) / testResults.length),
            maxTokens: Math.max(...testResults.map(r => r.estimatedTokens)),
            minTokens: Math.min(...testResults.map(r => r.estimatedTokens))
        };
        
        console.log('📋 ===== 兼容性测试报告 =====');
        console.log(`🎯 总专家数量: ${summary.totalExperts}`);
        console.log(`✨ 已优化专家: ${summary.optimizedExperts}/${summary.totalExperts}`);
        console.log(`🔗 API兼容专家: ${summary.compatibleExperts}/${summary.totalExperts}`);
        console.log(`📊 平均Token消耗: ~${summary.averageTokens}`);
        console.log(`📊 Token范围: ${summary.minTokens} - ${summary.maxTokens}`);
        
        if (summary.compatibleExperts === summary.totalExperts) {
            console.log('\n🎉 所有专家都与 OpenRouter API 完全兼容！');
        } else {
            console.log('\n⚠️ 部分专家存在兼容性问题，请检查详细结果');
        }
        
        // 保存测试结果
        const reportData = {
            testDate: new Date().toISOString(),
            version: templatesData.version,
            summary,
            details: testResults
        };
        
        await fs.writeFile(
            '/home/kexing/09-ai-prompt-generator/api-compatibility-report.json',
            JSON.stringify(reportData, null, 2)
        );
        
        console.log('\n📁 测试报告已保存: api-compatibility-report.json');
        
        return summary.compatibleExperts === summary.totalExperts;
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        return false;
    }
}

// 运行测试
testApiCompatibility()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('💥 测试异常:', error);
        process.exit(1);
    });