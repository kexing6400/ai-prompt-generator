'use client'

import { useState, useCallback } from 'react'

interface FormData {
  industry: string
  scenario: string
  prompt: string
  context: string
}

interface UsePromptGeneratorReturn {
  loading: boolean
  result: string
  error: string
  formData: FormData
  setFormData: (data: FormData) => void
  updateFormData: (field: keyof FormData, value: string) => void
  handleSubmit: () => Promise<void>
  clearResult: () => void
  copyToClipboard: () => Promise<void>
  saveDraft: () => void
  loadDraft: () => void
}

export function usePromptGenerator(defaultIndustry: string): UsePromptGeneratorReturn {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<FormData>({
    industry: defaultIndustry,
    scenario: '',
    prompt: '',
    context: ''
  })

  // 更新表单数据
  const updateFormData = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  // 提交处理函数
  const handleSubmit = useCallback(async () => {
    if (!formData.scenario.trim() || !formData.prompt.trim()) {
      setError('请填写场景选择和具体需求描述')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      // 使用优化后的主API端点
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: formData.industry,
          scenario: formData.scenario,
          goal: formData.prompt,  // prompt 映射到 goal
          requirements: formData.context || '',  // context 映射到 requirements
          locale: localStorage.getItem('locale') || 'zh'  // 添加语言参数
        })
      })
      
      const data = await response.json()
      if (data.success) {
        // v2 API 返回的是 prompt 字段
        setResult(data.prompt)
        // 自动保存成功的结果
        localStorage.setItem(`prompt-result-${formData.industry}`, data.prompt)
        // 可选：显示质量分数
        if (data.qualityScore) {
          console.log(`生成质量分数: ${data.qualityScore}/100`)
        }
      } else {
        setError(data.error || '生成失败，请稍后重试')
      }
    } catch (err) {
      setError('网络错误，请检查网络连接后重试')
    } finally {
      setLoading(false)
    }
  }, [formData])

  // 清空结果
  const clearResult = useCallback(() => {
    setResult('')
    setError('')
  }, [])

  // 复制到剪贴板
  const copyToClipboard = useCallback(async () => {
    if (!result) return
    
    try {
      await navigator.clipboard.writeText(result)
      // 这里可以显示成功提示，但为了简化，我们用简单的alert
      const originalError = error
      setError('')
      setTimeout(() => setError(originalError), 2000)
    } catch (err) {
      setError('复制失败，请手动选择复制')
    }
  }, [result, error])

  // 保存草稿
  const saveDraft = useCallback(() => {
    const draftKey = `prompt-draft-${formData.industry}`
    localStorage.setItem(draftKey, JSON.stringify(formData))
  }, [formData])

  // 加载草稿
  const loadDraft = useCallback(() => {
    try {
      const draftKey = `prompt-draft-${formData.industry}`
      const savedDraft = localStorage.getItem(draftKey)
      if (savedDraft) {
        const draft = JSON.parse(savedDraft)
        setFormData(draft)
      }
    } catch (err) {
      console.error('加载草稿失败:', err)
    }
  }, [formData.industry])

  return {
    loading,
    result,
    error,
    formData,
    setFormData,
    updateFormData,
    handleSubmit,
    clearResult,
    copyToClipboard,
    saveDraft,
    loadDraft
  }
}