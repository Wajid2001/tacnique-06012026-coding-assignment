'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { quizApi } from '@/lib/quizApi';
import type { QuestionCreate, ChoiceCreate } from '@/types/quiz';
import Link from 'next/link';

interface QuestionFormData extends QuestionCreate {
  tempId: string;
}

const createEmptyQuestion = (): QuestionFormData => ({
  tempId: crypto.randomUUID(),
  question_text: '',
  question_type: 'mcq',
  order: 0,
  correct_text_answer: '',
  choices: [
    { choice_text: '', is_correct: true },
    { choice_text: '', is_correct: false },
    { choice_text: '', is_correct: false },
    { choice_text: '', is_correct: false },
  ],
});

export default function CreateQuiz() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<QuestionFormData[]>([createEmptyQuestion()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ id: number; link: string } | null>(null);
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const addQuestion = () => {
    setQuestions([...questions, createEmptyQuestion()]);
  };

  const removeQuestion = (tempId: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.tempId !== tempId));
    }
  };

  const updateQuestion = (tempId: string, field: keyof QuestionFormData, value: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.tempId !== tempId) return q;

        const updated = { ...q, [field]: value };

        // Reset choices when changing question type
        if (field === 'question_type') {
          if (value === 'true_false') {
            updated.choices = [
              { choice_text: 'True', is_correct: true },
              { choice_text: 'False', is_correct: false },
            ];
          } else if (value === 'mcq') {
            updated.choices = [
              { choice_text: '', is_correct: true },
              { choice_text: '', is_correct: false },
              { choice_text: '', is_correct: false },
              { choice_text: '', is_correct: false },
            ];
          } else {
            updated.choices = [];
          }
        }

        return updated;
      })
    );
  };

  const updateChoice = (questionTempId: string, choiceIndex: number, field: keyof ChoiceCreate, value: string | boolean) => {
    setQuestions(
      questions.map((q) => {
        if (q.tempId !== questionTempId) return q;

        const newChoices = [...q.choices];
        
        if (field === 'is_correct' && value === true) {
          // Only one choice can be correct
          newChoices.forEach((c, i) => {
            newChoices[i] = { ...c, is_correct: i === choiceIndex };
          });
        } else {
          newChoices[choiceIndex] = { ...newChoices[choiceIndex], [field]: value };
        }

        return { ...q, choices: newChoices };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Validation
    if (!title.trim()) {
      setError('Please enter a quiz title');
      setIsSubmitting(false);
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        setError(`Question ${i + 1} is empty`);
        setIsSubmitting(false);
        return;
      }

      if (q.question_type === 'mcq') {
        const filledChoices = q.choices.filter((c) => c.choice_text.trim());
        if (filledChoices.length < 2) {
          setError(`Question ${i + 1} needs at least 2 choices`);
          setIsSubmitting(false);
          return;
        }
        if (!q.choices.some((c) => c.is_correct)) {
          setError(`Question ${i + 1} needs a correct answer`);
          setIsSubmitting(false);
          return;
        }
      }

      if (q.question_type === 'text' && !q.correct_text_answer?.trim()) {
        setError(`Question ${i + 1} needs a correct answer`);
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const quizData = {
        title: title.trim(),
        description: description.trim(),
        questions: questions.map((q, idx) => ({
          question_text: q.question_text,
          question_type: q.question_type,
          order: idx,
          correct_text_answer: q.correct_text_answer || '',
          choices: q.question_type !== 'text' 
            ? q.choices.filter((c) => c.choice_text.trim())
            : [],
        })),
      };

      const result = await quizApi.create(quizData);
      setSuccess({
        id: result.id,
        link: `${window.location.origin}/quiz/${result.id}`,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create quiz. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Quiz Created!</h2>
          <p className="text-gray-500 mb-6">Your quiz is ready to share</p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-2">Share this link:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={success.link}
                readOnly
                className="flex-1 bg-white border border-gray-200 rounded px-3 py-2 text-sm"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(success.link);
                  alert('Link copied!');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Link
              href={`/quiz/${success.id}`}
              target="_blank"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Preview Quiz
            </Link>
            <Link
              href="/admin/dashboard"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-gray-800">Create New Quiz</h1>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Quiz Details */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Quiz Details</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Enter quiz title"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  rows={3}
                  placeholder="Optional description for your quiz"
                />
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Questions</h2>
              <button
                type="button"
                onClick={addQuestion}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                + Add Question
              </button>
            </div>

            {questions.map((question, qIndex) => (
              <div key={question.tempId} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-sm font-medium text-gray-500">Question {qIndex + 1}</span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(question.tempId)}
                      className="text-red-400 hover:text-red-600 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Question Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question Type
                    </label>
                    <select
                      value={question.question_type}
                      onChange={(e) => updateQuestion(question.tempId, 'question_type', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="mcq">Multiple Choice</option>
                      <option value="true_false">True / False</option>
                      <option value="text">Text Answer</option>
                    </select>
                  </div>

                  {/* Question Text */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question *
                    </label>
                    <textarea
                      value={question.question_text}
                      onChange={(e) => updateQuestion(question.tempId, 'question_text', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                      rows={2}
                      placeholder="Enter your question"
                      required
                    />
                  </div>

                  {/* MCQ Choices */}
                  {question.question_type === 'mcq' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Choices (select the correct answer)
                      </label>
                      <div className="space-y-2">
                        {question.choices.map((choice, cIndex) => (
                          <div key={cIndex} className="flex items-center gap-3">
                            <input
                              type="radio"
                              name={`correct-${question.tempId}`}
                              checked={choice.is_correct}
                              onChange={() => updateChoice(question.tempId, cIndex, 'is_correct', true)}
                              className="w-4 h-4 text-blue-600"
                            />
                            <input
                              type="text"
                              value={choice.choice_text}
                              onChange={(e) => updateChoice(question.tempId, cIndex, 'choice_text', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                              placeholder={`Choice ${cIndex + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* True/False */}
                  {question.question_type === 'true_false' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Correct Answer
                      </label>
                      <div className="flex gap-4">
                        {question.choices.map((choice, cIndex) => (
                          <label key={cIndex} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`correct-${question.tempId}`}
                              checked={choice.is_correct}
                              onChange={() => updateChoice(question.tempId, cIndex, 'is_correct', true)}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span>{choice.choice_text}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Text Answer */}
                  {question.question_type === 'text' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Correct Answer *
                      </label>
                      <input
                        type="text"
                        value={question.correct_text_answer || ''}
                        onChange={(e) => updateQuestion(question.tempId, 'correct_text_answer', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Enter the correct answer"
                        required={question.question_type === 'text'}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Answers will be matched case-insensitively
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Link
              href="/admin/dashboard"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Quiz'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
