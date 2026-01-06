// Quiz Types
export interface Choice {
  id: number;
  choice_text: string;
  is_correct?: boolean;
}

export interface Question {
  id: number;
  question_text: string;
  question_type: 'mcq' | 'true_false' | 'text';
  order: number;
  choices: Choice[];
  correct_text_answer?: string;
}

export interface Quiz {
  id: number;
  title: string;
  description: string;
  questions: Question[];
  created_by_username?: string;
  created_at?: string;
  updated_at?: string;
}

export interface QuizListItem {
  id: number;
  title: string;
  description: string;
  created_by_username: string;
  question_count: number;
  created_at: string;
}

// Form Types for Creating Quizzes
export interface ChoiceCreate {
  choice_text: string;
  is_correct: boolean;
}

export interface QuestionCreate {
  question_text: string;
  question_type: 'mcq' | 'true_false' | 'text';
  order: number;
  correct_text_answer?: string;
  choices: ChoiceCreate[];
}

export interface QuizCreate {
  title: string;
  description: string;
  questions: QuestionCreate[];
}

// Submission Types
export interface AnswerSubmit {
  question_id: number;
  selected_choice_id?: number | null;
  text_answer?: string;
}

export interface QuizSubmit {
  taker_name?: string;
  answers: AnswerSubmit[];
}

export interface AnswerResult {
  question_text: string;
  question_type: 'mcq' | 'true_false' | 'text';
  selected_choice_text: string | null;
  text_answer: string | null;
  is_correct: boolean;
  correct_choice: string | null;
  correct_text: string | null;
}

export interface QuizResult {
  id: number;
  quiz_title: string;
  taker_name: string;
  score: number;
  total_questions: number;
  percentage: number;
  submitted_at: string;
  answers: AnswerResult[];
}

// Auth Types
export interface User {
  id: number;
  username: string;
  email: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface RegisterResponse {
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
  message: string;
}

// Analytics Types
export interface QuestionAnalytics {
  question_id: number;
  question_text: string;
  question_type: 'mcq' | 'true_false' | 'text';
  total_answers: number;
  correct_answers: number;
  accuracy: number;
}

export interface SubmissionSummary {
  id: number;
  taker_name: string;
  score: number;
  total_questions: number;
  percentage: number;
  submitted_at: string;
}

export interface QuizAnalytics {
  quiz_id: number;
  quiz_title: string;
  total_submissions: number;
  average_score: number;
  average_percentage: number;
  highest_score: number;
  lowest_score: number;
  pass_rate: number;
  question_analytics: QuestionAnalytics[];
  submissions: SubmissionSummary[];
}
