<script setup lang="ts">
import type { LearningItem } from '@/types'

defineProps<{
  items: LearningItem[]
}>()

function categoryColor(category: string): string {
  switch (category) {
    case 'technical': return 'cat-technical'
    case 'business': return 'cat-business'
    case 'process': return 'cat-process'
    default: return 'cat-technical'
  }
}
</script>

<template>
  <div class="learning-container">
    <div class="learning-header">
      <h3 class="learning-title">Teaching & Learning</h3>
    </div>
    <p v-if="items.length === 0" class="learning-empty">No technical concepts identified in this session.</p>
    <div v-else class="learning-grid">
      <div
        v-for="item in items"
        :key="item.id"
        class="learning-card"
      >
        <div class="learning-card-header">
          <h4 class="learning-concept">{{ item.concept }}</h4>
          <span class="learning-category" :class="categoryColor(item.category)">
            {{ item.category }}
          </span>
        </div>
        <p class="learning-explanation">{{ item.explanation }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.learning-container {
  padding: 0;
}

.learning-header {
  margin-bottom: 16px;
}

.learning-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-pri);
  margin: 0;
}

.learning-empty {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin: 0;
}

.learning-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.learning-card {
  padding: 16px;
  background: var(--surface-el);
  border: 1px solid var(--border-sub);
  border-left: 2px solid var(--accent);
  border-radius: 10px;
  transition: border-color 0.15s ease;
}

.learning-card:hover {
  border-color: var(--accent);
  border-left-color: var(--accent);
}

.learning-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  gap: 8px;
}

.learning-concept {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-pri);
  margin: 0;
}

.learning-category {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.cat-technical {
  background: var(--accent-dim);
  color: var(--accent);
}

.cat-business {
  background: rgba(96, 165, 250, 0.1);
  color: #60a5fa;
}

.cat-process {
  background: var(--warning-bg);
  color: var(--warning-text);
}

.learning-explanation {
  font-size: 0.9rem;
  color: var(--text-sec);
  line-height: 1.6;
  margin: 0;
}
</style>
