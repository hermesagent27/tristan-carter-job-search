import type { Question } from '~/types/questions'
import { getAllQuestions, updateQuestion } from '../../../utils/github'

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
    const questions = await getAllQuestions()
    const idx = questions.findIndex((q: Question) => q.id === id)
    
    if (idx === -1) {
      throw createError({ statusCode: 404, statusMessage: 'Question not found' })
    }
    
    const updated: Question = {
      ...questions[idx],
      ...(body.question !== undefined && { question: body.question.trim() }),
      ...(body.answer !== undefined && { answer: body.answer.trim() }),
      ...(body.category && { category: body.category }),
      updated_at: new Date().toISOString()
    }
    
    const result = await updateQuestion(id, updated)
    
    return { success: true, question: result.question }
  } catch (e: any) {
    console.error('Failed to update question:', e)
    throw createError({ 
      statusCode: e.statusCode || 500, 
      statusMessage: e.statusMessage || 'Failed to update question' 
    })
  }
})
