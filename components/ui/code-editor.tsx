/**
 * 代码编辑器组件
 * 用于提示词模版编辑，支持语法高亮和自动完成
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card } from './card';
import { Button } from './button';
import { 
  Copy, 
  Download, 
  RotateCcw, 
  Maximize2, 
  Minimize2,
  Eye,
  Edit3,
  Settings
} from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  language?: 'text' | 'markdown' | 'json';
  height?: number;
  readOnly?: boolean;
  showPreview?: boolean;
  onSave?: () => void;
  className?: string;
}

export function CodeEditor({
  value,
  onChange,
  placeholder = '在此输入提示词模版...',
  language = 'text',
  height = 300,
  readOnly = false,
  showPreview = true,
  onSave,
  className = ''
}: CodeEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPreviewPanel, setShowPreviewPanel] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 计算字数
  useEffect(() => {
    setWordCount(value.length);
  }, [value]);

  // 处理键盘快捷键
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      onSave?.();
    }
    
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      setShowPreviewPanel(!showPreviewPanel);
    }
  };

  // 复制到剪贴板
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value);
      // TODO: 显示成功提示
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 下载为文件
  const downloadAsFile = () => {
    const blob = new Blob([value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 重置内容
  const resetContent = () => {
    if (confirm('确定要重置内容吗？此操作不可撤销。')) {
      onChange('');
    }
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''} ${className}`}>
      <Card className="p-0 overflow-hidden">
        {/* 工具栏 */}
        <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
          <div className="flex items-center space-x-2">
            <Edit3 className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">模版编辑器</span>
            <span className="text-xs text-gray-500">({language})</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {!readOnly && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  title="复制内容 (Ctrl+C)"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadAsFile}
                  title="下载文件"
                >
                  <Download className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetContent}
                  title="重置内容"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </>
            )}
            
            {showPreview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreviewPanel(!showPreviewPanel)}
                title="切换预览 (Ctrl+Enter)"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title="全屏模式"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* 编辑器主体 */}
        <div className={`flex ${showPreviewPanel ? 'divide-x' : ''}`}>
          {/* 编辑区域 */}
          <div className={`flex-1 ${showPreviewPanel ? 'w-1/2' : 'w-full'}`}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              readOnly={readOnly}
              className="w-full p-4 border-0 outline-none resize-none font-mono text-sm leading-6 bg-white"
              style={{ height: `${height}px` }}
              spellCheck={false}
            />
          </div>

          {/* 预览区域 */}
          {showPreviewPanel && (
            <div className="flex-1 w-1/2 bg-gray-50">
              <div className="p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">预览</h4>
                <div 
                  className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap"
                  style={{ minHeight: `${height - 60}px` }}
                >
                  {value || <span className="text-gray-400 italic">暂无内容可预览</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 状态栏 */}
        <div className="flex items-center justify-between p-2 bg-gray-50 border-t text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>字符数: {wordCount}</span>
            <span>行数: {value.split('\n').length}</span>
            {!readOnly && (
              <span className="text-green-600">● 实时保存</span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <span>快捷键：</span>
            <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">Ctrl+S</kbd>
            <span>保存</span>
            <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">Ctrl+Enter</kbd>
            <span>预览</span>
          </div>
        </div>
      </Card>
    </div>
  );
}