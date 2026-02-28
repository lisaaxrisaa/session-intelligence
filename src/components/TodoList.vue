<script setup lang="ts">
import { ref } from 'vue'
import type { TodoItem } from '@/types'

const props = defineProps<{
  todos: TodoItem[]
  sessionId: string
}>()

const emit = defineEmits<{
  update: [todos: TodoItem[]]
}>()

const copied = ref(false)

function toggleTodo(id: string) {
  const updated = props.todos.map(t =>
    t.id === id ? { ...t, completed: !t.completed } : t
  )
  emit('update', updated)
}

function priorityClass(priority: string): string {
  return `priority-${priority}`
}

async function copyToClipboard() {
  const text = props.todos
    .map(t => `- [${t.completed ? 'x' : ' '}] ${t.priority.toUpperCase()}: ${t.text}`)
    .join('\n')

  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}
</script>

<template>
  <div class="todos-container">
    <div class="todos-header">
      <h3 class="todos-title">
        Action Items
        <span class="todos-count">{{ todos.filter(t => !t.completed).length }} remaining</span>
      </h3>
      <button
        class="btn-copy"
        :class="{ copied }"
        @click="copyToClipboard"
      >
        {{ copied ? 'Copied!' : 'Copy' }}
      </button>
    </div>
    <p v-if="todos.length === 0" class="todos-empty">No action items found in this session.</p>
    <ul v-else class="todos-list">
      <li
        v-for="todo in todos"
        :key="todo.id"
        class="todo-item"
        :class="{ completed: todo.completed }"
      >
        <label class="todo-label">
          <input
            type="checkbox"
            :checked="todo.completed"
            class="todo-checkbox"
            @change="toggleTodo(todo.id)"
          >
          <span class="todo-text">{{ todo.text }}</span>
        </label>
        <span class="todo-priority" :class="priorityClass(todo.priority)">
          {{ todo.priority }}
        </span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.todos-container {
  padding: 0;
}

.todos-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.todos-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-pri);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.todos-count {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--surface-high);
  padding: 2px 8px;
  border-radius: 9999px;
}

.btn-copy {
  padding: 6px 14px;
  background: var(--surface-high);
  color: var(--text-sec);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-copy:hover {
  background: var(--border);
}

.btn-copy.copied {
  background: var(--success-bg);
  color: var(--success-text);
  border-color: transparent;
}

.todos-empty {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin: 0;
}

.todos-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--surface-el);
  transition: background 0.15s ease;
}

.todo-item:hover {
  background: var(--surface-high);
}

.todo-item.completed {
  opacity: 0.55;
}

.todo-label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  flex: 1;
  min-width: 0;
}

.todo-checkbox {
  width: 18px;
  height: 18px;
  margin-top: 2px;
  cursor: pointer;
  flex-shrink: 0;
  appearance: none;
  -webkit-appearance: none;
  background: var(--surface-high);
  border: 1.5px solid var(--border);
  border-radius: 4px;
  transition: all 0.15s ease;
}

.todo-checkbox:checked {
  background: var(--accent-dim);
  border-color: var(--accent);
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='%238b5cf6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3E%3C/svg%3E");
  background-size: 14px;
  background-position: center;
  background-repeat: no-repeat;
}

.todo-text {
  font-size: 0.9rem;
  color: var(--text-sec);
  line-height: 1.4;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  color: var(--text-muted);
}

.todo-priority {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
  margin-left: 8px;
}

.priority-high {
  background: var(--error-bg);
  color: var(--error-text);
}

.priority-medium {
  background: var(--warning-bg);
  color: var(--warning-text);
}

.priority-low {
  background: var(--success-bg);
  color: var(--success-text);
}
</style>
