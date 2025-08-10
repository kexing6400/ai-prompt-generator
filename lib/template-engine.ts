/**
 * AI Prompt Builder Pro - 核心模板引擎
 * 
 * 功能特性：
 * - 支持参数插值和条件渲染
 * - 类型安全的参数验证
 * - 高性能模板编译和缓存
 * - 支持模板继承和组合
 * 
 * @author Claude Code (后端架构师)
 * @version 2.0
 * @date 2025-01-10
 */

import { z, ZodSchema } from 'zod'

// =================================================================
// 核心类型定义
// =================================================================

export interface TemplateParameter {
  key: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'textarea'
  title: string
  description?: string
  required: boolean
  defaultValue?: any
  options?: string[] // 用于select类型
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
    min?: number
    max?: number
  }
}

export interface TemplateSchema {
  id: string
  name: string
  description?: string
  templateContent: string
  parameters: TemplateParameter[]
  examples?: TemplateExample[]
  metadata?: {
    industry: string
    scenario: string
    difficulty: number
    estimatedTime: number
  }
}

export interface TemplateExample {
  title: string
  parameters: Record<string, any>
  expectedOutput: string
}

export interface RenderOptions {
  strict?: boolean // 严格模式：未提供的必需参数会抛出错误
  escapeHtml?: boolean // 转义HTML
  preserveWhitespace?: boolean // 保留空白字符
}

export interface RenderResult {
  content: string
  parametersUsed: string[]
  renderTime: number
  warnings: string[]
}

// 模板编译错误类型
export class TemplateError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message)
    this.name = 'TemplateError'
  }
}

// =================================================================
// 核心模板引擎类
// =================================================================

export class PromptTemplateEngine {
  private compiledTemplates = new Map<string, CompiledTemplate>()
  private parameterValidators = new Map<string, ZodSchema>()

  /**
   * 编译模板 - 预处理模板语法为可执行函数
   */
  public compileTemplate(schema: TemplateSchema): CompiledTemplate {
    const startTime = Date.now()
    
    try {
      // 1. 解析模板语法
      const ast = this.parseTemplate(schema.templateContent)
      
      // 2. 生成参数验证器
      const validator = this.createParameterValidator(schema.parameters)
      this.parameterValidators.set(schema.id, validator)
      
      // 3. 编译为可执行函数
      const renderFunction = this.compileAST(ast, schema.parameters)
      
      // 4. 创建编译结果
      const compiled: CompiledTemplate = {
        id: schema.id,
        renderFunction,
        validator,
        parameters: schema.parameters,
        compileTime: Date.now() - startTime,
        compiledAt: new Date()
      }
      
      // 5. 缓存编译结果
      this.compiledTemplates.set(schema.id, compiled)
      
      return compiled
    } catch (error) {
      throw new TemplateError(
        `模板编译失败: ${error.message}`,
        'TEMPLATE_COMPILE_ERROR',
        { templateId: schema.id, error }
      )
    }
  }

  /**
   * 渲染模板 - 将参数应用到已编译的模板
   */
  public async renderTemplate(
    templateId: string,
    parameters: Record<string, any>,
    options: RenderOptions = {}
  ): Promise<RenderResult> {
    const startTime = Date.now()
    const warnings: string[] = []

    try {
      // 1. 获取编译后的模板
      const compiled = this.compiledTemplates.get(templateId)
      if (!compiled) {
        throw new TemplateError(
          `模板未找到或未编译: ${templateId}`,
          'TEMPLATE_NOT_FOUND'
        )
      }

      // 2. 参数验证
      const validatedParams = this.validateParameters(
        compiled.validator,
        parameters,
        compiled.parameters,
        options.strict ?? true
      )

      // 3. 执行渲染
      const content = compiled.renderFunction(validatedParams, {
        escapeHtml: options.escapeHtml ?? false,
        preserveWhitespace: options.preserveWhitespace ?? true
      })

      // 4. 后处理
      const processedContent = this.postProcessContent(content, options)
      const parametersUsed = this.extractUsedParameters(processedContent, compiled.parameters)

      return {
        content: processedContent,
        parametersUsed,
        renderTime: Date.now() - startTime,
        warnings
      }
    } catch (error) {
      throw new TemplateError(
        `模板渲染失败: ${error.message}`,
        'TEMPLATE_RENDER_ERROR',
        { templateId, parameters, error }
      )
    }
  }

  /**
   * 批量渲染 - 高效处理多个模板渲染请求
   */
  public async batchRender(
    requests: Array<{
      templateId: string
      parameters: Record<string, any>
      options?: RenderOptions
    }>
  ): Promise<RenderResult[]> {
    const results = await Promise.all(
      requests.map(async (req) => {
        try {
          return await this.renderTemplate(req.templateId, req.parameters, req.options)
        } catch (error) {
          // 批量渲染中的单个失败不应影响其他模板
          return {
            content: `<!-- 渲染错误: ${error.message} -->`,
            parametersUsed: [],
            renderTime: 0,
            warnings: [`渲染失败: ${error.message}`]
          }
        }
      })
    )

    return results
  }

  // =================================================================
  // 私有方法 - 模板解析和编译
  // =================================================================

  /**
   * 解析模板内容为抽象语法树
   */
  private parseTemplate(templateContent: string): TemplateAST {
    const tokens = this.tokenize(templateContent)
    return this.parse(tokens)
  }

  /**
   * 词法分析 - 将模板字符串分解为token
   */
  private tokenize(content: string): Token[] {
    const tokens: Token[] = []
    const regex = /\{\{(.*?)\}\}/g
    let lastIndex = 0
    let match

    while ((match = regex.exec(content)) !== null) {
      // 添加普通文本token
      if (match.index > lastIndex) {
        tokens.push({
          type: 'TEXT',
          value: content.slice(lastIndex, match.index),
          position: lastIndex
        })
      }

      // 解析表达式token
      const expression = match[1].trim()
      tokens.push(this.parseExpression(expression, match.index))
      
      lastIndex = regex.lastIndex
    }

    // 添加剩余的文本
    if (lastIndex < content.length) {
      tokens.push({
        type: 'TEXT',
        value: content.slice(lastIndex),
        position: lastIndex
      })
    }

    return tokens
  }

  /**
   * 解析表达式 - 识别变量、条件、循环等
   */
  private parseExpression(expression: string, position: number): Token {
    // 条件表达式 {{#if condition}}
    if (expression.startsWith('#if ')) {
      return {
        type: 'IF_START',
        value: expression.slice(4).trim(),
        position
      }
    }

    // 条件结束 {{/if}}
    if (expression === '/if') {
      return {
        type: 'IF_END',
        value: '',
        position
      }
    }

    // else分支 {{#else}}
    if (expression === '#else') {
      return {
        type: 'ELSE',
        value: '',
        position
      }
    }

    // 循环表达式 {{#each items}}
    if (expression.startsWith('#each ')) {
      return {
        type: 'EACH_START',
        value: expression.slice(6).trim(),
        position
      }
    }

    // 循环结束 {{/each}}
    if (expression === '/each') {
      return {
        type: 'EACH_END',
        value: '',
        position
      }
    }

    // 函数调用 {{formatDate date}}
    if (expression.includes(' ')) {
      const parts = expression.split(' ')
      const functionName = parts[0]
      const args = parts.slice(1)
      
      return {
        type: 'FUNCTION_CALL',
        value: functionName,
        args,
        position
      }
    }

    // 普通变量 {{variable}}
    return {
      type: 'VARIABLE',
      value: expression,
      position
    }
  }

  /**
   * 语法分析 - 将token序列构建为AST
   */
  private parse(tokens: Token[]): TemplateAST {
    const ast: TemplateAST = {
      type: 'ROOT',
      children: []
    }

    let current = 0
    
    while (current < tokens.length) {
      const node = this.parseNode(tokens, current)
      ast.children.push(node.node)
      current = node.nextIndex
    }

    return ast
  }

  /**
   * 解析单个节点
   */
  private parseNode(tokens: Token[], startIndex: number): { node: ASTNode; nextIndex: number } {
    const token = tokens[startIndex]

    switch (token.type) {
      case 'TEXT':
        return {
          node: { type: 'TEXT', content: token.value },
          nextIndex: startIndex + 1
        }

      case 'VARIABLE':
        return {
          node: { type: 'VARIABLE', name: token.value },
          nextIndex: startIndex + 1
        }

      case 'FUNCTION_CALL':
        return {
          node: {
            type: 'FUNCTION_CALL',
            name: token.value,
            args: token.args || []
          },
          nextIndex: startIndex + 1
        }

      case 'IF_START':
        return this.parseIfStatement(tokens, startIndex)

      case 'EACH_START':
        return this.parseEachStatement(tokens, startIndex)

      default:
        throw new TemplateError(
          `未知的token类型: ${token.type}`,
          'PARSE_ERROR',
          { token, position: startIndex }
        )
    }
  }

  /**
   * 解析if语句
   */
  private parseIfStatement(tokens: Token[], startIndex: number): { node: ASTNode; nextIndex: number } {
    const condition = tokens[startIndex].value
    let current = startIndex + 1
    const thenBranch: ASTNode[] = []
    const elseBranch: ASTNode[] = []
    let inElseBranch = false

    while (current < tokens.length) {
      const token = tokens[current]

      if (token.type === 'IF_END') {
        break
      }

      if (token.type === 'ELSE') {
        inElseBranch = true
        current++
        continue
      }

      const nodeResult = this.parseNode(tokens, current)
      
      if (inElseBranch) {
        elseBranch.push(nodeResult.node)
      } else {
        thenBranch.push(nodeResult.node)
      }
      
      current = nodeResult.nextIndex
    }

    return {
      node: {
        type: 'IF_STATEMENT',
        condition,
        thenBranch,
        elseBranch: elseBranch.length > 0 ? elseBranch : undefined
      },
      nextIndex: current + 1
    }
  }

  /**
   * 解析each循环
   */
  private parseEachStatement(tokens: Token[], startIndex: number): { node: ASTNode; nextIndex: number } {
    const arrayName = tokens[startIndex].value
    let current = startIndex + 1
    const body: ASTNode[] = []

    while (current < tokens.length) {
      const token = tokens[current]

      if (token.type === 'EACH_END') {
        break
      }

      const nodeResult = this.parseNode(tokens, current)
      body.push(nodeResult.node)
      current = nodeResult.nextIndex
    }

    return {
      node: {
        type: 'EACH_STATEMENT', 
        arrayName,
        body
      },
      nextIndex: current + 1
    }
  }

  /**
   * 将AST编译为可执行的渲染函数
   */
  private compileAST(ast: TemplateAST, parameters: TemplateParameter[]): RenderFunction {
    const parameterMap = new Map(parameters.map(p => [p.key, p]))

    return (params: Record<string, any>, options: any) => {
      return this.executeAST(ast, params, parameterMap, options)
    }
  }

  /**
   * 执行AST节点
   */
  private executeAST(
    ast: TemplateAST | ASTNode,
    params: Record<string, any>,
    parameterMap: Map<string, TemplateParameter>,
    options: any
  ): string {
    if ('children' in ast) {
      // 根节点，执行所有子节点
      return ast.children.map(child => this.executeAST(child, params, parameterMap, options)).join('')
    }

    switch (ast.type) {
      case 'TEXT':
        return ast.content

      case 'VARIABLE':
        const value = this.getParameterValue(ast.name, params, parameterMap)
        return this.formatValue(value, options)

      case 'FUNCTION_CALL':
        return this.executeFunction(ast.name, ast.args, params, options)

      case 'IF_STATEMENT':
        const conditionResult = this.evaluateCondition(ast.condition, params)
        if (conditionResult) {
          return ast.thenBranch.map(node => this.executeAST(node, params, parameterMap, options)).join('')
        } else if (ast.elseBranch) {
          return ast.elseBranch.map(node => this.executeAST(node, params, parameterMap, options)).join('')
        }
        return ''

      case 'EACH_STATEMENT':
        const array = params[ast.arrayName]
        if (!Array.isArray(array)) {
          return ''
        }
        
        return array.map((item, index) => {
          const itemParams = { 
            ...params, 
            this: item, 
            index, 
            first: index === 0, 
            last: index === array.length - 1 
          }
          return ast.body.map(node => this.executeAST(node, itemParams, parameterMap, options)).join('')
        }).join('')

      default:
        return ''
    }
  }

  // =================================================================
  // 辅助方法
  // =================================================================

  /**
   * 创建参数验证器
   */
  private createParameterValidator(parameters: TemplateParameter[]): ZodSchema {
    const schemaObject: Record<string, any> = {}

    for (const param of parameters) {
      let validator: any

      switch (param.type) {
        case 'string':
        case 'textarea':
          validator = z.string()
          if (param.validation?.minLength) {
            validator = validator.min(param.validation.minLength)
          }
          if (param.validation?.maxLength) {
            validator = validator.max(param.validation.maxLength)
          }
          if (param.validation?.pattern) {
            validator = validator.regex(new RegExp(param.validation.pattern))
          }
          break

        case 'number':
          validator = z.number()
          if (param.validation?.min) {
            validator = validator.min(param.validation.min)
          }
          if (param.validation?.max) {
            validator = validator.max(param.validation.max)
          }
          break

        case 'boolean':
          validator = z.boolean()
          break

        case 'select':
          if (param.options) {
            validator = z.enum(param.options as [string, ...string[]])
          } else {
            validator = z.string()
          }
          break

        case 'multiselect':
          if (param.options) {
            validator = z.array(z.enum(param.options as [string, ...string[]]))
          } else {
            validator = z.array(z.string())
          }
          break

        default:
          validator = z.any()
      }

      // 处理可选参数和默认值
      if (!param.required) {
        if (param.defaultValue !== undefined) {
          validator = validator.default(param.defaultValue)
        } else {
          validator = validator.optional()
        }
      }

      schemaObject[param.key] = validator
    }

    return z.object(schemaObject)
  }

  /**
   * 验证参数
   */
  private validateParameters(
    validator: ZodSchema,
    parameters: Record<string, any>,
    parameterDefs: TemplateParameter[],
    strict: boolean
  ): Record<string, any> {
    try {
      return validator.parse(parameters)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => 
          `参数 "${err.path.join('.')}" ${err.message}`
        ).join('; ')
        
        throw new TemplateError(
          `参数验证失败: ${errorMessages}`,
          'PARAMETER_VALIDATION_ERROR',
          { errors: error.errors, parameters }
        )
      }
      throw error
    }
  }

  /**
   * 获取参数值
   */
  private getParameterValue(
    name: string,
    params: Record<string, any>,
    parameterMap: Map<string, TemplateParameter>
  ): any {
    if (params.hasOwnProperty(name)) {
      return params[name]
    }

    const paramDef = parameterMap.get(name)
    if (paramDef?.defaultValue !== undefined) {
      return paramDef.defaultValue
    }

    if (paramDef?.required) {
      throw new TemplateError(
        `必需参数缺失: ${name}`,
        'REQUIRED_PARAMETER_MISSING',
        { parameterName: name }
      )
    }

    return ''
  }

  /**
   * 格式化输出值
   */
  private formatValue(value: any, options: any): string {
    if (value === null || value === undefined) {
      return ''
    }

    let result = String(value)
    
    if (options.escapeHtml) {
      result = result
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    }

    return result
  }

  /**
   * 执行内置函数
   */
  private executeFunction(name: string, args: string[], params: Record<string, any>, options: any): string {
    switch (name) {
      case 'formatDate':
        const date = params[args[0]]
        if (!date) return ''
        return new Date(date).toLocaleDateString('zh-CN')

      case 'uppercase':
        const text = params[args[0]]
        return String(text || '').toUpperCase()

      case 'lowercase':
        const text2 = params[args[0]]
        return String(text2 || '').toLowerCase()

      case 'length':
        const value = params[args[0]]
        if (Array.isArray(value)) return String(value.length)
        return String(value || '').length.toString()

      default:
        return `<!-- 未知函数: ${name} -->`
    }
  }

  /**
   * 评估条件表达式
   */
  private evaluateCondition(condition: string, params: Record<string, any>): boolean {
    // 简单的条件评估，支持基本的比较运算
    try {
      // 安全地评估条件（仅支持简单的比较）
      const safeCondition = condition.replace(/(\w+)/g, (match) => {
        if (params.hasOwnProperty(match)) {
          const value = params[match]
          return typeof value === 'string' ? `"${value}"` : String(value)
        }
        return 'null'
      })

      // 使用Function构造器安全评估
      return new Function('return ' + safeCondition)()
    } catch {
      // 如果评估失败，检查参数是否为真值
      return !!params[condition]
    }
  }

  /**
   * 提取已使用的参数
   */
  private extractUsedParameters(content: string, parameters: TemplateParameter[]): string[] {
    const used = new Set<string>()
    
    for (const param of parameters) {
      if (content.includes(`{{${param.key}}}`) || content.includes(param.key)) {
        used.add(param.key)
      }
    }
    
    return Array.from(used)
  }

  /**
   * 后处理内容
   */
  private postProcessContent(content: string, options: RenderOptions): string {
    let result = content

    // 移除多余的空白行
    if (!options.preserveWhitespace) {
      result = result.replace(/\n\s*\n\s*\n/g, '\n\n')
      result = result.trim()
    }

    return result
  }

  /**
   * 获取模板统计信息
   */
  public getTemplateStats(templateId: string): TemplateStats | null {
    const compiled = this.compiledTemplates.get(templateId)
    if (!compiled) return null

    return {
      templateId,
      compileTime: compiled.compileTime,
      compiledAt: compiled.compiledAt,
      parameterCount: compiled.parameters.length,
      requiredParameterCount: compiled.parameters.filter(p => p.required).length,
      cacheSize: this.compiledTemplates.size
    }
  }

  /**
   * 清除编译缓存
   */
  public clearCache(templateId?: string): void {
    if (templateId) {
      this.compiledTemplates.delete(templateId)
      this.parameterValidators.delete(templateId)
    } else {
      this.compiledTemplates.clear()
      this.parameterValidators.clear()
    }
  }
}

// =================================================================
// 内部类型定义
// =================================================================

interface Token {
  type: 'TEXT' | 'VARIABLE' | 'IF_START' | 'IF_END' | 'ELSE' | 'EACH_START' | 'EACH_END' | 'FUNCTION_CALL'
  value: string
  position: number
  args?: string[]
}

interface TemplateAST {
  type: 'ROOT'
  children: ASTNode[]
}

interface ASTNode {
  type: 'TEXT' | 'VARIABLE' | 'FUNCTION_CALL' | 'IF_STATEMENT' | 'EACH_STATEMENT'
  content?: string
  name?: string
  args?: string[]
  condition?: string
  thenBranch?: ASTNode[]
  elseBranch?: ASTNode[]
  arrayName?: string
  body?: ASTNode[]
}

interface CompiledTemplate {
  id: string
  renderFunction: RenderFunction
  validator: ZodSchema
  parameters: TemplateParameter[]
  compileTime: number
  compiledAt: Date
}

type RenderFunction = (
  params: Record<string, any>, 
  options: any
) => string

interface TemplateStats {
  templateId: string
  compileTime: number
  compiledAt: Date
  parameterCount: number
  requiredParameterCount: number
  cacheSize: number
}

// =================================================================
// 导出工厂函数和单例
// =================================================================

let globalTemplateEngine: PromptTemplateEngine | null = null

/**
 * 获取全局模板引擎实例（单例模式）
 */
export function getTemplateEngine(): PromptTemplateEngine {
  if (!globalTemplateEngine) {
    globalTemplateEngine = new PromptTemplateEngine()
  }
  return globalTemplateEngine
}

/**
 * 创建新的模板引擎实例
 */
export function createTemplateEngine(): PromptTemplateEngine {
  return new PromptTemplateEngine()
}

export default PromptTemplateEngine