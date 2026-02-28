import type { ChatMessage, ClaudeProcessingResult, ContextSummary, Session } from '@/types'

export async function processTranscription(
  transcription: string,
  context: ContextSummary | null
): Promise<ClaudeProcessingResult> {
  const response = await fetch('/api/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcription, context })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to process transcription')
  }

  return response.json()
}

export async function updateContext(
  session: Pick<Session, 'title' | 'created_at' | 'meeting_notes' | 'todos' | 'learning'>,
  previousContext: ContextSummary | null
): Promise<{
  summary: string
  key_people: ContextSummary['key_people']
  open_items: ContextSummary['open_items']
  project_context: ContextSummary['project_context']
}> {
  const response = await fetch('/api/update-context', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session, previousContext })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update context')
  }

  return response.json()
}

export async function reviseContext(
  currentContext: ContextSummary,
  deletedSession: Pick<Session, 'title' | 'meeting_notes'>
): Promise<{
  summary: string
  key_people: ContextSummary['key_people']
  open_items: ContextSummary['open_items']
  project_context: ContextSummary['project_context']
}> {
  const response = await fetch('/api/revise-context', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentContext, deletedSession })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to revise context')
  }

  return response.json()
}

export async function chatFollowUpStream(
  message: string,
  history: ChatMessage[],
  transcription: string,
  meetingNotes: string,
  onChunk: (text: string) => void
): Promise<void> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, transcription, meetingNotes })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to send message')
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    // Keep the last incomplete line in the buffer
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)

      if (data === '[DONE]') return

      try {
        const parsed = JSON.parse(data)
        if (parsed.error) throw new Error(parsed.error)
        if (parsed.text) onChunk(parsed.text)
      } catch (e) {
        if (e instanceof SyntaxError) continue
        throw e
      }
    }
  }
}
