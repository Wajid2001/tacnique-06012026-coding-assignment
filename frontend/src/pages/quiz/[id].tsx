'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { publicQuizApi } from '@/lib/quizApi';
import type { Quiz, Question, AnswerSubmit, QuizResult } from '@/types/quiz';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { MdClose, MdCheck } from "react-icons/md";
import { PageLoader } from "@/components/ui/loading-spinner";
import { ThemeToggle } from "@/components/theme-toggle";

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
    return <PageLoader />;
  }

  if (error && !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-in fade-in duration-500">
        <Card className="max-w-md w-full text-center border-destructive/20 shadow-lg">
            <CardContent className="pt-8 pb-8">
                <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <MdClose className="w-10 h-10 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">Quiz Not Found</h2>
                <p className="text-muted-foreground text-lg mb-6">{error}</p>
                <Button asChild variant="outline">
                    <a href="/" className="min-w-[120px]">Go Home</a>
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  // Show results
  if (result) {
    return (
      <div className="min-h-screen bg-muted/40 py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-12 px-4 animate-in zoom-in-95 duration-500">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Score Card */}
          <Card className="text-center p-8 overflow-hidden relative border-none shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
            <CardContent className="relative z-10">
                <h1 className="text-3xl font-extrabold text-foreground mb-2 tracking-tight">Quiz Complete!</h1>
                <p className="text-muted-foreground mb-8 text-lg">{result.quiz_title}</p>
                
                <div className="mb-8 p-6 bg-card rounded-2xl shadow-inner border mx-auto max-w-sm">
                    <div className="text-6xl font-black text-primary mb-2 tracking-tighter">{result.percentage}%</div>
                    <Progress value={result.percentage} className="w-full h-3 mb-3 bg-muted"  />
                    <div className="text-sm font-medium text-muted-foreground">{result.score} / {result.total_questions} correct</div>
                </div>

                <p className="text-xl font-medium text-foreground mb-2">
                {result.percentage >= 80
                    ? '🎉 Excellent work! You\'re a star!'
                    : result.percentage >= 60
                    ? '👍 Good job! Keep it up.'
                    : result.percentage >= 40
                    ? '📚 Nice try, keep practicing!'
                    : '💪 Don\'t give up! Study and try again.'}
                </p>
            </CardContent>
          </Card>

          {/* Answer Review */}
          <Card className="overflow-hidden border shadow-md">
            <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-xl">Review Answers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {result.answers.map((answer, index) => (
                <div
                  key={index}
                  className={`p-5 rounded-xl border-l-[6px] shadow-sm transition-all hover:shadow-md ${
                    answer.is_correct
                      ? 'border-l-green-500 bg-green-50/50 dark:bg-green-950/10'
                      : 'border-l-destructive bg-red-50/50 dark:bg-red-950/10'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                      answer.is_correct ? 'bg-green-500 text-white' : 'bg-destructive text-white'
                    }`}>
                      {answer.is_correct ? (
                        <MdCheck className="w-5 h-5" />
                      ) : (
                        <MdClose className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="font-semibold text-foreground text-lg leading-snug">
                        <span className="text-muted-foreground mr-2 text-base font-normal">{index + 1}.</span>
                        {answer.question_text}
                      </p>
                      
                      <div className="grid gap-2 text-sm pl-1 mt-2">
                        <div className="p-3 bg-background/80 rounded-lg border">
                          <span className="block text-xs font-semibold uppercase text-muted-foreground mb-1 tracking-wider">Your Answer</span>
                          <span className={`font-medium text-base ${answer.is_correct ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                            {answer.question_type === 'text'
                              ? answer.text_answer || 'No answer'
                              : answer.selected_choice_text || 'No answer'}
                          </span>
                        </div>
                        
                        {!answer.is_correct && (
                          <div className="p-3 bg-background/80 rounded-lg border">
                            <span className="block text-xs font-semibold uppercase text-muted-foreground mb-1 tracking-wider">Correct Answer</span>
                            <span className="font-medium text-base text-green-600 dark:text-green-400">
                              {answer.question_type === 'text'
                                ? answer.correct_text
                                : answer.correct_choice}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Try Again */}
          <div className="text-center pb-12">
            <Button onClick={() => window.location.reload()} size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
              Try Again
            </Button>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // Quiz Form
  return (
    <div className="min-h-screen bg-muted/40 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Quiz Header */}
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                   <CardTitle className="text-2xl">{quiz?.title}</CardTitle>
                   {quiz?.description && <p className="text-muted-foreground mt-2">{quiz.description}</p>}
                   <p className="text-sm text-muted-foreground mt-2">
                       {quiz?.questions.length} questions
                   </p>
                </div>
                <ThemeToggle />
            </CardHeader>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Name Input */}
          <Card>
            <CardContent className="pt-6">
                <Label htmlFor="name" className="mb-2 block">Your Name (optional)</Label>
                <Input
                    id="name"
                    value={takerName}
                    onChange={(e) => setTakerName(e.target.value)}
                    placeholder="Enter your name"
                />
            </CardContent>
          </Card>

          {/* Questions */}
          <div className="space-y-8">
            {quiz?.questions.map((question, qIndex) => (
              <Card key={question.id} className="shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="bg-muted/10 border-b pb-4">
                    <CardTitle className="text-lg font-bold leading-relaxed flex gap-3">
                        <span className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow-sm">
                            {qIndex + 1}
                        </span>
                        <div className="pt-0.5">{question.question_text}</div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    {/* MCQ / True-False */}
                    {(question.question_type === 'mcq' || question.question_type === 'true_false') && (
                    <RadioGroup
                        value={answers[question.id]?.selected_choice_id?.toString()}
                        onValueChange={(val) => updateAnswer(question.id, 'selected_choice_id', parseInt(val))}
                        className="space-y-3"
                    >
                        {question.choices.map((choice) => (
                        <div key={choice.id} className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                            answers[question.id]?.selected_choice_id === choice.id 
                            ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                            : 'border-transparent hover:bg-muted'
                        }`}>
                             <RadioGroupItem value={choice.id.toString()} id={`choice-${choice.id}`} className="mt-0.5" />
                             <Label htmlFor={`choice-${choice.id}`} className="font-medium cursor-pointer flex-1 text-base leading-relaxed py-1">
                                {choice.choice_text}
                             </Label>
                        </div>
                        ))}
                    </RadioGroup>
                    )}

                    {/* Text Answer */}
                    {question.question_type === 'text' && (
                    <div className="relative">
                        <Input
                            type="text"
                            value={answers[question.id]?.text_answer || ''}
                            onChange={(e) => updateAnswer(question.id, 'text_answer', e.target.value)}
                            placeholder="Type your answer here..."
                            className="text-lg p-6 shadow-sm focus-visible:ring-primary"
                        />
                    </div>
                    )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Submit */}
          <div className="text-center pb-12 pt-4">
            <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto px-12 py-6 text-lg rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-1">
              {isSubmitting ? (
                  <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                  </span>
              ) : 'Submit Quiz'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
