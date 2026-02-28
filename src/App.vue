<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Session, TodoItem, ChatMessage } from '@/types'
import { useSession } from '@/composables/useSession'
import { useMemory } from '@/composables/useMemory'
import { loadSessions, updateSessionTodos, updateSessionChat, deleteSession } from '@/services/sessions'
import { removeSessionFromContext } from '@/services/memory'
import SessionSidebar from '@/components/SessionSidebar.vue'
import TranscriptionInput from '@/components/TranscriptionInput.vue'
import ResultsView from '@/components/ResultsView.vue'
import MemoryStatus from '@/components/MemoryStatus.vue'

const sessions = ref<Session[]>([])
const showMemory = ref(false)
const { currentSession, state, process, selectSession, clearSession } = useSession()
const { context, loading: memoryLoading, refresh: refreshMemory } = useMemory()

onMounted(async () => {
  await Promise.all([
    loadSessions().then(data => { sessions.value = data }),
    refreshMemory()
  ])
})

async function handleSubmit(transcription: string) {
  try {
    const session = await process(transcription)
    sessions.value = [session, ...sessions.value]
    await refreshMemory()
  } catch {
    // Error is already captured in state.error
  }
}

function handleSelectSession(session: Session) {
  selectSession(session)
}

function handleNewSession() {
  clearSession()
}

async function handleDeleteSession(session: Session) {
  if (!confirm(`Delete "${session.title}"?`)) return

  await deleteSession(session.id)
  const remaining = sessions.value.filter(s => s.id !== session.id)
  sessions.value = remaining

  // If we deleted the active session, go back to input
  if (currentSession.value?.id === session.id) {
    clearSession()
  }

  // Update memory to remove deleted session's info
  try {
    await removeSessionFromContext(session, remaining.length)
    await refreshMemory()
  } catch (err) {
    console.error('Failed to update memory after deletion:', err)
  }
}

async function handleUpdateTodos(todos: TodoItem[]) {
  if (!currentSession.value) return

  // Optimistic update
  const updated = { ...currentSession.value, todos }
  selectSession(updated)

  // Update in session list
  sessions.value = sessions.value.map(s =>
    s.id === updated.id ? updated : s
  )

  await updateSessionTodos(updated.id, todos)
}

async function handleUpdateChat(messages: ChatMessage[]) {
  if (!currentSession.value) return

  const updated = { ...currentSession.value, chat_history: messages }
  selectSession(updated)

  sessions.value = sessions.value.map(s =>
    s.id === updated.id ? updated : s
  )

  await updateSessionChat(updated.id, messages)
}
</script>

<template>
  <div class="app-layout">
    <SessionSidebar
      :sessions="sessions"
      :active-session-id="currentSession?.id ?? null"
      :context="context"
      :memory-loading="memoryLoading"
      @select="handleSelectSession"
      @delete="handleDeleteSession"
      @new-session="handleNewSession"
      @show-memory="showMemory = true"
    />

    <main class="app-main">
      <TranscriptionInput
        v-if="!currentSession || state.isProcessing"
        :is-processing="state.isProcessing"
        :progress="state.progress"
        :error="state.error"
        @submit="handleSubmit"
      />
      <ResultsView
        v-else
        :session="currentSession"
        @update-todos="handleUpdateTodos"
        @update-chat="handleUpdateChat"
      />
    </main>

    <div v-if="showMemory" class="memory-overlay" @click.self="showMemory = false">
      <MemoryStatus
        :context="context"
        :loading="memoryLoading"
        @close="showMemory = false"
      />
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  position: relative;
}

.app-main {
  flex: 1;
  overflow-y: auto;
  height: 100vh;
}

.memory-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 200;
  display: flex;
  justify-content: flex-end;
}
</style>
