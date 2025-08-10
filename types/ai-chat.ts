/**
 * AI对话系统相关类型定义
 */

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  error?: string;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  streamingMessageId: string | null;
}

export type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_STREAMING_MESSAGE'; payload: { id: string; content: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'START_STREAMING'; payload: string }
  | { type: 'STOP_STREAMING' };

export interface AIOptimizeRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  prompt?: string;
  model?: string;
}

export interface AIOptimizeResponse {
  content?: string;
  error?: string;
}

export interface ChatConfiguration {
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface ConversationHistory {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt?: string;
}

export interface StreamingResponse {
  content?: string;
  error?: string;
  finished?: boolean;
}

export interface ChatHookReturn {
  messages: ChatMessage[];
  input: string;
  setInput: (input: string) => void;
  isLoading: boolean;
  error: string | null;
  sendMessage: (message?: string) => Promise<void>;
  clearMessages: () => void;
  stopStreaming: () => void;
}

export interface ChatContextType {
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  configuration: ChatConfiguration;
  updateConfiguration: (config: Partial<ChatConfiguration>) => void;
  conversations: ConversationHistory[];
  saveConversation: (title?: string) => void;
  loadConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
}

export interface OptimizationResult {
  originalPrompt: string;
  optimizedPrompt: string;
  improvements: string[];
  suggestions: OptimizationSuggestion[];
  score: QualityScore;
}

export interface OptimizationSuggestion {
  type: 'structure' | 'clarity' | 'specificity' | 'context' | 'format';
  title: string;
  description: string;
  example?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface QualityScore {
  clarity: number;
  specificity: number;
  structure: number;
  overall: number;
}

export interface OptimizationContext {
  originalPrompt?: string;
  domain?: string;
  targetAudience?: string;
  desiredTone?: string;
  specificGoals?: string[];
}

// React Hook相关类型
export interface UseChatOptions {
  apiEndpoint?: string;
  configuration?: Partial<ChatConfiguration>;
  onError?: (error: string) => void;
  onMessage?: (message: ChatMessage) => void;
}