'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useIndustryTheme } from '@/components/providers/industry-theme-provider';
import { INDUSTRIES } from '@/lib/constants/industries';
import { 
  Search, 
  Filter, 
  Copy, 
  Star, 
  Trash2,
  Download,
  Share,
  Calendar,
  Tag,
  ChevronDown,
  MoreHorizontal,
  CheckCircle,
  ArrowUpDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HistoryItem {
  id: string;
  title: string;
  prompt: string;
  createdAt: string;
  industryId: string;
  scenarioId: string;
  tags?: string[];
  isFavorite?: boolean;
  category?: string;
}

interface HistoryCardProps {
  item: HistoryItem;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onToggleFavorite: (id: string) => void;
  onCopy: (prompt: string) => void;
  onDelete: (id: string) => void;
}

function HistoryCard({ 
  item, 
  isSelected, 
  onSelect, 
  onToggleFavorite, 
  onCopy, 
  onDelete 
}: HistoryCardProps) {
  const industry = INDUSTRIES[item.industryId];
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = async () => {
    onCopy(item.prompt);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return '今天';
    } else if (diffInHours < 48) {
      return '昨天';
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <Card className={`group hover:shadow-md transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(item.id, checked as boolean)}
              className="mt-1"
            />
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900 line-clamp-1">
                  {item.title}
                </h3>
                {item.isFavorite && (
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {industry && (
                  <>
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: industry.color.primary }}
                    ></div>
                    <span>{industry.name}</span>
                    <span>•</span>
                  </>
                )}
                <Calendar className="w-3 h-3" />
                <span>{formatDate(item.createdAt)}</span>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCopy}>
                <Copy className="w-4 h-4 mr-2" />
                复制提示词
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleFavorite(item.id)}>
                <Star className="w-4 h-4 mr-2" />
                {item.isFavorite ? '取消收藏' : '添加收藏'}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share className="w-4 h-4 mr-2" />
                分享
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(item.id)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-lg p-3 border">
            <p className="text-sm text-gray-700 line-clamp-3">
              {item.prompt}
            </p>
          </div>
          
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="text-xs"
              >
                {copySuccess ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    复制
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function HistoryManagementPage() {
  const router = useRouter();
  const { currentIndustry } = useIndustryTheme();
  
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'industry'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // 从localStorage加载历史记录
  useEffect(() => {
    const stored = localStorage.getItem('promptHistory');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setHistoryItems(parsed);
      } catch (error) {
        console.error('Failed to parse history:', error);
      }
    }
  }, []);

  // 过滤和排序历史记录
  const filteredAndSortedItems = useMemo(() => {
    let items = [...historyItems];

    // 搜索过滤
    if (searchTerm) {
      items = items.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.prompt.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 行业过滤
    if (selectedIndustry !== 'all') {
      items = items.filter(item => item.industryId === selectedIndustry);
    }

    // 收藏过滤
    if (showOnlyFavorites) {
      items = items.filter(item => item.isFavorite);
    }

    // 排序
    items.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'industry':
          const industryA = INDUSTRIES[a.industryId]?.name || '';
          const industryB = INDUSTRIES[b.industryId]?.name || '';
          comparison = industryA.localeCompare(industryB);
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return items;
  }, [historyItems, searchTerm, selectedIndustry, sortBy, sortOrder, showOnlyFavorites]);

  const handleItemSelect = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedItems);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredAndSortedItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredAndSortedItems.map(item => item.id)));
    }
  };

  const handleToggleFavorite = (id: string) => {
    setHistoryItems(prev => {
      const updated = prev.map(item =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      );
      localStorage.setItem('promptHistory', JSON.stringify(updated));
      return updated;
    });
  };

  const handleCopy = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const handleDelete = (id: string) => {
    setHistoryItems(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem('promptHistory', JSON.stringify(updated));
      return updated;
    });
    selectedItems.delete(id);
    setSelectedItems(new Set(selectedItems));
  };

  const handleBatchDelete = () => {
    setHistoryItems(prev => {
      const updated = prev.filter(item => !selectedItems.has(item.id));
      localStorage.setItem('promptHistory', JSON.stringify(updated));
      return updated;
    });
    setSelectedItems(new Set());
  };

  const handleBatchExport = () => {
    const selectedHistoryItems = historyItems.filter(item => selectedItems.has(item.id));
    const exportData = JSON.stringify(selectedHistoryItems, null, 2);
    
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      {/* 头部 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">历史记录</h1>
              <p className="text-gray-600">
                管理您的提示词生成历史，共 {historyItems.length} 条记录
              </p>
            </div>
            <Button onClick={() => router.push('/')}>
              返回首页
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜索和筛选栏 */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 搜索框 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索历史记录..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 筛选器 */}
            <div className="flex gap-2">
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有行业</option>
                {Object.values(INDUSTRIES).map(industry => (
                  <option key={industry.id} value={industry.id}>
                    {industry.name}
                  </option>
                ))}
              </select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    排序
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => { setSortBy('date'); setSortOrder('desc'); }}>
                    按日期排序 (新到旧)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSortBy('date'); setSortOrder('asc'); }}>
                    按日期排序 (旧到新)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSortBy('title'); setSortOrder('asc'); }}>
                    按标题排序
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSortBy('industry'); setSortOrder('asc'); }}>
                    按行业排序
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* 快捷操作栏 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedItems.size > 0 && selectedItems.size === filteredAndSortedItems.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-gray-600">
                  全选 ({selectedItems.size} / {filteredAndSortedItems.length})
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={showOnlyFavorites}
                  onCheckedChange={setShowOnlyFavorites}
                />
                <label className="text-sm text-gray-600">仅显示收藏</label>
              </div>
            </div>

            {selectedItems.size > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBatchExport}
                >
                  <Download className="w-4 h-4 mr-1" />
                  导出选中
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBatchDelete}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  删除选中
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 历史记录列表 */}
        {filteredAndSortedItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAndSortedItems.map((item) => (
              <HistoryCard
                key={item.id}
                item={item}
                isSelected={selectedItems.has(item.id)}
                onSelect={handleItemSelect}
                onToggleFavorite={handleToggleFavorite}
                onCopy={handleCopy}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="space-y-4">
              <div className="text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-4" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                {historyItems.length === 0 ? '暂无历史记录' : '未找到匹配的记录'}
              </h3>
              <p className="text-gray-600">
                {historyItems.length === 0 
                  ? '开始使用AI Prompt Builder Pro生成您的第一个提示词' 
                  : '尝试调整搜索条件或筛选器'
                }
              </p>
              {historyItems.length === 0 && (
                <Button onClick={() => router.push('/')}>
                  开始创建
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}