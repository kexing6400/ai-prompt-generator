export interface WizardStep {
  id: number
  title: string
  description: string
  isCompleted: boolean
  isActive: boolean
}

export interface PromptTemplate {
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

export interface TemplateField {
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

export interface FormData {
  [key: string]: string | number | string[] | Date
}

export interface GeneratedPrompt {
  id: string
  title: string
  content: string
  template: PromptTemplate
  formData: FormData
  createdAt: Date
  optimizations?: string[]
}

export interface WizardState {
  currentStep: number
  selectedTemplate: PromptTemplate | null
  formData: FormData
  generatedPrompt: GeneratedPrompt | null
  isGenerating: boolean
}

export interface WizardActions {
  setCurrentStep: (step: number) => void
  setSelectedTemplate: (template: PromptTemplate) => void
  updateFormData: (data: Partial<FormData>) => void
  setGeneratedPrompt: (prompt: GeneratedPrompt) => void
  setIsGenerating: (loading: boolean) => void
  reset: () => void
  goNext: () => void
  goBack: () => void
}