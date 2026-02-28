import { supabase } from '@/lib/supabase'
import { updateContext, reviseContext } from '@/services/api'
import type { ContextSummary, Session } from '@/types'

export async function loadLatestContext(): Promise<ContextSummary | null> {
  const { data, error } = await supabase
    .from('context_summaries')
    .select('*')
    .order('version', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to load context: ${error.message}`)
  }

  return (data as ContextSummary) ?? null
}

export async function buildAndSaveContext(
  session: Session,
  previousContext: ContextSummary | null
): Promise<ContextSummary> {
  const parsed = await updateContext(session, previousContext)
  const nextVersion = (previousContext?.version ?? 0) + 1

  const { data, error } = await supabase
    .from('context_summaries')
    .insert({
      session_id: session.id,
      summary: parsed.summary,
      key_people: parsed.key_people,
      open_items: parsed.open_items,
      project_context: parsed.project_context,
      version: nextVersion
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to save context summary: ${error.message}`)
  }

  return data as ContextSummary
}

export async function removeSessionFromContext(
  deletedSession: Pick<Session, 'title' | 'meeting_notes'>,
  remainingSessions: number
): Promise<void> {
  const currentContext = await loadLatestContext()
  if (!currentContext) return

  // No remaining sessions — wipe all context
  if (remainingSessions === 0) {
    const { error } = await supabase
      .from('context_summaries')
      .delete()
      .gte('version', 1)
    if (error) {
      throw new Error(`Failed to clear context: ${error.message}`)
    }
    return
  }

  // Ask Claude to revise context without the deleted session
  const parsed = await reviseContext(currentContext, deletedSession)
  const nextVersion = currentContext.version + 1

  const { error } = await supabase
    .from('context_summaries')
    .insert({
      session_id: null,
      summary: parsed.summary,
      key_people: parsed.key_people,
      open_items: parsed.open_items,
      project_context: parsed.project_context,
      version: nextVersion
    })

  if (error) {
    throw new Error(`Failed to save revised context: ${error.message}`)
  }
}
