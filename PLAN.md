# PLAN.md - Quiz Management System

## Project Overview
Building a production-ready Quiz Management System with admin capabilities and public quiz-taking functionality.

## Tech Stack
- **Frontend**: Next.js (Page Router), React.js, TypeScript, Tailwind CSS
- **Backend**: Django, Python, Django REST Framework
- **Database**: PostgreSQL (Neon DB)
- **Deployment**: Vercel (Frontend) + Railway/Render (Backend)

## Assumptions & Scope

### Assumptions
1. Admin panel requires simple authentication (no complex role management)
2. Quizzes are public and accessible via shareable links
3. No user accounts needed for quiz takers
4. Quiz results shown immediately after completion
5. Questions support MCQ (single choice), True/False, and short text answers
6. Focus on core functionality over advanced features

### Scope (MVP for 2 hours)
**In Scope:**
- Admin authentication (simple token-based)
- Create/list quizzes (admin only)
- Add questions to quiz (3 types: MCQ, True/False, Text)
- Public quiz-taking page
- Score calculation and results display
- Responsive UI

**Out of Scope (for now):**
- Quiz editing/deletion
- Question bank/reusability
- Analytics/reporting
- Timed quizzes
- User registration for quiz takers
- Quiz settings (passing score, randomization)

## High-Level Architecture

```
┌─────────────────┐         ┌──────────────────┐
│   Next.js App   │◄────────┤   Django REST    │
│   (Frontend)    │  HTTP   │      API         │
│                 │────────►│   (Backend)      │
└─────────────────┘         └──────────────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │  PostgreSQL     │
                            │  (Neon DB)      │
                            └─────────────────┘
```

## Database Schema

### Models

**User** (Django built-in)
- id (Primary Key)
- username
- password (hashed)
- email

**Quiz**
- id (Primary Key)
- title (CharField, max 200)
- description (TextField, optional)
- created_by (ForeignKey → User)
- created_at (DateTime)
- updated_at (DateTime)

**Question**
- id (Primary Key)
- quiz (ForeignKey → Quiz, CASCADE)
- question_text (TextField)
- question_type (CharField: 'mcq', 'true_false', 'text')
- order (IntegerField)
- created_at (DateTime)

**Choice** (for MCQ and True/False)
- id (Primary Key)
- question (ForeignKey → Question, CASCADE)
- choice_text (CharField, max 200)
- is_correct (BooleanField)

**QuizSubmission**
- id (Primary Key)
- quiz (ForeignKey → Quiz)
- taker_name (CharField, optional)
- score (IntegerField)
- total_questions (IntegerField)
- submitted_at (DateTime)

**Answer**
- id (Primary Key)
- submission (ForeignKey → QuizSubmission, CASCADE)
- question (ForeignKey → Question)
- selected_choice (ForeignKey → Choice, nullable)
- text_answer (TextField, nullable)
- is_correct (BooleanField)

## API Endpoints

### Authentication
- `POST /api/auth/login/` - Admin login
- `POST /api/auth/register/` - Admin registration

### Quiz Management (Admin)
- `POST /api/quizzes/` - Create quiz
- `GET /api/quizzes/` - List all quizzes (admin)
- `GET /api/quizzes/{id}/` - Get quiz details
- `POST /api/quizzes/{id}/questions/` - Add questions to quiz

### Public Quiz
- `GET /api/public/quiz/{id}/` - Get quiz for taking (no answers)
- `POST /api/public/quiz/{id}/submit/` - Submit quiz answers

## Implementation Tasks

### Phase 1: Backend Setup (30 min)
- [x] **Task 1.1**: Initialize Django project with REST framework
  - **Check**: `python manage.py runserver` works, REST framework installed
  
- [x] **Task 1.2**: Configure PostgreSQL (Neon DB) connection
  - **Check**: Database migrations run successfully
  
- [x] **Task 1.3**: Create models (Quiz, Question, Choice, QuizSubmission, Answer)
  - **Check**: `python manage.py makemigrations` and `migrate` succeed without errors
  
- [x] **Task 1.4**: Set up Django admin panel for quick testing
  - **Check**: Can access `/admin` and see all models
  
- [x] **Task 1.5**: Create serializers for all models
  - **Check**: Serializers properly handle nested relationships

### Phase 2: Backend API Development (30 min)
- [x] **Task 2.1**: Implement authentication endpoints (login/register)
  - **Check**: Can register and get JWT token, token validates correctly
  
- [x] **Task 2.2**: Create quiz management endpoints (create, list, retrieve)
  - **Check**: Can create quiz via API, list returns quizzes, retrieve shows details
  
- [x] **Task 2.3**: Implement question/choice creation endpoint
  - **Check**: Can add MCQ with choices, True/False, and text questions
  
- [x] **Task 2.4**: Create public quiz retrieval endpoint (no answers)
  - **Check**: Endpoint returns quiz data without `is_correct` flags
  
- [x] **Task 2.5**: Implement quiz submission and scoring logic
  - **Check**: Submission calculates score correctly, stores answers
  
- [x] **Task 2.6**: Set up CORS for frontend communication
  - **Check**: Frontend can make requests without CORS errors

### Phase 3: Frontend Setup (15 min)
- [x] **Task 3.1**: Initialize Next.js project with TypeScript and Tailwind
  - **Check**: `npm run dev` works, Tailwind styles apply
  
- [x] **Task 3.2**: Set up API client/axios with base configuration
  - **Check**: Can make test API call to backend
  
- [x] **Task 3.3**: Create project structure (pages, components, lib, types)
  - **Check**: Folder structure is organized and logical
  
- [x] **Task 3.4**: Set up TypeScript interfaces for Quiz, Question, etc.
  - **Check**: Types match backend serializer structure

### Phase 4: Frontend - Admin Panel (25 min)
- [x] **Task 4.1**: Create login page (`/admin/login`)
  - **Check**: Login form submits, stores token in localStorage/cookies
  
- [x] **Task 4.2**: Create admin dashboard page (`/admin/dashboard`)
  - **Check**: Shows list of created quizzes, protected route
  
- [x] **Task 4.3**: Create quiz creation page (`/admin/quiz/create`)
  - **Check**: Form accepts title, description
  
- [x] **Task 4.4**: Implement dynamic question builder component
  - **Check**: Can add/remove questions, switch question types
  
- [x] **Task 4.5**: Handle quiz + questions submission as single flow
  - **Check**: Successfully creates quiz with all questions and choices
  
- [x] **Task 4.6**: Show success message and quiz shareable link
  - **Check**: After creation, displays link to public quiz page

### Phase 5: Frontend - Public Quiz (20 min)
- [x] **Task 5.1**: Create public quiz page (`/quiz/[id]`)
  - **Check**: Page loads quiz data from API
  
- [x] **Task 5.2**: Implement question rendering for all types
  - **Check**: MCQ shows radio buttons, True/False shows options, Text shows input
  
- [x] **Task 5.3**: Create quiz form with answer collection
  - **Check**: User selections stored in state correctly
  
- [x] **Task 5.4**: Implement quiz submission
  - **Check**: Submits answers to API, handles loading and errors
  
- [x] **Task 5.5**: Create results page/component
  - **Check**: Shows score, displays which answers were correct/incorrect
  
- [x] **Task 5.6**: Add responsive design polish
  - **Check**: Works on mobile and desktop viewports

### Phase 6: Testing & Polish (10 min)
- [x] **Task 6.1**: Test complete admin flow (create quiz end-to-end)
  - **Check**: Can create quiz and see it in dashboard
  
- [x] **Task 6.2**: Test complete public flow (take quiz end-to-end)
  - **Check**: Can take quiz and see results
  
- [x] **Task 6.3**: Add error handling and loading states
  - **Check**: Network errors show user-friendly messages
  
- [x] **Task 6.4**: Add basic form validation
  - **Check**: Empty fields show validation errors
  
- [x] **Task 6.5**: Quick UI/UX improvements
  - **Check**: Interface looks clean and professional

### Phase 7: Deployment (10 min)
- [ ] **Task 7.1**: Deploy backend to Render/Railway
  - **Check**: API is accessible via public URL
  
- [ ] **Task 7.2**: Deploy frontend to Vercel
  - **Check**: Frontend loads and connects to backend
  
- [ ] **Task 7.3**: Update environment variables for production
  - **Check**: CORS settings allow frontend domain
  
- [ ] **Task 7.4**: Final end-to-end test on production
  - **Check**: Can create and take quiz on deployed version

## Trade-offs & Decisions

### Chosen Approach
1. **Monolithic submission**: Questions created together with quiz (simpler for MVP)
2. **Token authentication**: Using Django REST Framework tokens (simple, no OAuth needed)
3. **No edit functionality**: Create-only to save time
4. **Immediate scoring**: No review mode, just show results
5. **Simple validation**: Basic required field checking only

### What Was Skipped
- Quiz editing/deletion capabilities
- Advanced question types (multi-select, matching)
- Image upload for questions
- Quiz categories/tags
- User dashboard for quiz takers
- Quiz analytics and statistics

## Scope Changes During Implementation
_[This section will be updated during development if scope needs adjustment]_

## Post-Implementation Reflection
_[To be filled after completion - ~5 min reflection]_

### What I Would Do Next With More Time
_[Will include:]_
- Features to add
- Code refactoring opportunities
- Performance optimizations
- Testing strategy
- Security enhancements

## Commit Strategy
- **Commit 1** (0-30 min): Backend setup + models + migrations
- **Commit 2** (30-60 min): Backend API endpoints + serializers
- **Commit 3** (60-90 min): Frontend setup + admin panel
- **Commit 4** (90-120 min): Public quiz page + final polish + deployment

---

**Timeline**: 2 hours total
**Started**: [To be filled]
**Completed**: [To be filled]