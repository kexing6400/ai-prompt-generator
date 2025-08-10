'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  Info,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PromptTemplate, FormData, TemplateField } from '../types'

interface CustomInputStepProps {
  template: PromptTemplate
  formData: FormData
  onFormDataChange: (data: Partial<FormData>) => void
  onNext: () => void
  onBack: () => void
}

export default function CustomInputStep({
  template,
  formData,
  onFormDataChange,
  onNext,
  onBack
}: CustomInputStepProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Calculate completion progress
  const progress = useMemo(() => {
    const totalFields = template.fields.length
    const completedFields = template.fields.filter(field => {
      const value = formData[field.name]
      return value !== undefined && value !== null && value !== ''
    }).length
    
    return totalFields > 0 ? (completedFields / totalFields) * 100 : 0
  }, [template.fields, formData])

  // Validate field
  const validateField = (field: TemplateField, value: any): string => {
    if (field.required && (!value || value === '')) {
      return `${field.label} is required`
    }

    if (field.validation && value) {
      const { minLength, maxLength, pattern, min, max } = field.validation

      if (field.type === 'text' || field.type === 'textarea') {
        const strValue = String(value)
        if (minLength && strValue.length < minLength) {
          return `${field.label} must be at least ${minLength} characters`
        }
        if (maxLength && strValue.length > maxLength) {
          return `${field.label} must be no more than ${maxLength} characters`
        }
        if (pattern && !new RegExp(pattern).test(strValue)) {
          return `${field.label} format is invalid`
        }
      }

      if (field.type === 'number') {
        const numValue = Number(value)
        if (isNaN(numValue)) {
          return `${field.label} must be a valid number`
        }
        if (min !== undefined && numValue < min) {
          return `${field.label} must be at least ${min}`
        }
        if (max !== undefined && numValue > max) {
          return `${field.label} must be no more than ${max}`
        }
      }
    }

    return ''
  }

  // Handle field change
  const handleFieldChange = (field: TemplateField, value: any) => {
    onFormDataChange({ [field.name]: value })
    
    // Clear error for this field if it exists
    if (fieldErrors[field.name]) {
      const newErrors = { ...fieldErrors }
      delete newErrors[field.name]
      setFieldErrors(newErrors)
    }
  }

  // Validate all fields before proceeding
  const validateAllFields = (): boolean => {
    const errors: Record<string, string> = {}
    let isValid = true

    template.fields.forEach(field => {
      const error = validateField(field, formData[field.name])
      if (error) {
        errors[field.name] = error
        isValid = false
      }
    })

    setFieldErrors(errors)
    return isValid
  }

  // Handle next button
  const handleNext = () => {
    if (validateAllFields()) {
      onNext()
    }
  }

  // Generate preview text
  const generatePreview = (): string => {
    let preview = `**Template: ${template.title}**\n\n`
    
    preview += `**System Role:** ${template.prompt.system}\n\n`
    
    let contextWithData = template.prompt.context
    let taskWithData = template.prompt.task
    
    // Replace placeholders with actual form data
    template.fields.forEach(field => {
      const value = formData[field.name]
      const placeholder = `{${field.name}}`
      const displayValue = Array.isArray(value) ? value.join(', ') : String(value || '[Not provided]')
      
      contextWithData = contextWithData.replace(new RegExp(placeholder, 'g'), displayValue)
      taskWithData = taskWithData.replace(new RegExp(placeholder, 'g'), displayValue)
    })
    
    preview += `**Context:** ${contextWithData}\n\n`
    preview += `**Task:** ${taskWithData}\n\n`
    preview += `**Format:** ${template.prompt.format}\n\n`
    preview += `**Examples:** ${template.prompt.examples}`
    
    return preview
  }

  // Render different field types
  const renderField = (field: TemplateField) => {
    const hasError = !!fieldErrors[field.name]
    const value = formData[field.name]

    const fieldWrapper = (children: React.ReactNode) => (
      <div key={field.id} className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={field.id} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {field.helpText && (
            <div className="group relative">
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              <div className="invisible group-hover:visible absolute bottom-full left-0 mb-2 p-2 bg-popover border rounded-md shadow-md text-xs text-popover-foreground max-w-64 z-10">
                {field.helpText}
              </div>
            </div>
          )}
        </div>
        {children}
        {hasError && (
          <div className="flex items-center gap-1 text-red-500 text-xs">
            <AlertCircle className="h-3 w-3" />
            {fieldErrors[field.name]}
          </div>
        )}
      </div>
    )

    switch (field.type) {
      case 'text':
        return fieldWrapper(
          <Input
            id={field.id}
            value={String(value || '')}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            placeholder={field.placeholder}
            className={cn(hasError && "border-red-500")}
          />
        )

      case 'textarea':
        return fieldWrapper(
          <Textarea
            id={field.id}
            value={String(value || '')}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            placeholder={field.placeholder}
            className={cn("min-h-[100px]", hasError && "border-red-500")}
            rows={4}
          />
        )

      case 'number':
        return fieldWrapper(
          <Input
            id={field.id}
            type="number"
            value={String(value || '')}
            onChange={(e) => handleFieldChange(field, e.target.value ? Number(e.target.value) : '')}
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
            className={cn(hasError && "border-red-500")}
          />
        )

      case 'select':
        return fieldWrapper(
          <select
            id={field.id}
            value={String(value || '')}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              hasError && "border-red-500"
            )}
          >
            <option value="">{field.placeholder || `Select ${field.label.toLowerCase()}...`}</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      case 'multiselect':
        const selectedOptions = Array.isArray(value) ? value : []
        return fieldWrapper(
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {field.options?.map((option, index) => {
                const isSelected = selectedOptions.includes(option)
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      const newSelection = isSelected
                        ? selectedOptions.filter(item => item !== option)
                        : [...selectedOptions, option]
                      handleFieldChange(field, newSelection)
                    }}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm border transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted border-input"
                    )}
                  >
                    {isSelected && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                    {option}
                  </button>
                )
              })}
            </div>
            {selectedOptions.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Selected: {selectedOptions.join(', ')}
              </div>
            )}
          </div>
        )

      case 'date':
        return fieldWrapper(
          <Input
            id={field.id}
            type="date"
            value={value ? new Date(value as string).toISOString().split('T')[0] : ''}
            onChange={(e) => handleFieldChange(field, new Date(e.target.value))}
            className={cn(hasError && "border-red-500")}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Customize Your Prompt</h2>
            <p className="text-muted-foreground">
              Fill in the details below to customize your {template.title.toLowerCase()} prompt
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Progress</div>
            <div className="text-2xl font-bold text-primary">{Math.round(progress)}%</div>
          </div>
        </div>

        {/* Template Info */}
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-medium">{template.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">{template.industry}</Badge>
                    <span>•</span>
                    <Clock className="h-3 w-3" />
                    <span>{template.estimatedTime}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2"
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form Fields */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Required Information</CardTitle>
              <CardDescription>
                Complete the form below to generate your customized prompt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {template.fields.map(renderField)}
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          {showPreview && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Live Preview</CardTitle>
                <CardDescription>
                  See how your prompt will look with the current inputs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap font-mono text-muted-foreground">
                    {generatePreview()}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Best Practices */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Best Practices</CardTitle>
              <CardDescription>
                Tips for getting the best results from this template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {template.bestPractices.map((practice, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{practice}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Templates
        </Button>

        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {template.fields.filter(field => formData[field.name]).length} of {template.fields.length} fields completed
          </div>
          <Button
            onClick={handleNext}
            disabled={progress < 100}
            className="flex items-center gap-2"
          >
            Generate Prompt
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}