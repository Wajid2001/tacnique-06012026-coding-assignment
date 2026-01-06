'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { publicQuizApi } from '@/lib/quizApi';
import type { Quiz, Question, AnswerSubmit, QuizResult } from '@/types/quiz';

export default function TakeQuiz() {
  const router = useRouter();
  const { id } = router.query;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [takerName, setTakerName] = useState('');
  const [answers, setAnswers] = useState<Record<number, AnswerSubmit>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    if (id) {
      fetchQuiz();
    }
  }, [id]);

  const fetchQuiz = async () => {
    try {
      const data = await publicQuizApi.get(Number(id));
      setQuiz(data);
      
      // Initialize answers
      const initialAnswers: Record<number, AnswerSubmit> = {};
      data.questions.forEach((q: Question) => {
        initialAnswers[q.id] = {
          question_id: q.id,
          selected_choice_id: null,
          text_answer: '',
        };
      });
      setAnswers(initialAnswers);
    } catch (err) {
      setError('Failed to load quiz. It may not exist.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateAnswer = (questionId: number, field: 'selected_choice_id' | 'text_answer', value: number | string | null) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Check all questions are answered
    const unanswered = quiz?.questions.filter((q) => {
      const answer = answers[q.id];
      if (q.question_type === 'text') {
        return !answer?.text_answer?.trim();
      }
      return !answer?.selected_choice_id;
    });

    if (unanswered && unanswered.length > 0) {
      setError(`Please answer all questions. ${unanswered.length} question(s) unanswered.`);
      setIsSubmitting(false);
      return;
    }

    try {
      const submission = {
        taker_name: takerName.trim() || 'Anonymous',
        answers: Object.values(answers),
      };

      const resultData = await publicQuizApi.submit(Number(id), submission);
      setResult(resultData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit quiz. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Quiz Not Found</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  // Show results
  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Score Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Quiz Complete!</h1>
            <p className="text-gray-500 mb-6">{result.quiz_title}</p>
            
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mb-6">
              <div className="text-white">
                <div className="text-4xl font-bold">{result.percentage}%</div>
                <div className="text-sm opacity-80">{result.score}/{result.total_questions}</div>
              </div>
            </div>

            <p className="text-gray-600">
              {result.percentage >= 80
                ? '🎉 Excellent work!'
                : result.percentage >= 60
                ? '👍 Good job!'
                : result.percentage >= 40
                ? '📚 Keep practicing!'
                : '💪 Don\'t give up!'}
            </p>
          </div>

          {/* Answer Review */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Review Answers</h2>
            
            <div className="space-y-4">
              {result.answers.map((answer, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    answer.is_correct
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      answer.is_correct ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {answer.is_correct ? (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 mb-2">
                        {index + 1}. {answer.question_text}
                      </p>
                      
                      <div className="text-sm space-y-1">
                        <p>
                          <span className="text-gray-500">Your answer: </span>
                          <span className={answer.is_correct ? 'text-green-700' : 'text-red-700'}>
                            {answer.question_type === 'text'
                              ? answer.text_answer || 'No answer'
                              : answer.selected_choice_text || 'No answer'}
                          </span>
                        </p>
                        
                        {!answer.is_correct && (
                          <p>
                            <span className="text-gray-500">Correct answer: </span>
                            <span className="text-green-700">
                              {answer.question_type === 'text'
                                ? answer.correct_text
                                : answer.correct_choice}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Try Again */}
          <div className="text-center mt-6">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Take Quiz Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Form
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Quiz Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{quiz?.title}</h1>
          {quiz?.description && (
            <p className="text-gray-500">{quiz.description}</p>
          )}
          <p className="text-sm text-gray-400 mt-3">
            {quiz?.questions.length} questions
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Name Input */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name (optional)
            </label>
            <input
              id="name"
              type="text"
              value={takerName}
              onChange={(e) => setTakerName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Enter your name"
            />
          </div>

          {/* Questions */}
          <div className="space-y-4 mb-6">
            {quiz?.questions.map((question, qIndex) => (
              <div key={question.id} className="bg-white rounded-xl shadow-sm p-6">
                <p className="font-medium text-gray-800 mb-4">
                  <span className="text-blue-600 mr-2">{qIndex + 1}.</span>
                  {question.question_text}
                </p>

                {/* MCQ / True-False */}
                {(question.question_type === 'mcq' || question.question_type === 'true_false') && (
                  <div className="space-y-2">
                    {question.choices.map((choice) => (
                      <label
                        key={choice.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                          answers[question.id]?.selected_choice_id === choice.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          checked={answers[question.id]?.selected_choice_id === choice.id}
                          onChange={() => updateAnswer(question.id, 'selected_choice_id', choice.id)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-gray-700">{choice.choice_text}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Text Answer */}
                {question.question_type === 'text' && (
                  <input
                    type="text"
                    value={answers[question.id]?.text_answer || ''}
                    onChange={(e) => updateAnswer(question.id, 'text_answer', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Type your answer"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Submit */}
          <div className="text-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-10 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
