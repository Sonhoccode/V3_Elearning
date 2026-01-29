from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UserManager(BaseUserManager):
    def create_user(self, username, email, password=None, role='student'):
        if not username:
            raise ValueError("Username là bắt buộc")
        if not email:
            raise ValueError("Email là bắt buộc")
        
        is_approved = True
        if role == 'teacher':
            is_approved = False

        user = self.model(
            username=username,
            email=self.normalize_email(email),
            role=role,
            is_approved=is_approved,
            is_active=True
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password):
        user = self.create_user(username, email, password, role='admin')
        user.is_staff = True
        user.is_superuser = True
        user.save()
        return user


class User(AbstractBaseUser, PermissionsMixin):

    ROLE_CHOICE = (
        ('admin','Admin'),
        ('teacher','Teacher'),
        ('student','Student'),
    )

    username = models.CharField(max_length=100, unique=True)
    email = models.EmailField(unique=True)

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICE,
        default='student'
    )

    is_approved = models.BooleanField(default=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    last_login = models.DateTimeField(blank=True, null=True)  # 🔥 QUAN TRỌNG
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    class Meta:
        db_table = 'user'
        ordering = ['-created_at']


    def __str__(self):
        return f"{self.username} ({self.role})"

class Verification(models.Model):
    us = models.ForeignKey(User, on_delete=models.CASCADE)
    vc_otp = models.CharField(max_length=20)
    vc_start = models.DateTimeField()
    vc_end = models.DateTimeField()
    vc_status = models.BooleanField(default=False)

    class Meta:
        db_table = "verification"

    def __str__(self):
        return f"OTP {self.vc_otp} - {self.us.username}"
    
# class Quiz(models.Model):
#     title = models.CharField(max_length=255)
#     description = models.TextField()
#     course = models.ForeignKey('Course', on_delete=models.CASCADE)
#     lesson = models.ForeignKey('Lesson', on_delete=models.CASCADE)
#     time_limit = models.IntegerField(help_text="Time limit in minutes")
#     passing_score = models.FloatField()
#     is_published = models.BooleanField(default=False)
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     class Meta:
#         db_table = "quizzes"

#     def __str__(self):
#         return self.title

# class Question(models.Model):
#     quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
#     content = models.TextField()
#     question_type = models.CharField(max_length=50, choices=(('mcq', 'Multiple Choice'), ('tf', 'True/False')))
#     order = models.IntegerField(default=0)
#     points = models.FloatField(default=1.0)

#     class Meta:
#         db_table = "questions"
#         ordering = ['order']
#     def __str__(self):
#         return f"Question {self.id} for Quiz {self.quiz.title}"
