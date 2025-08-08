"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface HorizontalScrollContainerProps {
  children: React.ReactNode
  showScrollButtons?: boolean
  className?: string
}

export default function HorizontalScrollContainer({ 
  children, 
  showScrollButtons = true,
  className = ""
}: HorizontalScrollContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScrollability = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  useEffect(() => {
    checkScrollability()
    const handleResize = () => checkScrollability()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [children])

  const scrollLeft = () => {
    if (scrollRef.current) {
      const cardWidth = 320 // Approximate card width
      scrollRef.current.scrollBy({ left: -cardWidth, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollRef.current) {
      const cardWidth = 320 // Approximate card width
      scrollRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' })
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Left Scroll Button */}
      {showScrollButtons && canScrollLeft && (
        <Button
          variant="outline"
          size="sm"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg border-gray-300 hover:bg-gray-50"
          onClick={scrollLeft}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Scrollable Content */}
      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide pb-4"
        onScroll={checkScrollability}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {children}
      </div>

      {/* Right Scroll Button */}
      {showScrollButtons && canScrollRight && (
        <Button
          variant="outline"
          size="sm"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg border-gray-300 hover:bg-gray-50"
          onClick={scrollRight}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      {/* Scroll Indicator */}
      {!showScrollButtons && (canScrollLeft || canScrollRight) && (
        <div className="flex justify-center mt-2">
          <div className="flex items-center space-x-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            <ChevronLeft className="h-3 w-3" />
            <span>Scroll horizontally</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      )}
    </div>
  )
}
