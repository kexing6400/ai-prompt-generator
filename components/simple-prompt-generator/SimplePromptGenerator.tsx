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
  Wand2,
  Download,
  FileText,
  File,
  Printer
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { UsageIndicator } from '@/components/subscription'
import type { 
  SimpleTemplate, 
  SimpleFormData, 
  GeneratedResult,
  SimplePromptGeneratorProps 
} from './types'

export default function SimplePromptGenerator({ 
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

  // 重置表单
  const resetForm = useCallback(() => {
    setFormData({})
    setGeneratedResult(null)
    setError(null)
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
    setError(null) // 清除错误状态
  }, [])

  // 表单验证
  const validateForm = useCallback(() => {
    if (!selectedTemplate) return false
    
    for (const field of selectedTemplate.fields) {
      if (field.required && !formData[field.name]?.trim()) {
        setError(`请填写 ${field.label}`)
        return false
      }
    }
    
    return true
  }, [selectedTemplate, formData])

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

      // 调用AI API生成内容
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          industry,
          template: selectedTemplate.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // 检查是否是使用量限制错误
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
  }, [selectedTemplate, formData, validateForm, industry, onGenerate])

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
          title: `${industry} - ${generatedResult.template.title}`,
          content: generatedResult.content,
          format,
          industry,
          template: generatedResult.template.title
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
  }, [generatedResult, industry])

  // 打印为PDF
  const printAsPDF = useCallback(async () => {
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
          title: `${industry} - ${generatedResult.template.title}`,
          content: generatedResult.content,
          format: 'html',
          industry,
          template: generatedResult.template.title
        })
      })

      if (!response.ok) {
        throw new Error('生成PDF预览失败')
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || '生成PDF预览失败')
      }

      // 在新窗口中打开HTML内容用于打印
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(data.content)
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
      }

    } catch (error) {
      console.error('Print error:', error)
      setDownloadError(error instanceof Error ? error.message : 'PDF生成失败')
    } finally {
      setIsDownloading(false)
    }
  }, [generatedResult, industry])

  return (
    <div className={cn("max-w-4xl mx-auto space-y-6", className)}>
      
      {/* 主卡片 */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Wand2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">AI 提示词生成器</CardTitle>
                <p className="text-muted-foreground">
                  选择模板，填写信息，一键生成专业提示词
                </p>
              </div>
            </div>
            
            {/* 使用量指示器 */}
            <div className="hidden md:block">
              <UsageIndicator 
                variant="compact" 
                onUpgrade={() => {
                  // 可以在这里打开升级模态框
                  console.log('Open upgrade modal')
                }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          
          {/* 步骤1: 选择模板 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center">
                1
              </div>
              <Label className="text-base font-medium">选择模板</Label>
            </div>
            
            <Select onValueChange={handleTemplateSelect} value={selectedTemplate?.id || ""}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择一个模板开始生成..." />
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
                <Label className="text-base font-medium">填写信息</Label>
              </div>

              <div className="grid gap-4">
                {selectedTemplate.fields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    
                    {field.type === 'text' && (
                      <Input
                        id={field.name}
                        placeholder={field.placeholder}
                        value={formData[field.name] || ''}
                        onChange={(e) => updateFormData(field.name, e.target.value)}
                        className="w-full"
                      />
                    )}
                    
                    {field.type === 'textarea' && (
                      <Textarea
                        id={field.name}
                        placeholder={field.placeholder}
                        value={formData[field.name] || ''}
                        onChange={(e) => updateFormData(field.name, e.target.value)}
                        rows={3}
                        className="w-full"
                      />
                    )}
                    
                    {field.type === 'select' && (
                      <Select 
                        onValueChange={(value) => updateFormData(field.name, value)}
                        value={formData[field.name] || ''}
                      >
                        <SelectTrigger>
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
                    ? "text-yellow-700 bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800" 
                    : "text-red-600 bg-red-50 dark:bg-red-900/20"
                )}>
                  <AlertCircle className="h-4 w-4" />
                  <div className="flex-1">
                    <span className="text-sm">{error}</span>
                    {usageLimitReached && (
                      <div className="mt-2">
                        <Button 
                          size="sm" 
                          onClick={() => {
                            // 打开升级模态框
                            console.log('Open upgrade modal')
                          }}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                          立即升级到专业版
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 生成按钮 */}
              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !selectedTemplate}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    正在生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    生成提示词
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 步骤3: 生成结果 */}
      {generatedResult && (
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-sm flex items-center justify-center">
                  3
                </div>
                <CardTitle className="text-lg">生成结果</CardTitle>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="flex items-center gap-2"
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
                    title="下载为Markdown格式"
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
                    title="下载为文本格式"
                  >
                    <File className="h-3 w-3" />
                    .txt
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={printAsPDF}
                    disabled={isDownloading}
                    className="flex items-center gap-1 text-xs"
                    title="打印为PDF"
                  >
                    <Printer className="h-3 w-3" />
                    PDF
                  </Button>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startOver}
                >
                  重新生成
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  使用模板：{generatedResult.template.title}
                </div>
                {isDownloading && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    正在处理...
                  </div>
                )}
              </div>
              
              {/* 下载错误提示 */}
              {downloadError && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{downloadError}</span>
                </div>
              )}
              
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {generatedResult.content}
                </pre>
              </div>
              
              {/* 下载说明 */}
              <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
                💡 提示：点击上方按钮可将提示词下载为不同格式的文档，方便保存和分享
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 空状态提示 */}
      {!selectedTemplate && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Wand2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">开始创建您的专业提示词</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              选择一个适合您需求的模板，填写相关信息，我们将为您生成专业的 AI 提示词
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                专业模板优化
              </div>
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-blue-500" />
                一键文档下载
              </div>
              <div className="flex items-center gap-2">
                <Copy className="h-4 w-4 text-green-500" />
                快速复制使用
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}