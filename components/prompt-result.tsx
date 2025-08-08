'use client'

import { useState } from 'react'
import { CheckCircle, Copy, Download, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PromptResultProps {
  result: string
  loading: boolean
  error: string
  onCopy: () => Promise<void>
  onClear: () => void
  onRegenerate?: () => void
}

export default function PromptResult({ 
  result, 
  loading, 
  error, 
  onCopy, 
  onClear,
  onRegenerate 
}: PromptResultProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const element = document.createElement('a')
    const file = new Blob([result], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `prompt-${Date.now()}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  if (loading) {
    return (
      <Card className="mt-6 border-2 border-dashed border-gray-200">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            <p className="text-gray-600">AI正在生成专业提示词，请稍候...</p>
            <p className="text-sm text-gray-400">这通常需要10-30秒</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="mt-6 border-2 border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-700">
            <X className="h-5 w-5" />
            <div>
              <p className="font-medium">生成失败</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!result) return null

  return (
    <Card className="mt-6 border-2 border-green-200 bg-green-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            生成成功！
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 结果展示 */}
        <div className="rounded-lg bg-white border p-4 max-h-96 overflow-y-auto">
          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
            {result}
          </pre>
        </div>

        {/* 字数统计 */}
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>字数：{result.length} 字符</span>
          <span>预计阅读时间：{Math.ceil(result.length / 500)} 分钟</span>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={handleCopy}
            disabled={copied}
            className="flex-1 sm:flex-none"
          >
            {copied ? (
              <CheckCircle className="mr-2 h-4 w-4" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            {copied ? '已复制！' : '复制提示词'}
          </Button>

          <Button
            variant="outline"
            onClick={handleDownload}
            className="flex-1 sm:flex-none"
          >
            <Download className="mr-2 h-4 w-4" />
            下载文件
          </Button>

          {onRegenerate && (
            <Button
              variant="outline"
              onClick={onRegenerate}
              className="flex-1 sm:flex-none"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              重新生成
            </Button>
          )}
        </div>

        {/* 使用提示 */}
        <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">使用建议</div>
            <div className="text-blue-600">
              将生成的提示词复制到ChatGPT、Claude、文心一言等AI助手中使用。
              根据具体情况可以进一步调整和优化。
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}