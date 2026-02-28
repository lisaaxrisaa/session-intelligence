import { ref } from 'vue'
import type { Session, ProcessingState, ContextSummary } from '@/types'
import { processTranscription } from '@/services/api'
import { saveSession } from '@/services/sessions'
import { loadLatestContext, buildAndSaveContext } from '@/services/memory'

export function useSession() {
  const currentSession = ref<Session | null>(null)
  const state = ref<ProcessingState>({
    isProcessing: false,
    error: null,
    progress: 'idle'
  })

  async function process(transcription: string): Promise<Session> {
    state.value = { isProcessing: true, error: null, progress: 'loading-context' }

    try {
      const context: ContextSummary | null = await loadLatestContext()

      state.value.progress = 'calling-api'
      const startTime = Date.now()
      const result = await processTranscription(transcription, context)
      const durationMs = Date.now() - startTime

      state.value.progress = 'saving'
      const session = await saveSession(
        transcription,
        result,
        context?.summary ?? null,
        durationMs
      )

      state.value.progress = 'updating-memory'
      await buildAndSaveContext(session, context)

      currentSession.value = session
      state.value = { isProcessing: false, error: null, progress: 'done' }
      return session
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      state.value = { isProcessing: false, error: message, progress: 'idle' }
      throw err
    }
  }

  function selectSession(session: Session) {
    currentSession.value = session
  }

  function clearSession() {
    currentSession.value = null
    state.value = { isProcessing: false, error: null, progress: 'idle' }
  }

  return {
    currentSession,
    state,
    process,
    selectSession,
    clearSession
  }
}
