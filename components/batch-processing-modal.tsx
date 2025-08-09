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
import { useToast } from "@/hooks/use-toast";

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
  processing_progress?: {
    current: number;
    total: number;
    message: string;
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
  const { toast } = useToast();
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

  // Global copy function for code blocks
  useEffect(() => {
    // Add global copy function
    (window as any).copyCode = function (elementId: string) {
      const codeElement = document.getElementById(elementId);
      if (codeElement) {
        const text = codeElement.textContent || "";
        navigator.clipboard
          .writeText(text)
          .then(() => {
            const button =
              codeElement.parentElement?.previousElementSibling?.querySelector(
                "button"
              );
            if (button) {
              const originalText = button.textContent;
              button.textContent = "Copied!";
              button.classList.add("bg-green-100", "text-green-700");
              setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove("bg-green-100", "text-green-700");
              }, 2000);
            }
          })
          .catch((err) => {
            console.error("Failed to copy code:", err);
          });
      }
    };
  }, []);

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

      // Show success message for question extraction
      toast({
        title: "Questions Extracted Successfully!",
        description: `Found ${questions.length} questions from your text.`,
        variant: "default",
      });
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

      toast({
        title: "Processing Failed",
        description: `Failed to process text: ${errorMessage}. Please try again.`,
        variant: "destructive",
      });
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

      // Remove the answer for the deleted question
      const updatedAnswers = { ...prev.answers };
      const hadAnswer = !!updatedAnswers[id];
      delete updatedAnswers[id];

      // Recalculate answered count based on remaining questions
      const answeredCount = Object.values(updatedAnswers).filter(
        (a) =>
          a.trim().length > 0 && a !== "AI couldn't respond to this question."
      ).length;

      return {
        ...prev,
        extracted_questions: updatedQuestions,
        answers: updatedAnswers,
        statistics: {
          total: updatedQuestions.length,
          edited: editedCount,
          deleted: prev.statistics.deleted + 1,
          answered: answeredCount,
        },
      };
    });

    // Show toast notification
    toast({
      title: "Question Deleted",
      description: "Question has been removed from the list.",
      variant: "default",
    });
  };

  const handleBulkDelete = (ids: string[]) => {
    setState((prev) => {
      const updatedQuestions = prev.extracted_questions.filter(
        (q) => !ids.includes(q.id)
      );
      const editedCount = updatedQuestions.filter((q) => q.is_edited).length;

      // Remove answers for all deleted questions
      const updatedAnswers = { ...prev.answers };
      ids.forEach((id) => delete updatedAnswers[id]);

      // Recalculate answered count based on remaining questions
      const answeredCount = Object.values(updatedAnswers).filter(
        (a) =>
          a.trim().length > 0 && a !== "AI couldn't respond to this question."
      ).length;

      return {
        ...prev,
        extracted_questions: updatedQuestions,
        answers: updatedAnswers,
        statistics: {
          total: updatedQuestions.length,
          edited: editedCount,
          deleted: prev.statistics.deleted + ids.length,
          answered: answeredCount,
        },
      };
    });

    // Show toast notification
    toast({
      title: "Questions Deleted",
      description: `${ids.length} question${
        ids.length > 1 ? "s" : ""
      } have been removed from the list.`,
      variant: "default",
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
            (a) =>
              a.trim().length > 0 &&
              a !== "AI couldn't respond to this question."
          ).length;

          return {
            ...prev,
            answers: updatedAnswers,
            statistics: { ...prev.statistics, answered: answeredCount },
          };
        });

        console.log("Answer generated successfully:", data.data.answer);

        toast({
          title: "Answer Generated",
          description: "Answer generated successfully for this question.",
          variant: "default",
        });
      } else {
        throw new Error(data.message || "Failed to generate answer");
      }
    } catch (error) {
      console.error("Error generating answer:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      toast({
        title: "Answer Generation Failed",
        description: `Failed to generate answer: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleCreateQuestions = async () => {
    // Process the final questions and answers
    const questionsWithAnswers = state.extracted_questions.map((q) => ({
      ...q,
      answer: state.answers[q.id] || "",
    }));
    console.log("Processing questions with answers:", questionsWithAnswers);
    onClose();
  };

  const handleAnswerAllQuestions = async () => {
    if (state.extracted_questions.length === 0) return;

    setState((prev) => ({
      ...prev,
      is_processing: true,
      current_step: "processing",
      processing_progress: {
        current: 0,
        total: state.extracted_questions.length,
        message: "Preparing to generate answers...",
      },
    }));

    try {
      console.log(
        `Answering ${state.extracted_questions.length} questions in batch`
      );

      // Update progress
      setState((prev) => ({
        ...prev,
        processing_progress: {
          current: 0,
          total: state.extracted_questions.length,
          message: "Generating answers for all questions...",
        },
      }));

      // Show processing started toast
      toast({
        title: "Processing Started",
        description: `Generating answers for ${state.extracted_questions.length} questions...`,
        variant: "default",
      });

      // Prepare questions for batch processing
      const questionsForBatch = state.extracted_questions.map((q) => ({
        id: q.id,
        text: q.text,
      }));

      const response = await fetch(
        "http://localhost:5000/api/qa/batch-concise",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            questions: questionsForBatch,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to generate batch answers"
        );
      }

      const data = await response.json();

      if (data.success) {
        // Convert results to answers object
        const newAnswers: Record<string, string> = {};
        data.data.results.forEach((result: any) => {
          newAnswers[result.id] = result.answer;
        });

        const answeredCount = Object.values(newAnswers).filter(
          (a) =>
            a.trim().length > 0 && a !== "AI couldn't respond to this question."
        ).length;

        setState((prev) => ({
          ...prev,
          answers: newAnswers,
          statistics: { ...prev.statistics, answered: answeredCount },
          is_processing: false,
          current_step: "questions_preview",
          processing_progress: undefined,
        }));

        console.log("Batch answers generated successfully:", data.data);

        // Show success message
        const successCount = data.data.successfulQuestions;
        const failedCount = data.data.failedQuestions;
        if (successCount > 0) {
          toast({
            title: "Answers Generated Successfully!",
            description: `Successfully generated ${successCount} answers${
              failedCount > 0 ? ` (${failedCount} failed)` : ""
            }`,
            variant: "default",
          });
        }
      } else {
        throw new Error(data.message || "Failed to generate batch answers");
      }
    } catch (error) {
      console.error("Error generating batch answers:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      toast({
        title: "Failed to Generate Answers",
        description: `Error: ${errorMessage}`,
        variant: "destructive",
      });

      setState((prev) => ({
        ...prev,
        is_processing: false,
        current_step: "questions_preview",
        processing_progress: undefined,
      }));
    }
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
      processing_progress: undefined,
    });
  };

  useEffect(() => {
    if (!isOpen) {
      resetModal();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
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
                {state.processing_progress
                  ? state.processing_progress.message
                  : state.extracted_questions.length > 0 &&
                    state.answers &&
                    Object.keys(state.answers).length > 0
                  ? "Generating answers for all questions..."
                  : "Analyzing text and extracting questions..."}
              </p>
              {state.processing_progress && (
                <div className="text-sm text-gray-500">
                  Processing {state.processing_progress.current} of{" "}
                  {state.processing_progress.total} questions
                </div>
              )}
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
                onBulkDelete={handleBulkDelete}
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

              {/* Answer Summary */}
              {state.statistics.answered > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <h3 className="text-xl font-semibold text-green-800">
                      Answers Generated Successfully
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-base">
                    <div>
                      <span className="text-green-600 font-medium">
                        Total Questions:
                      </span>
                      <p className="text-green-800 text-lg font-semibold">
                        {state.statistics.total}
                      </p>
                    </div>
                    <div>
                      <span className="text-green-600 font-medium">
                        Successfully Answered:
                      </span>
                      <p className="text-green-800 text-lg font-semibold">
                        {state.statistics.answered}
                      </p>
                    </div>
                    <div>
                      <span className="text-green-600 font-medium">
                        Failed:
                      </span>
                      <p className="text-green-800 text-lg font-semibold">
                        {state.statistics.total - state.statistics.answered}
                      </p>
                    </div>
                    <div>
                      <span className="text-green-600 font-medium">
                        Success Rate:
                      </span>
                      <p className="text-green-800 text-lg font-semibold">
                        {Math.round(
                          (state.statistics.answered / state.statistics.total) *
                            100
                        )}
                        %
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col lg:flex-row justify-end space-y-3 lg:space-y-0 lg:space-x-4 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="h-11 px-6"
                >
                  Close
                </Button>

                {state.statistics.answered > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const allAnswers = state.extracted_questions
                        .map((q) => {
                          const answer = state.answers[q.id];
                          return answer
                            ? `**${q.text}**\n\n${answer}\n\n---\n`
                            : null;
                        })
                        .filter(Boolean)
                        .join("\n");

                      navigator.clipboard.writeText(allAnswers).then(() => {
                        toast({
                          title: "Answers Copied!",
                          description:
                            "All answers have been copied to clipboard.",
                          variant: "default",
                        });
                      });
                    }}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 h-11 px-6"
                  >
                    Copy All Answers
                  </Button>
                )}

                <Button
                  onClick={handleAnswerAllQuestions}
                  className="bg-green-600 hover:bg-green-700 h-11 px-6"
                  disabled={
                    state.extracted_questions.length === 0 ||
                    state.is_processing
                  }
                >
                  {state.is_processing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                      Generating Answers...
                    </>
                  ) : (
                    `Answer All Questions (${state.statistics.total})`
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
