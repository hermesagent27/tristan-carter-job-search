import type { Question } from '~/types/questions'
import { getAllQuestions } from '../utils/github'

export default defineEventHandler(async (event) => {
  if (event.method !== 'GET') {
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
  }

  try {
    const questions: Question[] = await getAllQuestions()
    
    // Get query params
    const query = getQuery(event)
    let filtered = questions
    
    // Category filter
    if (query.category && query.category !== 'all') {
      filtered = filtered.filter(q => q.category === query.category)
    }
    
    // Search by question text
    if (query.search) {
      const search = (query.search as string).toLowerCase()
      filtered = filtered.filter(q => 
        q.question.toLowerCase().includes(search) ||
        q.answer.toLowerCase().includes(search) ||
        (q.job_company && q.job_company.toLowerCase().includes(search))
      )
    }
    
    // Answer status filter
    if (query.answer_status === 'answered') {
      filtered = filtered.filter(q => q.answer.trim().length > 0)
    } else if (query.answer_status === 'unanswered') {
      filtered = filtered.filter(q => q.answer.trim().length === 0)
    }
    
    // Sort by updated_at desc
    filtered.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    
    return { success: true, questions: filtered, total: questions.length }
  } catch (e) {
    console.error('Failed to load questions:', e)
    return { success: false, questions: [], total: 0, error: 'Failed to load questions' }
  }
})
