'use client'

import { useState, useEffect } from 'react'
import { 
  Home, 
  TrendingUp, 
  MessageSquare, 
  Users, 
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  BookmarkPlus,
  History,
  MapPin
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { usePromptGenerator } from '@/lib/hooks/use-prompt-generator'
import { industryExamples } from '@/lib/constants/industry-examples'
import PromptResult from '@/components/prompt-result'

// Professional template categories for realtors
const templateCategories = [
  {
    id: 'property-marketing',
    name: 'Property Marketing',
    description: 'Compelling listings, virtual tours, social media content creation',
    icon: Home,
    templates: [
      'Luxury property descriptions',
      'Virtual staging narratives', 
      'Social media campaigns',
      'Open house promotions'
    ],
    popular: true
  },
  {
    id: 'market-analysis',
    name: 'Market Analysis',
    description: 'Comparative analysis, pricing strategies, investment insights',
    icon: TrendingUp,
    templates: [
      'Neighborhood analysis',
      'Price trend reports',
      'Investment valuations',
      'Market forecast summaries'
    ]
  },
  {
    id: 'client-communication',
    name: 'Client Communication',
    description: 'Professional correspondence, negotiation scripts, follow-up templates',
    icon: MessageSquare,
    templates: [
      'First-time buyer guidance',
      'Negotiation strategies',
      'Transaction updates',
      'Market condition briefings'
    ]
  },
  {
    id: 'lead-generation',
    name: 'Lead Generation',
    description: 'Prospecting outreach, referral requests, networking content',
    icon: Users,
    templates: [
      'Cold outreach scripts',
      'Referral campaigns',
      'Community engagement',
      'Testimonial collection'
    ]
  }
]

// Success metrics
const successMetrics = [
  { label: 'Realtors Served', value: '950+', icon: Users },
  { label: 'Listings Created', value: '28K+', icon: Home },
  { label: 'Conversion Rate', value: '+35%', icon: TrendingUp },
  { label: 'Time Saved', value: '60%', icon: CheckCircle },
]

export default function RealtorAIPrompts() {
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
  } = usePromptGenerator('realtor')

  const [wordCount, setWordCount] = useState(0)
  const examples = industryExamples.realtor

  useEffect(() => {
    loadDraft()
  }, [])

  useEffect(() => {
    setWordCount(formData.prompt.length)
  }, [formData.prompt])

  const fillExample = (example: typeof examples.examples[0]) => {
    updateFormData('scenario', example.scenario)
    updateFormData('prompt', example.prompt)
    updateFormData('context', example.context)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleSubmit()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-green-900/5 dark:to-gray-900">
      
      {/* Header Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />
        <div className="absolute right-0 top-0 -z-10 blur-3xl">
          <div className="aspect-square w-96 bg-gradient-to-br from-green-400/20 to-emerald-600/20 opacity-60" />
        </div>

        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
              <Home className="h-10 w-10 text-white" />
            </div>
            
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                AI Prompts for Realtors: Professional Real Estate Templates
              </h1>
              <p className="mt-2 text-xl text-gray-600 dark:text-gray-300">
                Boost property sales with AI-powered marketing, client communication, and market analysis
              </p>
              
              <nav className="mt-4 flex items-center space-x-2 text-sm text-gray-500">
                <a href="/" className="hover:text-green-600">Home</a>
                <span>/</span>
                <span className="text-green-600">AI Prompts for Realtors</span>
              </nav>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Real Estate Template Categories
              </h2>
              
              <div className="space-y-4">
                {templateCategories.map((category) => {
                  const IconComponent = category.icon
                  return (
                    <Card 
                      key={category.id} 
                      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-green-500/50 ${
                        category.popular ? 'ring-2 ring-green-500/20 border-green-500/30' : ''
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {category.name}
                              {category.popular && (
                                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
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
                              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-green-600 cursor-pointer transition-colors"
                            >
                              <div className="h-1.5 w-1.5 rounded-full bg-green-500/40" />
                              {template}
                            </div>
                          ))}
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-4 hover:bg-green-600 hover:text-white"
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

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-2 border-gray-100 dark:border-gray-700">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-green-600" />
                  AI Prompt Generator for Realtors
                </CardTitle>
                <CardDescription className="text-base">
                  Create professional real estate AI prompts for property marketing, client services, and market analysis
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 p-6">
                <form onSubmit={onSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="scenario" className="text-base font-medium">
                      Real Estate Service Scenario *
                    </Label>
                    <select 
                      id="scenario"
                      value={formData.scenario}
                      onChange={(e) => updateFormData('scenario', e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/20 focus-visible:ring-offset-2"
                      required
                    >
                      <option value="">Choose your real estate scenario</option>
                      {examples.scenarios.map(scenario => (
                        <option key={scenario.value} value={scenario.value}>
                          {scenario.label}
                        </option>
                      ))}
                    </select>
                  </div>

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
                      placeholder="Describe what you want the AI to help with, such as: create a compelling property listing for a luxury waterfront home that highlights unique features..."
                      className="min-h-[120px] resize-none"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="context" className="text-base font-medium">
                      Additional Context (Optional)
                    </Label>
                    <Textarea
                      id="context"
                      value={formData.context}
                      onChange={(e) => updateFormData('context', e.target.value)}
                      placeholder="Provide more details such as: property type, location highlights, target buyer demographics, special features..."
                      className="min-h-[80px] resize-none"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-green-600" />
                      Quick Start - Example Templates
                    </Label>
                    <div className="grid gap-3">
                      {examples.examples.map((example, index) => (
                        <Card 
                          key={index} 
                          className="cursor-pointer hover:border-green-500/50 transition-colors"
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

                  <div className="flex gap-4 pt-6">
                    <Button 
                      type="submit"
                      size="lg" 
                      disabled={loading || !formData.scenario || !formData.prompt.trim()}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white disabled:opacity-50"
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
                  </div>
                </form>

                <div className="rounded-lg bg-green-50 p-4 border border-green-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium text-green-600 mb-1">Professional Tip</div>
                      <div className="text-gray-600 dark:text-gray-400">
                        Perfect for residential and commercial real estate agents. Works seamlessly with ChatGPT, Claude, and other AI assistants.
                      </div>
                    </div>
                  </div>
                </div>

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

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {successMetrics.map((metric) => {
                const IconComponent = metric.icon
                return (
                  <Card key={metric.label} className="text-center p-4">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-3">
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