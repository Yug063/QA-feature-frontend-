import QuestionSeparatorEngine from '@/lib/question-separator-engine'

export async function GET() {
  try {
    // Run built-in tests
    const testResults = QuestionSeparatorEngine.runTests()
    
    return Response.json({
      success: true,
      test_results: testResults,
      message: `${testResults.passed}/${testResults.total} tests passed`
    })
  } catch (error) {
    console.error('Test error:', error)
    return Response.json({ 
      success: false, 
      error: 'Failed to run tests' 
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { text, max_questions = 20 } = await request.json()
    
    if (!text) {
      return Response.json({ error: 'Text is required' }, { status: 400 })
    }

    // Process the text
    const result = QuestionSeparatorEngine.processTextToQuestions(text, max_questions)
    
    return Response.json({
      success: true,
      result,
      debug_info: {
        input_length: text.length,
        lines_detected: QuestionSeparatorEngine.splitByLines(text).length,
        processing_method: result.processing_method
      }
    })
  } catch (error) {
    console.error('Processing error:', error)
    return Response.json({ 
      success: false, 
      error: 'Failed to process text' 
    }, { status: 500 })
  }
}
