'use client'

import { useState, useEffect } from 'react'
import { 
  Sparkles,
  Grid3X3,
  List,
  Search,
  TrendingUp,
  BookOpen,
  Users,
  LucideIcon
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import TemplateCard from './template-card'
import { Badge } from './ui/badge'

interface Template {
  id: string
  title: string
  category: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  prompt: {
    system: string
    context: string
    task: string
    format: string
    examples: string
  }
  tags: string[]
  useCases: string[]
  bestPractices: string[]
}

interface IndustryTemplatesPageProps {
  industryKey: 'lawyer' | 'realtor' | 'insurance' | 'teacher' | 'accountant'
  industryName: string
  industryTitle: string
  industryDescription: string
  industryIcon: LucideIcon
  gradientClass: string
}

export default function IndustryTemplatesPage({
  industryKey,
  industryName,
  industryTitle,
  industryDescription,
  industryIcon: IconComponent,
  gradientClass
}: IndustryTemplatesPageProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // 获取行业模板
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch(`/api/templates/list?industry=${industryKey}`)
        const data = await response.json()
        if (data.success) {
          setTemplates(data.templates || [])
          setFilteredTemplates(data.templates || [])
        }
      } catch (error) {
        console.error('获取模板失败:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchTemplates()
  }, [industryKey])

  // 过滤模板
  useEffect(() => {
    let filtered = [...templates]
    
    // 搜索过滤
    if (searchQuery) {
      filtered = filtered.filter(template => 
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }
    
    // 分类过滤
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory)
    }
    
    // 难度过滤
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(template => template.difficulty === selectedDifficulty)
    }
    
    setFilteredTemplates(filtered)
  }, [searchQuery, selectedCategory, selectedDifficulty, templates])

  // 获取所有分类
  const categories = Array.from(new Set(templates.map(t => t.category)))
  
  // 统计数据
  const stats = {
    total: templates.length,
    beginner: templates.filter(t => t.difficulty === 'beginner').length,
    intermediate: templates.filter(t => t.difficulty === 'intermediate').length,
    advanced: templates.filter(t => t.difficulty === 'advanced').length
  }

  // 难度标签映射
  const difficultyLabels = {
    beginner: '初级',
    intermediate: '中级',
    advanced: '高级'
  }

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-${industryKey}/5 via-white to-${industryKey}/10 flex items-center justify-center`}>
        <div className="text-center">
          <Sparkles className={`h-8 w-8 text-${industryKey} animate-pulse mx-auto mb-4`} />
          <p className="text-gray-600">加载模板中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-${industryKey}/5 via-white to-${industryKey}/10`}>
      {/* 页面标题 */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
        
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center gap-6">
            <div className={`h-20 w-20 rounded-2xl ${gradientClass} flex items-center justify-center`}>
              <IconComponent className="h-10 w-10 text-white" />
            </div>
            
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900">
                {industryTitle}
              </h1>
              <p className="mt-2 text-xl text-gray-600">
                {industryDescription}
              </p>
              
              {/* 统计信息 */}
              <div className="mt-4 flex flex-wrap gap-4">
                <Badge variant="secondary" className="px-3 py-1">
                  <BookOpen className="h-3 w-3 mr-1" />
                  共 {stats.total} 个模板
                </Badge>
                <Badge variant="outline" className="px-3 py-1 bg-green-50 text-green-700 border-green-200">
                  初级 {stats.beginner} 个
                </Badge>
                <Badge variant="outline" className="px-3 py-1 bg-yellow-50 text-yellow-700 border-yellow-200">
                  中级 {stats.intermediate} 个
                </Badge>
                <Badge variant="outline" className="px-3 py-1 bg-red-50 text-red-700 border-red-200">
                  高级 {stats.advanced} 个
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 过滤和搜索栏 */}
      <section className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 搜索框 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="搜索模板..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* 分类筛选 */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-${industryKey}/20`}
            >
              <option value="all">所有分类</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            {/* 难度筛选 */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className={`px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-${industryKey}/20`}
            >
              <option value="all">所有难度</option>
              <option value="beginner">初级</option>
              <option value="intermediate">中级</option>
              <option value="advanced">高级</option>
            </select>
            
            {/* 视图切换 */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? gradientClass : ''}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? gradientClass : ''}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* 结果统计 */}
          <div className="mt-3 text-sm text-gray-600">
            找到 {filteredTemplates.length} 个符合条件的模板
          </div>
        </div>
      </section>

      {/* 模板列表 */}
      <section className="container mx-auto px-4 py-8">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">没有找到符合条件的模板</h3>
            <p className="mt-2 text-gray-600">请尝试调整搜索条件或筛选选项</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }>
            {filteredTemplates.map((template) => (
              <TemplateCard 
                key={template.id} 
                template={template}
                industryName={industryName}
              />
            ))}
          </div>
        )}
      </section>

      {/* 底部提示 */}
      <section className="container mx-auto px-4 py-8 border-t">
        <div className={`bg-${industryKey}/5 rounded-lg p-6`}>
          <div className="flex items-start gap-4">
            <div className={`h-10 w-10 rounded-lg ${gradientClass} flex items-center justify-center flex-shrink-0`}>
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                持续更新中
              </h3>
              <p className="text-gray-600 text-sm">
                我们的{industryName}AI提示词模板库会根据最新的行业实践和AI技术发展持续更新。
                建议您定期查看，获取最新的模板和最佳实践。
              </p>
              <div className="mt-4 flex gap-3">
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  联系专家团队
                </Button>
                <Button variant="outline" size="sm">
                  <BookOpen className="h-4 w-4 mr-2" />
                  查看使用指南
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}