from django.db import models

class Quiz(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='quiz_images/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Keeping these as placeholders or optional if we want to link them later
    # course = models.ForeignKey('Course', on_delete=models.CASCADE, null=True, blank=True)
    # lesson = models.ForeignKey('Lesson', on_delete=models.CASCADE, null=True, blank=True)

    class Meta:
        db_table = "quizzes"
        verbose_name = "Bài kiểm tra"
        verbose_name_plural = "Danh sách bài kiểm tra"

    def __str__(self):
        return self.title

class Question(models.Model):
    SINGLE = 'single'
    MULTIPLE = 'multiple'
    
    QUESTION_TYPES = [
        (SINGLE, 'Single Choice'),
        (MULTIPLE, 'Multiple Choice'),
    ]

    quiz = models.ForeignKey(Quiz, related_name='questions', on_delete=models.CASCADE)
    text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES, default=SINGLE)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = "questions"
        ordering = ['order']
        verbose_name = "Câu hỏi"
        verbose_name_plural = "Danh sách câu hỏi"

    def __str__(self):
        return f"{self.text[:50]}..."

class Choice(models.Model):
    question = models.ForeignKey(Question, related_name='choices', on_delete=models.CASCADE)
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

    class Meta:
        db_table = "choices"
        verbose_name = "Lựa chọn"
        verbose_name_plural = "Danh sách lựa chọn"

    def __str__(self):
        return self.text
