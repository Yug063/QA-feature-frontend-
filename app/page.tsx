"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import CharacterCounter from "@/components/character-counter";
import BatchProcessingModal from "@/components/batch-processing-modal";

interface SingleInputState {
  question_text: string;
  character_count: number;
  show_warning: boolean;
  is_generating: boolean;
}

interface ApiResponse {
  success: boolean;
  data?: {
    id: string;
    question: string;
    answer: string;
    apiUsed: string;
    processingTime: number;
    status: string;
  };
  message?: string;
  error?: string;
}

export default function QAPairPage() {
  const [singleInput, setSingleInput] = useState<SingleInputState>({
    question_text: "",
    character_count: 0,
    show_warning: false,
    is_generating: false,
  });

  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

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

  const handleInputChange = (value: string) => {
    const charCount = value.length;
    setSingleInput({
      question_text: value,
      character_count: charCount,
      show_warning: charCount > 500,
      is_generating: false,
    });
    // Clear previous response when input changes
    setApiResponse(null);
  };

  const handleGenerateAnswer = async () => {
    if (!singleInput.question_text.trim()) {
      return;
    }

    setSingleInput((prev) => ({ ...prev, is_generating: true }));
    setApiResponse(null);

    try {
      const response = await axios.post<ApiResponse>(
        "http://localhost:5000/api/qa/single",
        {
          question: singleInput.question_text.trim(),
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000, // 30 second timeout
        }
      );

      const data = response.data;

      if (data.success) {
        setApiResponse(data);
      } else {
        setApiResponse({
          success: false,
          error: data.error || "Failed to generate answer",
        });
      }
    } catch (error) {
      console.error("Error generating answer:", error);

      let errorMessage =
        "Network error. Please check if the server is running.";

      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with error status
          const errorData = error.response.data;
          errorMessage =
            errorData.error ||
            errorData.message ||
            `Server error: ${error.response.status}`;
        } else if (error.request) {
          // Request was made but no response received
          errorMessage =
            "No response from server. Please check if the server is running.";
        } else {
          // Something else happened
          errorMessage = error.message || "An unexpected error occurred.";
        }
      }

      setApiResponse({
        success: false,
        error: errorMessage,
      });
    } finally {
      setSingleInput((prev) => ({ ...prev, is_generating: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            QA Pair Generator
          </h1>
          <Button
            variant="outline"
            onClick={() => setIsBatchModalOpen(true)}
            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
          >
            Paste Multiple Questions
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">
              Generate Answer for Single Question
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Question Input */}
            <div className="space-y-2">
              <label
                htmlFor="question-input"
                className="block text-sm font-medium text-gray-700"
              >
                Enter your question
              </label>
              <Textarea
                id="question-input"
                placeholder="What would you like to know?"
                value={singleInput.question_text}
                onChange={(e) => handleInputChange(e.target.value)}
                className="min-h-[120px] resize-none"
                maxLength={500}
              />

              {/* Character Counter */}
              <CharacterCounter
                current={singleInput.character_count}
                max={500}
                softLimit={true}
              />
            </div>

            {/* Warning Message */}
            {singleInput.show_warning && (
              <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  <p>
                    Your input is too long. Please simplify it into a single
                    question - or{" "}
                    <button
                      onClick={() => setIsBatchModalOpen(true)}
                      className="underline font-medium hover:text-red-800"
                    >
                      Paste Multiple Questions
                    </button>{" "}
                    instead.
                  </p>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerateAnswer}
              disabled={
                !singleInput.question_text.trim() ||
                singleInput.is_generating ||
                singleInput.show_warning
              }
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {singleInput.is_generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Answer...
                </>
              ) : (
                "Generate Answer"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* API Response Display */}
        {apiResponse && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                {apiResponse.success ? (
                  <>
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    Answer Generated Successfully
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6 text-red-500" />
                    Error Generating Answer
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {apiResponse.success && apiResponse.data ? (
                <div className="space-y-4">
                  {/* Question */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Question:
                    </h3>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                      {apiResponse.data.question}
                    </p>
                  </div>

                  {/* Answer */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Answer:
                    </h3>
                    <div
                      className="text-gray-900 bg-green-50 p-3 rounded-md prose prose-sm max-w-none [&_pre]:bg-gray-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-gray-200 [&_code]:bg-gray-200 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono [&_.hljs]:bg-transparent [&_.relative]:!bg-gray-100 [&_.relative]:!rounded-lg [&_.relative]:!border [&_.relative]:!border-gray-200 [&_.relative]:!overflow-hidden [&_.bg-gray-200]:!bg-gray-200 [&_.flex]:!flex [&_.items-center]:!items-center [&_.justify-between]:!justify-between [&_.px-4]:!px-4 [&_.py-2]:!py-2 [&_.border-b]:!border-b [&_.border-gray-300]:!border-gray-300 [&_.text-xs]:!text-xs [&_.font-medium]:!font-medium [&_.text-gray-600]:!text-gray-600 [&_.uppercase]:!uppercase [&_.bg-white]:!bg-white [&_.hover\\:bg-gray-50]:hover:!bg-gray-50 [&_.text-gray-700]:!text-gray-700 [&_.px-2]:!px-2 [&_.py-1]:!py-1 [&_.rounded]:!rounded [&_.border]:!border [&_.border-gray-300]:!border-gray-300 [&_.transition-colors]:!transition-colors [&_.duration-200]:!duration-200"
                      dangerouslySetInnerHTML={{
                        __html: apiResponse.data.answer,
                      }}
                    />
                  </div>

                  {/* Metadata */}
                  {/* <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">API Used:</span>
                      <p className="font-medium text-gray-900">
                        {apiResponse.data.apiUsed}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Processing Time:</span>
                      <p className="font-medium text-gray-900">
                        {apiResponse.data.processingTime}ms
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <p className="font-medium text-gray-900">
                        {apiResponse.data.status}
                      </p>
                    </div>
                  </div> */}

                  {/* Answer ID */}
                  {/* <div className="text-xs text-gray-500">
                    Answer ID: {apiResponse.data.id}
                  </div> */}
                </div>
              ) : (
                <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-700">
                    <p className="font-medium">Error:</p>
                    <p>{apiResponse.error}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Batch Processing Modal */}
      <BatchProcessingModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
      />
    </div>
  );
}
