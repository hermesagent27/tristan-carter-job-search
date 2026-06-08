import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import type { Question } from '~/types/questions'

const DATA_PATH = process.env.NODE_ENV === 'production' 
  ? '/data/questions.json'
  : join(process.cwd(), '..', 'data', 'questions.json')

export default defineEventHandler(async (event) => {
  if (event.method !== 'PATCH') {
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Question ID required' })
  }

  const body = await readBody(event)

  try {
    const data = await readFile(DATA_PATH, 'utf-8')
    const questions: Question[] = JSON.parse(data)
    
    const index = questions.findIndex(q => q.id === id)
    if (index === -1) {
      throw createError({ statusCode: 404, statusMessage: 'Question not found' })
    }
    
    const updated: Question = {
      ...questions[index],
      ...(body.question !== undefined && { question: body.question.trim() }),
      ...(body.answer !== undefined && { answer: body.answer.trim() }),
      ...(body.category && { category: body.category }),
      updated_at: new Date().toISOString()
    }
    
    questions[index] = updated
    await writeFile(DATA_PATH, JSON.stringify(questions, null, 2))
    
    return { success: true, question: updated }
  } catch (e) {
    console.error('Failed to update question:', e)
    throw createError({ statusCode: 500, statusMessage: 'Failed to update question' })
  }
})