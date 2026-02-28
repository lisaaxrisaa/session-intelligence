<script setup lang="ts">
import type { ContextSummary } from '@/types'

defineProps<{
  context: ContextSummary | null
  loading: boolean
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <aside class="memory-panel">
    <div class="memory-header">
      <h3 class="memory-title">Session Memory</h3>
      <button class="memory-close" @click="emit('close')">&times;</button>
    </div>

    <div v-if="loading" class="memory-loading">
      <span class="spinner" />
      Loading...
    </div>

    <div v-else-if="!context" class="memory-empty">
      <p>No memory yet.</p>
      <p class="memory-hint">Process your first session to start building context.</p>
    </div>

    <div v-else class="memory-content">
      <div class="memory-stat">
        <span class="memory-stat-label">Version</span>
        <span class="memory-stat-value">{{ context.version }}</span>
      </div>
      <div class="memory-stat">
        <span class="memory-stat-label">Key People</span>
        <span class="memory-stat-value">{{ context.key_people.length }}</span>
      </div>
      <div class="memory-stat">
        <span class="memory-stat-label">Open Items</span>
        <span class="memory-stat-value">{{ context.open_items.filter(i => i.status !== 'resolved').length }}</span>
      </div>
      <div class="memory-stat">
        <span class="memory-stat-label">Projects</span>
        <span class="memory-stat-value">{{ context.project_context.length }}</span>
      </div>

      <div class="memory-summary">
        <h4 class="memory-section-title">Context Summary</h4>
        <p class="memory-summary-text">{{ context.summary }}</p>
      </div>

      <div v-if="context.key_people.length > 0" class="memory-section">
        <h4 class="memory-section-title">People</h4>
        <div v-for="person in context.key_people" :key="person.name" class="memory-person">
          <strong>{{ person.name }}</strong>
          <span class="memory-person-role">{{ person.role }}</span>
        </div>
      </div>

      <div v-if="context.open_items.filter(i => i.status !== 'resolved').length > 0" class="memory-section">
        <h4 class="memory-section-title">Open Items</h4>
        <div v-for="item in context.open_items.filter(i => i.status !== 'resolved')" :key="item.item" class="memory-item">
          <span class="memory-item-status" :class="item.status">{{ item.status }}</span>
          <span>{{ item.item }}</span>
        </div>
      </div>

      <div v-if="context.project_context.length > 0" class="memory-section">
        <h4 class="memory-section-title">Projects</h4>
        <div v-for="proj in context.project_context" :key="proj.project" class="memory-project">
          <strong>{{ proj.project }}</strong>
          <span class="memory-project-status">{{ proj.status }}</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.memory-panel {
  width: 320px;
  min-width: 320px;
  background: var(--surface);
  padding: 20px;
  height: 100vh;
  overflow-y: auto;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.4);
  animation: slideIn 0.2s ease;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.memory-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.memory-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-pri);
  margin: 0;
}

.memory-close {
  background: none;
  border: none;
  font-size: 1.4rem;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.memory-close:hover {
  color: var(--text-sec);
}

.memory-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-sec);
}

.memory-empty p {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0 0 4px;
}

.memory-hint {
  font-size: 0.8rem !important;
}

.memory-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.memory-stat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: var(--surface-el);
  border: 1px solid var(--border-sub);
  border-radius: 6px;
}

.memory-stat-label {
  font-size: 0.8rem;
  color: var(--text-sec);
}

.memory-stat-value {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--accent);
}

.memory-summary {
  margin-top: 4px;
}

.memory-section-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  margin: 0 0 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.memory-summary-text {
  font-size: 0.825rem;
  color: var(--text-sec);
  line-height: 1.5;
  margin: 0;
}

.memory-section {
  margin-top: 4px;
}

.memory-person {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 6px 0;
  font-size: 0.825rem;
  color: var(--text-sec);
  border-bottom: 1px solid var(--border-sub);
}

.memory-person:last-child {
  border-bottom: none;
}

.memory-person-role {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.memory-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 4px 0;
  font-size: 0.825rem;
  color: var(--text-sec);
}

.memory-item-status {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 1px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.memory-item-status.open {
  background: var(--error-bg);
  color: var(--error-text);
}

.memory-item-status.in-progress {
  background: var(--warning-bg);
  color: var(--warning-text);
}

.memory-project {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 6px 0;
  font-size: 0.825rem;
  color: var(--text-sec);
  border-bottom: 1px solid var(--border-sub);
}

.memory-project:last-child {
  border-bottom: none;
}

.memory-project-status {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
