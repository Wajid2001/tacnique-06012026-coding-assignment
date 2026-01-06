# Quiz Management System

A production-ready Quiz Management System with admin capabilities and public quiz-taking functionality.

## 🚀 Tech Stack

- **Frontend**: Next.js (Page Router), React.js, TypeScript, Tailwind CSS
- **Backend**: Django, Python, Django REST Framework
- **Authentication**: JWT (Simple JWT)
- **Database**: SQLite (dev) / PostgreSQL (production)

## ✨ Features

### Admin Features
- 🔐 User registration and login
- 📝 Create quizzes with multiple questions
- 🎯 Support for MCQ, True/False, and Text answer questions
- 📊 Dashboard to view all created quizzes
- 🔗 Shareable quiz links

### Public Quiz Features
- 📋 Take quizzes without registration
- ✅ Instant score calculation
- 📖 Detailed answer review after submission
- 📱 Responsive design for mobile and desktop

## 🛠️ Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ or Bun
- Git

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers psycopg2-binary python-dotenv

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start server
python manage.py runserver 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
bun install  # or npm install

# Start development server
bun run dev  # or npm run dev
```

### Environment Variables

Backend (`.env`):
```
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

Frontend (`.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## 📁 Project Structure

```
├── backend/
│   ├── config/           # Django project settings
│   ├── quizzes/          # Quiz app (models, views, serializers)
│   ├── authentication/   # Auth app (login, register)
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── pages/        # Next.js pages
│   │   ├── components/   # React components
│   │   ├── lib/          # API client
│   │   ├── types/        # TypeScript types
│   │   └── context/      # React context (Auth)
│   └── package.json
└── PLAN.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new admin
- `POST /api/auth/login/` - Login and get JWT token
- `GET /api/auth/profile/` - Get current user profile

### Quiz Management (Authenticated)
- `GET /api/quizzes/` - List all quizzes
- `GET /api/quizzes/{id}/` - Get quiz details
- `POST /api/quizzes/create-with-questions/` - Create quiz with questions

### Public Quiz
- `GET /api/quizzes/public/{id}/` - Get quiz for taking (no answers)
- `POST /api/quizzes/public/{id}/submit/` - Submit quiz and get results

## 🎯 Usage

1. **Admin Flow**:
   - Go to `/admin/login` or `/admin/register`
   - Create a new quiz from the dashboard
   - Add questions (MCQ, True/False, or Text)
   - Share the generated link with quiz takers

2. **Quiz Taker Flow**:
   - Open the shared quiz link (`/quiz/{id}`)
   - Answer all questions
   - Submit and view results with answer review

## 📝 Question Types

- **Multiple Choice (MCQ)**: 4 options, one correct answer
- **True/False**: Simple binary choice
- **Text Answer**: Free text, case-insensitive matching

## 🔒 Security

- JWT-based authentication for admin routes
- Public quiz endpoints don't expose correct answers
- CORS configured for frontend domain only

---

Built for Tacnique Coding Assignment | January 2026
