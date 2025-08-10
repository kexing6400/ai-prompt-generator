'use client'

import { useState } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { 
  Copy, 
  Eye, 
  Clock, 
  Sparkles,
  CheckCircle,
  ChevronRight,
  Hash
} from 'lucide-react'

interface TemplateCardProps {
  template: {
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
  industryName?: string
}

export default function TemplateCard({ template, industryName }: TemplateCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [copied, setCopied] = useState(false)

  // Difficulty color mapping
  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800'
  }

  const difficultyLabels = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced'
  }

  // Copy prompt
  const copyPrompt = () => {
    const fullPrompt = `System Role: ${template.prompt.system}

Context: ${template.prompt.context}

Task Requirements: ${template.prompt.task}

Output Format: ${template.prompt.format}

Examples: ${template.prompt.examples}`

    navigator.clipboard.writeText(fullPrompt)
    setCopied(true)
    // 2秒后重置状态
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Card className="hover:shadow-lg transition-all duration-200 border-gray-200 hover:border-primary/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {template.title}
              </CardTitle>
              <CardDescription className="mt-2">
                {template.description}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="secondary" className="text-xs">
              <Hash className="h-3 w-3 mr-1" />
              {template.category}
            </Badge>
            <Badge 
              variant="secondary" 
              className={`text-xs ${difficultyColors[template.difficulty]}`}
            >
              {difficultyLabels[template.difficulty]}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {template.estimatedTime}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {/* 标签展示 */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {template.tags.slice(0, 3).map((tag, index) => (
                <span 
                  key={index}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {template.tags.length > 3 && (
                <span className="text-xs px-2 py-1 text-gray-500">
                  +{template.tags.length - 3}
                </span>
              )}
            </div>
          </div>

          {/* Use cases */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-700 mb-2">Use Cases:</p>
            <div className="flex flex-wrap gap-2">
              {template.useCases.slice(0, 4).map((useCase, index) => (
                <span 
                  key={index}
                  className="text-xs text-gray-600 flex items-center"
                >
                  <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                  {useCase}
                </span>
              ))}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    {template.title}
                  </DialogTitle>
                  <DialogDescription>
                    {industryName && <span className="font-medium">{industryName} · </span>}
                    {template.category} · {difficultyLabels[template.difficulty]} · {template.estimatedTime}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* System role */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">🤖 System Role</h4>
                    <p className="text-sm text-blue-800">{template.prompt.system}</p>
                  </div>

                  {/* Context */}
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">📋 Context</h4>
                    <p className="text-sm text-green-800 whitespace-pre-line">{template.prompt.context}</p>
                  </div>

                  {/* Task requirements */}
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">🎯 Task Requirements</h4>
                    <p className="text-sm text-purple-800 whitespace-pre-line">{template.prompt.task}</p>
                  </div>

                  {/* Output format */}
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-medium text-orange-900 mb-2">📝 Output Format</h4>
                    <pre className="text-sm text-orange-800 whitespace-pre-wrap font-mono">
                      {template.prompt.format}
                    </pre>
                  </div>

                  {/* Examples */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">💡 Examples</h4>
                    <p className="text-sm text-gray-700">{template.prompt.examples}</p>
                  </div>

                  {/* Best practices */}
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <h4 className="font-medium text-indigo-900 mb-2">✨ Best Practices</h4>
                    <ul className="space-y-1">
                      {template.bestPractices.map((practice, index) => (
                        <li key={index} className="text-sm text-indigo-800 flex items-start">
                          <ChevronRight className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                          {practice}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tags */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">🏷️ Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {template.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Copy button */}
                  <div className="pt-4 border-t">
                    <Button 
                      onClick={copyPrompt}
                      className="w-full"
                      variant={copied ? "secondary" : "default"}
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Copied to Clipboard
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Full Prompt
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              size="sm" 
              className="flex-1"
              onClick={copyPrompt}
              variant={copied ? "secondary" : "default"}
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy & Use
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}