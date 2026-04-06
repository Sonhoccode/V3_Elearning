from django.conf import settings
from django.db import models


class TestResult(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="test_result",
    )
    score = models.FloatField(default=0.0)
    level = models.CharField(max_length=50, blank=True, null=True)
    strengths = models.TextField(blank=True, null=True)
    weaknesses = models.TextField(blank=True, null=True)
    recommended_paths = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "test_results"

    def __str__(self):
        return f"{self.user_id} - {self.level}"
