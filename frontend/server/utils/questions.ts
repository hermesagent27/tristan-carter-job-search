import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import type { Question } from '~/types/questions'

const IS_DEV = process.env.NODE_ENV === 'development' || !process.env.VERCEL
const LOCAL_DATA_PATH = process.env.LOCAL_DATA_PATH || '/home/tristan/tristan-carter-job-search/data'

const DATA_PATH = IS_DEV 
  ? join(LOCAL_DATA_PATH, 'questions.json')
  : '/data/questions.json'

// Infer category from question text
function inferCategory(question: string): 'technical' | 'behavioral' | 'other' {
  const q = question.toLowerCase()
  
  const technicalKeywords = [
    'code', 'coding', 'program', 'programming', 'language', 'framework', 'library',
    'database', 'api', 'rest', 'graphql', 'http', 'css', 'html', 'javascript',
    'typescript', 'python', 'react', 'vue', 'angular', 'node', 'server', 'client',
    'frontend', 'backend', 'fullstack', 'devops', 'docker', 'kubernetes', 'aws',
    'deploy', 'testing', 'test', 'unit', 'integration', 'git', 'version control',
    'bug', 'debug', 'optimize', 'performance', 'algorithm', 'data structure',
    'project', 'architecture', 'system design', 'oop', 'functional'
  ]
  
  const behavioralKeywords = [
    'describe a time', 'tell me about', 'example', 'situation', 'challenge',
    'difficult', 'conflict', ' teamwork', 'team', 'lead', 'leadership',
    'manage', 'manager', 'deadline', 'pressure', 'stress', 'failure',
    'success', 'accomplish', 'goal', 'motivate', 'communication', 'communicate',
    'collaborate', 'disagree', 'criticism', 'feedback', 'strength', 'weakness'
  ]
  
  const techCount = technicalKeywords.filter(k => q.includes(k)).length
  const behavCount = behavioralKeywords.filter(k => q.includes(k)).length
  
  if (techCount > behavCount) return 'technical'
  if (behavCount > techCount) return 'behavioral'
  return 'other'
}

// Load all questions from file
export async function loadQuestions(): Promise<Question[]> {
  try {
    const data = await readFile(DATA_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (e) {
    console.error('[Questions] Failed to load questions:', e)
    return []
  }
}

// Save questions to file
export async function saveQuestions(questions: Question[]): Promise<void> {
  await writeFile(DATA_PATH, JSON.stringify(questions, null, 2))
}

// Sync questions from a job's application_data to global questions store
export async function syncQuestionsFromJob(
  jobId: string, 
  company: string, 
  title: string,
  jobQuestions: Array<{ question: string; answer: string; category?: 'technical' | 'behavioral' | 'other' }>
): Promise<void> {
  const questions = await loadQuestions()
  const now = new Date().toISOString()
  
  // Get existing questions for this job
  const existingForJob = questions.filter(q => q.job_id === jobId)
  const processedIds = new Set<string>()
  
  for (const jq of jobQuestions) {
    if (!jq.question.trim()) continue
    
    // Check if question already exists for this job
    const existing = existingForJob.find(q => 
      q.question.toLowerCase().trim() === jq.question.toLowerCase().trim()
    )
    
    const category = jq.category || inferCategory(jq.question)
    
    if (existing) {
      // Update answer and category if changed
      if (existing.answer !== jq.answer || existing.category !== category) {
        existing.answer = jq.answer
        existing.category = category
        existing.updated_at = now
      }
      processedIds.add(existing.id)
    } else {
      // Create new question
      const newQuestion: Question = {
        id: `q-${randomUUID().slice(0, 8)}`,
        question: jq.question.trim(),
        answer: jq.answer.trim(),
        category,
        job_id: jobId,
        job_company: company,
        job_title: title,
        created_at: now,
        updated_at: now
      }
      questions.push(newQuestion)
      processedIds.add(newQuestion.id)
    }
  }
  
  // Mark orphaned questions (keep them but clear job reference)
  for (const existing of existingForJob) {
    if (!processedIds.has(existing.id)) {
      // Question was removed from job - keep in global store but mark orphaned
      existing.job_id = null
      existing.updated_at = now
    }
  }
  
  await saveQuestions(questions)
  console.log(`[Questions] Synced ${jobQuestions.length} questions from job ${jobId}`)
}

// When job is deleted, keep questions but clear job reference
export async function orphanQuestionsFromJob(jobId: string): Promise<void> {
  const questions = await loadQuestions()
  const now = new Date().toISOString()
  let updated = false
  
  for (const q of questions) {
    if (q.job_id === jobId) {
      q.job_id = null
      q.updated_at = now
      updated = true
    }
  }
  
  if (updated) {
    await saveQuestions(questions)
    console.log(`[Questions] Orphaned questions from deleted job ${jobId}`)
  }
}