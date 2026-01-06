'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { quizApi } from '@/lib/quizApi';
import type { QuizListItem } from '@/types/quiz';
import Link from 'next/link';
import { MdArticle, MdAnalytics, MdContentCopy, MdCheck } from "react-icons/md";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageLoader } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";

export default function AdminDashboard() {
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchQuizzes();
    }
  }, [isAuthenticated]);

  const fetchQuizzes = async () => {
    try {
      const data = await quizApi.list();
      setQuizzes(data);
    } catch (err) {
      setError('Failed to load quizzes');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyShareLink = (quizId: number) => {
    const url = `${window.location.origin}/quiz/${quizId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(quizId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (authLoading || !isAuthenticated) {
    return <PageLoader />;
  }

  return (
    <AdminLayout
      title="Quiz Dashboard"
      actions={
        <Button asChild>
          <Link href="/admin/quiz/create">+ Create New Quiz</Link>
        </Button>
      }
    >
        {error && (
            <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <PageLoader />
          </div>
        ) : quizzes.length === 0 ? (
          <EmptyState
            icon={MdArticle}
            title="No quizzes yet"
            description="Create your first quiz to get started collecting responses."
            actionLabel="Create Your First Quiz"
            actionLink="/admin/quiz/create"
          />
        ) : (
          <div className="bg-card border rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="px-6 py-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/30">
               <h2 className="text-xl font-semibold text-foreground">Your Quizzes</h2>
               <div className="text-sm text-muted-foreground">
                  Total: <span className="font-medium text-foreground">{quizzes.length}</span>
               </div>
             </div>
             <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[400px] text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-6">Title</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Questions</TableHead>
                            <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created At</TableHead>
                            <TableHead className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider pr-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="bg-card divide-y divide-border">
                        {quizzes.map((quiz) => (
                            <TableRow key={quiz.id} className="hover:bg-muted/30 transition-colors">
                                <TableCell className="font-medium p-4 pl-6">
                                    <Link href={`/admin/quiz/${quiz.id}/analytics`} className="text-lg text-primary mb-1 hover:underline block w-fit">
                                        {quiz.title}
                                    </Link>
                                    {quiz.description && <div className="text-sm text-muted-foreground line-clamp-1">{quiz.description}</div>}
                                </TableCell>
                                <TableCell>
                                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                        {quiz.question_count} Qs
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{new Date(quiz.created_at).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right space-x-2 pr-6">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/admin/quiz/${quiz.id}/analytics`}>
                                            <MdAnalytics className="w-4 h-4 mr-1" />
                                            Analytics
                                        </Link>
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => copyShareLink(quiz.id)}
                                        className={copiedId === quiz.id ? "border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20" : ""}
                                    >
                                        {copiedId === quiz.id ? (
                                            <>
                                                <MdCheck className="w-4 h-4 mr-1" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <MdContentCopy className="w-4 h-4 mr-1" />
                                                Copy Link
                                            </>
                                        )}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
             </div>
          </div>
        )}
    </AdminLayout>
  );
}
