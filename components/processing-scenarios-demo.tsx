"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import QuestionCardsList from "./question-cards-list";

interface Question {
  id: string;
  text: string;
  is_edited: boolean;
  confidence: number;
  is_fallback: boolean;
  card_number: number;
  original_text?: string;
}

const TEST_SCENARIOS = [
  {
    name: "Normal Question Extraction",
    input: "What is AI? How does ML work? What are neural networks?",
    description: "Direct questions with high confidence",
  },
  {
    name: "Bullet Point Processing",
    input:
      "• What is machine learning?\n• How do algorithms work?\n• What is deep learning?",
    description: "Bullet points converted to clean questions",
  },
  {
    name: "Fallback Sentence Processing",
    input:
      "AI is revolutionary. Machine learning transforms industries. Neural networks are powerful.",
    description: "Statements converted to questions with lower confidence",
  },
  {
    name: "Mixed Format",
    input:
      "What is artificial intelligence?\n• Machine learning applications\n1. How do neural networks work?\nDeep learning is complex.",
    description: "Combination of different input formats",
  },
];

export default function ProcessingScenariosDemo() {
  const [selectedScenario, setSelectedScenario] = useState(0);
  const [inputText, setInputText] = useState(TEST_SCENARIOS[0].input);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcess = async () => {
    setIsProcessing(true);

    try {
      const response = await fetch("/api/extract-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, limit: 20, force_mode: true }),
      });

      const data = await response.json();
      if (data.questions) {
        setQuestions(data.questions);
      }
    } catch (error) {
      console.error("Error processing text:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuestionEdit = (id: string, newText: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id
          ? { ...q, text: newText, is_edited: newText !== q.original_text }
          : q
      )
    );
  };

  const handleQuestionDelete = (id: string) => {
    setQuestions((prev) => {
      const filtered = prev.filter((q) => q.id !== id);
      // Re-number remaining questions
      return filtered.map((q, index) => ({ ...q, card_number: index + 1 }));
    });
  };

  const handleAnswerQuestion = async (id: string) => {
    // Find the question text
    const question = questions.find((q) => q.id === id);
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
        console.log("Answer generated successfully:", data.data.answer);
        // You can add state to store answers if needed
        alert(`Answer generated: ${data.data.answer.substring(0, 100)}...`);
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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Question Card Creation System Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scenario Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {TEST_SCENARIOS.map((scenario, index) => (
              <Button
                key={index}
                variant={selectedScenario === index ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedScenario(index);
                  setInputText(scenario.input);
                  setQuestions([]);
                }}
                className="text-left h-auto p-3"
              >
                <div>
                  <div className="font-medium text-sm">{scenario.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {scenario.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>

          {/* Input Area */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Test Input ({inputText.length}/5000 characters)
            </label>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[120px]"
              maxLength={5000}
            />
          </div>

          {/* Process Button */}
          <Button
            onClick={handleProcess}
            disabled={!inputText.trim() || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              "Process Text & Create Cards"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Question Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <QuestionCardsList
              questions={questions}
              onEdit={handleQuestionEdit}
              onDelete={handleQuestionDelete}
              onBulkDelete={(ids) => {
                ids.forEach((id) => handleQuestionDelete(id));
              }}
              onAnswerQuestion={handleAnswerQuestion}
              showConfidence={true}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
