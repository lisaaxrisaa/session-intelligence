<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Session } from '@/types'
import SessionCard from '@/components/SessionCard.vue'

import type { ContextSummary } from '@/types'

const props = defineProps<{
  sessions: Session[]
  activeSessionId: string | null
  context: ContextSummary | null
  memoryLoading: boolean
}>()

defineEmits<{
  select: [session: Session]
  delete: [session: Session]
  'new-session': []
  'show-memory': []
}>()

const searchQuery = ref('')
const sortBy = ref<'newest' | 'oldest' | 'alpha' | 'todos'>('newest')

const filteredSessions = computed(() => {
  let list = props.sessions

  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.meeting_notes.toLowerCase().includes(q) ||
      s.transcription.toLowerCase().includes(q)
    )
  }

  return [...list].sort((a, b) => {
    switch (sortBy.value) {
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'alpha':
        return a.title.localeCompare(b.title)
      case 'todos':
        return b.todos.filter(t => !t.completed).length - a.todos.filter(t => !t.completed).length
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })
})
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h2 class="sidebar-title">Sessions</h2>
      <button class="btn-new-session" @click="$emit('new-session')">
        + New
      </button>
    </div>
    <div v-if="sessions.length > 0" class="sidebar-controls">
      <input
        v-model="searchQuery"
        placeholder="Search sessions..."
        class="sidebar-search"
      />
      <select v-model="sortBy" class="sidebar-sort">
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="alpha">A – Z</option>
        <option value="todos">Most todos</option>
      </select>
    </div>
    <div class="sidebar-list">
      <p v-if="sessions.length === 0" class="sidebar-empty">
        No sessions yet. Process your first transcription!
      </p>
      <p v-else-if="filteredSessions.length === 0" class="sidebar-empty">
        No matching sessions.
      </p>
      <SessionCard
        v-for="session in filteredSessions"
        :key="session.id"
        :session="session"
        :is-active="session.id === activeSessionId"
        @click="$emit('select', session)"
        @delete="$emit('delete', session)"
      />
    </div>

    <button
      v-if="context || memoryLoading"
      class="memory-btn"
      @click="$emit('show-memory')"
    >
      <span class="memory-btn-dot" />
      <span class="memory-btn-label">Session Memory</span>
      <span v-if="context" class="memory-btn-version">v{{ context.version }}</span>
      <span v-if="memoryLoading" class="memory-btn-version">...</span>
    </button>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 280px;
  min-width: 280px;
  border-right: 1px solid var(--border);
  background: var(--surface);
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border);
}

.sidebar-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-pri);
  margin: 0;
}

.btn-new-session {
  padding: 6px 12px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-new-session:hover {
  background: var(--accent-hover);
}

.sidebar-controls {
  display: flex;
  gap: 6px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-sub);
}

.sidebar-search {
  flex: 1;
  min-width: 0;
  padding: 6px 10px;
  background: var(--surface-el);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-pri);
  font-family: inherit;
  font-size: 0.8rem;
  transition: border-color 0.15s ease;
}

.sidebar-search::placeholder {
  color: var(--text-muted);
}

.sidebar-search:focus {
  outline: none;
  border-color: var(--accent);
}

.sidebar-sort {
  padding: 6px 8px;
  background: var(--surface-el);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-sec);
  font-family: inherit;
  font-size: 0.75rem;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.sidebar-sort:focus {
  outline: none;
  border-color: var(--accent);
}

.sidebar-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-empty {
  font-size: 0.85rem;
  color: var(--text-muted);
  text-align: center;
  padding: 24px 12px;
  margin: 0;
}

.memory-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: none;
  border: none;
  border-top: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.15s ease;
  width: 100%;
  text-align: left;
}

.memory-btn:hover {
  background: var(--surface-el);
}

.memory-btn-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
}

.memory-btn-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-sec);
  flex: 1;
}

.memory-btn-version {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-dim);
  padding: 1px 6px;
  border-radius: 9999px;
}
</style>
