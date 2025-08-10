'use client'

import { useState, useMemo } from 'react'
import { useTemplates } from '@/lib/hooks/use-templates'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Filter, 
  Clock, 
  Star, 
  Users, 
  Sparkles,
  ChevronRight,
  BookOpen,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PromptTemplate } from '../types'

interface TemplateSelectionStepProps {
  selectedTemplate: PromptTemplate | null
  onTemplateSelect: (template: PromptTemplate) => void
  onNext: () => void
  industry?: string
}

// Industry mapping for consistent naming
const INDUSTRY_MAP: { [key: string]: string } = {
  'lawyers': 'Legal',
  'realtors': 'Real Estate', 
  'insurance-advisors': 'Insurance',
  'teachers': 'Education',
  'accountants': 'Accounting'
}


export default function TemplateSelectionStep({
  selectedTemplate,
  onTemplateSelect,
  onNext,
  industry
}: TemplateSelectionStepProps) {
  const [searchQuery, setSearchQuery] = useState('')
  // Map industry prop to display name
  const mappedIndustry = industry && INDUSTRY_MAP[industry] ? INDUSTRY_MAP[industry] : industry
  const [selectedIndustry, setSelectedIndustry] = useState<string>(mappedIndustry || 'all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')

  // Get unique industries and difficulties
  const industries = useMemo(() => {
    const uniqueIndustries = [...new Set(MOCK_TEMPLATES.map(t => t.industry))]
    return ['all', ...uniqueIndustries]
  }, [])

  const difficulties = useMemo(() => {
    const uniqueDifficulties = [...new Set(MOCK_TEMPLATES.map(t => t.difficulty))]
    return ['all', ...uniqueDifficulties]
  }, [])

  // Filter templates based on search and filters
  const filteredTemplates = useMemo(() => {
    return MOCK_TEMPLATES.filter(template => {
      const matchesSearch = !searchQuery || 
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesIndustry = selectedIndustry === 'all' || 
        template.industry.toLowerCase() === selectedIndustry.toLowerCase() ||
        (mappedIndustry && template.industry.toLowerCase() === mappedIndustry.toLowerCase())
      const matchesDifficulty = selectedDifficulty === 'all' || template.difficulty === selectedDifficulty

      return matchesSearch && matchesIndustry && matchesDifficulty
    })
  }, [searchQuery, selectedIndustry, selectedDifficulty])

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return <BookOpen className="h-3 w-3" />
      case 'intermediate': return <Zap className="h-3 w-3" />
      case 'advanced': return <Star className="h-3 w-3" />
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Choose Your Template</h2>
        <p className="text-muted-foreground">
          {mappedIndustry && mappedIndustry !== 'all' 
            ? `为${mappedIndustry}专业人士提供的专业模板，每个模板都针对您的行业需求进行了优化。`
            : '选择与您的行业和用例匹配的模板。每个模板都针对特定的专业需求进行了优化。'
          }
        </p>
        {mappedIndustry && mappedIndustry !== 'all' && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
            <Sparkles className="h-3 w-3" />
            {mappedIndustry} Templates
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索模板..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            {industries.map(industry => (
              <option key={industry} value={industry}>
                {industry === 'all' ? '所有行业' : industry}
              </option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            {difficulties.map(difficulty => (
              <option key={difficulty} value={difficulty}>
                {difficulty === 'all' ? '所有难度' : 
                  difficulty === 'beginner' ? '初级' :
                  difficulty === 'intermediate' ? '中级' :
                  difficulty === 'advanced' ? '高级' :
                  difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          找到 {filteredTemplates.length} 个模板
        </p>
        {selectedTemplate && (
          <Button onClick={onNext} className="flex items-center gap-2">
            使用 "{selectedTemplate.title}" 继续
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Template Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-lg",
              selectedTemplate?.id === template.id
                ? "ring-2 ring-primary shadow-lg"
                : "hover:border-primary/50"
            )}
            onClick={() => onTemplateSelect(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {template.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-xs">
                      {template.industry}
                    </Badge>
                    <span>•</span>
                    <span>{template.category}</span>
                  </div>
                </div>
              </div>
              
              <CardDescription className="text-sm">
                {template.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Difficulty and Time */}
              <div className="flex items-center justify-between">
                <Badge 
                  variant="secondary" 
                  className={cn("text-xs", getDifficultyColor(template.difficulty))}
                >
                  {getDifficultyIcon(template.difficulty)}
                  <span className="ml-1">{template.difficulty.charAt(0).toUpperCase() + template.difficulty.slice(1)}</span>
                </Badge>
                
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {template.estimatedTime}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {template.tags.slice(0, 3).map((tag, index) => (
                  <span 
                    key={index}
                    className="text-xs px-2 py-1 bg-muted/50 text-muted-foreground rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {template.tags.length > 3 && (
                  <span className="text-xs px-2 py-1 text-muted-foreground">
                    +{template.tags.length - 3}
                  </span>
                )}
              </div>

              {/* Use Cases Preview */}
              <div className="pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-1">使用场景:</p>
                <div className="space-y-1">
                  {template.useCases.slice(0, 2).map((useCase, index) => (
                    <div key={index} className="text-xs text-muted-foreground flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {useCase}
                    </div>
                  ))}
                  {template.useCases.length > 2 && (
                    <p className="text-xs text-muted-foreground">
                      +{template.useCases.length - 2} more...
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {!loading && !error && filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 opacity-20">
            <Filter className="w-full h-full" />
          </div>
          <h3 className="text-lg font-medium mb-2">未找到模板</h3>
          <p className="text-muted-foreground">
            请尝试调整您的搜索条件或筛选器来查找模板。
          </p>
        </div>
      )}
    </div>
  )
}