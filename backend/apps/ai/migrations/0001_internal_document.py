from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("Common", "0002_user_groups_user_is_active_user_is_staff_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="InternalDocument",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("title", models.CharField(max_length=255)),
                ("source_type", models.CharField(choices=[("text", "Text"), ("pdf", "PDF")], max_length=16)),
                ("source_key", models.CharField(max_length=255, unique=True)),
                ("original_filename", models.CharField(blank=True, max_length=255, null=True)),
                ("stored_path", models.CharField(blank=True, max_length=500, null=True)),
                ("chunk_count", models.PositiveIntegerField(default=0)),
                ("status", models.CharField(choices=[("processing", "processing"), ("ready", "ready"), ("error", "error")], default="processing", max_length=16)),
                ("error_message", models.TextField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="internal_documents",
                        to="Common.user",
                    ),
                ),
            ],
        ),
    ]
