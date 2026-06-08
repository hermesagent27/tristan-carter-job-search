export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  
  if (method === 'DELETE') {
    const jobId = getRouterParam(event, 'id')
    if (!jobId) {
      throw createError({ statusCode: 400, statusMessage: 'Missing job ID' })
    }
    
    try {
      const { deleteJob } = await import('../../utils/github')
      const { orphanQuestionsFromJob } = await import('../../utils/questions')
      const result = await deleteJob(jobId)

      if (!result.deleted) {
        throw createError({ statusCode: 404, statusMessage: 'Job not found' })
      }

      // Orphan questions so they persist after job deletion
      await orphanQuestionsFromJob(jobId)

      return { success: true, persisted: result.persisted, message: 'Job deleted' }
    } catch (e) {
      console.error('Failed to delete job:', e)
      throw createError({ statusCode: 500, statusMessage: 'Failed to delete job' })
    }
  }
  
  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})
