from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Answer, Choice, Question, Quiz, QuizSubmission
from .serializers import (
    QuizCreateSerializer,
    QuizDetailSerializer,
    QuizListSerializer,
    QuizPublicSerializer,
    QuizSubmissionResultSerializer,
    QuizSubmitSerializer,
    QuizWithQuestionsCreateSerializer,
)


class QuizListCreateView(generics.ListCreateAPIView):
    """List all quizzes or create a new quiz (admin only)"""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return QuizCreateSerializer
        return QuizListSerializer

    def get_queryset(self):
        return Quiz.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class QuizDetailView(generics.RetrieveAPIView):
    """Retrieve a quiz with all questions (admin only)"""
    permission_classes = [IsAuthenticated]
    serializer_class = QuizDetailSerializer

    def get_queryset(self):
        return Quiz.objects.filter(created_by=self.request.user)


class QuizWithQuestionsCreateView(APIView):
    """Create a quiz with all questions and choices in one request"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = QuizWithQuestionsCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        # Create the quiz
        quiz = Quiz.objects.create(
            title=data['title'],
            description=data.get('description', ''),
            created_by=request.user
        )

        # Create questions and choices
        for idx, q_data in enumerate(data['questions']):
            question = Question.objects.create(
                quiz=quiz,
                question_text=q_data['question_text'],
                question_type=q_data['question_type'],
                order=q_data.get('order', idx),
                correct_text_answer=q_data.get('correct_text_answer', '')
            )

            # Create choices if provided
            choices = q_data.get('choices', [])

            # For true/false, auto-generate choices if not provided
            if q_data['question_type'] == 'true_false' and not choices:
                Choice.objects.create(
                    question=question, choice_text='True', is_correct=True)
                Choice.objects.create(
                    question=question, choice_text='False', is_correct=False)
            else:
                for choice_data in choices:
                    Choice.objects.create(
                        question=question,
                        choice_text=choice_data['choice_text'],
                        is_correct=choice_data.get('is_correct', False)
                    )

        return Response({
            'id': quiz.id,
            'title': quiz.title,
            'message': 'Quiz created successfully',
            'share_link': f'/quiz/{quiz.id}'
        }, status=status.HTTP_201_CREATED)


class PublicQuizView(generics.RetrieveAPIView):
    """Get a quiz for public taking (no correct answers shown)"""
    permission_classes = [AllowAny]
    serializer_class = QuizPublicSerializer
    queryset = Quiz.objects.all()


class QuizSubmitView(APIView):
    """Submit answers and get scored results"""
    permission_classes = [AllowAny]

    def post(self, request, pk):
        quiz = get_object_or_404(Quiz, pk=pk)
        serializer = QuizSubmitSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        # Create submission
        submission = QuizSubmission.objects.create(
            quiz=quiz,
            taker_name=data.get('taker_name', ''),
            total_questions=quiz.questions.count()
        )

        score = 0

        # Process each answer
        for answer_data in data['answers']:
            question = get_object_or_404(
                Question, pk=answer_data['question_id'], quiz=quiz)

            is_correct = False
            selected_choice = None
            text_answer = answer_data.get('text_answer', '')

            if question.question_type in ['mcq', 'true_false']:
                choice_id = answer_data.get('selected_choice_id')
                if choice_id:
                    selected_choice = get_object_or_404(
                        Choice, pk=choice_id, question=question)
                    is_correct = selected_choice.is_correct
            else:  # text question
                # Simple case-insensitive comparison for text answers
                if question.correct_text_answer:
                    is_correct = text_answer.strip().lower(
                    ) == question.correct_text_answer.strip().lower()

            if is_correct:
                score += 1

            Answer.objects.create(
                submission=submission,
                question=question,
                selected_choice=selected_choice,
                text_answer=text_answer,
                is_correct=is_correct
            )

        # Update submission with score
        submission.score = score
        submission.save()

        # Return results
        result_serializer = QuizSubmissionResultSerializer(submission)
        return Response(result_serializer.data, status=status.HTTP_201_CREATED)
