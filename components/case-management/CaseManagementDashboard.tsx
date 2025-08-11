'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Scale,
  FileText,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  CheckCircle2,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Eye,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'

// 案件状态定义
const caseStatuses = {
  active: { label: '进行中', color: 'bg-blue-100 text-blue-800', icon: Clock },
  pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  suspended: { label: '暂停', color: 'bg-gray-100 text-gray-800', icon: Clock },
  closed: { label: '已结案', color: 'bg-purple-100 text-purple-800', icon: CheckCircle2 }
}

// 案件类型定义
const caseTypes = [
  { id: 'civil', name: '民事纠纷', color: 'text-blue-600' },
  { id: 'commercial', name: '商事争议', color: 'text-green-600' },
  { id: 'criminal', name: '刑事案件', color: 'text-red-600' },
  { id: 'administrative', name: '行政案件', color: 'text-purple-600' },
  { id: 'labor', name: '劳动争议', color: 'text-orange-600' },
  { id: 'ip', name: '知识产权', color: 'text-indigo-600' }
]

// 优先级定义
const priorities = {
  high: { label: '紧急', color: 'bg-red-100 text-red-800' },
  medium: { label: '重要', color: 'bg-yellow-100 text-yellow-800' },
  low: { label: '一般', color: 'bg-green-100 text-green-800' }
}

interface CaseData {
  id: string
  title: string
  client: string
  type: string
  status: keyof typeof caseStatuses
  priority: keyof typeof priorities
  startDate: string
  nextHearing?: string
  description: string
  value?: string
  assignedLawyer: string
  progress: number
  documents: number
  lastUpdate: Date
}

// 模拟案件数据
const mockCases: CaseData[] = [
  {
    id: '1',
    title: 'XX公司合同纠纷案',
    client: 'XX科技有限公司',
    type: 'commercial',
    status: 'active',
    priority: 'high',
    startDate: '2024-01-15',
    nextHearing: '2024-02-20',
    description: '关于软件开发合同的违约纠纷，涉及付款和交付问题',
    value: '500万元',
    assignedLawyer: '张律师',
    progress: 65,
    documents: 12,
    lastUpdate: new Date('2024-01-20')
  },
  {
    id: '2',
    title: '劳动合同争议调解',
    client: '王某',
    type: 'labor',
    status: 'pending',
    priority: 'medium',
    startDate: '2024-01-10',
    description: '员工与公司关于离职补偿和竞业限制的争议',
    assignedLawyer: '李律师',
    progress: 30,
    documents: 8,
    lastUpdate: new Date('2024-01-18')
  },
  {
    id: '3',
    title: '商标侵权案件',
    client: 'YY品牌集团',
    type: 'ip',
    status: 'completed',
    priority: 'high',
    startDate: '2023-11-01',
    description: '商标侵权诉讼，已获得胜诉判决',
    value: '200万元',
    assignedLawyer: '赵律师',
    progress: 100,
    documents: 25,
    lastUpdate: new Date('2024-01-05')
  }
]

export default function CaseManagementDashboard() {
  const [cases, setCases] = useState<CaseData[]>(mockCases)
  const [selectedCase, setSelectedCase] = useState<CaseData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // 过滤案件
  const filteredCases = cases.filter(caseData => {
    const matchesSearch = caseData.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         caseData.client.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || caseData.status === statusFilter
    const matchesType = typeFilter === 'all' || caseData.type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  // 获取统计信息
  const getStats = useCallback(() => {
    return {
      total: cases.length,
      active: cases.filter(c => c.status === 'active').length,
      pending: cases.filter(c => c.status === 'pending').length,
      completed: cases.filter(c => c.status === 'completed').length,
      highPriority: cases.filter(c => c.priority === 'high').length
    }
  }, [cases])

  const stats = getStats()

  // 案件卡片组件
  const CaseCard = ({ caseData }: { caseData: CaseData }) => {
    const StatusIcon = caseStatuses[caseData.status].icon
    const caseType = caseTypes.find(t => t.id === caseData.type)
    
    return (
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow-md",
          selectedCase?.id === caseData.id && "ring-2 ring-blue-500"
        )}
        onClick={() => setSelectedCase(caseData)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">{caseData.title}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                {caseData.client}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={priorities[caseData.priority].color}>
                {priorities[caseData.priority].label}
              </Badge>
              <Badge className={caseStatuses[caseData.status].color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {caseStatuses[caseData.status].label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className={cn("font-medium", caseType?.color)}>
              {caseType?.name}
            </span>
            <span className="text-gray-500">
              {caseData.assignedLawyer}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 line-clamp-2">
            {caseData.description}
          </p>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>进度: {caseData.progress}%</span>
            <span>{caseData.documents} 个文档</span>
            <span>更新: {caseData.lastUpdate.toLocaleDateString()}</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${caseData.progress}%` }}
            />
          </div>
          
          {caseData.value && (
            <div className="text-sm font-medium text-green-600">
              案件价值: {caseData.value}
            </div>
          )}
          
          {caseData.nextHearing && (
            <div className="flex items-center gap-2 text-sm text-orange-600">
              <Calendar className="w-4 h-4" />
              下次开庭: {caseData.nextHearing}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Scale className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">案件管理</h1>
            <p className="text-gray-600">统一管理和跟踪所有法律案件</p>
          </div>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          新建案件
        </Button>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">总案件数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.active}</div>
            <div className="text-sm text-gray-600">进行中</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">待处理</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">已完成</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.highPriority}</div>
            <div className="text-sm text-gray-600">紧急案件</div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="搜索案件标题或客户名称..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="按状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                {Object.entries(caseStatuses).map(([key, status]) => (
                  <SelectItem key={key} value={key}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="按类型筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有类型</SelectItem>
                {caseTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 案件列表 */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              案件列表 ({filteredCases.length})
            </h2>
            
            {filteredCases.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">暂无案件</h3>
                  <p className="text-gray-600">没有找到符合条件的案件</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredCases.map((caseData) => (
                  <CaseCard key={caseData.id} caseData={caseData} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 案件详情 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">案件详情</h2>
          
          {selectedCase ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{selectedCase.title}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">客户</span>
                    <span className="text-sm text-gray-900">{selectedCase.client}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">案件类型</span>
                    <span className="text-sm text-gray-900">
                      {caseTypes.find(t => t.id === selectedCase.type)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">负责律师</span>
                    <span className="text-sm text-gray-900">{selectedCase.assignedLawyer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">开始日期</span>
                    <span className="text-sm text-gray-900">{selectedCase.startDate}</span>
                  </div>
                  {selectedCase.value && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">案件价值</span>
                      <span className="text-sm font-semibold text-green-600">{selectedCase.value}</span>
                    </div>
                  )}
                  {selectedCase.nextHearing && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">下次开庭</span>
                      <span className="text-sm text-orange-600">{selectedCase.nextHearing}</span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">案件描述</h4>
                  <p className="text-sm text-gray-600">{selectedCase.description}</p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">进度</span>
                    <span className="text-sm font-semibold text-blue-600">{selectedCase.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${selectedCase.progress}%` }}
                    />
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <Button className="w-full" variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    查看文档 ({selectedCase.documents})
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    时间线
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    导出报告
                  </Button>
                </div>

              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">选择案件</h3>
                <p className="text-gray-600">点击左侧案件查看详细信息</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}