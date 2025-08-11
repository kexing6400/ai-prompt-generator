'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Loader2, 
  Sparkles, 
  Copy, 
  CheckCircle2,
  AlertCircle,
  Scale,
  Download,
  FileText,
  File,
  Printer,
  AlertTriangle,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { UsageIndicator } from '@/components/subscription'
import type { 
  SimpleTemplate, 
  SimpleFormData, 
  GeneratedResult,
  SimplePromptGeneratorProps 
} from '../simple-prompt-generator/types'

export default function LawyerPromptGenerator({ 
  industry,
  templates,
  onGenerate,
  className 
}: SimplePromptGeneratorProps) {
  // 状态管理
  const [selectedTemplate, setSelectedTemplate] = useState<SimpleTemplate | null>(null)
  const [formData, setFormData] = useState<SimpleFormData>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedResult, setGeneratedResult] = useState<GeneratedResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [usageLimitReached, setUsageLimitReached] = useState(false)
  const [legalDisclaimerAccepted, setLegalDisclaimerAccepted] = useState(false)

  // 重置表单
  const resetForm = useCallback(() => {
    setFormData({})
    setGeneratedResult(null)
    setError(null)
    setLegalDisclaimerAccepted(false)
  }, [])

  // 模板选择处理
  const handleTemplateSelect = useCallback((templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplate(template)
      resetForm()
    }
  }, [templates, resetForm])

  // 表单数据更新
  const updateFormData = useCallback((fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
    setError(null)
  }, [])

  // 表单验证
  const validateForm = useCallback(() => {
    if (!selectedTemplate) return false
    
    // 检查法律声明确认
    if (!legalDisclaimerAccepted) {
      setError('请确认您已阅读并同意法律声明')
      return false
    }
    
    for (const field of selectedTemplate.fields) {
      if (field.required && !formData[field.name]?.trim()) {
        setError(`请填写 ${field.label}`)
        return false
      }
    }
    
    return true
  }, [selectedTemplate, formData, legalDisclaimerAccepted])

  // 生成提示词
  const handleGenerate = useCallback(async () => {
    if (!selectedTemplate || !validateForm()) {
      return
    }

    setIsGenerating(true)
    setError(null)
    setUsageLimitReached(false)

    try {
      // 替换模板中的占位符
      let prompt = selectedTemplate.prompt
      Object.entries(formData).forEach(([key, value]) => {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value)
      })

      // 添加法律免责声明到提示词
      const legalPromptPrefix = `
[重要提醒: 本AI助手生成的内容仅供法律专业人士参考，不构成正式法律建议。请在使用前经专业律师审核确认。]

`

      // 调用AI API生成内容
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: legalPromptPrefix + prompt,
          industry,
          template: selectedTemplate.id,
          metadata: {
            isLegalContent: true,
            requiresReview: true,
            templateType: selectedTemplate.id
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        if (response.status === 429 || errorData.code === 'USAGE_LIMIT_EXCEEDED') {
          setUsageLimitReached(true)
          throw new Error('本月免费额度已用完，请升级到专业版获得更多使用次数')
        }
        
        throw new Error(errorData.message || '生成失败，请稍后重试')
      }

      const data = await response.json()
      
      const result: GeneratedResult = {
        id: Date.now().toString(),
        content: data.content,
        template: selectedTemplate,
        formData,
        createdAt: new Date()
      }

      setGeneratedResult(result)
      onGenerate?.(result)
      
    } catch (error) {
      console.error('Generation error:', error)
      setError(error instanceof Error ? error.message : '生成失败，请稍后重试')
    } finally {
      setIsGenerating(false)
    }
  }, [selectedTemplate, formData, validateForm, industry, onGenerate, legalDisclaimerAccepted])

  // 复制结果
  const copyToClipboard = useCallback(async () => {
    if (!generatedResult) return

    try {
      await navigator.clipboard.writeText(generatedResult.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }, [generatedResult])

  // 重新开始
  const startOver = useCallback(() => {
    setSelectedTemplate(null)
    setFormData({})
    setGeneratedResult(null)
    setError(null)
    setDownloadError(null)
    setLegalDisclaimerAccepted(false)
  }, [])

  // 下载文档函数
  const downloadDocument = useCallback(async (format: 'md' | 'txt' | 'html') => {
    if (!generatedResult) return

    setIsDownloading(true)
    setDownloadError(null)

    try {
      const response = await fetch('/api/document/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `律师-${generatedResult.template.title}`,
          content: generatedResult.content,
          format,
          industry: 'lawyer',
          template: generatedResult.template.title,
          metadata: {
            isLegalDocument: true,
            disclaimer: '本文档由AI生成，需经专业律师审核确认后使用'
          }
        })
      })

      if (!response.ok) {
        throw new Error('下载失败，请稍后重试')
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || '下载失败')
      }

      // 创建下载链接
      const blob = new Blob([data.content], { type: data.mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data.fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Download error:', error)
      setDownloadError(error instanceof Error ? error.message : '下载失败，请稍后重试')
    } finally {
      setIsDownloading(false)
    }
  }, [generatedResult])

  return (
    <div className={cn("max-w-4xl mx-auto space-y-6", className)}>
      
      {/* 法律声明横幅 */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <Shield className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-amber-800 mb-2">法律责任声明</h3>
            <p className="text-amber-700 text-sm leading-relaxed mb-3">
              本AI助手生成的内容仅供法律专业人士参考和辅助工作使用，不构成正式的法律建议或法律文书。
              所有生成的内容必须经过执业律师的专业审核和确认后方可正式使用。使用者需承担相应的法律责任。
            </p>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={legalDisclaimerAccepted}
                onChange={(e) => setLegalDisclaimerAccepted(e.target.checked)}
                className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm text-amber-800">我已阅读并同意上述声明</span>
            </label>
          </div>
        </div>
      </div>

      {/* 主卡片 */}
      <Card className="shadow-lg border-blue-200">
        <CardHeader className="bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-blue-900">律师AI助手</CardTitle>
                <p className="text-blue-700">
                  专业法律文书生成与案例分析工具
                </p>
              </div>
            </div>
            
            <div className="hidden md:block">
              <UsageIndicator 
                variant="compact" 
                onUpgrade={() => {
                  console.log('Open upgrade modal')
                }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          
          {/* 步骤1: 选择模板 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center">
                1
              </div>
              <Label className="text-base font-medium">选择法律业务模板</Label>
            </div>
            
            <Select onValueChange={handleTemplateSelect} value={selectedTemplate?.id || ""}>
              <SelectTrigger className="w-full border-blue-200 focus:ring-blue-500">
                <SelectValue placeholder="请选择适合您业务场景的专业模板..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <span>{template.icon}</span>
                      <div>
                        <div className="font-medium">{template.title}</div>
                        <div className="text-sm text-muted-foreground">{template.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 步骤2: 填写表单 */}
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-500 text-white text-sm flex items-center justify-center">
                  2
                </div>
                <Label className="text-base font-medium">填写案件信息</Label>
              </div>

              <div className="grid gap-4 bg-gray-50 p-4 rounded-lg">
                {selectedTemplate.fields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name} className="text-gray-700">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    
                    {field.type === 'text' && (
                      <Input
                        id={field.name}
                        placeholder={field.placeholder}
                        value={formData[field.name] || ''}
                        onChange={(e) => updateFormData(field.name, e.target.value)}
                        className="w-full border-gray-300 focus:ring-blue-500"
                      />
                    )}
                    
                    {field.type === 'textarea' && (
                      <Textarea
                        id={field.name}
                        placeholder={field.placeholder}
                        value={formData[field.name] || ''}
                        onChange={(e) => updateFormData(field.name, e.target.value)}
                        rows={3}
                        className="w-full border-gray-300 focus:ring-blue-500"
                      />
                    )}
                    
                    {field.type === 'select' && (
                      <Select 
                        onValueChange={(value) => updateFormData(field.name, value)}
                        value={formData[field.name] || ''}
                      >
                        <SelectTrigger className="border-gray-300 focus:ring-blue-500">
                          <SelectValue placeholder={`请选择${field.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}
              </div>

              {/* 错误提示 */}
              {error && (
                <div className={cn(
                  "flex items-center gap-2 p-3 rounded-lg",
                  usageLimitReached 
                    ? "text-yellow-700 bg-yellow-50 border border-yellow-200" 
                    : "text-red-600 bg-red-50 border border-red-200"
                )}>
                  <AlertCircle className="h-4 w-4" />
                  <div className="flex-1">
                    <span className="text-sm">{error}</span>
                    {usageLimitReached && (
                      <div className="mt-2">
                        <Button 
                          size="sm" 
                          onClick={() => console.log('Open upgrade modal')}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                          升级到专业版
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 生成按钮 */}
              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !selectedTemplate || !legalDisclaimerAccepted}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    正在生成专业法律内容...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    生成法律文档
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 步骤3: 生成结果 */}
      {generatedResult && (
        <Card className="shadow-lg border-green-200">
          <CardHeader className="bg-green-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-500 text-white text-sm flex items-center justify-center">
                  3
                </div>
                <CardTitle className="text-lg text-green-900">生成结果</CardTitle>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 border-green-300 hover:bg-green-50"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      复制
                    </>
                  )}
                </Button>
                
                {/* 下载按钮组 */}
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadDocument('md')}
                    disabled={isDownloading}
                    className="flex items-center gap-1 text-xs"
                  >
                    <FileText className="h-3 w-3" />
                    .md
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadDocument('txt')}
                    disabled={isDownloading}
                    className="flex items-center gap-1 text-xs"
                  >
                    <File className="h-3 w-3" />
                    .txt
                  </Button>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startOver}
                  className="hover:bg-gray-50"
                >
                  重新生成
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  模板：{generatedResult.template.title} | 生成时间：{generatedResult.createdAt.toLocaleString()}
                </div>
                {isDownloading && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    正在处理...
                  </div>
                )}
              </div>
              
              {/* 重要提醒 */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">重要提醒</span>
                </div>
                <p className="text-sm text-orange-700 mt-1">
                  此内容由AI生成，仅供参考。请务必经专业律师审核后使用。
                </p>
              </div>

              {/* 下载错误提示 */}
              {downloadError && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{downloadError}</span>
                </div>
              )}
              
              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800 leading-relaxed">
                  {generatedResult.content}
                </pre>
              </div>
              
              {/* 使用说明 */}
              <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg border border-blue-200">
                📋 使用建议：建议将生成的内容保存为文档，并由执业律师进行专业审核和修改后使用
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 空状态提示 */}
      {!selectedTemplate && (
        <Card className="border-dashed border-2 border-blue-200">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Scale className="h-12 w-12 text-blue-400 mb-4" />
            <h3 className="text-lg font-medium mb-2 text-blue-900">开始使用律师AI助手</h3>
            <p className="text-blue-700 mb-4 max-w-md">
              选择适合您业务需求的专业模板，快速生成高质量的法律文档和分析报告
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-600">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                专业法律模板
              </div>
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-green-500" />
                多格式导出
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                合规风险提醒
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}