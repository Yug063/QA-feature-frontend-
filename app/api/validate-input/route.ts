export async function POST(request: Request) {
  try {
    const { text, force_mode = false } = await request.json()
    
    if (!text || typeof text !== 'string') {
      return Response.json({ error: 'Invalid text input' }, { status: 400 })
    }
    
    // Heuristic analysis
    const questionMarks = (text.match(/\?/g) || []).length
    const lines = text.split('\n').filter(line => line.trim().length > 0)
    const linesCount = lines.length
    const averageLineLength = linesCount > 0 ? lines.reduce((sum, line) => sum + line.length, 0) / linesCount : 0
    const hasBulletPoints = /^[\s]*[-•*]\s/m.test(text) || /^\d+\.\s/m.test(text)
    
    // Determine if we can proceed
    const canProceed = force_mode || (
      questionMarks > 0 || 
      linesCount > 1 || 
      hasBulletPoints ||
      text.length > 100
    )
    
    const confidenceScore = Math.min(1, (
      (questionMarks * 0.3) + 
      (Math.min(linesCount / 5, 1) * 0.3) +
      (hasBulletPoints ? 0.2 : 0) +
      (Math.min(text.length / 500, 1) * 0.2)
    ))

    return Response.json({
      question_marks_found: questionMarks,
      lines_count: linesCount,
      average_line_length: Math.round(averageLineLength),
      has_bullet_points: hasBulletPoints,
      can_proceed: canProceed,
      confidence_score: confidenceScore
    })
  } catch (error) {
    console.error('Validation error:', error)
    return Response.json({ error: 'Failed to validate input' }, { status: 500 })
  }
}
