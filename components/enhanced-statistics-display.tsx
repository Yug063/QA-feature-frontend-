"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Edit3, MessageSquare, FileText } from 'lucide-react'

interface StatisticsDisplayProps {
  statistics: {
    total: number
    edited: number
    deleted: number
    answered: number
  }
  showAnswerStats?: boolean
}

export default function EnhancedStatisticsDisplay({ 
  statistics, 
  showAnswerStats = false 
}: StatisticsDisplayProps) {
  const completionRate = statistics.total > 0 
    ? Math.round((statistics.answered / statistics.total) * 100) 
    : 0

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-2">
            <div className="flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-500 mr-2" />
              <div className="text-3xl font-bold text-blue-600">{statistics.total}</div>
            </div>
            <div className="text-sm text-gray-600">Total Questions</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-center">
              <Edit3 className="h-5 w-5 text-orange-500 mr-2" />
              <div className="text-3xl font-bold text-orange-600">{statistics.edited}</div>
            </div>
            <div className="text-sm text-gray-600">Edited</div>
          </div>
          
          {showAnswerStats && (
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-green-500 mr-2" />
                <div className="text-3xl font-bold text-green-600">{statistics.answered}</div>
              </div>
              <div className="text-sm text-gray-600">Answered</div>
            </div>
          )}
          
          {showAnswerStats && (
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-purple-500 mr-2" />
                <div className="text-3xl font-bold text-purple-600">{completionRate}%</div>
              </div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
          )}
          
          {!showAnswerStats && (
            <div className="space-y-2">
              <div className="text-3xl font-bold text-red-600">{statistics.deleted}</div>
              <div className="text-sm text-gray-600">Deleted</div>
            </div>
          )}
        </div>
        
        {showAnswerStats && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Progress: <span className="font-medium">{statistics.answered}</span> of{' '}
                <span className="font-medium">{statistics.total}</span> questions answered
              </p>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionRate}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-green-600">{completionRate}%</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
