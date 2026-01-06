from rest_framework import serializers

from .models import Answer, Choice, Question, Quiz, QuizSubmission


class ChoiceSerializer(serializers.ModelSerializer):
    """Serializer for choices - used in admin views"""
    class Meta:
        model = Choice
        fields = ['id', 'choice_text', 'is_correct']


class ChoicePublicSerializer(serializers.ModelSerializer):
    """Serializer for choices - public view without is_correct"""
    class Meta:
        model = Choice
        fields = ['id', 'choice_text']


class QuestionSerializer(serializers.ModelSerializer):
    """Serializer for questions with choices - admin view"""
    choices = ChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'question_text', 'question_type',
                  'order', 'correct_text_answer', 'choices']


class QuestionPublicSerializer(serializers.ModelSerializer):
    """Serializer for questions - public view without correct answers"""
    choices = ChoicePublicSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'question_text', 'question_type', 'order', 'choices']


class QuizListSerializer(serializers.ModelSerializer):
    """Serializer for quiz list view"""
    question_count = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(
        source='created_by.username', read_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'title', 'description',
                  'created_by_username', 'question_count', 'created_at']

    def get_question_count(self, obj):
        return obj.questions.count()


class QuizDetailSerializer(serializers.ModelSerializer):
    """Serializer for quiz detail view - admin"""
    questions = QuestionSerializer(many=True, read_only=True)
    created_by_username = serializers.CharField(
        source='created_by.username', read_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'title', 'description', 'created_by_username',
                  'questions', 'created_at', 'updated_at']


class QuizPublicSerializer(serializers.ModelSerializer):
    """Serializer for public quiz view - no correct answers"""
    questions = QuestionPublicSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'title', 'description', 'questions']


class QuizCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a quiz"""
    class Meta:
        model = Quiz
        fields = ['title', 'description']


# Nested serializers for creating quiz with questions
class ChoiceCreateSerializer(serializers.Serializer):
    """Serializer for creating a choice"""
    choice_text = serializers.CharField(max_length=200)
    is_correct = serializers.BooleanField(default=False)


class QuestionCreateSerializer(serializers.Serializer):
    """Serializer for creating a question with choices"""
    question_text = serializers.CharField()
    question_type = serializers.ChoiceField(
        choices=['mcq', 'true_false', 'text'])
    order = serializers.IntegerField(default=0)
    correct_text_answer = serializers.CharField(
        required=False, allow_blank=True)
    choices = ChoiceCreateSerializer(many=True, required=False)


class QuizWithQuestionsCreateSerializer(serializers.Serializer):
    """Serializer for creating a quiz with questions and choices in one request"""
    title = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True)
    questions = QuestionCreateSerializer(many=True)


# Answer submission serializers
class AnswerSubmitSerializer(serializers.Serializer):
    """Serializer for submitting an answer"""
    question_id = serializers.IntegerField()
    selected_choice_id = serializers.IntegerField(
        required=False, allow_null=True)
    text_answer = serializers.CharField(required=False, allow_blank=True)


class QuizSubmitSerializer(serializers.Serializer):
    """Serializer for submitting a complete quiz"""
    taker_name = serializers.CharField(
        required=False, allow_blank=True, max_length=100)
    answers = AnswerSubmitSerializer(many=True)


class AnswerResultSerializer(serializers.ModelSerializer):
    """Serializer for answer results"""
    question_text = serializers.CharField(
        source='question.question_text', read_only=True)
    question_type = serializers.CharField(
        source='question.question_type', read_only=True)
    selected_choice_text = serializers.CharField(
        source='selected_choice.choice_text', read_only=True, allow_null=True)
    correct_choice = serializers.SerializerMethodField()
    correct_text = serializers.CharField(
        source='question.correct_text_answer', read_only=True)

    class Meta:
        model = Answer
        fields = ['question_text', 'question_type', 'selected_choice_text',
                  'text_answer', 'is_correct', 'correct_choice', 'correct_text']

    def get_correct_choice(self, obj):
        if obj.question.question_type in ['mcq', 'true_false']:
            correct = obj.question.choices.filter(is_correct=True).first()
            return correct.choice_text if correct else None
        return None


class QuizSubmissionResultSerializer(serializers.ModelSerializer):
    """Serializer for quiz submission results"""
    answers = AnswerResultSerializer(many=True, read_only=True)
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    percentage = serializers.FloatField(read_only=True)

    class Meta:
        model = QuizSubmission
        fields = ['id', 'quiz_title', 'taker_name', 'score',
                  'total_questions', 'percentage', 'submitted_at', 'answers']
