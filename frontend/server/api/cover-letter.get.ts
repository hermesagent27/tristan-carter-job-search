import { generateCoverLetter } from '../utils/cover-letter'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const jobId = query.id as string
    
    if (!jobId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Job ID required'
      })
    }
    
    // Get the job - getJobById is auto-imported from server/utils
    const job = await getJobById(jobId)
    if (!job) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Job not found'
      })
    }
    
    // Generate cover letter
    const coverLetter = await generateCoverLetter(job)
    
    return {
      success: true,
      cover_letter: coverLetter
    }
    
  } catch (error: any) {
    console.error('Error generating cover letter:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to generate cover letter'
    })
  }
})
