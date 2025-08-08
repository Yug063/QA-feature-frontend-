"use client"

import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface HeuristicResults {
  question_marks_found?: number
  lines_count?: number
  average_line_length?: number
  has_bullet_points?: boolean
  can_proceed?: boolean
  confidence_score?: number
}

interface HeuristicCheckDisplayProps {
  results: HeuristicResults
}

export default function HeuristicCheckDisplay({ results }: HeuristicCheckDisplayProps) {
  const getStatusIcon = (canProceed: boolean) => {
    if (canProceed) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    }
    return <XCircle className="h-5 w-5 text-red-500" />
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "text-green-600"
    if (score >= 0.6) return "text-orange-600"
    return "text-red-600"
  }

  return (
    <Card className="bg-gray-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-blue-500" />
          <span>Text Analysis Results</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {results.question_marks_found || 0}
            </div>
            <div className="text-xs text-gray-600">Question Marks</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {results.lines_count || 0}
            </div>
            <div className="text-xs text-gray-600">Lines Found</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(results.average_line_length || 0)}
            </div>
            <div className="text-xs text-gray-600">Avg Line Length</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {results.has_bullet_points ? 'Yes' : 'No'}
            </div>
            <div className="text-xs text-gray-600">Has Bullets</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            {getStatusIcon(results.can_proceed || false)}
            <span className="font-medium">
              {results.can_proceed ? 'Ready to Process' : 'Processing May Be Limited'}
            </span>
          </div>
          
          {results.confidence_score !== undefined && (
            <div className="text-right">
              <div className={`text-sm font-medium ${getConfidenceColor(results.confidence_score)}`}>
                {Math.round(results.confidence_score * 100)}% Confidence
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
