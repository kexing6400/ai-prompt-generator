'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2,
  Circle,
  RotateCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Import step components
import TemplateSelectionStep from './steps/TemplateSelectionStep'
import CustomInputStep from './steps/CustomInputStep'
import AIGenerationStep from './steps/AIGenerationStep'

// Import types
import type { 
  WizardState, 
  WizardStep, 
  PromptTemplate, 
  FormData, 
  GeneratedPrompt 
} from './types'

interface PromptWizardProps {
  className?: string
  industry?: string
  onComplete?: (result: GeneratedPrompt) => void
  onReset?: () => void
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 1,
    title: 'Template Selection',
    description: 'Choose a template that matches your industry and use case',
    isCompleted: false,
    isActive: true
  },
  {
    id: 2,
    title: 'Custom Input',
    description: 'Fill in the details to customize your prompt',
    isCompleted: false,
    isActive: false
  },
  {
    id: 3,
    title: 'AI Generation',
    description: 'Review and refine your generated prompt',
    isCompleted: false,
    isActive: false
  }
]

export default function PromptWizard({ 
  className, 
  industry,
  onComplete, 
  onReset 
}: PromptWizardProps) {
  // Main wizard state
  const [wizardState, setWizardState] = useState<WizardState>({
    currentStep: 1,
    selectedTemplate: null,
    formData: {},
    generatedPrompt: null,
    isGenerating: false
  })

  // Steps state
  const [steps, setSteps] = useState<WizardStep[]>(WIZARD_STEPS)

  // Calculate progress
  const progress = ((wizardState.currentStep - 1) / (steps.length - 1)) * 100

  // Update step completion status
  const updateStepStatus = useCallback((stepId: number, isCompleted: boolean) => {
    setSteps(prevSteps => 
      prevSteps.map(step => {
        if (step.id === stepId) {
          return { ...step, isCompleted }
        }
        if (step.id === stepId + 1 && isCompleted) {
          return { ...step, isActive: true }
        }
        return step
      })
    )
  }, [])

  // Navigation functions
  const goToStep = useCallback((stepNumber: number) => {
    if (stepNumber >= 1 && stepNumber <= steps.length) {
      setWizardState(prev => ({ ...prev, currentStep: stepNumber }))
      
      // Update step active states
      setSteps(prevSteps =>
        prevSteps.map(step => ({
          ...step,
          isActive: step.id === stepNumber
        }))
      )
    }
  }, [steps.length])

  const goNext = useCallback(() => {
    if (wizardState.currentStep < steps.length) {
      updateStepStatus(wizardState.currentStep, true)
      goToStep(wizardState.currentStep + 1)
    }
  }, [wizardState.currentStep, steps.length, updateStepStatus, goToStep])

  const goBack = useCallback(() => {
    if (wizardState.currentStep > 1) {
      goToStep(wizardState.currentStep - 1)
    }
  }, [wizardState.currentStep, goToStep])

  // State update functions
  const setSelectedTemplate = useCallback((template: PromptTemplate) => {
    setWizardState(prev => ({
      ...prev,
      selectedTemplate: template,
      formData: {} // Reset form data when template changes
    }))
  }, [])

  const updateFormData = useCallback((data: Partial<FormData>) => {
    setWizardState(prev => ({
      ...prev,
      formData: { ...prev.formData, ...data } as FormData
    }))
  }, [])

  const setGeneratedPrompt = useCallback((prompt: GeneratedPrompt) => {
    setWizardState(prev => ({ ...prev, generatedPrompt: prompt }))
    updateStepStatus(3, true)
    onComplete?.(prompt)
  }, [updateStepStatus, onComplete])

  const setIsGenerating = useCallback((loading: boolean) => {
    setWizardState(prev => ({ ...prev, isGenerating: loading }))
  }, [])

  // Reset wizard
  const resetWizard = useCallback(() => {
    setWizardState({
      currentStep: 1,
      selectedTemplate: null,
      formData: {},
      generatedPrompt: null,
      isGenerating: false
    })
    setSteps(WIZARD_STEPS)
    onReset?.()
  }, [onReset])

  // Check if current step can proceed
  const canProceed = () => {
    switch (wizardState.currentStep) {
      case 1:
        return !!wizardState.selectedTemplate
      case 2:
        return wizardState.selectedTemplate && 
               wizardState.selectedTemplate.fields.every(field => 
                 !field.required || wizardState.formData[field.name]
               )
      case 3:
        return !!wizardState.generatedPrompt
      default:
        return false
    }
  }

  // Render current step content
  const renderStepContent = () => {
    switch (wizardState.currentStep) {
      case 1:
        return (
          <TemplateSelectionStep
            selectedTemplate={wizardState.selectedTemplate}
            onTemplateSelect={setSelectedTemplate}
            onNext={goNext}
            industry={industry}
          />
        )
      case 2:
        return (
          <CustomInputStep
            template={wizardState.selectedTemplate!}
            formData={wizardState.formData}
            onFormDataChange={updateFormData}
            onNext={goNext}
            onBack={goBack}
          />
        )
      case 3:
        return (
          <AIGenerationStep
            template={wizardState.selectedTemplate!}
            formData={wizardState.formData}
            generatedPrompt={wizardState.generatedPrompt}
            isGenerating={wizardState.isGenerating}
            onGenerate={setGeneratedPrompt}
            onSetGenerating={setIsGenerating}
            onBack={goBack}
            onReset={resetWizard}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className={cn("max-w-6xl mx-auto space-y-6", className)}>
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-4">
          {/* Progress Bar */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Step {wizardState.currentStep} of {steps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps Indicator */}
          <div className="flex items-center justify-between mt-6">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center text-center">
                  {/* Step Circle */}
                  <div 
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                      step.isCompleted
                        ? "bg-primary border-primary text-primary-foreground"
                        : step.isActive
                        ? "border-primary text-primary"
                        : "border-muted-foreground/20 text-muted-foreground"
                    )}
                  >
                    {step.isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </div>

                  {/* Step Info */}
                  <div className="mt-2 space-y-1">
                    <div 
                      className={cn(
                        "font-medium text-sm",
                        step.isActive 
                          ? "text-primary" 
                          : step.isCompleted 
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </div>
                    <div className="text-xs text-muted-foreground max-w-32">
                      {step.description}
                    </div>
                  </div>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div 
                    className={cn(
                      "flex-1 h-px mx-4 mt-[-20px]",
                      step.isCompleted 
                        ? "bg-primary" 
                        : "bg-muted-foreground/20"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Area */}
      <Card className="min-h-[600px]">
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation Footer */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {wizardState.currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={goBack}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
              
              <Button
                variant="ghost"
                onClick={resetWizard}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4" />
                Start Over
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {wizardState.currentStep < steps.length && (
                <Button
                  onClick={goNext}
                  disabled={!canProceed()}
                  className="flex items-center gap-2"
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}