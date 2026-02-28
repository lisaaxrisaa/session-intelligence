<script setup lang="ts">
import type { Session } from '@/types'

const props = defineProps<{
  session: Session
  isActive: boolean
}>()

defineEmits<{
  click: []
  delete: []
}>()

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function handleDelete(e: Event) {
  e.stopPropagation()
}
</script>

<template>
  <button
    class="session-card"
    :class="{ active: isActive }"
    @click="$emit('click')"
  >
    <div class="session-card-top">
      <span class="session-card-title">{{ props.session.title }}</span>
      <span
        class="session-card-delete"
        title="Delete session"
        @click="handleDelete($event); $emit('delete')"
      >
        &times;
      </span>
    </div>
    <span class="session-card-meta">
      <span class="session-card-date">{{ formatDate(props.session.created_at) }}</span>
      <span
        v-if="props.session.todos.filter(t => !t.completed).length > 0"
        class="session-card-badge"
      >
        {{ props.session.todos.filter(t => !t.completed).length }} todos
      </span>
    </span>
  </button>
</template>

<style scoped>
.session-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border: 1px solid var(--border-sub);
  border-radius: 8px;
  background: var(--surface-el);
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: all 0.15s ease;
  font-family: inherit;
  font-size: inherit;
}

.session-card:hover {
  border-color: var(--accent);
  background: var(--surface-high);
}

.session-card.active {
  border-color: var(--border-sub);
  border-left: 2px solid var(--accent);
  background: var(--surface-high);
}

.session-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.session-card-title {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text-pri);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.session-card-delete {
  font-size: 1.1rem;
  color: var(--text-muted);
  cursor: pointer;
  line-height: 1;
  padding: 0 2px;
  border-radius: 4px;
  opacity: 0;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.session-card:hover .session-card-delete {
  opacity: 1;
}

.session-card-delete:hover {
  color: var(--error-text);
  background: var(--error-bg);
}

.session-card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.session-card-date {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.session-card-badge {
  font-size: 0.675rem;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-dim);
  padding: 1px 6px;
  border-radius: 9999px;
}
</style>
