from django.urls import path

from .views import (
    PublicQuizView,
    QuizDetailView,
    QuizListCreateView,
    QuizSubmitView,
    QuizWithQuestionsCreateView,
)

urlpatterns = [
    # Admin endpoints (require authentication)
    path('', QuizListCreateView.as_view(), name='quiz-list-create'),
    path('<int:pk>/', QuizDetailView.as_view(), name='quiz-detail'),
    path('create-with-questions/',
         QuizWithQuestionsCreateView.as_view(), name='quiz-create-full'),

    # Public endpoints
    path('public/<int:pk>/', PublicQuizView.as_view(), name='quiz-public'),
    path('public/<int:pk>/submit/', QuizSubmitView.as_view(), name='quiz-submit'),
]
