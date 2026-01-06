from django.contrib import admin

from .models import Answer, Choice, Question, Quiz, QuizSubmission


class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 4


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1
    show_change_link = True


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ['title', 'created_by', 'created_at', 'question_count']
    list_filter = ['created_at', 'created_by']
    search_fields = ['title', 'description']
    inlines = [QuestionInline]

    def question_count(self, obj):
        return obj.questions.count()
    question_count.short_description = 'Questions'


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['question_text', 'quiz', 'question_type', 'order']
    list_filter = ['question_type', 'quiz']
    search_fields = ['question_text']
    inlines = [ChoiceInline]


@admin.register(Choice)
class ChoiceAdmin(admin.ModelAdmin):
    list_display = ['choice_text', 'question', 'is_correct']
    list_filter = ['is_correct']


@admin.register(QuizSubmission)
class QuizSubmissionAdmin(admin.ModelAdmin):
    list_display = ['taker_name', 'quiz', 'score',
                    'total_questions', 'percentage', 'submitted_at']
    list_filter = ['quiz', 'submitted_at']


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ['submission', 'question', 'is_correct']
    list_filter = ['is_correct']
