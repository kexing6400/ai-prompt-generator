# Prompt Wizard Component System

A professional three-step wizard component system for creating AI prompts with industry-specific templates.

## Features

- **Three-Step Flow**: Template Selection → Custom Input → AI Generation
- **Progress Tracking**: Visual progress indicator with step completion status
- **Professional Templates**: Industry-specific templates with validation
- **Real-time Preview**: Live preview of generated prompts
- **Responsive Design**: Mobile-first responsive layout
- **TypeScript Support**: Fully typed with comprehensive interfaces
- **Customizable**: Easy to extend and customize for different use cases

## Components

### Main Components

- `PromptWizard.tsx` - Main wizard container with navigation and state management
- `steps/TemplateSelectionStep.tsx` - Template selection with search and filtering
- `steps/CustomInputStep.tsx` - Dynamic form based on selected template
- `steps/AIGenerationStep.tsx` - AI generation with editing and optimization features

### UI Components

- `ui/progress.tsx` - Progress bar component for step tracking

## Usage

### Basic Implementation

```tsx
import { PromptWizard } from '@/components/prompt-wizard'
import type { GeneratedPrompt } from '@/components/prompt-wizard'

function MyApp() {
  const handleComplete = (result: GeneratedPrompt) => {
    console.log('Generated prompt:', result)
    // Handle the completed prompt
  }

  const handleReset = () => {
    console.log('Wizard reset')
    // Handle wizard reset
  }

  return (
    <PromptWizard 
      onComplete={handleComplete}
      onReset={handleReset}
      className="max-w-6xl mx-auto"
    />
  )
}
```

### Advanced Usage with State Management

```tsx
import { useState } from 'react'
import { PromptWizard } from '@/components/prompt-wizard'

function AdvancedExample() {
  const [results, setResults] = useState<GeneratedPrompt[]>([])
  const [currentWizard, setCurrentWizard] = useState<string | null>(null)

  const handleComplete = (result: GeneratedPrompt) => {
    setResults(prev => [...prev, result])
    // Save to database
    saveToDatabase(result)
    // Show success notification
    showNotification('Prompt generated successfully!')
  }

  return (
    <PromptWizard 
      onComplete={handleComplete}
      onReset={() => setCurrentWizard(null)}
    />
  )
}
```

## Props

### PromptWizard Props

| Prop | Type | Description |
|------|------|-------------|
| `className` | `string` | Optional CSS classes |
| `onComplete` | `(result: GeneratedPrompt) => void` | Callback when prompt generation completes |
| `onReset` | `() => void` | Callback when wizard is reset |

## Data Types

### PromptTemplate

```tsx
interface PromptTemplate {
  id: string
  title: string
  category: string
  industry: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  tags: string[]
  useCases: string[]
  fields: TemplateField[]
  prompt: {
    system: string
    context: string
    task: string
    format: string
    examples: string
  }
  bestPractices: string[]
}
```

### TemplateField

```tsx
interface TemplateField {
  id: string
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'date'
  placeholder?: string
  required: boolean
  options?: string[]
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
    min?: number
    max?: number
  }
  helpText?: string
}
```

### GeneratedPrompt

```tsx
interface GeneratedPrompt {
  id: string
  title: string
  content: string
  template: PromptTemplate
  formData: FormData
  createdAt: Date
  optimizations?: string[]
}
```

## Customization

### Adding New Template Categories

1. Add new templates to the `MOCK_TEMPLATES` array in `TemplateSelectionStep.tsx`
2. Define the template structure with appropriate fields
3. Include industry-specific validation rules

### Custom Field Types

Extend the `TemplateField` type to include new field types:

```tsx
// In types.ts
interface TemplateField {
  // ... existing properties
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'date' | 'custom'
  customConfig?: {
    component: React.ComponentType
    validation: (value: any) => string
  }
}
```

### Styling Customization

The components use Tailwind CSS classes and can be customized by:

1. Modifying the `cn()` utility function calls
2. Adding custom CSS classes via the `className` prop
3. Updating the theme colors in `tailwind.config.js`

## API Integration

### Connecting to Real AI Services

Replace the mock generation in `AIGenerationStep.tsx`:

```tsx
const handleGenerate = async () => {
  onSetGenerating(true)
  
  try {
    const response = await fetch('/api/generate-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template: template.id,
        formData: formData
      })
    })
    
    const result = await response.json()
    onGenerate(result)
  } catch (error) {
    // Handle error
  } finally {
    onSetGenerating(false)
  }
}
```

### Database Integration

Save generated prompts to your database:

```tsx
const savePrompt = async (prompt: GeneratedPrompt) => {
  await fetch('/api/prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prompt)
  })
}
```

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **ARIA Labels**: Proper ARIA labels for screen readers
- **Focus Management**: Logical focus flow through the wizard steps
- **High Contrast**: Support for high contrast mode
- **Screen Reader Support**: Compatible with popular screen readers

## Performance Optimizations

- **Code Splitting**: Each step component can be lazy-loaded
- **Memoization**: Heavy computations are memoized
- **Debounced Search**: Search input is debounced for better performance
- **Virtual Scrolling**: Large template lists use virtual scrolling

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow the existing code style and patterns
2. Add TypeScript types for all new interfaces
3. Include proper error handling
4. Write responsive CSS using Tailwind classes
5. Test on multiple screen sizes and devices

## License

This component system is part of the AI Prompt Generator Pro project.