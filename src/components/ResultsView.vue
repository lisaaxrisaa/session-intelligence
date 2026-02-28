<script setup lang="ts">
import { ref } from 'vue'
import type { Session, TodoItem, ChatMessage } from '@/types'
import MeetingNotes from '@/components/MeetingNotes.vue'
import TodoList from '@/components/TodoList.vue'
import LearningSection from '@/components/LearningSection.vue'
import SessionChat from '@/components/SessionChat.vue'

defineProps<{
  session: Session
}>()

const emit = defineEmits<{
  'update-todos': [todos: TodoItem[]]
  'update-chat': [messages: ChatMessage[]]
}>()

const activeTab = ref<'notes' | 'todos' | 'learning' | 'chat'>('notes')

const tabs = [
  { key: 'notes' as const, label: 'Notes' },
  { key: 'todos' as const, label: 'Todos' },
  { key: 'learning' as const, label: 'Learning' },
  { key: 'chat' as const, label: 'Chat' }
]
</script>

<template>
  <div class="results-container">
    <div class="results-header">
      <h2 class="results-title">{{ session.title }}</h2>
      <span class="results-date">
        {{ new Date(session.created_at).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        }) }}
      </span>
    </div>

    <div class="results-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span v-if="tab.key === 'todos'" class="tab-badge">
          {{ session.todos.length }}
        </span>
        <span v-if="tab.key === 'learning'" class="tab-badge">
          {{ session.learning.length }}
        </span>
      </button>
    </div>

    <div class="results-content">
      <MeetingNotes
        v-if="activeTab === 'notes'"
        :notes="session.meeting_notes"
      />
      <TodoList
        v-if="activeTab === 'todos'"
        :todos="session.todos"
        :session-id="session.id"
        @update="emit('update-todos', $event)"
      />
      <LearningSection
        v-if="activeTab === 'learning'"
        :items="session.learning"
      />
      <SessionChat
        v-if="activeTab === 'chat'"
        :transcription="session.transcription"
        :meeting-notes="session.meeting_notes"
        :chat-history="session.chat_history ?? []"
        :session-id="session.id"
        @update-chat="emit('update-chat', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.results-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 24px;
}

.results-header {
  margin-bottom: 24px;
}

.results-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-pri);
  margin: 0 0 4px;
}

.results-date {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.results-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 2px solid var(--border);
  margin-bottom: 24px;
}

.tab-btn {
  padding: 10px 16px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-sec);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  color: var(--accent);
}

.tab-btn.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.tab-badge {
  font-size: 0.7rem;
  font-weight: 600;
  background: var(--surface-high);
  color: var(--text-muted);
  padding: 1px 6px;
  border-radius: 9999px;
}

.tab-btn.active .tab-badge {
  background: var(--accent-dim);
  color: var(--accent);
}

.results-content {
  min-height: 200px;
}
</style>
