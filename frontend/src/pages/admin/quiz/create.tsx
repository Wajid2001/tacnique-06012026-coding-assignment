'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { quizApi } from '@/lib/quizApi';
import type { QuestionCreate, ChoiceCreate } from '@/types/quiz';
import Link from 'next/link';
import { MdCheck, MdContentCopy, MdAdd, MdDelete, MdArrowBack } from "react-icons/md";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageLoader, LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

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
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
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

  // Set the first question as active initially
  useEffect(() => {
    if (questions.length > 0 && !activeQuestionId) {
      setActiveQuestionId(questions[0].tempId);
    }
  }, []);

  const addQuestion = () => {
    const newQuestion = createEmptyQuestion();
    setQuestions([...questions, newQuestion]);
    setActiveQuestionId(newQuestion.tempId);
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
    return <PageLoader />;
  }

  if (success) {
    return (
      <AdminLayout title="Quiz Created">
        <div className="max-w-2xl mx-auto py-12 px-4">
          <div className="bg-card border rounded-xl shadow-lg p-8 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <MdCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Quiz Created Successfully!</h2>
            <p className="text-muted-foreground mb-8">Your quiz is ready to be shared with potential candidates.</p>
            
            <div className="bg-muted/50 p-6 rounded-lg border border-border mb-8 max-w-lg mx-auto">
              <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2 block text-left">Share Link</Label>
              <div className="flex gap-2">
                <Input 
                    readOnly 
                    value={success.link} 
                    className="flex-1 font-mono text-sm bg-background"
                />
                <Button variant="secondary" onClick={() => {
                  navigator.clipboard.writeText(success.link);
                  alert('Copied to clipboard!');
                }}>
                  <MdContentCopy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Button variant="outline" asChild>
                <Link href="/admin/dashboard">Back to Dashboard</Link>
              </Button>
              <Button asChild>
                <Link href={success.link.replace(window.location.origin, '')} target="_blank">
                    View Quiz
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
        title="Create New Quiz"
        actions={
            <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                    <MdArrowBack /> 
                    Cancel & Return
                </Link>
            </Button>
        }
    >
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Quiz Details Section */}
          <div className="bg-card border rounded-xl p-6 shadow-sm">
             <div className="mb-6">
                 <h2 className="text-lg font-semibold text-foreground mb-1">Quiz Details</h2>
                 <p className="text-sm text-muted-foreground">Basic information about the quiz.</p>
             </div>
             
             <div className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="title">Quiz Title</Label>
                    <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Frontend React Assessment"
                        required
                        className="max-w-xl"
                    />
                </div>
                
                <div className="grid gap-2">
                     <Label htmlFor="description">Description (Optional)</Label>
                     <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Briefly describe what this quiz covers..."
                        className="resize-none"
                    />
                </div>
             </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Questions</h2>
            <div className="text-sm text-muted-foreground">
                Total: <span className="font-mono font-medium">{questions.length}</span>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-6">
            {questions.map((q, qIndex) => (
              <Card 
                key={q.tempId} 
                className={`border-l-4 transition-all duration-200 overflow-hidden relative group ${
                    activeQuestionId === q.tempId 
                    ? 'border-l-primary shadow-md ring-1 ring-primary/20 scale-[1.01]' 
                    : 'border-l-transparent opacity-80 hover:opacity-100 hover:border-l-muted-foreground/30'
                }`}
                onClick={() => setActiveQuestionId(q.tempId)}
              >
                {/* Question Header / Number */}
                <div className="absolute top-4 left-4 flex items-center gap-3">
                     <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 border-primary/20 bg-primary/5 text-primary">
                         {qIndex + 1}
                     </Badge>
                     <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Question {qIndex + 1}</span>
                </div>

                <div className="absolute top-4 right-4">
                  {questions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                      onClick={() => removeQuestion(q.tempId)}
                      title="Remove Question"
                    >
                      <MdDelete className="w-5 h-5" />
                    </Button>
                  )}
                </div>

                <CardContent className="pt-14 pb-6">
                    <div className="grid gap-6">
                        {/* Question Text & Type */}
                        <div className="grid md:grid-cols-[1fr,200px] gap-4">
                            <div className="space-y-2">
                                <Label>Question Text</Label>
                                <Input
                                    value={q.question_text}
                                    onChange={(e) => updateQuestion(q.tempId, 'question_text', e.target.value)}
                                    placeholder="What is the capital of France?"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select
                                    value={q.question_type}
                                    onValueChange={(value) =>
                                        updateQuestion(q.tempId, 'question_type', value as any)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mcq">Multiple Choice</SelectItem>
                                        <SelectItem value="true_false">True / False</SelectItem>
                                        <SelectItem value="text">Short Answer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Answer Section Based on Type */}
                        <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                        {q.question_type === 'text' && (
                            <div className="space-y-2">
                                <Label>Correct Answer (Exact Match)</Label>
                                <Input
                                    value={q.correct_text_answer || ''}
                                    onChange={(e) =>
                                        updateQuestion(q.tempId, 'correct_text_answer', e.target.value)
                                    }
                                    placeholder="Enter the correct answer..."
                                    required
                                />
                                <p className="text-xs text-muted-foreground">Case-insensitive comparison will be used.</p>
                            </div>
                        )}

                        {q.question_type === 'true_false' && (
                            <div className="space-y-3">
                                <Label>Correct Option</Label>
                                <RadioGroup
                                    value={q.choices.find(c => c.is_correct)?.choice_text || ''}
                                    onValueChange={(val) => {
                                        const newChoices = q.choices.map(c => ({
                                            ...c,
                                            is_correct: c.choice_text === val
                                        }));
                                        // We can't easily use updateQuestion for deep updates like this with the current helper
                                        // so we'll do it manually here or update the helper? 
                                        // Actually let's use a simpler approach:
                                        setQuestions(prev => prev.map(qs => qs.tempId === q.tempId ? { ...qs, choices: newChoices } : qs));
                                    }}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="True" id={`t-${q.tempId}`} />
                                            <Label htmlFor={`t-${q.tempId}`}>True</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="False" id={`f-${q.tempId}`} />
                                            <Label htmlFor={`f-${q.tempId}`}>False</Label>
                                        </div>
                                    </div>
                                </RadioGroup>
                            </div>
                        )}

                        {q.question_type === 'mcq' && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center mb-1">
                                    <Label>Choices</Label>
                                    <span className="text-xs text-muted-foreground">Select the radio button for correct answer</span>
                                </div>
                                <RadioGroup
                                    value={q.choices.findIndex(c => c.is_correct).toString()}
                                    onValueChange={(val) => {
                                        const idx = parseInt(val);
                                        const newChoices = q.choices.map((c, i) => ({
                                            ...c,
                                            is_correct: i === idx
                                        }));
                                        setQuestions(prev => prev.map(qs => qs.tempId === q.tempId ? { ...qs, choices: newChoices } : qs));
                                    }}
                                >
                                    <div className="grid gap-3">
                                        {q.choices.map((choice, cIndex) => (
                                            <div key={cIndex} className="flex items-center gap-3">
                                                <RadioGroupItem value={cIndex.toString()} id={`c-${q.tempId}-${cIndex}`} />
                                                <Input
                                                    value={choice.choice_text}
                                                    onChange={(e) =>
                                                        updateChoice(q.tempId, cIndex, 'choice_text', e.target.value)
                                                    }
                                                    placeholder={`Option ${cIndex + 1}`}
                                                    required
                                                    className={choice.is_correct ? "border-green-500 ring-green-500/20" : ""}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>
                            </div>
                        )}
                        </div>
                    </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={addQuestion}
                className="w-full border-dashed border-2 py-8 h-auto flex flex-col gap-2 hover:bg-muted/50"
            >
                <div className="p-2 bg-background rounded-full shadow-sm">
                    <MdAdd className="w-5 h-5" />
                </div>
                <span>Add Another Question</span>
              </Button>

              <div className="flex justify-end gap-3 mt-4">
                 <Button type="button" variant="outline" asChild>
                    <Link href="/admin/dashboard">Cancel</Link>
                 </Button>
                 <Button type="submit" disabled={isSubmitting} size="lg" className="min-w-[150px]">
                    {isSubmitting ? (
                        <>
                           <LoadingSpinner size="sm" className="mr-2" /> Saving...
                        </>
                    ) : 'Create Quiz'}
                 </Button>
              </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
