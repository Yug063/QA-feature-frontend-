"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Play, TestTube } from 'lucide-react'

interface TestResult {
  name: string
  passed: boolean
  expected: number
  actual: number
  method: string
  questions: string[]
}

export default function SeparationTestPanel() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [customText, setCustomText] = useState("")
  const [customResult, setCustomResult] = useState<any>(null)
  const [isRunning, setIsRunning] = useState(false)

  const runBuiltInTests = async () => {
    setIsRunning(true)
    try {
      const response = await fetch('/api/test-separation')
      const data = await response.json()
      setTestResults(data.test_results.results)
    } catch (error) {
      console.error('Failed to run tests:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const testCustomText = async () => {
    if (!customText.trim()) return
    
    setIsRunning(true)
    try {
      const response = await fetch('/api/test-separation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: customText, max_questions: 20 })
      })
      const data = await response.json()
      setCustomResult(data.result)
    } catch (error) {
      console.error('Failed to test custom text:', error)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Built-in Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="h-5 w-5" />
            <span>Built-in Test Suite</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runBuiltInTests} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Running Tests...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run All Tests
              </>
            )}
          </Button>

          {testResults.length > 0 && (
            <div className="space-y-3">
              {testResults.map((test, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{test.name}</span>
                    {test.passed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Expected: {test.expected} questions | Actual: {test.actual}</div>
                    <div>Method: <Badge variant="outline">{test.method}</Badge></div>
                    <div className="mt-2">
                      <div className="font-medium">Generated Questions:</div>
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        {test.questions.map((q, qIndex) => (
                          <li key={qIndex} className="text-xs">{q}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Text Testing */}
      <Card>
        <CardHeader>
          <CardTitle>Test Custom Text</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter your text to test the separation logic..."
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            className="min-h-[120px]"
          />
          
          <Button 
            onClick={testCustomText} 
            disabled={!customText.trim() || isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              'Test Separation Logic'
            )}
          </Button>

          {customResult && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {customResult.questions.length}
                  </div>
                  <div className="text-xs text-gray-600">Questions Found</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {customResult.statistics.lines_processed}
                  </div>
                  <div className="text-xs text-gray-600">Lines Processed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(customResult.statistics.confidence_average * 100)}%
                  </div>
                  <div className="text-xs text-gray-600">Avg Confidence</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {customResult.statistics.fallback_used ? 'Yes' : 'No'}
                  </div>
                  <div className="text-xs text-gray-600">Fallback Used</div>
                </div>
              </div>

              <div className="pt-3 border-t">
                <Badge className="mb-3">{customResult.processing_method}</Badge>
                <div className="space-y-2">
                  {customResult.questions.map((q: any, index: number) => (
                    <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                      <div className="font-medium">{q.text}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Source: {q.source} | Confidence: {Math.round(q.confidence * 100)}%
                        {q.is_fallback && ' | Fallback'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
