# Code Introduction for AI Agents

This document provides a comprehensive overview of the Quiz Management System codebase to help AI agents understand the project structure, architecture, and key components.

## Project Overview

This is a **full-stack Quiz Management System** that enables:
- **Administrators** to create and manage quizzes with multiple question types (MCQ, True/False, Text)
- **Public users** to take quizzes without registration
- **Instant scoring** with detailed answer review
- **Analytics dashboard** for tracking quiz performance

## Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Django 6.0 | Python web framework |
| Django REST Framework 3.16 | REST API development |
| djangorestframework-simplejwt | JWT authentication |
| SQLite/PostgreSQL | Database |
| Gunicorn | Production WSGI server |

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 16 (Page Router) | React framework |
| React 19 | UI library |
| TypeScript | Type safety |
| Tailwind CSS 4 | Styling |
| Radix UI / Shadcn | UI components |
| axios | HTTP client |
| react-hook-form + zod | Form handling & validation |
| recharts | Charts/analytics |

## Directory Structure

```
.
├── backend/                      # Django REST API
│   ├── config/                   # Django project configuration
│   │   ├── settings.py           # App settings (DB, CORS, JWT, security)
│   │   ├── urls.py               # Root URL routing
│   │   └── wsgi.py               # Production WSGI entry
│   ├── quizzes/                  # Quiz management app
│   │   ├── models.py             # Quiz, Question, Choice, Submission, Answer
│   │   ├── views.py              # API views (CRUD, public, analytics)
│   │   ├── serializers.py        # DRF serializers
│   │   └── urls.py               # Quiz API routes
│   ├── authentication/           # User auth app
│   │   ├── views.py              # Register, profile endpoints
│   │   └── urls.py               # Auth routes
│   ├── manage.py                 # Django CLI
│   └── requirements.txt          # Python dependencies
│
├── frontend/                     # Next.js application
│   ├── src/
│   │   ├── pages/                # Next.js pages (file-based routing)
│   │   │   ├── index.tsx         # Landing page
│   │   │   ├── quiz/[id].tsx     # Public quiz taking
│   │   │   └── admin/            # Admin pages
│   │   │       ├── login.tsx     # Admin login
│   │   │       ├── register.tsx  # Admin registration
│   │   │       ├── dashboard.tsx # Quiz management
│   │   │       └── quiz/
│   │   │           ├── create.tsx         # Create quiz
│   │   │           └── [id]/analytics.tsx # Quiz analytics
│   │   ├── components/
│   │   │   ├── ui/               # Shadcn UI components (50+)
│   │   │   └── layout/           # Layout components
│   │   ├── lib/
│   │   │   ├── api.ts            # Axios instance with interceptors
│   │   │   ├── quizApi.ts        # API client functions
│   │   │   └── utils.ts          # Utility functions
│   │   ├── context/
│   │   │   └── AuthContext.tsx   # Authentication state management
│   │   └── types/
│   │       └── quiz.ts           # TypeScript type definitions
│   ├── package.json              # Node dependencies
│   └── next.config.ts            # Next.js configuration
│
└── vercel.json                   # Vercel deployment config
```

## Key Files Reference

### Backend Entry Points
| File | Line | Purpose |
|------|------|---------|
| `backend/manage.py` | 1 | Django CLI entry point |
| `backend/config/urls.py` | 1 | Root URL routing - includes auth and quiz APIs |
| `backend/config/settings.py` | 1 | All Django configuration |

### Backend Core Logic
| File | Purpose |
|------|---------|
| `backend/quizzes/models.py` | Data models: Quiz, Question, Choice, QuizSubmission, Answer |
| `backend/quizzes/views.py` | All quiz API views including public quiz, submission, analytics |
| `backend/quizzes/serializers.py` | Request/response serialization and validation |
| `backend/authentication/views.py` | User registration and profile endpoints |

### Frontend Entry Points
| File | Purpose |
|------|---------|
| `frontend/src/pages/_app.tsx` | App wrapper with providers (Auth, Theme) |
| `frontend/src/pages/index.tsx` | Landing page |
| `frontend/src/context/AuthContext.tsx` | Global authentication state |

### Frontend Core Logic
| File | Purpose |
|------|---------|
| `frontend/src/lib/api.ts` | Axios instance with JWT handling and token refresh |
| `frontend/src/lib/quizApi.ts` | All API client functions (auth, quizzes, submissions) |
| `frontend/src/types/quiz.ts` | TypeScript interfaces for all data types |
| `frontend/src/pages/admin/dashboard.tsx` | Main admin interface |
| `frontend/src/pages/admin/quiz/create.tsx` | Quiz creation form with dynamic questions |
| `frontend/src/pages/quiz/[id].tsx` | Public quiz taking and submission |

## Data Models

### Quiz Model (`backend/quizzes/models.py`)
```python
Quiz:
  - id: UUID (primary key)
  - title: str
  - description: str (optional)
  - created_by: User (foreign key)
  - created_at: datetime
  - updated_at: datetime

Question:
  - id: UUID
  - quiz: Quiz (foreign key)
  - text: str
  - question_type: 'mcq' | 'true_false' | 'text'
  - order: int
  - correct_text_answer: str (for text questions)

Choice:
  - id: UUID
  - question: Question (foreign key)
  - text: str
  - is_correct: bool
  - order: int

QuizSubmission:
  - id: UUID
  - quiz: Quiz (foreign key)
  - score: float (percentage)
  - total_questions: int
  - correct_answers: int
  - submitted_at: datetime
  - ip_address: str (for rate limiting)

Answer:
  - id: UUID
  - submission: QuizSubmission (foreign key)
  - question: Question (foreign key)
  - selected_choice: Choice (optional, for MCQ/TF)
  - text_answer: str (optional, for text questions)
  - is_correct: bool
```

## API Endpoints

### Authentication (`/api/auth/`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register/` | No | Create admin account |
| POST | `/login/` | No | Get JWT tokens |
| POST | `/refresh/` | No | Refresh access token |
| GET | `/profile/` | Yes | Get current user |

### Quiz Management (`/api/quizzes/`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List user's quizzes |
| GET | `/{id}/` | Yes | Get quiz with questions (includes answers) |
| POST | `/create-with-questions/` | Yes | Create quiz with all questions |
| GET | `/{id}/analytics/` | Yes | Get quiz performance data |
| GET | `/{id}/submissions/{sub_id}/` | Yes | Get submission details |

### Public Quiz (`/api/quizzes/public/`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/{id}/` | No | Get quiz for taking (no correct answers) |
| POST | `/{id}/submit/` | No | Submit answers, get score |

## Authentication Flow

1. **Login**: POST to `/api/auth/login/` with username/password
2. **Token Storage**: Access + refresh tokens stored in localStorage
3. **API Requests**: Access token sent in `Authorization: Bearer <token>` header
4. **Token Refresh**: On 401, automatically refresh using `/api/auth/refresh/`
5. **Logout**: Clear tokens from localStorage

## Security Features

- **JWT Authentication**: Access tokens (5min) + Refresh tokens (1 day)
- **Rate Limiting**: 10 quiz submissions per hour per IP per quiz
- **Input Sanitization**: XSS prevention on all text inputs
- **Quiz Ownership**: Users can only manage their own quizzes
- **CORS**: Configured for frontend origin
- **HTTPS**: Enforced in production

## Common Development Tasks

### Running the Backend
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python manage.py runserver
```

### Running the Frontend
```bash
cd frontend
npm run dev
```

### Running Tests
```bash
# Backend
cd backend
python manage.py test

# Frontend
cd frontend
npm run lint
npm run build
```

### Database Migrations
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

## Environment Variables

### Backend (`backend/.env`)
```
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3  # or PostgreSQL URL
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Code Patterns

### Backend View Pattern
```python
class MyView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        obj = get_object_or_404(MyModel, pk=pk, created_by=request.user)
        serializer = MySerializer(obj)
        return Response(serializer.data)
```

### Frontend API Call Pattern
```typescript
// In lib/quizApi.ts
export const fetchData = async (): Promise<DataType> => {
  const response = await api.get('/endpoint/');
  return response.data;
};

// In component
const [data, setData] = useState<DataType | null>(null);
useEffect(() => {
  fetchData().then(setData).catch(console.error);
}, []);
```

### Protected Route Pattern (Frontend)
```typescript
const { user, loading } = useAuth();
const router = useRouter();

useEffect(() => {
  if (!loading && !user) {
    router.replace('/admin/login');
  }
}, [user, loading, router]);
```

## Notes for AI Agents

1. **Backend changes**: After modifying models, run `makemigrations` and `migrate`
2. **Frontend types**: Keep `frontend/src/types/quiz.ts` in sync with backend serializers
3. **API changes**: Update both `backend/quizzes/urls.py` and `frontend/src/lib/quizApi.ts`
4. **New UI components**: Use existing Shadcn components from `frontend/src/components/ui/`
5. **Styling**: Use Tailwind CSS utility classes, check `globals.css` for CSS variables
6. **Forms**: Use react-hook-form with zod schemas for validation
7. **State management**: Use React Context for global state, local state for component-specific data
