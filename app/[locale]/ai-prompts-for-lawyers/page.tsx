'use client'

import { useState, useEffect } from 'react'
import { 
  Scale, 
  FileText, 
  Search, 
  Users, 
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  BookmarkPlus,
  History
} from 'lucide-react'

import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Textarea } from "../../../components/ui/textarea"
import { usePromptGenerator } from "../../../lib/hooks/use-prompt-generator"
import { industryExamples } from "../../../lib/constants/industry-examples"
import PromptResult from "../../../components/prompt-result"

// Professional template categories for lawyers
const templateCategories = [
  {
    id: 'contract-review',
    name: 'Contract Review',
    description: 'AI-powered contract analysis, risk identification, professional recommendations',
    icon: FileText,
    templates: [
      'Commercial contract risk analysis',
      'Employment agreement review', 
      'Real estate contract assessment',
      'IP agreement evaluation'
    ],
    popular: true
  },
  {
    id: 'case-analysis',
    name: 'Case Analysis',
    description: 'Deep case studies, extract key legal insights, precedent research',
    icon: Search,
    templates: [
      'Judgment analysis & key points',
      'Similar case comparison',
      'Legal precedent research',
      'Case dispute focus analysis'
    ]
  },
  {
    id: 'legal-research',
    name: 'Legal Research',
    description: 'Statute research, legal analysis, academic research support',
    icon: AlertCircle,
    templates: [
      'Statute applicability analysis',
      'Legal reasoning documentation',
      'Legislative history research',
      'Judicial interpretation review'
    ]
  },
  {
    id: 'document-drafting',
    name: 'Document Drafting',
    description: 'Professional legal document templates and optimization',
    icon: Users,
    templates: [
      'Complaint drafting',
      'Response brief writing',
      'Legal opinion letters',
      'Demand letter creation'
    ]
  }
]

// Success metrics
const successMetrics = [
  { label: 'Lawyers Served', value: '2,300+', icon: Users },
  { label: 'Prompts Generated', value: '150K+', icon: Sparkles },
  { label: 'Time Saved', value: '70%', icon: CheckCircle },
  { label: 'Accuracy Rate', value: '95%', icon: Scale },
]

export default function LawyerAIPrompts() {
  const {
    loading,
    result,
    error,
    formData,
    updateFormData,
    handleSubmit,
    clearResult,
    copyToClipboard,
    saveDraft,
    loadDraft
  } = usePromptGenerator('lawyer')

  const [wordCount, setWordCount] = useState(0)
  const examples = industryExamples.lawyer

  // Load draft on component mount
  useEffect(() => {
    loadDraft()
  }, [])

  // Calculate word count
  useEffect(() => {
    setWordCount(formData.prompt.length)
  }, [formData.prompt])

  // Fill example data
  const fillExample = (example: typeof examples.examples[0]) => {
    updateFormData('scenario', example.scenario)
    updateFormData('prompt', example.prompt)
    updateFormData('context', example.context)
  }

  // Form submit handler
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleSubmit()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lawyer/5 via-white to-lawyer/10 dark:from-gray-900 dark:via-lawyer/5 dark:to-gray-900">
      
      {/* Header Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />
        <div className="absolute right-0 top-0 -z-10 blur-3xl">
          <div className="aspect-square w-96 bg-gradient-to-br from-lawyer/20 to-lawyer-dark/20 opacity-60" />
        </div>

        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            {/* Industry icon */}
            <div className="h-20 w-20 rounded-2xl gradient-lawyer flex items-center justify-center">
              <Scale className="h-10 w-10 text-white" />
            </div>
            
            {/* Title information */}
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                AI Prompts for Lawyers: Save 70% Time with Professional Templates
              </h1>
              <p className="mt-2 text-xl text-gray-600 dark:text-gray-300">
                Professional legal AI assistant. Make legal services smarter and more efficient
              </p>
              
              {/* Breadcrumb navigation */}
              <nav className="mt-4 flex items-center space-x-2 text-sm text-gray-500">
                <a href="/" className="hover:text-lawyer">Home</a>
                <span>/</span>
                <span className="text-lawyer">AI Prompts for Lawyers</span>
              </nav>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* Left Sidebar - Template Categories */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Professional Template Categories
              </h2>
              
              <div className="space-y-4">
                {templateCategories.map((category) => {
                  const IconComponent = category.icon
                  return (
                    <Card 
                      key={category.id} 
                      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-lawyer/50 ${
                        category.popular ? 'ring-2 ring-lawyer/20 border-lawyer/30' : ''
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg gradient-lawyer flex items-center justify-center">
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {category.name}
                              {category.popular && (
                                <span className="text-xs bg-lawyer/10 text-lawyer px-2 py-1 rounded-full">
                                  Popular
                                </span>
                              )}
                            </CardTitle>
                          </div>
                        </div>
                        <CardDescription>{category.description}</CardDescription>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-2">
                          {category.templates.map((template, index) => (
                            <div 
                              key={index}
                              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-lawyer cursor-pointer transition-colors"
                            >
                              <div className="h-1.5 w-1.5 rounded-full bg-lawyer/40" />
                              {template}
                            </div>
                          ))}
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-4 hover:bg-lawyer hover:text-white"
                        >
                          Select Category
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Main Content - AI Prompt Generator */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-2 border-gray-100 dark:border-gray-700">
              <CardHeader className="bg-gradient-to-r from-lawyer/10 to-lawyer-dark/10">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-lawyer" />
                  AI Prompt Generator for Lawyers
                </CardTitle>
                <CardDescription className="text-base">
                  Fill out the form below to generate professional legal AI prompts
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 p-6">
                <form onSubmit={onSubmit} className="space-y-6">
                  {/* Scenario selection */}
                  <div className="space-y-2">
                    <Label htmlFor="scenario" className="text-base font-medium">
                      Legal Service Scenario *
                    </Label>
                    <select 
                      id="scenario"
                      value={formData.scenario}
                      onChange={(e) => updateFormData('scenario', e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lawyer/20 focus-visible:ring-offset-2"
                      required
                    >
                      <option value="">Choose your legal service scenario</option>
                      {examples.scenarios.map(scenario => (
                        <option key={scenario.value} value={scenario.value}>
                          {scenario.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Specific requirements description */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="requirements" className="text-base font-medium">
                        Specific Requirements *
                      </Label>
                      <span className="text-sm text-gray-500">{wordCount} characters</span>
                    </div>
                    <Textarea
                      id="requirements"
                      value={formData.prompt}
                      onChange={(e) => updateFormData('prompt', e.target.value)}
                      placeholder="Please describe in detail what you want the AI assistant to help you with, such as: analyze the main risk points of a commercial contract and provide corresponding legal advice..."
                      className="min-h-[120px] resize-none"
                      required
                    />
                    <div className="text-sm text-gray-500">
                      Tip: Describe your needs in detail, including document type, focus points, expected output format, etc.
                    </div>
                  </div>

                  {/* Additional information */}
                  <div className="space-y-2">
                    <Label htmlFor="context" className="text-base font-medium">
                      Additional Information (Optional)
                    </Label>
                    <Textarea
                      id="context"
                      value={formData.context}
                      onChange={(e) => updateFormData('context', e.target.value)}
                      placeholder="Provide more background information, such as: case amount, practice area, special requirements, etc..."
                      className="min-h-[80px] resize-none"
                    />
                  </div>

                  {/* Example prompts */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-lawyer" />
                      Quick Start - Choose Example Scenario
                    </Label>
                    <div className="grid gap-3">
                      {examples.examples.map((example, index) => (
                        <Card 
                          key={index} 
                          className="cursor-pointer hover:border-lawyer/50 transition-colors"
                          onClick={() => fillExample(example)}
                        >
                          <CardContent className="p-4">
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {examples.scenarios.find(s => s.value === example.scenario)?.label}
                            </div>
                            <div className="text-xs text-gray-600 mb-2">{example.prompt}</div>
                            <div className="text-xs text-gray-400">{example.context}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Generate button */}
                  <div className="flex gap-4 pt-6">
                    <Button 
                      type="submit"
                      size="lg" 
                      disabled={loading || !formData.scenario || !formData.prompt.trim()}
                      className="flex-1 gradient-lawyer hover:opacity-90 btn-press disabled:opacity-50"
                    >
                      <Sparkles className="mr-2 h-5 w-5" />
                      {loading ? 'Generating...' : 'Generate Professional AI Prompt'}
                    </Button>
                    <Button 
                      type="button"
                      variant="outline" 
                      size="lg"
                      onClick={saveDraft}
                    >
                      <BookmarkPlus className="mr-2 h-4 w-4" />
                      Save Draft
                    </Button>
                    <Button 
                      type="button"
                      variant="outline" 
                      size="lg"
                      onClick={loadDraft}
                    >
                      <History className="mr-2 h-4 w-4" />
                      Load Draft
                    </Button>
                  </div>
                </form>

                {/* Usage tips */}
                <div className="rounded-lg bg-lawyer/5 p-4 border border-lawyer/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-lawyer mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium text-lawyer mb-1">Professional Tip</div>
                      <div className="text-gray-600 dark:text-gray-400">
                        Generated prompts work directly with ChatGPT, Claude, and other mainstream AI assistants. We recommend fine-tuning based on your specific situation before use.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Result display */}
                <PromptResult
                  result={result}
                  loading={loading}
                  error={error}
                  onCopy={copyToClipboard}
                  onClear={clearResult}
                  onRegenerate={handleSubmit}
                />
              </CardContent>
            </Card>

            {/* Success metrics display */}
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {successMetrics.map((metric) => {
                const IconComponent = metric.icon
                return (
                  <Card key={metric.label} className="text-center p-4">
                    <div className="h-10 w-10 rounded-lg gradient-lawyer flex items-center justify-center mx-auto mb-3">
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {metric.value}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {metric.label}
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}