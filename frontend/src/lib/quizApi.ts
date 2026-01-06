import api from './api';
import type {
  Quiz,
  QuizListItem,
  QuizCreate,
  QuizSubmit,
  QuizResult,
  QuizAnalytics,
  LoginResponse,
  RegisterResponse,
  User,
} from '@/types/quiz';

// Auth API
export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/login/', { username, password });
    return response.data;
  },

  register: async (username: string, email: string, password: string, password2: string): Promise<RegisterResponse> => {
    const response = await api.post('/auth/register/', { username, email, password, password2 });
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },
};

// Quiz API (Admin)
export const quizApi = {
  list: async (): Promise<QuizListItem[]> => {
    const response = await api.get('/quizzes/');
    return response.data;
  },

  get: async (id: number): Promise<Quiz> => {
    const response = await api.get(`/quizzes/${id}/`);
    return response.data;
  },

  create: async (quiz: QuizCreate): Promise<{ id: number; title: string; message: string; share_link: string }> => {
    const response = await api.post('/quizzes/create-with-questions/', quiz);
    return response.data;
  },

  getAnalytics: async (id: number): Promise<QuizAnalytics> => {
    const response = await api.get(`/quizzes/${id}/analytics/`);
    return response.data;
  },

  getSubmissionDetail: async (quizId: number, submissionId: number): Promise<QuizResult> => {
    const response = await api.get(`/quizzes/${quizId}/submissions/${submissionId}/`);
    return response.data;
  },
};

// Public Quiz API
export const publicQuizApi = {
  get: async (id: number): Promise<Quiz> => {
    const response = await api.get(`/quizzes/public/${id}/`);
    return response.data;
  },

  submit: async (id: number, submission: QuizSubmit): Promise<QuizResult> => {
    const response = await api.post(`/quizzes/public/${id}/submit/`, submission);
    return response.data;
  },
};
