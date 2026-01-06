from django.urls import path

from .views import (
    PublicQuizView,
    QuizAnalyticsView,
    QuizDetailView,
    QuizListCreateView,
    QuizSubmissionDetailView,
    QuizSubmitView,
    QuizWithQuestionsCreateView,
)

urlpatterns = [
    # Admin endpoints (require authentication)
    path('', QuizListCreateView.as_view(), name='quiz-list-create'),
    path('<int:pk>/', QuizDetailView.as_view(), name='quiz-detail'),
    path('create-with-questions/',
         QuizWithQuestionsCreateView.as_view(), name='quiz-create-full'),
    
    # Analytics endpoints (require authentication + ownership)
    path('<int:pk>/analytics/', QuizAnalyticsView.as_view(), name='quiz-analytics'),
    path('<int:quiz_pk>/submissions/<int:submission_pk>/',
         QuizSubmissionDetailView.as_view(), name='submission-detail'),

    # Public endpoints
    path('public/<int:pk>/', PublicQuizView.as_view(), name='quiz-public'),
    path('public/<int:pk>/submit/', QuizSubmitView.as_view(), name='quiz-submit'),
]
