/**
 * 简化版AI聊天系统演示页面
 * 展示新的简洁对话接口
 */

import { Metadata } from 'next';
import SimpleChatDemo from '@/components/SimpleChatDemo';

export const metadata: Metadata = {
  title: '简化版AI专家对话系统 - AI Prompt Generator',
  description: '体验全新的简洁AI对话系统，与5位专业AI专家直接对话，简单、快速、直观',
};

export default function SimpleChatPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleChatDemo />
    </div>
  );
}