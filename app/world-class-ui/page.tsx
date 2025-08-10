"use client"

import React, { useState } from "react"
import { 
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { showToast } from "@/components/ui/toast"
import {
  MotionDiv,
  MotionCard,
  MotionButton,
  MotionListItem,
  PageTransition,
  StaggerContainer,
  fadeInUp,
  slideInRight,
  scaleIn
} from "@/components/ui/motion"
import {
  AutoAnimate,
  AutoAnimateList,
  AutoAnimateGrid,
  AutoAnimateForm,
  useAutoAnimate
} from "@/components/ui/auto-animate"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Search, 
  Sparkles, 
  Zap, 
  Palette, 
  MousePointer, 
  Keyboard,
  Plus,
  Trash2,
  Calendar,
  Home,
  Settings,
  User,
  FileText,
  Globe,
  Star,
  Heart,
  Coffee
} from "lucide-react"
import { useHotkeys } from "react-hotkeys-hook"

export default function WorldClassUIPage() {
  const [commandOpen, setCommandOpen] = useState(false)
  const [items, setItems] = useState([
    { id: 1, title: "世界级组件展示", type: "feature" },
    { id: 2, title: "动画效果演示", type: "animation" },
    { id: 3, title: "交互体验优化", type: "interaction" }
  ])
  const [formFields, setFormFields] = useState([
    { id: 1, label: "项目名称", type: "text", placeholder: "输入项目名称..." },
    { id: 2, label: "项目描述", type: "textarea", placeholder: "描述你的项目..." }
  ])

  // 键盘快捷键
  useHotkeys('ctrl+k', () => setCommandOpen(true), { preventDefault: true })
  useHotkeys('ctrl+j', () => showToast.info("快捷键演示", "您按下了 Ctrl+J"), { preventDefault: true })

  const addItem = () => {
    const newItem = {
      id: Date.now(),
      title: `新项目 ${items.length + 1}`,
      type: Math.random() > 0.5 ? "feature" : "animation"
    }
    setItems([...items, newItem])
    showToast.success("项目已添加", "新项目已成功添加到列表中")
  }

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id))
    showToast.success("项目已删除", "项目已从列表中移除")
  }

  const addFormField = () => {
    const newField = {
      id: Date.now(),
      label: `字段 ${formFields.length + 1}`,
      type: "text",
      placeholder: "输入内容..."
    }
    setFormFields([...formFields, newField])
  }

  const removeFormField = (id: number) => {
    setFormFields(formFields.filter(field => field.id !== id))
  }

  return (
    <PageTransition className="container mx-auto px-4 py-8 space-y-12">
      {/* 头部区域 */}
      <StaggerContainer className="text-center space-y-6">
        <MotionDiv variants={fadeInUp}>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full border border-blue-200 dark:border-blue-800">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">世界级UI组件库</span>
          </div>
        </MotionDiv>
        
        <MotionDiv variants={fadeInUp}>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            AI Prompt Builder Pro
            <br />
            <span className="text-2xl md:text-3xl text-blue-600 dark:text-blue-400">世界级组件展示</span>
          </h1>
        </MotionDiv>
        
        <MotionDiv variants={fadeInUp}>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            参考 Vercel、Linear、Stripe 设计标准，打造现代化、高性能、无障碍的用户界面组件
          </p>
        </MotionDiv>

        <MotionDiv variants={fadeInUp} className="flex flex-wrap gap-4 justify-center">
          <MotionButton onClick={() => setCommandOpen(true)} className="gap-2">
            <Keyboard className="h-4 w-4" />
            打开命令面板 (Ctrl+K)
          </MotionButton>
          <MotionButton 
            variant="outline" 
            onClick={() => showToast.success("Toast演示", "这是一个现代化的通知消息!")}
            className="gap-2"
          >
            <Zap className="h-4 w-4" />
            测试Toast通知
          </MotionButton>
        </MotionDiv>
      </StaggerContainer>

      {/* 功能展示网格 */}
      <StaggerContainer>
        <MotionDiv variants={fadeInUp} className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">核心功能展示</h2>
          <p className="text-gray-600 dark:text-gray-400">
            体验世界级的交互设计和动画效果
          </p>
        </MotionDiv>

        <AutoAnimateGrid cols={3} className="gap-6">
          <MotionCard variants={scaleIn} className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold">动画系统</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              基于 Framer Motion 和 Auto-animate 的流畅动画体验
            </p>
            <div className="flex gap-2">
              <Badge variant="secondary">Framer Motion</Badge>
              <Badge variant="secondary">Auto-animate</Badge>
            </div>
          </MotionCard>

          <MotionCard variants={scaleIn} className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <MousePointer className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold">交互体验</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              现代化的悬停效果、点击反馈和状态转换
            </p>
            <div className="flex gap-2">
              <Badge variant="secondary">Hover Effects</Badge>
              <Badge variant="secondary">Micro-interactions</Badge>
            </div>
          </MotionCard>

          <MotionCard variants={scaleIn} className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Keyboard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold">快捷键支持</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              强大的键盘导航和快捷键系统，提升操作效率
            </p>
            <div className="flex gap-2">
              <Badge variant="secondary">Ctrl+K</Badge>
              <Badge variant="secondary">Ctrl+J</Badge>
            </div>
          </MotionCard>
        </AutoAnimateGrid>
      </StaggerContainer>

      {/* 动态列表演示 */}
      <StaggerContainer>
        <MotionDiv variants={fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-600" />
                动态列表演示
              </CardTitle>
              <CardDescription>
                展示 Auto-animate 在列表操作中的流畅效果
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6">
                <MotionButton onClick={addItem} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  添加项目
                </MotionButton>
                <MotionButton 
                  variant="outline" 
                  size="sm"
                  onClick={() => showToast.info("快捷键提示", "试试按 Ctrl+J")}
                  className="gap-2"
                >
                  <Keyboard className="h-4 w-4" />
                  测试快捷键
                </MotionButton>
              </div>

              <AutoAnimateList>
                {items.map((item) => (
                  <MotionListItem key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        item.type === 'feature' ? 'bg-blue-500' : 'bg-green-500'
                      }`} />
                      <span>{item.title}</span>
                      <Badge variant={item.type === 'feature' ? 'default' : 'secondary'}>
                        {item.type === 'feature' ? '功能' : '动画'}
                      </Badge>
                    </div>
                    <MotionButton
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </MotionButton>
                  </MotionListItem>
                ))}
              </AutoAnimateList>
            </CardContent>
          </Card>
        </MotionDiv>
      </StaggerContainer>

      {/* 动态表单演示 */}
      <StaggerContainer>
        <MotionDiv variants={slideInRight}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                动态表单演示
              </CardTitle>
              <CardDescription>
                展示表单字段的动态添加和删除效果
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AutoAnimateForm className="space-y-4">
                {formFields.map((field) => (
                  <div key={field.id} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                        {field.label}
                      </label>
                      <Input placeholder={field.placeholder} />
                    </div>
                    <MotionButton
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeFormField(field.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </MotionButton>
                  </div>
                ))}
                
                <div className="flex gap-2 pt-4">
                  <MotionButton type="button" onClick={addFormField} variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    添加字段
                  </MotionButton>
                  <MotionButton type="submit" size="sm">
                    提交表单
                  </MotionButton>
                </div>
              </AutoAnimateForm>
            </CardContent>
          </Card>
        </MotionDiv>
      </StaggerContainer>

      {/* 状态卡片 */}
      <StaggerContainer>
        <MotionDiv variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MotionCard className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <Star className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold mb-2">世界级设计</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              参考顶级产品的设计规范
            </p>
          </MotionCard>

          <MotionCard className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <Heart className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold mb-2">用户体验</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              注重细节的交互体验
            </p>
          </MotionCard>

          <MotionCard className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <Coffee className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold mb-2">开发体验</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              简洁易用的组件API
            </p>
          </MotionCard>
        </MotionDiv>
      </StaggerContainer>

      {/* 命令面板 */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="搜索功能和页面..." />
        <CommandList>
          <CommandEmpty>没有找到相关结果</CommandEmpty>
          <CommandGroup heading="页面导航">
            <CommandItem>
              <Home className="mr-2 h-4 w-4" />
              <span>首页</span>
              <CommandShortcut>Ctrl+H</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <FileText className="mr-2 h-4 w-4" />
              <span>Prompt 生成器</span>
              <CommandShortcut>Ctrl+P</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <Globe className="mr-2 h-4 w-4" />
              <span>行业模板</span>
              <CommandShortcut>Ctrl+T</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="功能操作">
            <CommandItem onSelect={() => {
              setCommandOpen(false)
              showToast.success("功能已执行", "新建项目功能已启动")
            }}>
              <Plus className="mr-2 h-4 w-4" />
              <span>新建项目</span>
              <CommandShortcut>Ctrl+N</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>设置</span>
              <CommandShortcut>Ctrl+,</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="主题切换">
            <CommandItem>
              <Palette className="mr-2 h-4 w-4" />
              <span>切换主题</span>
              <CommandShortcut>Ctrl+Shift+T</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </PageTransition>
  )
}