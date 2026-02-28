import express from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'
import type { ContextSummary, ClaudeProcessingResult, Session } from '../src/types/index.js'

const app = express()
const PORT = 3001
const MODEL = 'claude-sonnet-4-5-20250929'

app.use(cors())
app.use(express.json({ limit: '1mb' }))

const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  console.error('ANTHROPIC_API_KEY is not set. Create a .env file with your key.')
  process.exit(1)
}

const anthropic = new Anthropic({ apiKey })

function extractJSON(text: string): string {
  const trimmed = text.trim()
  // If it starts with a code fence, strip the opening and closing fences
  if (trimmed.startsWith('```')) {
    // Remove opening fence (```json or ```)
    const afterOpen = trimmed.replace(/^```(?:json)?\s*\n?/, '')
    // Remove closing fence from the end
    const cleaned = afterOpen.replace(/\n?\s*```\s*$/, '')
    return cleaned.trim()
  }
  return trimmed
}

function buildProcessingSystemMessage(context: ContextSummary | null): string {
  let system = `You are a meeting intelligence assistant. You process meeting transcriptions and produce three outputs:

1. **Full Meeting Notes — Complete Breakdown**: Write a thorough, narrative-style breakdown of the entire meeting. This is NOT a brief summary — it should capture everything discussed in rich detail.

Rules for meeting notes:
- Divide the notes into logical parts/sections with clear headings (e.g., "## Part 1: Opening / Personal Updates", "## Part 2: Technical Deep Dive")
- Write in a narrative style with full sentences and paragraphs, not just bullet points
- Capture WHO said WHAT — attribute statements, opinions, and decisions to specific people
- Include the reasoning and context behind decisions, not just the decisions themselves
- Preserve specific details: names, numbers, tool names, technical terms, URLs, examples given
- When someone explains a concept or tells a story, capture the full explanation with context
- Use bold for key names, decisions, and important terms
- Use bullet points or sub-lists only when listing multiple items within a narrative section
- Include side conversations, personal updates, and non-technical discussions — capture the full picture
- If someone gives advice, instructions, or recommendations, write them out in detail
- Aim for completeness — if it was said in the meeting, it should be in the notes
- Use Markdown formatting throughout

2. **Todo List**: Extract all action items, assignments, and follow-ups. For each item, determine a priority (high/medium/low) based on urgency and importance expressed in the meeting.

3. **Teaching & Learning Section**: Identify technical concepts, jargon, frameworks, or methodologies mentioned in the meeting. Explain each one in plain, accessible language as if teaching someone new to the field. Explain why they matter in the context of this meeting.

You MUST respond with valid JSON matching this exact structure:
{
  "title": "A concise, descriptive title for this meeting (max 10 words)",
  "meeting_notes": "Full markdown-formatted meeting notes (detailed narrative breakdown)",
  "todos": [
    { "id": "todo-1", "text": "Action item description", "completed": false, "priority": "high" }
  ],
  "learning": [
    { "id": "learn-1", "concept": "Concept name", "explanation": "Plain language explanation with context on why it matters", "category": "technical" }
  ]
}

Use sequential IDs like "todo-1", "todo-2" and "learn-1", "learn-2".
The "category" field should be one of: "technical", "business", or "process".
The "priority" field should be one of: "high", "medium", or "low".

Respond ONLY with the JSON object. No markdown code fences, no extra text.`

  if (context) {
    system += `

## Background Context (from previous sessions)

You have memory of prior meetings. Use this context to:
- Reference ongoing projects and their status
- Recognize recurring people and their roles
- Track open items from previous meetings
- Provide continuity in your notes (e.g., "Following up from the previous discussion...")

### Summary
${context.summary}

### Key People
${context.key_people.map(p => `- ${p.name} (${p.role}): ${p.notes}`).join('\n') || 'None yet'}

### Open Items
${context.open_items.map(i => `- [${i.status}] ${i.item} (since ${i.since})`).join('\n') || 'None'}

### Project Context
${context.project_context.map(p => `- ${p.project} [${p.status}]: ${p.details}`).join('\n') || 'None'}`
  }

  return system
}

function buildContextUpdatePrompt(
  session: Pick<Session, 'title' | 'created_at' | 'meeting_notes' | 'todos' | 'learning'>,
  previous: ContextSummary | null
): string {
  let prompt = ''

  if (previous) {
    prompt += `## Previous Context (version ${previous.version})

### Summary
${previous.summary}

### Key People
${previous.key_people.map(p => `- ${p.name} (${p.role}): ${p.notes}`).join('\n') || 'None yet'}

### Open Items
${previous.open_items.map(i => `- [${i.status}] ${i.item} (since ${i.since})`).join('\n') || 'None'}

### Project Context
${previous.project_context.map(p => `- ${p.project} [${p.status}]: ${p.details}`).join('\n') || 'None'}

---

`
  } else {
    prompt += `## Previous Context
This is the FIRST session. There is no previous context. Create an initial context from this meeting.

---

`
  }

  prompt += `## New Session: "${session.title}" (${session.created_at})

### Meeting Notes
${session.meeting_notes}

### Action Items
${session.todos.map(t => `- [${t.priority}] ${t.text}`).join('\n') || 'None'}

### Concepts Discussed
${session.learning.map(l => `- ${l.concept}: ${l.explanation}`).join('\n') || 'None'}

---

Please produce an updated context summary that merges the new session with the previous context.`

  return prompt
}

// POST /api/process — Process a meeting transcription
app.post('/api/process', async (req, res) => {
  try {
    const { transcription, context } = req.body as {
      transcription: string
      context: ContextSummary | null
    }

    if (!transcription || typeof transcription !== 'string') {
      res.status(400).json({ error: 'transcription is required' })
      return
    }

    const systemMessage = buildProcessingSystemMessage(context || null)

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 16384,
      system: systemMessage,
      messages: [
        {
          role: 'user',
          content: `Process the following meeting transcription:\n\n${transcription}`
        }
      ]
    })

    const textBlock = response.content.find(block => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      res.status(500).json({ error: 'No text content in Claude response' })
      return
    }

    const parsed: ClaudeProcessingResult = JSON.parse(extractJSON(textBlock.text))

    if (!parsed.title || !parsed.meeting_notes || !Array.isArray(parsed.todos) || !Array.isArray(parsed.learning)) {
      res.status(500).json({ error: 'Invalid response structure from Claude' })
      return
    }

    res.json(parsed)
  } catch (err) {
    console.error('Error processing transcription:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

// POST /api/update-context — Build an updated context summary
app.post('/api/update-context', async (req, res) => {
  try {
    const { session, previousContext } = req.body as {
      session: Pick<Session, 'title' | 'created_at' | 'meeting_notes' | 'todos' | 'learning'>
      previousContext: ContextSummary | null
    }

    if (!session) {
      res.status(400).json({ error: 'session is required' })
      return
    }

    const prompt = buildContextUpdatePrompt(session, previousContext || null)

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: `You are a context summarization assistant. You maintain a rolling summary of meeting sessions for cross-session continuity.

Your job: Given a new meeting session and the previous context (if any), produce an UPDATED context summary that:
- Merges new information with existing context
- Updates the status of open items (mark as resolved if addressed)
- Adds new people, projects, and open items discovered in the new session
- Keeps the summary concise but comprehensive (max ~500 words)
- Prunes stale information that is no longer relevant

Respond with valid JSON matching this exact structure:
{
  "summary": "Updated rolling summary paragraph",
  "key_people": [{ "name": "Name", "role": "Role", "notes": "Context notes" }],
  "open_items": [{ "item": "Item description", "status": "open", "since": "YYYY-MM-DD" }],
  "project_context": [{ "project": "Project name", "status": "Status", "details": "Details" }]
}

The "status" field in open_items should be one of: "open", "in-progress", or "resolved".

Respond ONLY with the JSON object. No markdown code fences, no extra text.`,
      messages: [{ role: 'user', content: prompt }]
    })

    const textBlock = response.content.find(block => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      res.status(500).json({ error: 'No text content in context summary response' })
      return
    }

    const parsed = JSON.parse(extractJSON(textBlock.text))
    res.json(parsed)
  } catch (err) {
    console.error('Error updating context:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

// POST /api/revise-context — Remove a deleted session's info from context
app.post('/api/revise-context', async (req, res) => {
  try {
    const { currentContext, deletedSession } = req.body as {
      currentContext: ContextSummary
      deletedSession: Pick<Session, 'title' | 'meeting_notes'>
    }

    if (!currentContext || !deletedSession) {
      res.status(400).json({ error: 'currentContext and deletedSession are required' })
      return
    }

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: `You are a context summarization assistant. You maintain a rolling summary of meeting sessions.

A session has been DELETED. Your job: revise the current context to REMOVE any information that came exclusively from the deleted session. Keep everything that came from other sessions.

Rules:
- Remove people, open items, and projects that were ONLY mentioned in the deleted session
- If a person or project was mentioned in other sessions too, keep them but remove notes specific to the deleted session
- Update the summary paragraph to no longer reference the deleted session
- If removing the session leaves no meaningful context, return empty arrays and a brief "No context yet" summary

Respond with valid JSON matching this exact structure:
{
  "summary": "Updated rolling summary paragraph",
  "key_people": [{ "name": "Name", "role": "Role", "notes": "Context notes" }],
  "open_items": [{ "item": "Item description", "status": "open", "since": "YYYY-MM-DD" }],
  "project_context": [{ "project": "Project name", "status": "Status", "details": "Details" }]
}

Respond ONLY with the JSON object. No markdown code fences, no extra text.`,
      messages: [{
        role: 'user',
        content: `## Current Context

### Summary
${currentContext.summary}

### Key People
${currentContext.key_people.map(p => `- ${p.name} (${p.role}): ${p.notes}`).join('\n') || 'None'}

### Open Items
${currentContext.open_items.map(i => `- [${i.status}] ${i.item} (since ${i.since})`).join('\n') || 'None'}

### Project Context
${currentContext.project_context.map(p => `- ${p.project} [${p.status}]: ${p.details}`).join('\n') || 'None'}

---

## Deleted Session: "${deletedSession.title}"

### Meeting Notes (for reference — remove info from this session)
${deletedSession.meeting_notes}

---

Please produce a revised context with the deleted session's information removed.`
      }]
    })

    const textBlock = response.content.find(block => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      res.status(500).json({ error: 'No text content in context revision response' })
      return
    }

    const parsed = JSON.parse(extractJSON(textBlock.text))
    res.json(parsed)
  } catch (err) {
    console.error('Error revising context:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

// POST /api/chat — Follow-up chat about a session (streaming)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, transcription, meetingNotes } = req.body as {
      message: string
      history: { role: 'user' | 'assistant'; content: string }[]
      transcription: string
      meetingNotes: string
    }

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'message is required' })
      return
    }

    const messages = [
      ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: message }
    ]

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 4096,
      system: `You are a helpful meeting assistant. You have access to the full transcription and generated notes from a meeting session. Your job is to answer follow-up questions about the meeting.

You can:
- Provide more detail on specific topics that were discussed
- Clarify what someone said or meant
- Expand on sections that the notes may have missed or abbreviated
- Summarize specific parts of the meeting
- Answer questions about decisions, action items, or technical concepts mentioned
- Add context or detail that the original notes left out

Always reference the original transcription as your source of truth — the notes may have missed things, but the transcription has everything.

Use Markdown formatting in your responses.

## Original Transcription
${transcription}

## Generated Meeting Notes
${meetingNotes}`,
      messages
    })

    stream.on('text', (text) => {
      res.write(`data: ${JSON.stringify({ text })}\n\n`)
    })

    stream.on('end', () => {
      res.write('data: [DONE]\n\n')
      res.end()
    })

    stream.on('error', (err) => {
      console.error('Stream error:', err)
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
      res.end()
    })
  } catch (err) {
    console.error('Error in chat:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
