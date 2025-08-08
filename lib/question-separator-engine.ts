/**
 * Question Separation Logic Engine
 * Pure processing logic for separating text into questions
 * No UI dependencies - can be used in API routes or client-side
 */

interface QuestionObject {
  id: string
  text: string
  source: string
  is_edited: boolean
  confidence: number
  is_fallback: boolean
  card_number?: number
  original_text?: string
}

interface ProcessingResult {
  questions: QuestionObject[]
  total_processed: number
  processing_method: string
  statistics: {
    lines_processed: number
    questions_found: number
    fallback_used: boolean
    confidence_average: number
  }
}

class QuestionSeparatorEngine {
  // Regex patterns for different text formats
  private static readonly PATTERNS = {
    bullet_points: /^[\s]*[-•*]\s+/,
    numbered_lists: /^\d+\.\s+/,
    question_prefixes: /^(Q|Question)\s*\d*[:\.]?\s+/i,
    sentence_boundaries: /[.!?]+\s*/
  }

  /**
   * Split text by line breaks and clean empty lines
   */
  static splitByLines(text: string): string[] {
    return text
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.trim())
  }

  /**
   * Check if line contains question markers, exclamations, or structured formatting
   */
  static detectQuestionInLine(line: string): boolean {
    return (
      /[?!]/.test(line) ||
      (/\.$/.test(line) && line.length < 100) ||
      this.PATTERNS.bullet_points.test(line) ||
      this.PATTERNS.numbered_lists.test(line) ||
      this.PATTERNS.question_prefixes.test(line)
    )
  }

  /**
   * Remove formatting prefixes from lines
   */
  static cleanLinePrefix(line: string): string {
    return line
      .replace(this.PATTERNS.bullet_points, '')
      .replace(this.PATTERNS.numbered_lists, '')
      .replace(this.PATTERNS.question_prefixes, '')
      .trim()
  }

  /**
   * Split text by sentence boundaries for fallback processing
   */
  static splitBySentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .filter(s => s.trim().length > 5)
      .map(s => {
        const clean = s.trim()
        return clean.endsWith('?') ? clean : `${clean}?`
      })
  }

  /**
   * Split line with mixed punctuation into separate questions
   */
  static splitMixedPunctuation(line: string): { text: string; source: string; confidence: number }[] {
    // Split by punctuation but keep the punctuation marks
    const parts = line.split(/([.!?])/).filter(Boolean)
    const questions: { text: string; source: string; confidence: number }[] = []
    
    for (let i = 0; i < parts.length; i += 2) {
      const text = parts[i]?.trim()
      const punctuation = parts[i + 1]
      
      if (text && text.length > 5) {
        let questionText: string
        let source: string
        let confidence: number
        
        if (punctuation === '?') {
          questionText = `${text}?`
          source = 'question_preserved'
          confidence = 0.95
        } else if (punctuation === '!') {
          questionText = `${text}?`
          source = 'exclamation_converted'
          confidence = 0.85
        } else if (punctuation === '.') {
          questionText = `${text}?`
          source = 'period_converted'
          confidence = 0.75
        } else {
          // No punctuation at end
          questionText = `${text}?`
          source = 'no_punctuation_converted'
          confidence = 0.7
        }
        
        questions.push({ text: questionText, source, confidence })
      }
    }
  
    return questions
  }

  /**
   * Check if line contains multiple questions (multiple question marks)
   */
  static hasMultipleQuestions(line: string): boolean {
    return (line.match(/\?/g) || []).length > 1
  }

  /**
   * Split line by sentence boundaries when multiple questions detected
   */
  static splitLineByQuestions(line: string): string[] {
    // Split by question marks but keep the question mark
    const parts = line.split(/(\?)/).filter(part => part.trim())
    const questions: string[] = []
    
    for (let i = 0; i < parts.length; i += 2) {
      if (parts[i] && parts[i + 1] === '?') {
        questions.push((parts[i] + '?').trim())
      }
    }
    
    return questions.filter(q => q.length > 5)
  }

  /**
   * Transform statement to question for fallback processing
   */
  static transformToQuestion(statement: string): { text: string; confidence: number } {
    const lower = statement.toLowerCase()
    
    // Already a question
    if (statement.includes('?')) {
      return { text: statement, confidence: 0.95 }
    }

    // Transform based on content patterns
    if (lower.includes(' is ') || lower.includes(' are ')) {
      return { 
        text: `What ${lower}?`, 
        confidence: 0.7 
      }
    }
    
    if (lower.includes(' has ') || lower.includes(' have ')) {
      return { 
        text: `What applications or features ${lower.replace(' has ', ' have ')}?`, 
        confidence: 0.68 
      }
    }
    
    if (lower.includes(' can ') || lower.includes(' could ')) {
      return { 
        text: `How ${lower}?`, 
        confidence: 0.65 
      }
    }
    
    // Generic transformation
    return { 
      text: `What about ${lower.replace(/[.!]$/, '')}?`, 
      confidence: 0.6 
    }
  }

  /**
   * Main processing function - converts text to question objects
   */
  static processTextToQuestions(inputText: string, maxQuestions: number = 20): ProcessingResult {
    const lines = this.splitByLines(inputText)
    const questions: QuestionObject[] = []
    let processing_method = 'line_breaks'
    let fallback_used = false
    let questionCounter = 0

    // Process each line
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]
      
      // Check for multiple questions or mixed punctuation in same line
      if (this.hasMultipleQuestions(line) || /[.!?].*[.!?]/.test(line)) {
        processing_method = 'mixed_punctuation'
        const splitQuestions = this.splitMixedPunctuation(line)
        
        splitQuestions.forEach((questionData, splitIndex) => {
          if (questionCounter < maxQuestions) {
            questions.push({
              id: `temp_${questionCounter + 1}`,
              text: questionData.text,
              source: questionData.source,
              is_edited: false,
              confidence: questionData.confidence,
              is_fallback: false,
              card_number: questionCounter + 1,
              original_text: questionData.text
            })
            questionCounter++
          }
        })
        continue
      }

      // Check if line contains question markers
      if (this.detectQuestionInLine(line)) {
        const originalLine = line
        const cleanedText = this.cleanLinePrefix(line)
        const wasPrefix = cleanedText !== line
        
        if (cleanedText.length > 5 && questionCounter < maxQuestions) {
          // Ensure question ends with question mark if it doesn't already
          const questionText = cleanedText.includes('?') ? cleanedText : `${cleanedText}?`
          
          questions.push({
            id: `temp_${questionCounter + 1}`,
            text: questionText,
            source: wasPrefix ? this.getSourceType(originalLine) : `line_${lineIndex + 1}`,
            is_edited: false,
            confidence: wasPrefix ? 0.85 : 0.95,
            is_fallback: false,
            card_number: questionCounter + 1,
            original_text: originalLine
          })
          questionCounter++
          
          if (wasPrefix) {
            processing_method = 'prefix_cleaning'
          }
        }
      } else if (line.length > 20 && line.length < 200 && questionCounter < maxQuestions) {
        // Potential fallback candidate
        const transformed = this.transformToQuestion(line)
        questions.push({
          id: `temp_${questionCounter + 1}`,
          text: transformed.text,
          source: 'fallback_transformed',
          is_edited: false,
          confidence: transformed.confidence,
          is_fallback: true,
          card_number: questionCounter + 1,
          original_text: line
        })
        questionCounter++
        fallback_used = true
        processing_method = 'fallback_processing'
      }
    }

    // If no questions found, use sentence splitting fallback
    if (questions.length === 0) {
      fallback_used = true
      processing_method = 'fallback_sentences'
      
      const sentences = this.splitBySentences(inputText)
      sentences.forEach((sentence, index) => {
        if (questionCounter < maxQuestions) {
          const transformed = this.transformToQuestion(sentence)
          questions.push({
            id: `temp_${questionCounter + 1}`,
            text: transformed.text,
            source: 'fallback_sentence',
            is_edited: false,
            confidence: transformed.confidence,
            is_fallback: true,
            card_number: questionCounter + 1,
            original_text: sentence
          })
          questionCounter++
        }
      })
    }

    // Calculate statistics
    const confidenceSum = questions.reduce((sum, q) => sum + q.confidence, 0)
    const confidenceAverage = questions.length > 0 ? confidenceSum / questions.length : 0

    return {
      questions: questions.slice(0, maxQuestions),
      total_processed: lines.length,
      processing_method,
      statistics: {
        lines_processed: lines.length,
        questions_found: questions.length,
        fallback_used,
        confidence_average: Math.round(confidenceAverage * 100) / 100
      }
    }
  }

  /**
   * Determine source type based on line format
   */
  private static getSourceType(line: string): string {
    if (this.PATTERNS.bullet_points.test(line)) return 'bullet_cleaned'
    if (this.PATTERNS.numbered_lists.test(line)) return 'numbered_cleaned'
    if (this.PATTERNS.question_prefixes.test(line)) return 'prefix_cleaned'
    return 'line_cleaned'
  }

  /**
   * Simple test function to validate processing logic
   */
  static runTests(): { passed: number; total: number; results: any[] } {
    const testCases = [
      {
        name: "Line breaks processing",
        input: "What is AI?\nHow does ML work?",
        expected_questions: 2,
        expected_method: "line_breaks"
      },
      {
        name: "Mixed punctuation processing",
        input: "What is AI! How does ML work. What are neural networks? Can you explain deep learning!",
        expected_questions: 4,
        expected_method: "mixed_punctuation"
      },
      {
        name: "Bullet point cleaning",
        input: "• What is AI?\n• How does ML work?",
        expected_questions: 2,
        expected_method: "prefix_cleaning"
      },
      {
        name: "Fallback sentence processing",
        input: "AI is important. ML has applications.",
        expected_questions: 2,
        expected_method: "fallback_sentences"
      }
    ]

    const results = testCases.map(testCase => {
      const result = this.processTextToQuestions(testCase.input)
      const passed = result.questions.length === testCase.expected_questions
      
      return {
        name: testCase.name,
        passed,
        expected: testCase.expected_questions,
        actual: result.questions.length,
        method: result.processing_method,
        questions: result.questions.map(q => q.text)
      }
    })

    const passed = results.filter(r => r.passed).length

    return {
      passed,
      total: testCases.length,
      results
    }
  }
}

export default QuestionSeparatorEngine
export type { QuestionObject, ProcessingResult }
