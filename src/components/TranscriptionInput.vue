<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  isProcessing: boolean
  progress: string
  error: string | null
}>()

const emit = defineEmits<{
  submit: [transcription: string]
}>()

const transcription = ref('')

function handleSubmit() {
  const text = transcription.value.trim()
  if (text) {
    emit('submit', text)
  }
}

const progressMessages: Record<string, string> = {
  'loading-context': 'Loading session memory...',
  'calling-api': 'Claude is analyzing the transcription...',
  'saving': 'Saving session...',
  'updating-memory': 'Updating session memory...'
}
</script>

<template>
  <div class="input-container">
    <h1 class="input-title">Session Intelligence</h1>
    <p class="input-subtitle">
      Paste a meeting transcription and let AI extract structured notes, action items, and learning insights.
    </p>

    <textarea
      v-model="transcription"
      :disabled="isProcessing"
      class="input-textarea"
      placeholder="Paste your meeting transcription here..."
      rows="16"
    />

    <div v-if="error" class="input-error">
      {{ error }}
    </div>

    <div class="input-actions">
      <div v-if="isProcessing" class="input-progress">
        <span class="spinner" />
        <span>{{ progressMessages[progress] || 'Processing...' }}</span>
      </div>
      <button
        class="btn-process"
        :disabled="isProcessing || !transcription.trim()"
        @click="handleSubmit"
      >
        {{ isProcessing ? 'Processing...' : 'Process Transcription' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.input-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 48px 24px;
}

.input-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-pri);
  margin: 0 0 8px;
}

.input-subtitle {
  font-size: 0.95rem;
  color: var(--text-sec);
  margin: 0 0 24px;
  line-height: 1.5;
}

.input-textarea {
  width: 100%;
  padding: 16px;
  border: 2px solid var(--border);
  border-radius: 12px;
  font-family: inherit;
  font-size: 0.9rem;
  line-height: 1.6;
  resize: vertical;
  transition: border-color 0.15s ease;
  box-sizing: border-box;
  color: var(--text-pri);
  background: var(--surface-el);
}

.input-textarea:focus {
  outline: none;
  border-color: var(--accent);
}

.input-textarea:disabled {
  background: var(--surface);
  color: var(--text-muted);
}

.input-error {
  margin-top: 12px;
  padding: 12px 16px;
  background: var(--error-bg);
  border: none;
  border-radius: 8px;
  color: var(--error-text);
  font-size: 0.875rem;
}

.input-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  gap: 16px;
}

.input-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: var(--accent);
}

.btn-process {
  padding: 12px 24px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-left: auto;
  box-shadow: 0 0 16px var(--accent-glow);
}

.btn-process:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-process:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
