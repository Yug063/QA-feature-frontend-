"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUp } from "lucide-react";
import QuestionCard from "./question-card";
import EnhancedStatisticsDisplay from "./enhanced-statistics-display";

interface Question {
  id: string;
  text: string;
  is_edited: boolean;
  confidence: number;
  is_fallback: boolean;
  card_number: number;
  original_text?: string;
}

interface QuestionCardsListProps {
  questions: Question[];
  onEdit: (id: string, newText: string) => void;
  onDelete: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onAnswerQuestion?: (id: string) => void;
  showConfidence?: boolean;
  answers?: Record<string, string>;
  showAnswerInputs?: boolean;
}

export default function QuestionCardsList({
  questions,
  onEdit,
  onDelete,
  onBulkDelete,
  onAnswerQuestion,
  showConfidence = true,
  answers = {},
  showAnswerInputs = false,
}: QuestionCardsListProps) {
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const statistics = {
    total: questions.length,
    edited: questions.filter((q) => q.is_edited).length,
    deleted: 0, // This will be updated when we track deleted questions
    answered: showAnswerInputs
      ? Object.values(answers).filter((a) => a.trim().length > 0).length
      : 0,
  };

  const handleSelectAll = () => {
    if (selectedCards.length === questions.length) {
      setSelectedCards([]);
    } else {
      setSelectedCards(questions.map((q) => q.id));
    }
  };

  const handleCardSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedCards((prev) => [...prev, id]);
    } else {
      setSelectedCards((prev) => prev.filter((cardId) => cardId !== id));
    }
  };

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedCards.length > 0) {
      onBulkDelete(selectedCards);
      setSelectedCards([]);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Show scroll to top button when there are many cards
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">No questions found</div>
        <p className="text-gray-500 text-sm">
          Try adjusting your input text or use force mode to process anyway.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bulk Actions Header */}
      <div className="sticky top-0 z-20 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={
                  selectedCards.length === questions.length &&
                  questions.length > 0
                }
                onCheckedChange={handleSelectAll}
                aria-label="Select all questions"
              />
              <span className="text-sm font-medium text-gray-700">
                {selectedCards.length > 0
                  ? `${selectedCards.length} selected`
                  : "Select all"}
              </span>
            </div>

            {selectedCards.length > 0 && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
                className="h-8"
              >
                Delete Selected ({selectedCards.length})
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkMode(!bulkMode)}
              className="h-8"
            >
              {bulkMode ? "Exit Bulk Mode" : "Bulk Select"}
            </Button>

            {/* Question count indicator */}
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {questions.length} question{questions.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Vertical Questions List */}
      <div className="space-y-4">
        {questions.map((question, index) => (
          <div key={question.id} className="relative">
            {/* Selection checkbox for bulk mode */}
            {(bulkMode || selectedCards.length > 0) && (
              <div className="absolute top-4 left-4 z-10">
                <Checkbox
                  checked={selectedCards.includes(question.id)}
                  onCheckedChange={(checked) =>
                    handleCardSelect(question.id, checked as boolean)
                  }
                  className="bg-white border-2 shadow-sm"
                  aria-label={`Select question ${question.card_number}`}
                />
              </div>
            )}

            {/* Question Card - Full Width */}
            <div
              className={`transition-all duration-200 ${
                selectedCards.includes(question.id)
                  ? "ring-2 ring-blue-500 ring-opacity-50"
                  : ""
              } ${bulkMode || selectedCards.length > 0 ? "ml-12" : ""}`}
            >
              <QuestionCard
                question={question}
                onEdit={(newText) => onEdit(question.id, newText)}
                onDelete={() => onDelete(question.id)}
                onAnswerQuestion={onAnswerQuestion}
                showConfidence={showConfidence}
                isFullWidth={true}
                answer={answers[question.id] || ""}
                showAnswerInput={showAnswerInputs}
              />
            </div>

            {/* Divider line between cards (except last) */}
            {index < questions.length - 1 && (
              <div className="mt-4 border-b border-gray-100"></div>
            )}
          </div>
        ))}
      </div>

      {/* Statistics Footer
      <EnhancedStatisticsDisplay
        statistics={statistics}
        showAnswerStats={showAnswerInputs}
      /> */}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-30 rounded-full w-12 h-12 p-0 shadow-lg bg-blue-600 hover:bg-blue-700"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
