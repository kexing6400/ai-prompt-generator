'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  ChevronLeft, 
  Copy,
  Download,
  Sparkles,
  Zap,
  FileText,
  CheckCircle2,
  RefreshCw,
  MessageSquare,
  Settings,
  Clock,
  RotateCcw,
  Loader2,
  Bot
} from 'lucide-react'
import { cn } from '@/lib/utils'
import AIChat from '@/components/ai-chat/AIChat'
import type { PromptTemplate, FormData, GeneratedPrompt } from '../types'

interface AIGenerationStepProps {
  template: PromptTemplate
  formData: FormData
  generatedPrompt: GeneratedPrompt | null
  isGenerating: boolean
  onGenerate: (prompt: GeneratedPrompt) => void
  onSetGenerating: (loading: boolean) => void
  onBack: () => void
  onReset: () => void
}

export default function AIGenerationStep({
  template,
  formData,
  generatedPrompt,
  isGenerating,
  onGenerate,
  onSetGenerating,
  onBack,
  onReset
}: AIGenerationStepProps) {
  const [copySuccess, setCopySuccess] = useState<string>('')
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [editablePrompt, setEditablePrompt] = useState('')
  const [showAIChat, setShowAIChat] = useState(false)

  // Generate the base prompt from template and form data
  const generateBasePrompt = (): string => {
    let prompt = `# ${template.title}\n\n`
    
    prompt += `## System Role\n${template.prompt.system}\n\n`
    
    let contextWithData = template.prompt.context
    let taskWithData = template.prompt.task
    
    // Replace placeholders with actual form data
    template.fields.forEach(field => {
      const value = formData[field.name]
      const placeholder = `{${field.name}}`
      const displayValue = Array.isArray(value) 
        ? value.join(', ') 
        : String(value || '[Please specify]')
      
      contextWithData = contextWithData.replace(new RegExp(placeholder, 'g'), displayValue)
      taskWithData = taskWithData.replace(new RegExp(placeholder, 'g'), displayValue)
    })
    
    prompt += `## Context\n${contextWithData}\n\n`
    prompt += `## Task Requirements\n${taskWithData}\n\n`
    prompt += `## Output Format\n${template.prompt.format}\n\n`
    prompt += `## Examples\n${template.prompt.examples}\n\n`
    
    // Add dynamic sections based on form data
    prompt += `## Specific Requirements\n`
    template.fields.forEach(field => {
      const value = formData[field.name]
      if (value && value !== '') {
        const displayValue = Array.isArray(value) ? value.join(', ') : String(value)
        prompt += `- **${field.label}**: ${displayValue}\n`
      }
    })
    
    return prompt
  }

  // Simulate AI generation
  const handleGenerate = async () => {
    onSetGenerating(true)
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const basePrompt = generateBasePrompt()
      const generatedResult: GeneratedPrompt = {
        id: `generated_${Date.now()}`,
        title: `Custom ${template.title}`,
        content: basePrompt,
        template,
        formData,
        createdAt: new Date(),
        optimizations: [
          'Added specific context based on your inputs',
          'Optimized for your industry requirements',
          'Included relevant examples and best practices',
          'Structured for maximum clarity and effectiveness'
        ]
      }
      
      onGenerate(generatedResult)
      setEditablePrompt(basePrompt)
      
    } catch (error) {
      console.error('Generation failed:', error)
    } finally {
      onSetGenerating(false)
    }
  }

  // Simulate optimization
  const handleOptimize = async () => {
    if (!generatedPrompt) return
    
    setIsOptimizing(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Add optimization suggestions
      const optimizedContent = editablePrompt + `\n\n## AI Optimization Suggestions\n- Consider adding more specific examples related to your use case\n- You might want to specify the desired tone and style\n- Include any constraints or limitations that should be considered\n- Add success criteria for the output`
      
      const optimizedPrompt: GeneratedPrompt = {
        ...generatedPrompt,
        content: optimizedContent,
        optimizations: [
          ...generatedPrompt.optimizations || [],
          'Added AI-powered optimization suggestions',
          'Enhanced with industry-specific guidance',
          'Improved prompt structure and clarity'
        ]
      }
      
      onGenerate(optimizedPrompt)
      setEditablePrompt(optimizedContent)
      
    } catch (error) {
      console.error('Optimization failed:', error)
    } finally {
      setIsOptimizing(false)
    }
  }

  // Copy to clipboard
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(label)
      setTimeout(() => setCopySuccess(''), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Download as file
  const downloadPrompt = () => {
    if (!generatedPrompt) return
    
    const element = document.createElement('a')
    const file = new Blob([generatedPrompt.content], { type: 'text/markdown' })
    element.href = URL.createObjectURL(file)
    element.download = `${generatedPrompt.title.toLowerCase().replace(/\s+/g, '-')}.md`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  // Update editable prompt
  useEffect(() => {
    if (generatedPrompt) {
      setEditablePrompt(generatedPrompt.content)
    }
  }, [generatedPrompt])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">AI-Generated Prompt</h2>
            <p className="text-muted-foreground">
              Your customized prompt is ready. Review, edit, and use it in your AI conversations.
            </p>
          </div>
          {generatedPrompt && (
            <Badge variant="secondary" className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3" />
              Generated {generatedPrompt.createdAt.toLocaleTimeString()}
            </Badge>
          )}
        </div>

        {/* Template Summary */}
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-medium">{template.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">{template.industry}</Badge>
                    <span>•</span>
                    <span>{template.fields.filter(field => formData[field.name]).length} inputs provided</span>
                  </div>
                </div>
              </div>
              {!generatedPrompt && (
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Generate Prompt
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generation Loading State */}
      {isGenerating && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <Sparkles className="h-6 w-6 absolute top-3 left-3 text-primary-foreground" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium">Generating Your Custom Prompt</h3>
                <p className="text-muted-foreground">
                  Our AI is analyzing your inputs and creating an optimized prompt...
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                This usually takes 2-3 seconds
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Prompt Display */}
      {generatedPrompt && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Prompt Editor */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Your Generated Prompt</CardTitle>
                  <div className="flex items-center gap-2">
                    <Dialog open={showAIChat} onOpenChange={setShowAIChat}>
                      <DialogTrigger asChild>
                        <Button
                          variant="default"
                          size="sm"
                          className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                        >
                          <Bot className="h-4 w-4" />
                          AI优化助手
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0">
                        <DialogHeader className="px-6 py-4 border-b">
                          <DialogTitle className="flex items-center gap-2">
                            <Bot className="h-5 w-5" />
                            AI提示词优化助手
                          </DialogTitle>
                        </DialogHeader>
                        <div className="p-6">
                          <AIChat
                            initialPrompt={editablePrompt}
                            onOptimizedPrompt={(optimizedPrompt) => {
                              setEditablePrompt(optimizedPrompt);
                              // 更新生成的提示词
                              if (generatedPrompt) {
                                const updatedPrompt: GeneratedPrompt = {
                                  ...generatedPrompt,
                                  content: optimizedPrompt,
                                  optimizations: [
                                    ...generatedPrompt.optimizations || [],
                                    'AI助手优化建议已应用',
                                    '提升了提示词的专业性和效果'
                                  ]
                                };
                                onGenerate(updatedPrompt);
                              }
                              setShowAIChat(false);
                            }}
                            className="h-[600px]"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOptimize}
                      disabled={isOptimizing}
                      className="flex items-center gap-2"
                    >
                      {isOptimizing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Optimizing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          快速优化
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  Review and edit your prompt. Changes are automatically saved.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={editablePrompt}
                  onChange={(e) => setEditablePrompt(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                  placeholder="Your generated prompt will appear here..."
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => copyToClipboard(editablePrompt, 'prompt')}
                  className="flex items-center gap-2"
                  variant={copySuccess === 'prompt' ? 'secondary' : 'default'}
                >
                  {copySuccess === 'prompt' ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Prompt
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={downloadPrompt}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                {editablePrompt.split('\n').length} lines, {editablePrompt.length} characters
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Bot className="h-4 w-4 mr-2" />
                      AI对话优化
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0">
                    <DialogHeader className="px-6 py-4 border-b">
                      <DialogTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        AI提示词优化助手
                      </DialogTitle>
                    </DialogHeader>
                    <div className="p-6">
                      <AIChat
                        initialPrompt={editablePrompt}
                        onOptimizedPrompt={(optimizedPrompt) => {
                          setEditablePrompt(optimizedPrompt);
                          if (generatedPrompt) {
                            const updatedPrompt: GeneratedPrompt = {
                              ...generatedPrompt,
                              content: optimizedPrompt,
                              optimizations: [
                                ...generatedPrompt.optimizations || [],
                                'AI专家优化完成',
                                '应用了最新的提示词工程技术'
                              ]
                            };
                            onGenerate(updatedPrompt);
                          }
                        }}
                        className="h-[600px]"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={downloadPrompt}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Create Document
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {/* TODO: Share functionality */}}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Share Template
                </Button>
              </CardContent>
            </Card>

            {/* Optimization Results */}
            {generatedPrompt.optimizations && generatedPrompt.optimizations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">AI Optimizations</CardTitle>
                  <CardDescription>
                    Improvements made to your prompt
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {generatedPrompt.optimizations.map((optimization, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{optimization}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Usage Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usage Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="font-medium">🤖</span>
                    使用AI助手进行深度优化和专业分析
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">📋</span>
                    复制提示词到ChatGPT、Claude等AI工具中使用
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">✏️</span>
                    可直接编辑提示词添加更具体的要求
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">💾</span>
                    保存为模板以便将来重复使用
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">🔄</span>
                    通过不同输入测试和完善提示词效果
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Inputs
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={onReset}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            Create New Prompt
          </Button>
          
          {generatedPrompt && (
            <Button
              onClick={() => copyToClipboard(editablePrompt, 'final')}
              className="flex items-center gap-2"
              variant={copySuccess === 'final' ? 'secondary' : 'default'}
            >
              {copySuccess === 'final' ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy & Use
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}