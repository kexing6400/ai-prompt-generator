'use client'

import { useState, useMemo } from 'react'
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

// Mock template data - in a real app, this would come from an API
const MOCK_TEMPLATES: PromptTemplate[] = [
  {
    id: '1',
    title: 'Legal Document Analysis',
    category: 'Document Review',
    industry: 'Legal',
    description: 'Analyze legal contracts, agreements, and documents for key terms, risks, and compliance issues.',
    difficulty: 'advanced',
    estimatedTime: '10-15 min',
    tags: ['contract', 'compliance', 'risk-assessment', 'legal-analysis'],
    useCases: ['Contract review', 'Risk assessment', 'Compliance check', 'Legal research'],
    fields: [
      {
        id: 'document_type',
        name: 'document_type',
        label: 'Document Type',
        type: 'select',
        required: true,
        options: ['Contract', 'Agreement', 'Terms of Service', 'Privacy Policy', 'License'],
        helpText: 'Select the type of legal document to analyze'
      },
      {
        id: 'focus_areas',
        name: 'focus_areas',
        label: 'Focus Areas',
        type: 'multiselect',
        required: true,
        options: ['Risk factors', 'Compliance issues', 'Key terms', 'Financial obligations', 'Termination clauses'],
        helpText: 'What aspects should the analysis focus on?'
      },
      {
        id: 'jurisdiction',
        name: 'jurisdiction',
        label: 'Jurisdiction',
        type: 'text',
        required: false,
        placeholder: 'e.g., California, EU, Federal',
        helpText: 'Specify the legal jurisdiction if relevant'
      }
    ],
    prompt: {
      system: 'You are a senior legal analyst with expertise in contract review and legal document analysis.',
      context: 'Analyze the provided legal document with attention to detail and legal implications.',
      task: 'Provide a comprehensive analysis including key terms, potential risks, and compliance considerations.',
      format: 'Structured analysis with sections for summary, key findings, risks, and recommendations.',
      examples: 'Include specific examples of problematic clauses or beneficial terms found in the document.'
    },
    bestPractices: [
      'Always consider jurisdiction-specific laws',
      'Flag ambiguous language that could lead to disputes',
      'Identify missing standard clauses',
      'Assess financial and legal risks thoroughly'
    ]
  },
  {
    id: '2',
    title: 'Property Valuation Report',
    category: 'Market Analysis',
    industry: 'Real Estate',
    description: 'Generate comprehensive property valuation reports with market comparisons and investment potential.',
    difficulty: 'intermediate',
    estimatedTime: '8-12 min',
    tags: ['valuation', 'market-analysis', 'investment', 'property-assessment'],
    useCases: ['Property appraisal', 'Investment analysis', 'Market comparison', 'Listing preparation'],
    fields: [
      {
        id: 'property_type',
        name: 'property_type',
        label: 'Property Type',
        type: 'select',
        required: true,
        options: ['Residential', 'Commercial', 'Industrial', 'Land', 'Mixed-use'],
        helpText: 'What type of property are you evaluating?'
      },
      {
        id: 'location',
        name: 'location',
        label: 'Property Location',
        type: 'text',
        required: true,
        placeholder: 'City, State/Region',
        helpText: 'Enter the property location for market analysis'
      },
      {
        id: 'square_footage',
        name: 'square_footage',
        label: 'Square Footage',
        type: 'number',
        required: true,
        validation: { min: 1 },
        helpText: 'Total square footage of the property'
      },
      {
        id: 'special_features',
        name: 'special_features',
        label: 'Special Features',
        type: 'textarea',
        required: false,
        placeholder: 'Pool, garage, recent renovations, etc.',
        helpText: 'List any special features that might affect valuation'
      }
    ],
    prompt: {
      system: 'You are an experienced real estate appraiser and market analyst.',
      context: 'Provide professional property valuation based on current market data and property characteristics.',
      task: 'Generate a detailed valuation report with market comparisons and investment insights.',
      format: 'Professional report format with executive summary, methodology, and detailed analysis.',
      examples: 'Include comparable properties and market trends data.'
    },
    bestPractices: [
      'Use recent comparable sales data',
      'Consider local market conditions',
      'Factor in property condition and features',
      'Include investment potential analysis'
    ]
  },
  {
    id: '3',
    title: 'Insurance Claim Assessment',
    category: 'Claim Processing',
    industry: 'Insurance',
    description: 'Evaluate insurance claims for coverage determination, fraud detection, and settlement recommendations.',
    difficulty: 'advanced',
    estimatedTime: '12-18 min',
    tags: ['claims', 'assessment', 'fraud-detection', 'coverage-analysis'],
    useCases: ['Claim evaluation', 'Fraud investigation', 'Settlement calculation', 'Coverage analysis'],
    fields: [
      {
        id: 'claim_type',
        name: 'claim_type',
        label: 'Claim Type',
        type: 'select',
        required: true,
        options: ['Auto', 'Property', 'Health', 'Life', 'Liability', 'Workers Compensation'],
        helpText: 'What type of insurance claim are you assessing?'
      },
      {
        id: 'claim_amount',
        name: 'claim_amount',
        label: 'Claimed Amount',
        type: 'number',
        required: true,
        validation: { min: 0 },
        helpText: 'Total amount claimed by the policyholder'
      },
      {
        id: 'incident_description',
        name: 'incident_description',
        label: 'Incident Description',
        type: 'textarea',
        required: true,
        placeholder: 'Detailed description of the incident...',
        helpText: 'Provide a comprehensive description of what happened'
      }
    ],
    prompt: {
      system: 'You are a senior insurance claims adjuster with expertise in claim evaluation and fraud detection.',
      context: 'Assess the insurance claim for validity, coverage, and appropriate settlement amount.',
      task: 'Provide detailed claim assessment with coverage determination and settlement recommendations.',
      format: 'Professional claims assessment report with clear recommendations.',
      examples: 'Include specific policy provisions and precedent cases where applicable.'
    },
    bestPractices: [
      'Verify policy coverage and limits',
      'Look for inconsistencies in the claim',
      'Consider industry standards and precedents',
      'Document all findings thoroughly'
    ]
  },
  {
    id: '4',
    title: 'Lesson Plan Generator',
    category: 'Curriculum Development',
    industry: 'Education',
    description: 'Create engaging lesson plans with learning objectives, activities, and assessment methods.',
    difficulty: 'beginner',
    estimatedTime: '5-8 min',
    tags: ['lesson-planning', 'curriculum', 'pedagogy', 'assessment'],
    useCases: ['Daily lesson planning', 'Curriculum development', 'Activity design', 'Assessment creation'],
    fields: [
      {
        id: 'subject',
        name: 'subject',
        label: 'Subject',
        type: 'text',
        required: true,
        placeholder: 'Mathematics, Science, History, etc.',
        helpText: 'What subject are you teaching?'
      },
      {
        id: 'grade_level',
        name: 'grade_level',
        label: 'Grade Level',
        type: 'select',
        required: true,
        options: ['K-2', '3-5', '6-8', '9-12', 'Adult Education'],
        helpText: 'Select the appropriate grade level'
      },
      {
        id: 'lesson_duration',
        name: 'lesson_duration',
        label: 'Lesson Duration',
        type: 'select',
        required: true,
        options: ['30 minutes', '45 minutes', '60 minutes', '90 minutes'],
        helpText: 'How long is the lesson?'
      },
      {
        id: 'learning_objectives',
        name: 'learning_objectives',
        label: 'Learning Objectives',
        type: 'textarea',
        required: true,
        placeholder: 'What should students learn from this lesson?',
        helpText: 'List the key learning objectives for this lesson'
      }
    ],
    prompt: {
      system: 'You are an experienced educator and curriculum specialist.',
      context: 'Create an engaging and effective lesson plan that promotes active learning.',
      task: 'Develop a comprehensive lesson plan with clear objectives, activities, and assessments.',
      format: 'Standard lesson plan format with introduction, main activities, and conclusion.',
      examples: 'Include specific examples of activities and assessment questions.'
    },
    bestPractices: [
      'Align activities with learning objectives',
      'Include multiple learning modalities',
      'Plan for different learning paces',
      'Include formative assessment opportunities'
    ]
  },
  {
    id: '5',
    title: 'Financial Statement Analysis',
    category: 'Financial Analysis',
    industry: 'Accounting',
    description: 'Analyze financial statements for performance, trends, and recommendations.',
    difficulty: 'intermediate',
    estimatedTime: '15-20 min',
    tags: ['financial-analysis', 'accounting', 'performance', 'trends'],
    useCases: ['Annual review', 'Investment analysis', 'Credit assessment', 'Performance evaluation'],
    fields: [
      {
        id: 'company_size',
        name: 'company_size',
        label: 'Company Size',
        type: 'select',
        required: true,
        options: ['Small Business', 'Medium Enterprise', 'Large Corporation', 'Public Company'],
        helpText: 'What size company are you analyzing?'
      },
      {
        id: 'analysis_period',
        name: 'analysis_period',
        label: 'Analysis Period',
        type: 'select',
        required: true,
        options: ['Quarterly', 'Annual', 'Multi-year trend'],
        helpText: 'What time period should the analysis cover?'
      },
      {
        id: 'focus_areas',
        name: 'focus_areas',
        label: 'Analysis Focus',
        type: 'multiselect',
        required: true,
        options: ['Profitability', 'Liquidity', 'Solvency', 'Efficiency', 'Growth'],
        helpText: 'What aspects should the analysis focus on?'
      }
    ],
    prompt: {
      system: 'You are a certified public accountant and financial analyst.',
      context: 'Analyze financial statements to assess company performance and financial health.',
      task: 'Provide comprehensive financial analysis with insights and recommendations.',
      format: 'Professional financial analysis report with executive summary and detailed findings.',
      examples: 'Include relevant financial ratios and industry benchmarks.'
    },
    bestPractices: [
      'Compare against industry benchmarks',
      'Analyze trends over multiple periods',
      'Consider economic and market factors',
      'Provide actionable recommendations'
    ]
  },
  // Additional templates for other industries
  {
    id: '6',
    title: 'Client Risk Assessment',
    category: 'Risk Management',
    industry: 'Insurance',
    description: 'Evaluate client risk profiles for insurance underwriting and premium calculations.',
    difficulty: 'intermediate',
    estimatedTime: '10-12 min',
    tags: ['risk-assessment', 'underwriting', 'premium-calculation', 'client-evaluation'],
    useCases: ['New client onboarding', 'Policy renewal', 'Premium adjustment', 'Coverage recommendation'],
    fields: [
      {
        id: 'client_type',
        name: 'client_type',
        label: 'Client Type',
        type: 'select',
        required: true,
        options: ['Individual', 'Small Business', 'Corporation', 'Non-profit'],
        helpText: 'What type of client are you assessing?'
      },
      {
        id: 'coverage_type',
        name: 'coverage_type',
        label: 'Coverage Type',
        type: 'select',
        required: true,
        options: ['Auto', 'Home', 'Life', 'Health', 'Business Liability', 'Property'],
        helpText: 'What type of insurance coverage is being considered?'
      }
    ],
    prompt: {
      system: 'You are an experienced insurance underwriter and risk assessment specialist.',
      context: 'Evaluate client risk factors to determine appropriate coverage and premium rates.',
      task: 'Provide comprehensive risk assessment with coverage recommendations.',
      format: 'Professional risk assessment report with clear risk ratings and recommendations.',
      examples: 'Include specific risk factors and mitigation strategies.'
    },
    bestPractices: [
      'Consider all relevant risk factors',
      'Use actuarial data and industry standards',
      'Document assessment reasoning clearly',
      'Provide fair and competitive pricing recommendations'
    ]
  },
  {
    id: '7',
    title: 'Market Analysis Report',
    category: 'Market Research',
    industry: 'Real Estate',
    description: 'Generate comprehensive market analysis for property investment and pricing decisions.',
    difficulty: 'advanced',
    estimatedTime: '15-20 min',
    tags: ['market-analysis', 'investment', 'pricing', 'trends'],
    useCases: ['Investment decisions', 'Property pricing', 'Market trends', 'Client consultation'],
    fields: [
      {
        id: 'market_area',
        name: 'market_area',
        label: 'Market Area',
        type: 'text',
        required: true,
        placeholder: 'City or neighborhood name',
        helpText: 'Specify the geographic market area for analysis'
      },
      {
        id: 'property_segment',
        name: 'property_segment',
        label: 'Property Segment',
        type: 'select',
        required: true,
        options: ['Luxury', 'Mid-range', 'Affordable', 'Commercial', 'Investment'],
        helpText: 'Which market segment are you focusing on?'
      }
    ],
    prompt: {
      system: 'You are a senior real estate market analyst with deep knowledge of property markets.',
      context: 'Analyze market conditions to provide insights for property decisions.',
      task: 'Generate detailed market analysis with trends and recommendations.',
      format: 'Comprehensive market report with data analysis and strategic insights.',
      examples: 'Include market trends, price comparisons, and investment opportunities.'
    },
    bestPractices: [
      'Use current market data',
      'Consider seasonal trends',
      'Include comparable market analysis',
      'Provide actionable investment insights'
    ]
  },
  {
    id: '8',
    title: 'Student Assessment Rubric',
    category: 'Assessment Design',
    industry: 'Education',
    description: 'Create detailed rubrics for student assessment and grading consistency.',
    difficulty: 'beginner',
    estimatedTime: '6-8 min',
    tags: ['assessment', 'rubric', 'grading', 'evaluation'],
    useCases: ['Project grading', 'Performance evaluation', 'Standardized assessment', 'Learning outcomes'],
    fields: [
      {
        id: 'assessment_type',
        name: 'assessment_type',
        label: 'Assessment Type',
        type: 'select',
        required: true,
        options: ['Project', 'Essay', 'Presentation', 'Lab Report', 'Portfolio'],
        helpText: 'What type of student work are you assessing?'
      },
      {
        id: 'grade_levels',
        name: 'grade_levels',
        label: 'Grade Levels',
        type: 'select',
        required: true,
        options: ['Elementary', 'Middle School', 'High School', 'College'],
        helpText: 'Select the appropriate grade level'
      }
    ],
    prompt: {
      system: 'You are an educational assessment specialist and experienced teacher.',
      context: 'Design fair and comprehensive rubrics for student evaluation.',
      task: 'Create detailed assessment rubric with clear criteria and performance levels.',
      format: 'Structured rubric with criteria, performance levels, and point values.',
      examples: 'Include specific examples of what constitutes each performance level.'
    },
    bestPractices: [
      'Use clear and measurable criteria',
      'Align with learning objectives',
      'Provide specific performance indicators',
      'Ensure consistency in grading'
    ]
  },
  {
    id: '9',
    title: 'Tax Planning Strategy',
    category: 'Tax Planning',
    industry: 'Accounting',
    description: 'Develop comprehensive tax planning strategies for individuals and businesses.',
    difficulty: 'advanced',
    estimatedTime: '18-25 min',
    tags: ['tax-planning', 'strategy', 'deductions', 'compliance'],
    useCases: ['Annual tax planning', 'Business tax strategy', 'Personal tax optimization', 'Audit preparation'],
    fields: [
      {
        id: 'client_type',
        name: 'client_type',
        label: 'Client Type',
        type: 'select',
        required: true,
        options: ['Individual', 'Sole Proprietorship', 'Partnership', 'Corporation', 'Non-profit'],
        helpText: 'What type of taxpayer are you planning for?'
      },
      {
        id: 'tax_year',
        name: 'tax_year',
        label: 'Tax Year',
        type: 'select',
        required: true,
        options: ['2024', '2025', 'Multi-year planning'],
        helpText: 'Which tax year or period are you planning for?'
      }
    ],
    prompt: {
      system: 'You are a certified tax professional and financial planner.',
      context: 'Develop strategic tax planning to minimize liability and ensure compliance.',
      task: 'Create comprehensive tax planning strategy with specific recommendations.',
      format: 'Professional tax planning report with strategies and implementation timeline.',
      examples: 'Include specific tax strategies, deductions, and compliance considerations.'
    },
    bestPractices: [
      'Stay current with tax law changes',
      'Consider long-term implications',
      'Balance tax savings with business goals',
      'Maintain detailed documentation'
    ]
  },
  {
    id: '10',
    title: 'Legal Brief Template',
    category: 'Document Drafting',
    industry: 'Legal',
    description: 'Create structured legal briefs with proper formatting and legal reasoning.',
    difficulty: 'advanced',
    estimatedTime: '20-30 min',
    tags: ['legal-brief', 'court-filing', 'argument', 'research'],
    useCases: ['Court filings', 'Legal arguments', 'Case preparation', 'Appeal briefs'],
    fields: [
      {
        id: 'brief_type',
        name: 'brief_type',
        label: 'Brief Type',
        type: 'select',
        required: true,
        options: ['Motion to Dismiss', 'Summary Judgment', 'Appeal Brief', 'Response Brief'],
        helpText: 'What type of legal brief are you preparing?'
      },
      {
        id: 'jurisdiction',
        name: 'jurisdiction',
        label: 'Jurisdiction',
        type: 'select',
        required: true,
        options: ['Federal', 'State', 'Local', 'Administrative'],
        helpText: 'In which jurisdiction will this brief be filed?'
      }
    ],
    prompt: {
      system: 'You are a senior litigation attorney with expertise in legal writing and research.',
      context: 'Prepare persuasive legal brief following proper legal format and citation.',
      task: 'Draft comprehensive legal brief with strong legal arguments and proper citations.',
      format: 'Standard legal brief format with proper headings and citation style.',
      examples: 'Include relevant case law, statutes, and legal precedents.'
    },
    bestPractices: [
      'Follow jurisdiction-specific formatting rules',
      'Use proper legal citation format',
      'Structure arguments logically',
      'Support arguments with relevant authority'
    ]
  }
]

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
            ? `Specialized templates for ${mappedIndustry} professionals. Each template is optimized for your industry needs.`
            : 'Select a template that matches your industry and use case. Each template is optimized for specific professional needs.'
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
            placeholder="Search templates..."
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
                {industry === 'all' ? 'All Industries' : industry}
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
                {difficulty === 'all' ? 'All Levels' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
        </p>
        {selectedTemplate && (
          <Button onClick={onNext} className="flex items-center gap-2">
            Continue with "{selectedTemplate.title}"
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
                <p className="text-xs font-medium text-muted-foreground mb-1">Use Cases:</p>
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
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 opacity-20">
            <Filter className="w-full h-full" />
          </div>
          <h3 className="text-lg font-medium mb-2">No templates found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria or filters to find templates.
          </p>
        </div>
      )}
    </div>
  )
}