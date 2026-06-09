import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import type { Question } from '~/types/questions'

const IS_DEV = process.env.NODE_ENV === 'development' || !process.env.VERCEL
const LOCAL_DATA_PATH = process.env.LOCAL_DATA_PATH || '/home/tristan/tristan-carter-job-search/data'

const DATA_PATH = IS_DEV 
  ? join(LOCAL_DATA_PATH, 'questions.json')
  : join(process.cwd(), '..', '..', 'data', 'questions.json')

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
    const data = await readFile(DATA_PATH, 'utf-8')
    const questions: Question[] = JSON.parse(data)
    
    const now = new Date().toISOString()
    const newQuestion: Question = {
      id: body.id || randomUUID().slice(0, 12),
      question: body.question.trim(),
      answer: (body.answer || '').trim(),
      category: body.category,
      job_id: body.job_id || null,
      job_company: body.job_company || null,
      job_title: body.job_title || null,
      created_at: body.created_at || now,
      updated_at: now
    }
    
    // Check for duplicates by question text (case insensitive) for same job
    const existingIndex = questions.findIndex(q => 
      q.question.toLowerCase() === newQuestion.question.toLowerCase() &&
      q.job_id === newQuestion.job_id
    )
    
    if (existingIndex >= 0) {
      // Update existing
      questions[existingIndex] = { ...questions[existingIndex], ...newQuestion, id: questions[existingIndex].id }
    } else {
      questions.push(newQuestion)
    }
    
    await writeFile(DATA_PATH, JSON.stringify(questions, null, 2))
    
    return { success: true, question: existingIndex >= 0 ? questions[existingIndex] : newQuestion }
  } catch (e) {
    console.error('Failed to save question:', e)
    throw createError({ statusCode: 500, statusMessage: 'Failed to save question' })
  }
})