import type { Question } from '~/types/questions'
import { getAllQuestions, updateQuestion } from '../../utils/github'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
  }

  const body = await readBody(event)
  
  if (!body.question || !body.question.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Question text is required' })
  }
  
  if (!body.category || !['technical', 'behavioral', 'other'].includes(body.category)) {
    throw createError({ statusCode: 400, statusMessage: 'Valid category required' })
  }

  try {
    const now = new Date().toISOString()
    
    // Check for duplicates first
    const questions = await getAllQuestions()
    const existing = questions.find((q: Question) => 
      q.question.toLowerCase() === body.question.trim().toLowerCase() &&
      q.job_id === (body.job_id || null)
    )
    
    if (existing) {
      // Update existing
      const result = await updateQuestion(existing.id, {
        ...existing,
        answer: (body.answer || existing.answer || '').trim(),
        category: body.category,
        updated_at: now
      })
      return { success: true, question: result.question }
    } else {
      // Create new
      const newId = body.id || `q-${randomUUID().slice(0, 8)}`
      const newQuestion = {
        id: newId,
        question: body.question.trim(),
        answer: (body.answer || '').trim(),
        category: body.category,
        job_id: body.job_id || null,
        job_company: body.job_company || null,
        job_title: body.job_title || null,
        created_at: body.created_at || now,
        updated_at: now
      }
      
      const result = await updateQuestion(newId, newQuestion)
      return { success: true, question: newQuestion }
    }
  } catch (e) {
    console.error('Failed to save question:', e)
    throw createError({ statusCode: 500, statusMessage: 'Failed to save question' })
  }
})
