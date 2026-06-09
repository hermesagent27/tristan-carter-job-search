import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import type { Question } from '~/types/questions'

const IS_DEV = process.env.NODE_ENV === 'development' || !process.env.VERCEL
const LOCAL_DATA_PATH = process.env.LOCAL_DATA_PATH || '/home/tristan/tristan-carter-job-search/data'

const DATA_PATH = IS_DEV 
  ? join(LOCAL_DATA_PATH, 'questions.json')
  : join(process.cwd(), '..', '..', 'data', 'questions.json')

export default defineEventHandler(async (event) => {
  if (event.method !== 'GET') {
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
  }

  try {
    const data = await readFile(DATA_PATH, 'utf-8')
    const questions: Question[] = JSON.parse(data)
    
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