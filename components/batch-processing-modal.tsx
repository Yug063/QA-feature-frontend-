"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Loader2 } from "lucide-react";
import CharacterCounter from "./character-counter";
import HeuristicCheckDisplay from "./heuristic-check-display";
import QuestionCard from "./question-card";
import QuestionCardsList from "./question-cards-list";
import EnhancedStatisticsDisplay from "@/components/enhanced-statistics-display";

interface Question {
  id: string;
  text: string;
  is_edited: boolean;
  confidence: number;
  is_fallback: boolean;
  card_number: number;
  original_text?: string;
}

interface BatchModalState {
  current_step: "paste_input" | "processing" | "questions_preview";
  raw_text: string;
  character_count: number;
  is_processing: boolean;
  heuristic_results: any;
  extracted_questions: Question[];
  answers: Record<string, string>;
  statistics: {
    total: number;
    edited: number;
    deleted: number;
    answered: number;
  };
}

interface BatchProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BatchProcessingModal({
  isOpen,
  onClose,
}: BatchProcessingModalProps) {
  const [state, setState] = useState<BatchModalState>({
    current_step: "paste_input",
    raw_text: "",
    character_count: 0,
    is_processing: false,
    heuristic_results: {},
    extracted_questions: [],
    answers: {},
    statistics: { total: 0, edited: 0, deleted: 0, answered: 0 },
  });

  const handleTextChange = (value: string) => {
    setState((prev) => ({
      ...prev,
      raw_text: value,
      character_count: value.length,
    }));
  };

  const handleProcess = async () => {
    if (!state.raw_text.trim()) return;

    setState((prev) => ({
      ...prev,
      is_processing: true,
      current_step: "processing",
    }));

    try {
      // Validate input first
      const validateResponse = await fetch("/api/validate-input", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: state.raw_text, force_mode: false }),
      });

      if (!validateResponse.ok) {
        const errorText = await validateResponse.text();
        console.error("Validation response:", errorText);
        throw new Error(`Validation failed: ${validateResponse.status}`);
      }

      const heuristicResults = await validateResponse.json();

      // Extract questions
      const extractResponse = await fetch("/api/extract-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: state.raw_text,
          limit: 20,
          force_mode: !heuristicResults.can_proceed,
        }),
      });

      if (!extractResponse.ok) {
        const errorText = await extractResponse.text();
        console.error("Extract response:", errorText);

        // Try to parse as JSON, fallback to text
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }

        throw new Error(
          errorData.error ||
            `Failed to extract questions: ${extractResponse.status}`
        );
      }

      const extractedData = await extractResponse.json();
      const questions: Question[] = extractedData.questions || [];

      setState((prev) => ({
        ...prev,
        heuristic_results: heuristicResults,
        extracted_questions: questions,
        answers: {},
        statistics: {
          total: questions.length,
          edited: 0,
          deleted: 0,
          answered: 0,
        },
        current_step: "questions_preview",
        is_processing: false,
      }));
    } catch (error) {
      console.error("Error processing text:", error);
      setState((prev) => ({
        ...prev,
        is_processing: false,
        current_step: "paste_input",
      }));

      // Show more specific error message
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      alert(`Failed to process text: ${errorMessage}. Please try again.`);
    }
  };

  const handleQuestionEdit = (id: string, newText: string) => {
    setState((prev) => {
      const updatedQuestions = prev.extracted_questions.map((q) =>
        q.id === id
          ? { ...q, text: newText, is_edited: newText !== q.original_text }
          : q
      );
      const editedCount = updatedQuestions.filter((q) => q.is_edited).length;

      return {
        ...prev,
        extracted_questions: updatedQuestions,
        statistics: { ...prev.statistics, edited: editedCount },
      };
    });
  };

  const handleQuestionDelete = (id: string) => {
    setState((prev) => {
      const updatedQuestions = prev.extracted_questions.filter(
        (q) => q.id !== id
      );
      const editedCount = updatedQuestions.filter((q) => q.is_edited).length;

      return {
        ...prev,
        extracted_questions: updatedQuestions,
        statistics: {
          total: updatedQuestions.length,
          edited: editedCount,
          deleted: prev.statistics.deleted + 1,
          answered: prev.statistics.answered,
        },
      };
    });
  };

  const handleAnswerQuestion = async (id: string) => {
    // Find the question text
    const question = state.extracted_questions.find((q) => q.id === id);
    if (!question) {
      console.error("Question not found:", id);
      return;
    }

    try {
      console.log(`Answering question: ${question.text}`);

      const response = await fetch("http://localhost:5000/api/qa/concise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question.text,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate answer");
      }

      const data = await response.json();

      if (data.success) {
        // Update the answers state with the new answer
        setState((prev) => {
          const updatedAnswers = { ...prev.answers, [id]: data.data.answer };
          const answeredCount = Object.values(updatedAnswers).filter(
            (a) => a.trim().length > 0
          ).length;

          return {
            ...prev,
            answers: updatedAnswers,
            statistics: { ...prev.statistics, answered: answeredCount },
          };
        });

        console.log("Answer generated successfully:", data.data.answer);
      } else {
        throw new Error(data.message || "Failed to generate answer");
      }
    } catch (error) {
      console.error("Error generating answer:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      alert(`Failed to generate answer: ${errorMessage}`);
    }
  };

  const handleCreateQuestions = () => {
    // Process the final questions and answers
    const questionsWithAnswers = state.extracted_questions.map((q) => ({
      ...q,
      answer: state.answers[q.id] || "",
    }));
    console.log("Processing questions with answers:", questionsWithAnswers);
    onClose();
  };

  const resetModal = () => {
    setState({
      current_step: "paste_input",
      raw_text: "",
      character_count: 0,
      is_processing: false,
      heuristic_results: {},
      extracted_questions: [],
      answers: {},
      statistics: { total: 0, edited: 0, deleted: 0, answered: 0 },
    });
  };

  useEffect(() => {
    if (!isOpen) {
      resetModal();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-semibold">
            Batch Process Questions
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Step 1: Paste Area */}
          {state.current_step === "paste_input" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Paste your text content
                </label>
                <Textarea
                  placeholder="Paste your questions, bullet points, or text here..."
                  value={state.raw_text}
                  onChange={(e) => handleTextChange(e.target.value)}
                  className="min-h-[300px] resize-none"
                  maxLength={5000}
                />
                <CharacterCounter current={state.character_count} max={5000} />
              </div>

              {state.character_count > 5000 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">
                    Your input is too long. Please split it into smaller chunks
                    under 5000 characters.
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleProcess}
                  disabled={
                    !state.raw_text.trim() || state.character_count > 5000
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Process Text
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Processing Status */}
          {state.current_step === "processing" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-lg font-medium text-gray-700">
                Analyzing text and extracting questions...
              </p>
              <p className="text-sm text-gray-500">
                This may take a few moments
              </p>
            </div>
          )}

          {/* Step 3: Questions Preview */}
          {state.current_step === "questions_preview" && (
            <div className="space-y-6">
              {/* Heuristic Results */}
              <HeuristicCheckDisplay results={state.heuristic_results} />

              {/* Questions List */}
              <QuestionCardsList
                questions={state.extracted_questions}
                onEdit={handleQuestionEdit}
                onDelete={handleQuestionDelete}
                onBulkDelete={(ids) => {
                  ids.forEach((id) => handleQuestionDelete(id));
                }}
                onAnswerQuestion={handleAnswerQuestion}
                answers={state.answers}
                showAnswerInputs={false}
                showConfidence={true}
              />

              {/* Statistics Display */}
              <EnhancedStatisticsDisplay
                statistics={state.statistics}
                showAnswerStats={true}
              />

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateQuestions}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={state.extracted_questions.length === 0}
                >
                  Answer Questions ({state.statistics.total})
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
