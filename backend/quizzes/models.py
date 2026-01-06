from django.contrib.auth.models import User
from django.db import models


class Quiz(models.Model):
    """Quiz model representing a collection of questions"""
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='quizzes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Quizzes'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class Question(models.Model):
    """Question model supporting MCQ, True/False, and Text types"""
    QUESTION_TYPES = [
        ('mcq', 'Multiple Choice'),
        ('true_false', 'True/False'),
        ('text', 'Text Answer'),
    ]

    quiz = models.ForeignKey(
        Quiz, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(
        max_length=20, choices=QUESTION_TYPES, default='mcq')
    order = models.IntegerField(default=0)
    correct_text_answer = models.TextField(
        blank=True, null=True, help_text="For text questions, the expected answer")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.quiz.title} - Q{self.order}: {self.question_text[:50]}"


class Choice(models.Model):
    """Choice model for MCQ and True/False questions"""
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name='choices')
    choice_text = models.CharField(max_length=200)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.choice_text} ({'Correct' if self.is_correct else 'Incorrect'})"


class QuizSubmission(models.Model):
    """Stores a complete quiz submission with score"""
    quiz = models.ForeignKey(
        Quiz, on_delete=models.CASCADE, related_name='submissions')
    taker_name = models.CharField(max_length=100, blank=True, null=True)
    score = models.IntegerField(default=0)
    total_questions = models.IntegerField(default=0)
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.taker_name or 'Anonymous'} - {self.quiz.title}: {self.score}/{self.total_questions}"

    @property
    def percentage(self):
        if self.total_questions == 0:
            return 0
        return round((self.score / self.total_questions) * 100, 1)


class Answer(models.Model):
    """Individual answer for each question in a submission"""
    submission = models.ForeignKey(
        QuizSubmission, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_choice = models.ForeignKey(
        Choice, on_delete=models.SET_NULL, null=True, blank=True)
    text_answer = models.TextField(blank=True, null=True)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return f"Answer to {self.question.question_text[:30]}"
