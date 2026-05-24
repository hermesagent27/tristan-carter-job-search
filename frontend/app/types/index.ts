// Types for jobs
export interface Job {
  id: string
  title: string
  company: string
  location: string
  is_remote: boolean
  salary_min?: number
  salary_max?: number
  description_short?: string
  description?: string
  url: string
  source: string
  date_posted: string
  date_scraped: string
  tags: string[]
  role_type?: string
  is_favorite: boolean
  status: 'new' | 'applied' | 'interview' | 'offer'
  application_data?: ApplicationData
}

export interface ApplicationData {
  cover_letter?: string
  questions: ApplicationQuestion[]
  notes?: string
}

export interface ApplicationQuestion {
  question: string
  answer: string
}

export interface Application {
  id: string
  job_id: string
  status: 'applied' | 'interview' | 'offer'
  date_applied: string
  updated_at: string
  cover_letter?: string
  notes?: string
}
