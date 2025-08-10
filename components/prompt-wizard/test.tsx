// Test file to verify component syntax and imports
// This file is for development testing only

import React from 'react'
import { PromptWizard } from './index'
import type { GeneratedPrompt } from './types'

// Test component to verify all imports and types work correctly
function TestPromptWizard() {
  const handleComplete = (result: GeneratedPrompt) => {
    console.log('Test completion:', result)
  }

  const handleReset = () => {
    console.log('Test reset')
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Prompt Wizard Test</h1>
      <PromptWizard 
        onComplete={handleComplete}
        onReset={handleReset}
        className="border border-gray-200 rounded-lg"
      />
    </div>
  )
}

export default TestPromptWizard

// Type checking tests
const typeTests = () => {
  // Test GeneratedPrompt type
  const mockPrompt: GeneratedPrompt = {
    id: 'test-1',
    title: 'Test Prompt',
    content: 'Test content',
    template: {
      id: 'legal-1',
      title: 'Legal Document Analysis',
      category: 'Document Review',
      industry: 'Legal',
      description: 'Test description',
      difficulty: 'beginner',
      estimatedTime: '5 min',
      tags: ['test'],
      useCases: ['testing'],
      fields: [{
        id: 'test-field',
        name: 'test_field',
        label: 'Test Field',
        type: 'text',
        required: true
      }],
      prompt: {
        system: 'Test system',
        context: 'Test context',
        task: 'Test task',
        format: 'Test format',
        examples: 'Test examples'
      },
      bestPractices: ['Test practice']
    },
    formData: { test_field: 'test value' },
    createdAt: new Date(),
    optimizations: ['Test optimization']
  }

  return mockPrompt
}

// Export for testing
export { typeTests }