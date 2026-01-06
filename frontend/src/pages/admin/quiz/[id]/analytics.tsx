'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { quizApi } from '@/lib/quizApi';
import { MdPoll, MdOutlineAssignment, MdChevronRight, MdClose, MdArrowBack } from "react-icons/md";
import type { QuizAnalytics, QuizResult } from '@/types/quiz';
import Link from 'next/link';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageLoader } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from "@/components/ui/button";

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
    if (percentage >= 80) return 'text-green-600 dark:text-green-400 bg-green-500/10';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10';
    return 'text-destructive bg-destructive/10';
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'bg-green-500';
    if (accuracy >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (authLoading || !isAuthenticated) {
    return <PageLoader />;
  }

  if (isLoading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-6 py-4 rounded-lg">
            {error}
          </div>
          <Link
            href="/admin/dashboard"
            className="mt-4 inline-block text-primary hover:text-primary/80"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </AdminLayout>
    );
  }

  if (!analytics) return null;

  return (
    <AdminLayout
      title={`Analytics: ${analytics.quiz_title}`}
      actions={
        <Button variant="outline" size="sm" asChild>
            <Link href="/admin/dashboard" className="flex items-center gap-2">
                <MdArrowBack /> Back to Dashboard
            </Link>
        </Button>
      }
    >
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border rounded-xl shadow-sm hover:shadow-md transition-all p-6 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <MdPoll className="w-24 h-24" />
            </div>
            <div className="text-4xl font-extrabold text-primary mb-1 relative z-10">
              {analytics.total_submissions}
            </div>
            <div className="text-muted-foreground text-sm font-medium relative z-10">Total Submissions</div>
          </div>
          <div className="bg-card border rounded-xl shadow-sm hover:shadow-md transition-all p-6 relative overflow-hidden">
            <div className="text-4xl font-extrabold text-green-600 dark:text-green-400 mb-1">
              {analytics.average_percentage}%
            </div>
            <div className="text-muted-foreground text-sm font-medium">Average Score</div>
          </div>
          <div className="bg-card border rounded-xl shadow-sm hover:shadow-md transition-all p-6 relative overflow-hidden">
            <div className="text-4xl font-extrabold text-purple-600 dark:text-purple-400 mb-1">
              {analytics.pass_rate}%
            </div>
            <div className="text-muted-foreground text-sm font-medium">Pass Rate (≥70%)</div>
          </div>
          <div className="bg-card border rounded-xl shadow-sm hover:shadow-md transition-all p-6 relative overflow-hidden">
            <div className="text-4xl font-extrabold text-orange-600 dark:text-orange-400 mb-1">
              {analytics.highest_score}/{analytics.total_submissions > 0 ? analytics.submissions[0]?.total_questions || 0 : 0}
            </div>
            <div className="text-muted-foreground text-sm font-medium">Highest Score</div>
          </div>
        </div>

        {analytics.total_submissions === 0 ? (
          <EmptyState
            icon={MdOutlineAssignment}
            title="No submissions yet"
            description="Share your quiz to start collecting responses"
          />
        ) : (
          <>
            {/* Question Analytics */}
            <div className="bg-card border rounded-xl shadow-sm mb-8 overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-muted/30">
                <h2 className="text-xl font-semibold text-foreground">Question Performance</h2>
              </div>
              <div className="p-6 space-y-6">
                {analytics.question_analytics.map((q, idx) => (
                  <div key={q.question_id} className="group transition-all">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                                {idx + 1}
                            </span>
                             <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border font-medium">
                              {q.question_type === 'mcq' ? 'MCQ' : q.question_type === 'true_false' ? 'T/F' : 'Text'}
                             </span>
                        </div>
                        <p className="text-foreground font-medium pl-8">{q.question_text}</p>
                      </div>
                      <div className="flex items-center gap-4 mt-2 md:mt-0 pl-8 md:pl-0 w-full md:w-auto justify-between md:justify-end">
                        <div className="text-right">
                          <span className={`text-xl font-bold ${q.accuracy >= 70 ? 'text-green-600' : q.accuracy >= 50 ? 'text-yellow-600' : 'text-destructive'}`}>
                            {q.accuracy}%
                          </span>
                          <p className="text-muted-foreground text-xs">Accuracy</p>
                        </div>
                         <div className="text-right border-l pl-4 py-1">
                          <span className="text-lg font-bold text-foreground">
                            {q.correct_answers}/{q.total_answers}
                          </span>
                          <p className="text-muted-foreground text-xs">Correct</p>
                        </div>
                      </div>
                    </div>
                    {/* Visual Bar */}
                    <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${getAccuracyColor(q.accuracy)}`}
                        style={{ width: `${q.accuracy}%` }}
                      >
                         <div className="w-full h-full opacity-20 bg-white/30 animate-[shimmer_2s_infinite]"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submissions Table */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/30">
                <h2 className="text-xl font-semibold text-foreground">Detailed Submissions</h2>
                 <div className="text-sm text-muted-foreground">
                    Total: <span className="font-medium text-foreground">{analytics.total_submissions}</span>
                 </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Participant
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Performance
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {analytics.submissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mr-3">
                                {(submission.taker_name || 'A')[0].toUpperCase()}
                            </div>
                            <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                              {submission.taker_name || 'Anonymous'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono font-medium text-foreground">
                            {submission.score} <span className="text-muted-foreground">/ {submission.total_questions}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              submission.percentage >= 70 ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' :
                              submission.percentage >= 40 ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20' :
                              'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
                          }`}>
                            {submission.percentage}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {new Date(submission.submitted_at).toLocaleDateString()} <span className="text-xs opacity-70">{new Date(submission.submitted_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => viewSubmissionDetail(submission.id)}
                            className="text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-md"
                          >
                             <span>View</span>
                             <MdChevronRight className="w-4 h-4" />
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
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-card border rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              <div className="bg-muted/50 border-b px-6 py-4 flex justify-between items-start shrink-0">
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    Submission Details
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{selectedSubmission.taker_name || 'Anonymous'}</span>
                    <span>•</span>
                    <span className={`font-mono font-medium ${selectedSubmission.percentage >= 70 ? 'text-green-600' : 'text-orange-600'}`}>
                        {selectedSubmission.score}/{selectedSubmission.total_questions} ({selectedSubmission.percentage}%)
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MdClose className="w-6 h-6" />
                </button>
              </div>
              
              <div className="overflow-y-auto p-0 scroll-smooth">
                 {isLoadingDetail ? (
                    <div className="p-12 flex flex-col items-center justify-center text-muted-foreground">
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mb-4"></div>
                      <p>Loading details...</p>
                    </div>
                  ) : (
                    <div className="p-6 space-y-6">
                      {selectedSubmission.answers.map((answer, idx) => (
                        <div
                          key={idx}
                          className={`p-5 rounded-xl border transition-colors ${
                              answer.is_correct 
                              ? 'border-green-500/20 bg-green-500/5 dark:bg-green-500/10' 
                              : 'border-red-500/20 bg-red-500/5 dark:bg-red-500/10'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3 gap-4">
                            <div className="flex gap-3">
                                <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                                    answer.is_correct ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
                                }`}>
                                    {idx + 1}
                                </span>
                                <span className="font-medium text-foreground text-sm leading-6">
                                  {answer.question_text}
                                </span>
                            </div>
                            <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border ${
                                answer.is_correct 
                                ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
                                : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                            }`}>
                              {answer.is_correct ? 'Correct' : 'Incorrect'}
                            </span>
                          </div>
                          
                          <div className="ml-9 space-y-2 text-sm">
                            <div className="grid grid-cols-[100px_1fr] gap-2 p-2 rounded bg-background/50">
                              <span className="text-muted-foreground font-medium">Their Answer:</span>
                              <span className={`font-medium ${answer.is_correct ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {answer.selected_choice_text || answer.text_answer || <span className="italic text-muted-foreground">Skipped</span>}
                              </span>
                            </div>
                            
                            {!answer.is_correct && (
                                <div className="grid grid-cols-[100px_1fr] gap-2 p-2 rounded bg-green-500/10 border border-green-500/20">
                                  <span className="text-green-700 dark:text-green-400 font-medium">Correct Answer:</span>
                                  <span className="text-foreground">
                                    {answer.correct_choice || answer.correct_text || 'See question details'}
                                  </span>
                                </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
              
              <div className="bg-muted/50 border-t p-4 flex justify-end shrink-0">
                <button
                    onClick={() => setSelectedSubmission(null)}
                    className="px-4 py-2 bg-background border rounded-lg shadow-sm hover:bg-accent transition-colors text-sm font-medium"
                >
                    Close
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
  );
}
