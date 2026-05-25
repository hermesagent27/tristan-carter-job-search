import { updateJob, getJobById, updateStatsFile } from '../../../server/utils/github'

export default defineEventHandler(async (event) => {
  try {
    // Get job ID from URL
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Job ID required'
      })
    }

    // Parse body
    const body = await readBody(event)
    const updates: Record<string, any> = {}

    // Validate allowed fields
    if (body.is_favorite !== undefined) {
      updates.is_favorite = Boolean(body.is_favorite)
    }
    if (body.status !== undefined) {
      updates.status = body.status // 'new', 'applied', 'interview', 'offer'
    }
    if (body.application_data !== undefined) {
      updates.application_data = body.application_data
    }

    if (Object.keys(updates).length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No valid updates provided'
      })
    }

    // Get current job to return updated version
    const currentJob = await getJobById(id)
    if (!currentJob) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Job not found'
      })
    }

    const result = await updateJob(id, updates)

    // Update stats file after status change
    if (updates.status !== undefined) {
      console.log('[Stats] Writing stats because status changed...')
      await updateStatsFile().catch(e => console.error('[Stats] Failed to write stats:', e))
    }

    return {
      success: true,
      persisted: result.persisted,
      job: result.job ?? { ...currentJob, ...updates }
    }

  } catch (error: any) {
    console.error('Error in PATCH /api/jobs/:id:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to update job'
    })
  }
})
