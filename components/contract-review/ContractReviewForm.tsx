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
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle2,
  Search,
  Shield,
  Scale,
  Loader2,
  Download,
  Copy,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

// 合同类型定义
const contractTypes = [
  { id: 'sale', name: '买卖合同', risk: 'medium', icon: '📄' },
  { id: 'service', name: '服务合同', risk: 'low', icon: '🤝' },
  { id: 'lease', name: '租赁合同', risk: 'medium', icon: '🏠' },
  { id: 'employment', name: '劳动合同', risk: 'high', icon: '👥' },
  { id: 'equity', name: '股权转让合同', risk: 'high', icon: '📈' },
  { id: 'nda', name: '保密协议', risk: 'medium', icon: '🔒' },
  { id: 'investment', name: '投资协议', risk: 'high', icon: '💰' },
  { id: 'partnership', name: '合伙协议', risk: 'high', icon: '🤝' }
]

// 审查重点选项
const reviewFocusOptions = [
  { id: 'payment', name: '付款条件', description: '付款方式、时间、违约责任' },
  { id: 'liability', name: '责任条款', description: '违约责任、赔偿限制、免责条件' },
  { id: 'termination', name: '终止条款', description: '合同终止条件、后果处理' },
  { id: 'ip', name: '知识产权', description: '知识产权归属、使用许可' },
  { id: 'confidentiality', name: '保密条款', description: '保密范围、期限、违约后果' },
  { id: 'dispute', name: '争议解决', description: '管辖法院、仲裁约定' },
  { id: 'force-majeure', name: '不可抗力', description: '不可抗力认定、处理方式' },
  { id: 'modification', name: '变更条款', description: '合同变更程序、生效条件' }
]

// 风险等级配置
const riskLevels = {
  low: { color: 'text-green-600', bg: 'bg-green-100', label: '低风险' },
  medium: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: '中风险' },
  high: { color: 'text-red-600', bg: 'bg-red-100', label: '高风险' }
}

interface ContractReviewData {
  contractType: string
  contractTitle: string
  parties: string
  contractValue: string
  reviewFocus: string[]
  riskTolerance: string
  timeframe: string
  specificConcerns: string
  regulatoryRequirements: string
}

interface ReviewResult {
  id: string
  summary: string
  riskAnalysis: Array<{
    category: string
    risk: 'low' | 'medium' | 'high'
    description: string
    suggestion: string
  }>
  recommendations: string[]
  missingClauses: string[]
  createdAt: Date
}

export default function ContractReviewForm() {
  const [formData, setFormData] = useState<ContractReviewData>({
    contractType: '',
    contractTitle: '',
    parties: '',
    contractValue: '',
    reviewFocus: [],
    riskTolerance: '',
    timeframe: '',
    specificConcerns: '',
    regulatoryRequirements: ''
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // 更新表单数据
  const updateFormData = useCallback((field: keyof ContractReviewData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }, [])

  // 处理审查重点选择
  const handleFocusChange = useCallback((focusId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      reviewFocus: checked 
        ? [...prev.reviewFocus, focusId]
        : prev.reviewFocus.filter(id => id !== focusId)
    }))
  }, [])

  // 表单验证
  const validateForm = useCallback(() => {
    if (!formData.contractType) {
      setError('请选择合同类型')
      return false
    }
    if (!formData.contractTitle.trim()) {
      setError('请输入合同标题')
      return false
    }
    if (!formData.parties.trim()) {
      setError('请输入当事人信息')
      return false
    }
    if (formData.reviewFocus.length === 0) {
      setError('请至少选择一个审查重点')
      return false
    }
    if (!formData.riskTolerance) {
      setError('请选择风险容忍度')
      return false
    }
    return true
  }, [formData])

  // 生成合同审查报告
  const generateReview = useCallback(async () => {
    if (!validateForm()) return

    setIsGenerating(true)
    setError(null)

    try {
      // 构建专业的合同审查提示词
      const reviewPrompt = `
作为资深合同法律师，请对以下合同进行专业审查：

合同信息：
- 合同类型：${formData.contractType}
- 合同标题：${formData.contractTitle}
- 当事人：${formData.parties}
- 合同价值：${formData.contractValue || '未提供'}
- 审查重点：${formData.reviewFocus.map(id => reviewFocusOptions.find(opt => opt.id === id)?.name).join('、')}
- 风险容忍度：${formData.riskTolerance}
- 时间要求：${formData.timeframe || '常规审查'}
- 特殊关注：${formData.specificConcerns || '无'}
- 合规要求：${formData.regulatoryRequirements || '标准合规'}

请提供结构化的合同审查报告，包括：
1. 整体风险评估
2. 重点条款分析
3. 风险识别与建议
4. 缺失条款补充建议
5. 修改意见和谈判要点

要求专业严谨，实用性强。`

      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: reviewPrompt,
          industry: 'lawyer',
          template: 'contract-review-detailed'
        })
      })

      if (!response.ok) {
        throw new Error('生成审查报告失败')
      }

      const data = await response.json()

      // 模拟结构化的审查结果
      const result: ReviewResult = {
        id: Date.now().toString(),
        summary: data.content,
        riskAnalysis: [
          {
            category: '付款条件',
            risk: 'medium' as const,
            description: '付款条件需要更明确的约定',
            suggestion: '建议增加付款担保措施'
          },
          {
            category: '违约责任',
            risk: 'high' as const,
            description: '违约责任条款不够完善',
            suggestion: '需要明确具体的违约情形和责任承担方式'
          }
        ],
        recommendations: [
          '增强付款保障措施',
          '完善违约责任条款',
          '明确争议解决机制'
        ],
        missingClauses: [
          '不可抗力条款',
          '保密约定',
          '知识产权归属'
        ],
        createdAt: new Date()
      }

      setReviewResult(result)

    } catch (error) {
      console.error('Review generation error:', error)
      setError(error instanceof Error ? error.message : '生成审查报告失败')
    } finally {
      setIsGenerating(false)
    }
  }, [formData, validateForm])

  // 复制结果
  const copyToClipboard = useCallback(async () => {
    if (!reviewResult) return

    try {
      await navigator.clipboard.writeText(reviewResult.summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }, [reviewResult])

  // 重置表单
  const resetForm = useCallback(() => {
    setFormData({
      contractType: '',
      contractTitle: '',
      parties: '',
      contractValue: '',
      reviewFocus: [],
      riskTolerance: '',
      timeframe: '',
      specificConcerns: '',
      regulatoryRequirements: ''
    })
    setReviewResult(null)
    setError(null)
  }, [])

  const selectedContractType = contractTypes.find(type => type.id === formData.contractType)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* 页面标题 */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <FileText className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">合同审查助手</h1>
        </div>
        <p className="text-gray-600">
          专业的合同条款分析，全面的风险识别，精准的修改建议
        </p>
      </div>

      {/* 合同基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            合同基本信息
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>合同类型 *</Label>
            <Select 
              value={formData.contractType} 
              onValueChange={(value) => updateFormData('contractType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="请选择合同类型" />
              </SelectTrigger>
              <SelectContent>
                {contractTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <span>{type.name}</span>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          'ml-2 text-xs',
                          riskLevels[type.risk as keyof typeof riskLevels].color
                        )}
                      >
                        {riskLevels[type.risk as keyof typeof riskLevels].label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>合同标题 *</Label>
            <Input
              placeholder="例如：软件开发服务合同"
              value={formData.contractTitle}
              onChange={(e) => updateFormData('contractTitle', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>当事人信息 *</Label>
            <Input
              placeholder="例如：甲方XX公司，乙方XX公司"
              value={formData.parties}
              onChange={(e) => updateFormData('parties', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>合同金额</Label>
            <Input
              placeholder="例如：100万元"
              value={formData.contractValue}
              onChange={(e) => updateFormData('contractValue', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 审查配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            审查重点配置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div>
            <Label className="text-base mb-4 block">选择审查重点 *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviewFocusOptions.map((option) => (
                <div key={option.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id={option.id}
                    checked={formData.reviewFocus.includes(option.id)}
                    onCheckedChange={(checked) => handleFocusChange(option.id, checked as boolean)}
                  />
                  <div className="flex-1">
                    <label htmlFor={option.id} className="text-sm font-medium cursor-pointer">
                      {option.name}
                    </label>
                    <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>风险容忍度 *</Label>
              <Select 
                value={formData.riskTolerance} 
                onValueChange={(value) => updateFormData('riskTolerance', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择风险容忍度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">保守型（严格审查）</SelectItem>
                  <SelectItem value="moderate">稳健型（标准审查）</SelectItem>
                  <SelectItem value="aggressive">进取型（快速审查）</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>时间要求</Label>
              <Select 
                value={formData.timeframe} 
                onValueChange={(value) => updateFormData('timeframe', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择时间要求" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">紧急（24小时）</SelectItem>
                  <SelectItem value="normal">常规（3-5天）</SelectItem>
                  <SelectItem value="detailed">详细（1-2周）</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>特殊关注事项</Label>
            <Textarea
              placeholder="例如：特别关注知识产权条款，需要加强保密措施..."
              value={formData.specificConcerns}
              onChange={(e) => updateFormData('specificConcerns', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>合规要求</Label>
            <Textarea
              placeholder="例如：需符合网络安全法要求，满足数据保护合规..."
              value={formData.regulatoryRequirements}
              onChange={(e) => updateFormData('regulatoryRequirements', e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* 生成按钮 */}
      <div className="text-center">
        <Button
          onClick={generateReview}
          disabled={isGenerating}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 px-8"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              正在生成审查报告...
            </>
          ) : (
            <>
              <Scale className="w-5 h-5 mr-2" />
              生成合同审查报告
            </>
          )}
        </Button>
      </div>

      {/* 审查结果 */}
      {reviewResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                审查报告
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-1 text-green-600" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      复制
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  重新审查
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* 风险分析摘要 */}
            <div>
              <h3 className="font-semibold mb-3">风险分析摘要</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviewResult.riskAnalysis.map((risk, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{risk.category}</h4>
                      <Badge className={riskLevels[risk.risk].bg + ' ' + riskLevels[risk.risk].color}>
                        {riskLevels[risk.risk].label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{risk.description}</p>
                    <p className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
                      💡 {risk.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 详细报告 */}
            <div>
              <h3 className="font-semibold mb-3">详细审查报告</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                  {reviewResult.summary}
                </pre>
              </div>
            </div>

            {/* 建议和缺失条款 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-green-700">修改建议</h3>
                <ul className="space-y-2">
                  {reviewResult.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-orange-700">缺失条款</h3>
                <ul className="space-y-2">
                  {reviewResult.missingClauses.map((clause, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      {clause}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 生成信息 */}
            <div className="text-xs text-gray-500 border-t pt-4">
              生成时间：{reviewResult.createdAt.toLocaleString()} | 
              合同类型：{selectedContractType?.name} | 
              审查重点：{formData.reviewFocus.length} 项
            </div>

          </CardContent>
        </Card>
      )}
    </div>
  )
}