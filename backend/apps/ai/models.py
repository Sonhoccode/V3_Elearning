import uuid
from django.conf import settings
from django.db import models


class InternalDocument(models.Model):
    TYPE_CHOICES = [
        ("text", "Text"),
        ("pdf", "PDF"),
        ("docx", "DOCX"),
    ]

    STATUS_CHOICES = [
        ("processing", "processing"),
        ("ready", "ready"),
        ("error", "error"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    source_type = models.CharField(max_length=16, choices=TYPE_CHOICES)
    source_key = models.CharField(max_length=255, unique=True)
    original_filename = models.CharField(max_length=255, null=True, blank=True)
    stored_path = models.CharField(max_length=500, null=True, blank=True)
    chunk_count = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="processing")
    error_message = models.TextField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="internal_documents",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.title} ({self.source_type})"
