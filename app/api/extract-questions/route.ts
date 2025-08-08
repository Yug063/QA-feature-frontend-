import QuestionSeparatorEngine, { QuestionObject } from '@/lib/question-separator-engine'

export async function POST(request: Request) {
  try {
    const { text, limit = 20, force_mode = false } = await request.json()
    
    // Input validation
    if (!text || typeof text !== 'string') {
      return Response.json({ error: 'Invalid text input' }, { status: 400 })
    }
    
    if (text.length > 5000) {
      return Response.json({ 
        error: 'Your input is too long. Please split it into smaller chunks under 5000 characters.',
        character_count: text.length,
        max_allowed: 5000
      }, { status: 400 })
    }

    // Process text using the separation engine
    const processingResult = QuestionSeparatorEngine.processTextToQuestions(text, limit)
    
    // Convert to expected API format
    const questions = processingResult.questions.map((q: QuestionObject, index: number) => ({
      id: q.id,
      text: q.text,
      is_edited: q.is_edited,
      confidence: q.confidence,
      is_fallback: q.is_fallback,
      card_number: index + 1,
      original_text: q.original_text || q.text,
      processing_method: processingResult.processing_method,
      source: q.source
    }))

    return Response.json({
      questions,
      total_found: processingResult.statistics.questions_found,
      limited_to: questions.length,
      processing_summary: {
        method: processingResult.processing_method,
        lines_processed: processingResult.statistics.lines_processed,
        fallback_used: processingResult.statistics.fallback_used,
        confidence_average: processingResult.statistics.confidence_average,
        statistics: processingResult.statistics
      }
    })
  } catch (error) {
    console.error('Extract questions error:', error)
    
    // Return a proper JSON error response
    return Response.json({ 
      error: 'Failed to extract questions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
