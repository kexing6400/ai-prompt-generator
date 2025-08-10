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

  // Get industry templates
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
        console.error('Failed to fetch templates:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchTemplates()
  }, [industryKey])

  // Filter templates
  useEffect(() => {
    let filtered = [...templates]
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(template => 
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }
    
    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory)
    }
    
    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(template => template.difficulty === selectedDifficulty)
    }
    
    setFilteredTemplates(filtered)
  }, [searchQuery, selectedCategory, selectedDifficulty, templates])

  // Get all categories
  const categories = Array.from(new Set(templates.map(t => t.category)))
  
  // Statistics
  const stats = {
    total: templates.length,
    beginner: templates.filter(t => t.difficulty === 'beginner').length,
    intermediate: templates.filter(t => t.difficulty === 'intermediate').length,
    advanced: templates.filter(t => t.difficulty === 'advanced').length
  }

  // Difficulty labels mapping
  const difficultyLabels = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced'
  }

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-${industryKey}/5 via-white to-${industryKey}/10 flex items-center justify-center`}>
        <div className="text-center">
          <Sparkles className={`h-8 w-8 text-${industryKey} animate-pulse mx-auto mb-4`} />
          <p className="text-gray-600">Loading templates...</p>
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
              
              {/* Statistics */}
              <div className="mt-4 flex flex-wrap gap-4">
                <Badge variant="secondary" className="px-3 py-1">
                  <BookOpen className="h-3 w-3 mr-1" />
                  {stats.total} templates total
                </Badge>
                <Badge variant="outline" className="px-3 py-1 bg-green-50 text-green-700 border-green-200">
                  {stats.beginner} Beginner
                </Badge>
                <Badge variant="outline" className="px-3 py-1 bg-yellow-50 text-yellow-700 border-yellow-200">
                  {stats.intermediate} Intermediate
                </Badge>
                <Badge variant="outline" className="px-3 py-1 bg-red-50 text-red-700 border-red-200">
                  {stats.advanced} Advanced
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and search bar */}
      <section className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search box */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Category filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-${industryKey}/20`}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            {/* Difficulty filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className={`px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-${industryKey}/20`}
            >
              <option value="all">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            
            {/* View toggle */}
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
          
          {/* Results count */}
          <div className="mt-3 text-sm text-gray-600">
            Found {filteredTemplates.length} templates matching your criteria
          </div>
        </div>
      </section>

      {/* Template list */}
      <section className="container mx-auto px-4 py-8">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No templates found</h3>
            <p className="mt-2 text-gray-600">Try adjusting your search criteria or filters</p>
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

      {/* Footer info */}
      <section className="container mx-auto px-4 py-8 border-t">
        <div className={`bg-${industryKey}/5 rounded-lg p-6`}>
          <div className="flex items-start gap-4">
            <div className={`h-10 w-10 rounded-lg ${gradientClass} flex items-center justify-center flex-shrink-0`}>
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Continuously Updated
              </h3>
              <p className="text-gray-600 text-sm">
                Our {industryName} AI prompt template library is continuously updated based on the latest industry practices and AI technology developments. 
                We recommend checking back regularly to get the latest templates and best practices.
              </p>
              <div className="mt-4 flex gap-3">
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Contact Expert Team
                </Button>
                <Button variant="outline" size="sm">
                  <BookOpen className="h-4 w-4 mr-2" />
                  View Usage Guide
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}