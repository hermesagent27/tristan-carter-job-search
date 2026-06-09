import { deleteQuestion } from '../../utils/github'

export default defineEventHandler(async (event) => {
  if (event.method !== 'DELETE') {
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Question ID required' })
  }

  try {
    const result = await deleteQuestion(id)
    
    if (!result.deleted) {
      throw createError({ statusCode: 404, statusMessage: 'Question not found' })
    }
    
    return { success: true, deleted: result.deleted }
  } catch (e: any) {
    console.error('Failed to delete question:', e)
    throw createError({ 
      statusCode: e.statusCode || 500, 
      statusMessage: e.statusMessage || 'Failed to delete question' 
    })
  }
})
