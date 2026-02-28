import { ref } from 'vue'
import type { ContextSummary } from '@/types'
import { loadLatestContext } from '@/services/memory'

export function useMemory() {
  const context = ref<ContextSummary | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function refresh() {
    loading.value = true
    error.value = null
    try {
      context.value = await loadLatestContext()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load context'
    } finally {
      loading.value = false
    }
  }

  return {
    context,
    loading,
    error,
    refresh
  }
}
