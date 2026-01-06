import html
import re

from django.db.models import Avg, F
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from .models import Answer, Choice, Question, Quiz, QuizSubmission
from .serializers import (
    QuizCreateSerializer,
    QuizDetailSerializer,
    QuizListSerializer,
    QuizPublicSerializer,
    QuizSubmissionAnalyticsSerializer,
    QuizSubmissionResultSerializer,
    QuizSubmitSerializer,
    QuizWithQuestionsCreateSerializer,
)


# Custom throttle for quiz submissions
class QuizSubmitThrottle(AnonRateThrottle):
    """Rate limiting for quiz submissions to prevent abuse"""
    rate = '10/hour'
    
    def get_cache_key(self, request, view):
        # Use IP + quiz ID to throttle per quiz
        ident = self.get_ident(request)
        quiz_pk = view.kwargs.get('pk', '')
        return f'quiz_submit_{ident}_{quiz_pk}'


def sanitize_input(text: str) -> str:
    """Sanitize user input to prevent XSS and injection attacks"""
    if not text:
        return text
    # HTML escape
    text = html.escape(text)
    # Remove potentially dangerous patterns
    text = re.sub(r'<script.*?>.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
    # Limit length to prevent DOS
    return text[:10000]


def validate_quiz_ownership(user, quiz):
    """Ensure the user owns the quiz they're trying to access"""
    if quiz.created_by != user:
        raise PermissionDenied("You do not have permission to access this quiz.")


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

        # Sanitize inputs for security
        title = sanitize_input(data['title'])
        description = sanitize_input(data.get('description', ''))

        # Validate question count (guard rail)
        questions_data = data['questions']
        if len(questions_data) > 100:
            return Response(
                {'error': 'Maximum 100 questions allowed per quiz'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create the quiz
        quiz = Quiz.objects.create(
            title=title,
            description=description,
            created_by=request.user
        )

        # Create questions and choices
        for idx, q_data in enumerate(data['questions']):
            # Sanitize question inputs
            question_text = sanitize_input(q_data['question_text'])
            correct_text_answer = sanitize_input(q_data.get('correct_text_answer', ''))
            
            question = Question.objects.create(
                quiz=quiz,
                question_text=question_text,
                question_type=q_data['question_type'],
                order=q_data.get('order', idx),
                correct_text_answer=correct_text_answer
            )

            # Create choices if provided
            choices = q_data.get('choices', [])
            
            # Validate choices count (guard rail)
            if len(choices) > 10:
                choices = choices[:10]  # Limit to 10 choices

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
                        choice_text=sanitize_input(choice_data['choice_text']),
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
    throttle_classes = [QuizSubmitThrottle]  # Rate limiting for submissions

    def post(self, request, pk):
        quiz = get_object_or_404(Quiz, pk=pk)
        serializer = QuizSubmitSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        # Sanitize taker name
        taker_name = sanitize_input(data.get('taker_name', ''))[:100]

        # Validate answer count matches question count (guard rail)
        question_count = quiz.questions.count()
        if len(data['answers']) > question_count:
            return Response(
                {'error': 'Too many answers submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create submission
        submission = QuizSubmission.objects.create(
            quiz=quiz,
            taker_name=taker_name,
            total_questions=question_count
        )

        score = 0
        answered_questions = set()

        # Process each answer
        for answer_data in data['answers']:
            question_id = answer_data['question_id']
            
            # Prevent duplicate answers (guard rail)
            if question_id in answered_questions:
                continue
            answered_questions.add(question_id)
            
            question = get_object_or_404(
                Question, pk=question_id, quiz=quiz)

            is_correct = False
            selected_choice = None
            text_answer = sanitize_input(answer_data.get('text_answer', ''))

            if question.question_type in ['mcq', 'true_false']:
                choice_id = answer_data.get('selected_choice_id')
                if choice_id:
                    # Verify choice belongs to the question (guard rail)
                    try:
                        selected_choice = Choice.objects.get(
                            pk=choice_id, question=question)
                        is_correct = selected_choice.is_correct
                    except Choice.DoesNotExist:
                        pass  # Invalid choice, mark as incorrect
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


class QuizAnalyticsView(APIView):
    """Get analytics and submissions for a quiz (quiz owner only)"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        quiz = get_object_or_404(Quiz, pk=pk)
        
        # Security check: Ensure user owns this quiz
        validate_quiz_ownership(request.user, quiz)

        # Get all submissions for this quiz
        submissions = QuizSubmission.objects.filter(quiz=quiz).order_by('-submitted_at')

        # Calculate analytics
        total_submissions = submissions.count()
        
        if total_submissions == 0:
            return Response({
                'quiz_id': quiz.id,
                'quiz_title': quiz.title,
                'total_submissions': 0,
                'average_score': 0,
                'average_percentage': 0,
                'highest_score': 0,
                'lowest_score': 0,
                'pass_rate': 0,
                'question_analytics': [],
                'submissions': []
            })

        # Aggregate statistics
        stats = submissions.aggregate(
            avg_score=Avg('score'),
            avg_percentage=Avg(F('score') * 100.0 / F('total_questions')),
        )
        
        highest_score = submissions.order_by('-score').first()
        lowest_score = submissions.order_by('score').first()
        
        # Pass rate (>= 70%)
        passing_submissions = submissions.filter(
            score__gte=F('total_questions') * 0.7
        ).count()
        pass_rate = (passing_submissions / total_submissions) * 100 if total_submissions > 0 else 0

        # Question-level analytics
        question_analytics = []
        for question in quiz.questions.all():
            total_answers = Answer.objects.filter(
                question=question,
                submission__quiz=quiz
            ).count()
            correct_answers = Answer.objects.filter(
                question=question,
                submission__quiz=quiz,
                is_correct=True
            ).count()
            
            accuracy = (correct_answers / total_answers * 100) if total_answers > 0 else 0
            
            question_analytics.append({
                'question_id': question.id,
                'question_text': question.question_text[:100],
                'question_type': question.question_type,
                'total_answers': total_answers,
                'correct_answers': correct_answers,
                'accuracy': round(accuracy, 1)
            })

        # Serialize submissions
        serializer = QuizSubmissionAnalyticsSerializer(submissions, many=True)

        return Response({
            'quiz_id': quiz.id,
            'quiz_title': quiz.title,
            'total_submissions': total_submissions,
            'average_score': round(stats['avg_score'] or 0, 1),
            'average_percentage': round(stats['avg_percentage'] or 0, 1),
            'highest_score': highest_score.score if highest_score else 0,
            'lowest_score': lowest_score.score if lowest_score else 0,
            'pass_rate': round(pass_rate, 1),
            'question_analytics': question_analytics,
            'submissions': serializer.data
        })


class QuizSubmissionDetailView(APIView):
    """Get detailed view of a specific submission (quiz owner only)"""
    permission_classes = [IsAuthenticated]

    def get(self, request, quiz_pk, submission_pk):
        quiz = get_object_or_404(Quiz, pk=quiz_pk)
        
        # Security check: Ensure user owns this quiz
        validate_quiz_ownership(request.user, quiz)
        
        submission = get_object_or_404(
            QuizSubmission, pk=submission_pk, quiz=quiz)
        
        serializer = QuizSubmissionResultSerializer(submission)
        return Response(serializer.data)
