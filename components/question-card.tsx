"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Edit3, Check, AlertCircle, Sparkles } from "lucide-react";

interface Question {
  id: string;
  text: string;
  is_edited: boolean;
  confidence: number;
  is_fallback: boolean;
  card_number: number;
  original_text?: string;
}

interface QuestionCardProps {
  question: Question;
  onEdit: (newText: string) => void;
  onDelete: () => void;
  onAnswerQuestion?: (questionId: string) => void;
  showConfidence?: boolean;
  isFullWidth?: boolean;
  answer?: string;
  showAnswerInput?: boolean;
}

export default function QuestionCard({
  question,
  onEdit,
  onDelete,
  onAnswerQuestion,
  showConfidence = true,
  isFullWidth = false,
  answer = "",
  showAnswerInput = false,
}: QuestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(question.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(editText.length, editText.length);
      // Auto-resize textarea
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [isEditing, editText]);

  const handleSave = () => {
    const trimmedText = editText.trim();
    if (trimmedText && trimmedText !== question.text) {
      onEdit(trimmedText);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(question.text);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditText(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "text-green-600 bg-green-50 border-green-200";
    if (confidence >= 0.7) return "text-blue-600 bg-blue-50 border-blue-200";
    return "text-orange-600 bg-orange-50 border-orange-200";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return "High";
    if (confidence >= 0.7) return "Good";
    return "Low";
  };

  return (
    <Card
      className={`group hover:shadow-md transition-all duration-200 border-gray-200 bg-white ${
        isFullWidth ? "w-full" : ""
      }`}
    >
      <CardContent className="p-6">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">
              {question.card_number}
            </div>
            <div className="flex items-center space-x-2">
              {question.is_fallback && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs border border-yellow-200">
                  <Sparkles className="h-3 w-3" />
                  <span>Auto-generated</span>
                </div>
              )}
              {question.is_edited && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-200">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Edited</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {showConfidence && (
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium border ${getConfidenceColor(
                  question.confidence
                )}`}
              >
                {getConfidenceLabel(question.confidence)} (
                {Math.round(question.confidence * 100)}%)
              </div>
            )}
            {question.confidence < 0.7 && (
              <div className="flex items-center space-x-1 text-orange-500 text-xs">
                <AlertCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Review suggested</span>
              </div>
            )}
          </div>
        </div>

        {/* Question Content */}
        <div className="mb-4">
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                ref={textareaRef}
                value={editText}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] text-base"
                placeholder="Enter your question here..."
              />
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="cursor-text p-3 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-colors min-h-[60px] flex items-start"
              onClick={() => setIsEditing(true)}
            >
              <p className="text-gray-900 leading-relaxed text-base flex-1 break-words">
                {question.text}
              </p>
            </div>
          )}
        </div>

        {/* Answer Display Section */}
        {answer && !showAnswerInput && (
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">
                AI Answer
              </span>
            </div>
            <div
              className="markdown-content bg-gray-50 rounded-lg p-4 border border-gray-200"
              dangerouslySetInnerHTML={{ __html: answer }}
            />
          </div>
        )}

        {/* Answer Input Section */}
        {showAnswerInput && (
          <div className="space-y-2 pt-4 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-700">
              Your Answer
            </label>
            <Textarea
              placeholder="Enter your answer here..."
              value={answer || ""}
              className="min-h-[100px] resize-none"
              disabled={isEditing}
            />
            <div className="text-xs text-gray-500">
              {(answer || "").length} characters
            </div>
          </div>
        )}

        {/* Card Footer */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            Question #{question.card_number}
          </div>

          {!isEditing && (
            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {onAnswerQuestion && (
                <Button
                  size="sm"
                  onClick={() => onAnswerQuestion(question.id)}
                  className="h-9 px-3 bg-green-600 hover:bg-green-700 text-white"
                  aria-label="Answer question"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Answer
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="h-9 px-3 hover:bg-blue-50 text-blue-600"
                aria-label="Edit question"
              >
                <Edit3 className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onDelete}
                className="h-9 px-3 text-red-500 hover:text-red-700 hover:bg-red-50"
                aria-label="Delete question"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
