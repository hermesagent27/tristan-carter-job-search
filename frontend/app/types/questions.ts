export interface Question {
  id: string
  question: string
  answer: string
  category: 'technical' | 'behavioral' | 'other'
  job_id: string | null  // null if orphaned (job deleted)
  job_company: string | null
  job_title: string | null
  created_at: string
  updated_at: string
}

export type QuestionCategory = 'technical' | 'behavioral' | 'other' | 'all'