from django.contrib import admin
from .models import Class, ClassEnrollment, Assignment, Submission


admin.site.register(Class)
admin.site.register(ClassEnrollment)
admin.site.register(Assignment)
admin.site.register(Submission)
