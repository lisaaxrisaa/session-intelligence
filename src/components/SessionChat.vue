<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import type { ChatMessage } from '@/types'
import { chatFollowUpStream } from '@/services/api'

const props = defineProps<{
  transcription: string
  meetingNotes: string
  chatHistory: ChatMessage[]
  sessionId: string
}>()

const emit = defineEmits<{
  'update-chat': [messages: ChatMessage[]]
}>()

const messages = ref<ChatMessage[]>([])
const input = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)
const chatContainer = ref<HTMLElement | null>(null)
const streamingContent = ref('')

onMounted(() => {
  messages.value = [...props.chatHistory]
})

async function scrollToBottom() {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

async function handleSend() {
  const text = input.value.trim()
  if (!text || isLoading.value) return

  input.value = ''
  error.value = null
  streamingContent.value = ''

  messages.value.push({ role: 'user', content: text })
  await scrollToBottom()

  isLoading.value = true

  try {
    const history = messages.value.slice(0, -1)

    await chatFollowUpStream(
      text,
      history,
      props.transcription,
      props.meetingNotes,
      (chunk) => {
        streamingContent.value += chunk
        scrollToBottom()
      }
    )

    // Move streamed content into messages
    messages.value.push({ role: 'assistant', content: streamingContent.value })
    streamingContent.value = ''
    await scrollToBottom()

    // Persist to Supabase
    emit('update-chat', [...messages.value])
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to get response'
  } finally {
    isLoading.value = false
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}
</script>

<template>
  <div class="chat-container">
    <div class="chat-header">
      <h3 class="chat-title">Follow-up Chat</h3>
      <span class="chat-hint">Ask questions about anything in the meeting</span>
    </div>

    <div ref="chatContainer" class="chat-messages">
      <div v-if="messages.length === 0 && !isLoading" class="chat-empty">
        <p>Ask a follow-up question about this meeting.</p>
        <div class="chat-suggestions">
          <button class="suggestion" @click="input = 'What parts of the discussion did the notes miss?'; handleSend()">
            What did the notes miss?
          </button>
          <button class="suggestion" @click="input = 'Can you expand on the most important decisions made?'; handleSend()">
            Expand on key decisions
          </button>
          <button class="suggestion" @click="input = 'Who said what about the main topic?'; handleSend()">
            Who said what?
          </button>
        </div>
      </div>

      <div
        v-for="(msg, i) in messages"
        :key="i"
        class="chat-message"
        :class="msg.role"
      >
        <div class="message-label">{{ msg.role === 'user' ? 'You' : 'Claude' }}</div>
        <div class="message-content" v-html="msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content" />
      </div>

      <!-- Streaming message -->
      <div v-if="isLoading && streamingContent" class="chat-message assistant">
        <div class="message-label">Claude</div>
        <div class="message-content" v-html="renderMarkdown(streamingContent)" />
      </div>

      <!-- Waiting for first chunk -->
      <div v-if="isLoading && !streamingContent" class="chat-message assistant">
        <div class="message-label">Claude</div>
        <div class="message-content streaming-cursor">Thinking...</div>
      </div>
    </div>

    <div v-if="error" class="chat-error">{{ error }}</div>

    <div class="chat-input-row">
      <textarea
        v-model="input"
        :disabled="isLoading"
        class="chat-input"
        placeholder="Ask a follow-up question..."
        rows="2"
        @keydown="handleKeydown"
      />
      <button
        class="chat-send"
        :disabled="isLoading || !input.trim()"
        @click="handleSend"
      >
        Send
      </button>
    </div>
  </div>
</template>

<script lang="ts">
function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
    .replace(/(<li>.*?<\/li>(<br>)?)+/g, (match) => {
      const cleaned = match.replace(/<br>/g, '')
      return `<ul>${cleaned}</ul>`
    })
}
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  margin-bottom: 12px;
}

.chat-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-pri);
  margin: 0 0 2px;
}

.chat-hint {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 200px;
  max-height: 400px;
  padding: 4px 0;
}

.chat-empty {
  text-align: center;
  padding: 24px 0;
}

.chat-empty p {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 0 0 16px;
}

.chat-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.suggestion {
  padding: 8px 14px;
  background: var(--surface-el);
  border: 1px solid var(--border);
  border-radius: 20px;
  font-size: 0.8rem;
  color: var(--text-sec);
  cursor: pointer;
  transition: all 0.15s ease;
}

.suggestion:hover {
  background: var(--accent-dim);
  border-color: var(--accent);
  color: var(--accent);
}

.chat-message {
  padding: 10px 14px;
  border-radius: 10px;
}

.chat-message.user {
  background: var(--accent-dim);
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.chat-message.assistant {
  background: var(--surface-el);
  border: 1px solid var(--border-sub);
}

.message-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  color: var(--text-muted);
}

.message-content {
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--text-sec);
}

.streaming-cursor {
  color: var(--text-muted);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.message-content :deep(h2),
.message-content :deep(h3),
.message-content :deep(h4) {
  margin: 12px 0 4px;
  color: var(--text-pri);
}

.message-content :deep(h3) { font-size: 1.05rem; }
.message-content :deep(h4) { font-size: 0.95rem; }

.message-content :deep(ul) {
  margin: 6px 0;
  padding-left: 18px;
}

.message-content :deep(li) {
  margin: 3px 0;
}

.message-content :deep(strong) {
  color: var(--text-pri);
}

.message-content :deep(p) {
  margin: 6px 0;
}

.chat-error {
  padding: 8px 12px;
  background: var(--error-bg);
  border: none;
  border-radius: 6px;
  color: var(--error-text);
  font-size: 0.8rem;
  margin-bottom: 8px;
}

.chat-input-row {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.chat-input {
  flex: 1;
  padding: 10px 12px;
  border: 2px solid var(--border);
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.875rem;
  resize: none;
  transition: border-color 0.15s ease;
  color: var(--text-pri);
  background: var(--surface-el);
}

.chat-input:focus {
  outline: none;
  border-color: var(--accent);
}

.chat-input:disabled {
  background: var(--surface);
  color: var(--text-muted);
}

.chat-send {
  padding: 10px 18px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  align-self: flex-end;
  box-shadow: 0 0 16px var(--accent-glow);
}

.chat-send:hover:not(:disabled) {
  background: var(--accent-hover);
}

.chat-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}
</style>
