"use client"

import { AlertTriangle } from 'lucide-react'

interface CharacterCounterProps {
  current: number
  max: number
  softLimit?: boolean
}

export default function CharacterCounter({ current, max, softLimit = false }: CharacterCounterProps) {
  const percentage = (current / max) * 100
  
  const getColorClass = () => {
    if (current > max) return "text-red-500"
    if (percentage >= 80) return "text-orange-500"
    return "text-green-500"
  }

  const getBgClass = () => {
    if (current > max) return "bg-red-50"
    if (percentage >= 80) return "bg-orange-50"
    return "bg-green-50"
  }

  const showWarning = current > max && !softLimit

  return (
    <div className="flex items-center justify-between">
      <div className={`flex items-center space-x-2 px-2 py-1 rounded-md ${getBgClass()}`}>
        {showWarning && <AlertTriangle className="h-4 w-4 text-red-500" />}
        <span className={`text-sm font-medium ${getColorClass()}`}>
          {current.toLocaleString()} / {max.toLocaleString()}
        </span>
      </div>
      
      {softLimit && current > max && (
        <span className="text-xs text-red-500 font-medium">
          Over recommended limit
        </span>
      )}
    </div>
  )
}
