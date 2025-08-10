'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useIndustryTheme } from '@/components/providers/industry-theme-provider';
import { 
  ChevronLeft, 
  Copy, 
  Download, 
  Save, 
  Sparkles,
  Eye,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap
} from 'lucide-react';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  placeholder: string;
  required: boolean;
  options?: string[];
  defaultValue?: string;
  description?: string;
}

interface ScenarioTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  promptTemplate: string;
  fields: FormField[];
  examples: Record<string, string>;
}

// 模拟场景模板数据
const SCENARIO_TEMPLATES: Record<string, ScenarioTemplate> = {
  'contract-review': {
    id: 'contract-review',
    title: '合同审查分析',
    description: '全面审查商业合同条款，识别风险点和改进建议',
    category: '合同管理',
    promptTemplate: `请作为专业律师，对以下合同进行全面审查分析：

合同类型：{{contractType}}
合同当事方：{{parties}}
合同金额：{{amount}}
合同期限：{{duration}}

请重点关注以下方面：
{{focusAreas}}

请提供：
1. 风险点识别和评估
2. 条款改进建议
3. 法律合规性检查
4. 执行可行性分析

附加要求：{{additionalRequirements}}`,
    fields: [
      {
        id: 'contractType',
        label: '合同类型',
        type: 'select',
        placeholder: '选择合同类型',
        required: true,
        options: ['销售合同', '服务合同', '劳动合同', '租赁合同', '合作协议', '其他']
      },
      {
        id: 'parties',
        label: '合同当事方',
        type: 'text',
        placeholder: '例：甲方-公司A，乙方-公司B',
        required: true,
        description: '简要描述合同双方或多方信息'
      },
      {
        id: 'amount',
        label: '合同金额',
        type: 'text',
        placeholder: '例：100万元或具体数额范围',
        required: false
      },
      {
        id: 'duration',
        label: '合同期限',
        type: 'text',
        placeholder: '例：2024年1月1日至2025年12月31日',
        required: false
      },
      {
        id: 'focusAreas',
        label: '重点关注领域',
        type: 'textarea',
        placeholder: '例：付款条件、违约责任、知识产权条款等',
        required: true,
        description: '列出需要特别关注的合同条款或风险点'
      },
      {
        id: 'additionalRequirements',
        label: '附加要求',
        type: 'textarea',
        placeholder: '任何特殊要求或补充说明',
        required: false
      }
    ],
    examples: {
      contractType: '销售合同',
      parties: '甲方-科技公司A，乙方-制造企业B',
      amount: '500万元',
      duration: '2024年3月1日至2025年2月28日',
      focusAreas: '付款进度安排、产品质量标准、违约责任条款、知识产权保护',
      additionalRequirements: '特别关注国际贸易相关法规的合规性'
    }
  }
  // 可以添加更多场景模板
};

interface PromptGeneratorPageProps {
  industryId: string;
}

export function PromptGeneratorPage({ industryId }: PromptGeneratorPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentIndustry } = useIndustryTheme();
  
  const scenarioId = searchParams.get('scenario');
  const scenarioTemplate = scenarioId ? SCENARIO_TEMPLATES[scenarioId] : null;
  
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  // 生成实时预览
  const previewPrompt = useMemo(() => {
    if (!scenarioTemplate) return '';
    
    let prompt = scenarioTemplate.promptTemplate;
    scenarioTemplate.fields.forEach(field => {
      const value = formData[field.id] || `[${field.label}]`;
      prompt = prompt.replace(new RegExp(`{{${field.id}}}`, 'g'), value);
    });
    
    return prompt;
  }, [formData, scenarioTemplate]);

  // 初始化示例数据
  useEffect(() => {
    if (scenarioTemplate && Object.keys(formData).length === 0) {
      setFormData(scenarioTemplate.examples);
    }
  }, [scenarioTemplate, formData]);

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setGeneratedPrompt(previewPrompt);
    setIsGenerating(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt || previewPrompt);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleSaveHistory = () => {
    // 实现保存到历史记录的逻辑
    const historyItem = {
      id: Date.now().toString(),
      title: scenarioTemplate?.title || '',
      prompt: generatedPrompt || previewPrompt,
      createdAt: new Date().toISOString(),
      industryId,
      scenarioId
    };
    
    const existingHistory = JSON.parse(localStorage.getItem('promptHistory') || '[]');
    existingHistory.unshift(historyItem);
    localStorage.setItem('promptHistory', JSON.stringify(existingHistory.slice(0, 50))); // 保持最新50条
  };

  const isFormValid = useMemo(() => {
    if (!scenarioTemplate) return false;
    
    return scenarioTemplate.fields
      .filter(field => field.required)
      .every(field => formData[field.id]?.trim());
  }, [formData, scenarioTemplate]);

  if (!scenarioTemplate || !currentIndustry) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">场景模板未找到</h3>
          <Button onClick={() => router.push(`/${industryId}`)}>
            返回场景选择
          </Button>
        </div>
      </div>
    );
  }

  const industryColor = currentIndustry.color.primary;

  return (
    <div 
      className="min-h-screen"
      style={{ background: `linear-gradient(135deg, ${currentIndustry.color.accent}, white)` }}
    >
      {/* 头部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/industries/${industryId}`)}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                返回场景选择
              </Button>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: industryColor }}
                >
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="font-semibold text-gray-900">{scenarioTemplate.title}</h1>
                  <p className="text-sm text-gray-600">{scenarioTemplate.category}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                预计3-5分钟
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：参数输入表单 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" style={{ color: industryColor }} />
                  参数配置
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {scenarioTemplate.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {scenarioTemplate.fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id} className="flex items-center">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    
                    {field.type === 'text' && (
                      <Input
                        id={field.id}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    )}
                    
                    {field.type === 'textarea' && (
                      <Textarea
                        id={field.id}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        rows={3}
                      />
                    )}
                    
                    {field.type === 'select' && (
                      <select
                        id={field.id}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        required={field.required}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">{field.placeholder}</option>
                        {field.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                    
                    {field.description && (
                      <p className="text-xs text-gray-500">{field.description}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <Button
                onClick={handleGenerate}
                disabled={!isFormValid || isGenerating}
                className="flex-1"
                style={{ backgroundColor: industryColor }}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    生成提示词
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* 右侧：实时预览和结果 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Eye className="w-5 h-5 mr-2" style={{ color: industryColor }} />
                    {showPreview ? '实时预览' : '生成结果'}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? '查看结果' : '查看预览'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-200">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                      {showPreview ? previewPrompt : (generatedPrompt || previewPrompt)}
                    </pre>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="flex-1"
                    >
                      {copySuccess ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          复制
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveHistory}
                      disabled={!generatedPrompt && !previewPrompt}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      保存
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!generatedPrompt && !previewPrompt}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      导出
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 使用提示 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">使用提示</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• 填写所有必需参数后即可生成专业提示词</p>
                  <p>• 实时预览帮助您及时调整参数内容</p>
                  <p>• 生成后可一键复制到您常用的AI工具</p>
                  <p>• 历史记录会自动保存，便于后续查看</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}