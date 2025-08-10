'use client'

import { useState } from 'react'
import { PromptWizard } from './index'
import type { GeneratedPrompt } from './types'

/**
 * Example usage of the PromptWizard component
 * This demonstrates how to integrate the wizard into your application
 */
export default function PromptWizardExample() {
  const [result, setResult] = useState<GeneratedPrompt | null>(null)
  const [showWizard, setShowWizard] = useState(true)

  const handleComplete = (generatedPrompt: GeneratedPrompt) => {
    console.log('Prompt generation completed:', generatedPrompt)
    setResult(generatedPrompt)
    // Here you could:
    // - Save to database
    // - Send to API
    // - Show success message
    // - Navigate to different page
  }

  const handleReset = () => {
    console.log('Wizard reset')
    setResult(null)
    setShowWizard(true)
  }

  const startOver = () => {
    setResult(null)
    setShowWizard(true)
  }

  if (!showWizard && result) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Prompt Generated Successfully!</h2>
          <p className="text-muted-foreground">
            Your custom prompt "{result.title}" is ready to use.
          </p>
          
          <div className="bg-muted p-4 rounded-lg text-left">
            <pre className="text-sm whitespace-pre-wrap">{result.content}</pre>
          </div>
          
          <button
            onClick={startOver}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Create Another Prompt
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <PromptWizard
          onComplete={handleComplete}
          onReset={handleReset}
          className="max-w-full"
        />
      </div>
    </div>
  )
}

/**
 * Integration Examples:
 * 
 * 1. Basic Usage:
 * ```tsx
 * import { PromptWizard } from '@/components/prompt-wizard'
 * 
 * function MyPage() {
 *   return (
 *     <PromptWizard 
 *       onComplete={(result) => console.log(result)}
 *       onReset={() => console.log('Reset')}
 *     />
 *   )
 * }
 * ```
 * 
 * 2. With Custom Styling:
 * ```tsx
 * <PromptWizard 
 *   className="my-custom-styles"
 *   onComplete={handleComplete}
 * />
 * ```
 * 
 * 3. With State Management:
 * ```tsx
 * const [wizardState, setWizardState] = useState(null)
 * 
 * <PromptWizard 
 *   onComplete={(result) => {
 *     setWizardState(result)
 *     // Save to store, database, etc.
 *   }}
 * />
 * ```
 */