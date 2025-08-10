#!/usr/bin/env python3
"""
优化专家提示词模板集成脚本
基于行动型AI教练模式，更新现有的5个专家模板系统
"""

import json
import os
from datetime import datetime

def load_json_file(file_path):
    """加载JSON文件"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json_file(data, file_path):
    """保存JSON文件"""
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def create_optimized_template(expert_key, optimized_data, original_template):
    """为每个专家创建优化的模板"""
    expert_info = optimized_data['experts'][expert_key]
    
    # 创建优化的核心模板 - 用于替换第一个模板
    optimized_template = {
        "id": f"{expert_key}-professional-consultation",
        "title": f"专业{expert_info['name']}咨询助手",
        "category": "专业咨询",
        "description": f"基于行动型AI教练模式的{expert_info['description']}",
        "difficulty": "professional",
        "estimatedTime": "15-30分钟",
        "prompt": {
            "system": expert_info['optimized_prompt']['system'],
            "context": expert_info['optimized_prompt']['context'],
            "task": expert_info['optimized_prompt']['task_framework'],
            "format": expert_info['optimized_prompt']['output_format'],
            "examples": f"基于{expert_info['name']}专业场景提供具体可执行的解决方案",
            "safety": expert_info['optimized_prompt']['safety_guidelines']
        },
        "tags": expert_info['core_competencies'],
        "useCases": expert_info['target_users'],
        "targetUsers": expert_info['target_users'],
        "coreCompetencies": expert_info['core_competencies'],
        "bestPractices": [
            "始终提供具体可执行的行动方案",
            "结合中国本土化环境和政策",
            "重视风险识别和防控",
            "支持客户决策和实施",
            "提供持续的专业指导"
        ],
        "optimizationFeatures": [
            "行动型AI教练模式",
            "结构化决策框架", 
            "具体实施清单",
            "中国本土化适配",
            "专业伦理保障"
        ]
    }
    
    return optimized_template

def update_expert_templates():
    """更新专家模板系统"""
    
    # 文件路径
    original_file = '/home/kexing/09-ai-prompt-generator/data/templates-2025.json'
    optimized_file = '/home/kexing/09-ai-prompt-generator/optimized-expert-prompts.json'
    backup_file = f'/home/kexing/09-ai-prompt-generator/data/templates-2025-backup-{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
    
    # 加载文件
    print("📖 加载原始模板文件...")
    original_data = load_json_file(original_file)
    
    print("📖 加载优化提示词文件...")
    optimized_data = load_json_file(optimized_file)
    
    # 创建备份
    print("💾 创建备份文件...")
    save_json_file(original_data, backup_file)
    
    # 更新专家映射
    expert_mapping = {
        'teacher': 'teacher',
        'lawyer': 'lawyer', 
        'accountant': 'accountant',
        'realtor': 'realtor',
        'insurance': 'insurance'
    }
    
    # 更新每个专家
    updated_count = 0
    for expert_key, optimized_key in expert_mapping.items():
        if expert_key in original_data['industries'] and optimized_key in optimized_data['experts']:
            print(f"🔄 更新 {optimized_data['experts'][optimized_key]['name']} 专家...")
            
            # 更新基本信息
            original_data['industries'][expert_key]['name'] = optimized_data['experts'][optimized_key]['name']
            original_data['industries'][expert_key]['description'] = optimized_data['experts'][optimized_key]['description']
            original_data['industries'][expert_key]['emoji'] = optimized_data['experts'][optimized_key]['emoji']
            original_data['industries'][expert_key]['targetUsers'] = optimized_data['experts'][optimized_key]['target_users']
            original_data['industries'][expert_key]['coreCompetencies'] = optimized_data['experts'][optimized_key]['core_competencies']
            
            # 创建并插入优化模板作为第一个模板
            optimized_template = create_optimized_template(expert_key, optimized_data, original_data['industries'][expert_key]['templates'][0])
            
            # 将优化模板插入到第一位
            original_data['industries'][expert_key]['templates'].insert(0, optimized_template)
            
            # 如果模板数量超过10个，保留前10个
            if len(original_data['industries'][expert_key]['templates']) > 10:
                original_data['industries'][expert_key]['templates'] = original_data['industries'][expert_key]['templates'][:10]
                
            updated_count += 1
            print(f"✅ {optimized_data['experts'][optimized_key]['name']} 更新完成")
    
    # 更新版本信息
    original_data['version'] = "2025.2-optimized"
    original_data['lastUpdated'] = datetime.now().strftime("%Y-%m-%d")
    original_data['optimizationInfo'] = {
        "optimizedBy": "Claude Code AI Prompt Generator",
        "optimizationDate": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "features": [
            "行动型AI教练模式",
            "Context7最佳实践应用", 
            "中国本土化深度优化",
            "结构化决策框架",
            "具体执行步骤指导"
        ],
        "expertCount": updated_count,
        "backupFile": os.path.basename(backup_file)
    }
    
    # 保存更新后的文件
    print("💾 保存更新后的模板文件...")
    save_json_file(original_data, original_file)
    
    print(f"""
🎉 专家模板优化完成！

📊 更新统计：
   - 更新专家数量：{updated_count}个
   - 备份文件：{backup_file}
   - 版本：{original_data['version']}
   
🚀 优化特性：
   ✨ 行动型AI教练模式
   ✨ Context7最佳实践
   ✨ 中国本土化适配
   ✨ 结构化决策框架
   ✨ 具体执行清单
   
📁 文件位置：{original_file}
    """)
    
    return True

if __name__ == "__main__":
    try:
        update_expert_templates()
    except Exception as e:
        print(f"❌ 更新失败: {str(e)}")
        exit(1)