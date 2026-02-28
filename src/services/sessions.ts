import { supabase } from '@/lib/supabase'
import type { Session, ClaudeProcessingResult, TodoItem, ChatMessage } from '@/types'

export async function saveSession(
  transcription: string,
  result: ClaudeProcessingResult,
  contextUsed: string | null,
  durationMs: number
): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      title: result.title,
      transcription,
      meeting_notes: result.meeting_notes,
      todos: result.todos,
      learning: result.learning,
      context_used: contextUsed,
      duration_ms: durationMs
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to save session: ${error.message}`)
  }

  return data as Session
}

export async function loadSessions(): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to load sessions: ${error.message}`)
  }

  return (data ?? []) as Session[]
}

export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)

  if (error) {
    throw new Error(`Failed to delete session: ${error.message}`)
  }
}

export async function updateSessionChat(
  sessionId: string,
  chatHistory: ChatMessage[]
): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({ chat_history: chatHistory })
    .eq('id', sessionId)

  if (error) {
    throw new Error(`Failed to save chat history: ${error.message}`)
  }
}

export async function updateSessionTodos(
  sessionId: string,
  todos: TodoItem[]
): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({ todos })
    .eq('id', sessionId)

  if (error) {
    throw new Error(`Failed to update todos: ${error.message}`)
  }
}
