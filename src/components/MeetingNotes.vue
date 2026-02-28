<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  notes: string
}>()

const copied = ref(false)

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Fallback for older browsers
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
  <div class="notes-container">
    <div class="notes-header">
      <h3 class="notes-title">Meeting Notes</h3>
      <button
        class="btn-copy"
        :class="{ copied }"
        @click="copyToClipboard(notes)"
      >
        {{ copied ? 'Copied!' : 'Copy' }}
      </button>
    </div>
    <div class="notes-content" v-html="renderMarkdown(notes)" />
  </div>
</template>

<script lang="ts">
// Simple markdown renderer — handles headings, bold, italic, lists, line breaks
function renderMarkdown(md: string): string {
  return md
    // Headings
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p>')
    // Single newlines to <br> within content
    .replace(/\n/g, '<br>')
    // Wrap in paragraph
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li>.*?<\/li>(<br>)?)+/g, (match) => {
      const cleaned = match.replace(/<br>/g, '')
      return `<ul>${cleaned}</ul>`
    })
}
</script>

<style scoped>
.notes-container {
  padding: 0;
}

.notes-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.notes-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-pri);
  margin: 0;
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

.notes-content {
  line-height: 1.7;
  color: var(--text-sec);
  font-size: 0.925rem;
}

.notes-content :deep(h2) {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-pri);
  margin: 24px 0 8px;
}

.notes-content :deep(h3) {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-pri);
  margin: 20px 0 8px;
}

.notes-content :deep(h4) {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-sec);
  margin: 16px 0 6px;
}

.notes-content :deep(ul) {
  margin: 8px 0;
  padding-left: 20px;
}

.notes-content :deep(li) {
  margin: 4px 0;
}

.notes-content :deep(strong) {
  color: var(--text-pri);
}

.notes-content :deep(p) {
  margin: 8px 0;
}
</style>
