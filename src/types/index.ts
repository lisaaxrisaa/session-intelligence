export interface TodoItem {
  id: string
  text: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
}

export interface LearningItem {
  id: string
  concept: string
  explanation: string
  category: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface Session {
  id: string
  created_at: string
  title: string
  transcription: string
  meeting_notes: string
  todos: TodoItem[]
  learning: LearningItem[]
  chat_history: ChatMessage[]
  context_used: string | null
  duration_ms: number | null
}

export interface ClaudeProcessingResult {
  title: string
  meeting_notes: string
  todos: TodoItem[]
  learning: LearningItem[]
}

export interface KeyPerson {
  name: string
  role: string
  notes: string
}

export interface OpenItem {
  item: string
  status: 'open' | 'in-progress' | 'resolved'
  since: string
}

export interface ProjectContext {
  project: string
  status: string
  details: string
}

export interface ContextSummary {
  id: string
  created_at: string
  session_id: string | null
  summary: string
  key_people: KeyPerson[]
  open_items: OpenItem[]
  project_context: ProjectContext[]
  version: number
}

export interface ProcessingState {
  isProcessing: boolean
  error: string | null
  progress: 'idle' | 'loading-context' | 'calling-api' | 'saving' | 'updating-memory' | 'done'
}
