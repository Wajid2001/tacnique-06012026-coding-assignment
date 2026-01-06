'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { quizApi } from '@/lib/quizApi';
import type { QuizAnalytics, QuizResult } from '@/types/quiz';
import Link from 'next/link';

export default function QuizAnalyticsPage() {
  const [analytics, setAnalytics] = useState<QuizAnalytics | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (id && isAuthenticated) {
      fetchAnalytics();
    }
  }, [id, isAuthenticated]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const data = await quizApi.getAnalytics(Number(id));
      setAnalytics(data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('You do not have permission to view this quiz analytics.');
      } else {
        setError('Failed to load analytics');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const viewSubmissionDetail = async (submissionId: number) => {
    try {
      setIsLoadingDetail(true);
      const data = await quizApi.getSubmissionDetail(Number(id), submissionId);
      setSelectedSubmission(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'bg-green-500';
    if (accuracy >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-lg">
            {error}
          </div>
          <Link
            href="/admin/dashboard"
            className="mt-4 inline-block text-blue-600 hover:text-blue-700"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link
                href="/admin/dashboard"
                className="text-blue-600 hover:text-blue-700 text-sm mb-1 inline-block"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-800">
                Analytics: {analytics.quiz_title}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-3xl font-bold text-blue-600">
              {analytics.total_submissions}
            </div>
            <div className="text-gray-500 text-sm">Total Submissions</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-3xl font-bold text-green-600">
              {analytics.average_percentage}%
            </div>
            <div className="text-gray-500 text-sm">Average Score</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-3xl font-bold text-purple-600">
              {analytics.pass_rate}%
            </div>
            <div className="text-gray-500 text-sm">Pass Rate (≥70%)</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-3xl font-bold text-orange-600">
              {analytics.highest_score}/{analytics.total_submissions > 0 ? analytics.submissions[0]?.total_questions || 0 : 0}
            </div>
            <div className="text-gray-500 text-sm">Highest Score</div>
          </div>
        </div>

        {analytics.total_submissions === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">No submissions yet</h3>
            <p className="text-gray-500">Share your quiz to start collecting responses</p>
          </div>
        ) : (
          <>
            {/* Question Analytics */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Question Performance</h2>
              <div className="space-y-4">
                {analytics.question_analytics.map((q, idx) => (
                  <div key={q.question_id} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <span className="text-gray-400 text-sm mr-2">Q{idx + 1}.</span>
                        <span className="text-gray-700">{q.question_text}</span>
                        <span className="ml-2 text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded">
                          {q.question_type === 'mcq' ? 'MCQ' : q.question_type === 'true_false' ? 'T/F' : 'Text'}
                        </span>
                      </div>
                      <div className="text-right ml-4">
                        <span className={`font-semibold ${q.accuracy >= 70 ? 'text-green-600' : q.accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {q.accuracy}%
                        </span>
                        <div className="text-gray-400 text-xs">
                          {q.correct_answers}/{q.total_answers} correct
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getAccuracyColor(q.accuracy)}`}
                        style={{ width: `${q.accuracy}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submissions Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Submissions</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Participant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Percentage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.submissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {submission.taker_name || 'Anonymous'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {submission.score} / {submission.total_questions}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${getScoreColor(submission.percentage)}`}>
                            {submission.percentage}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(submission.submitted_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => viewSubmissionDetail(submission.id)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Submission Detail Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Submission Details
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedSubmission.taker_name || 'Anonymous'} • Score: {selectedSubmission.score}/{selectedSubmission.total_questions} ({selectedSubmission.percentage}%)
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {isLoadingDetail ? (
                <div className="p-8 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {selectedSubmission.answers.map((answer, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${answer.is_correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium text-gray-800">
                          Q{idx + 1}. {answer.question_text}
                        </span>
                        <span className={`text-sm font-medium px-2 py-1 rounded ${answer.is_correct ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                          {answer.is_correct ? '✓ Correct' : '✗ Incorrect'}
                        </span>
                      </div>
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="text-gray-500">Their answer: </span>
                          <span className="text-gray-700">
                            {answer.selected_choice_text || answer.text_answer || 'No answer'}
                          </span>
                        </div>
                        {!answer.is_correct && (
                          <div>
                            <span className="text-gray-500">Correct answer: </span>
                            <span className="text-green-700 font-medium">
                              {answer.correct_choice || answer.correct_text || 'N/A'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
