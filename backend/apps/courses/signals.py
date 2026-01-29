# backend/apps/courses/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Category, Course
from .cache_utils import bump_menu_version

@receiver([post_save, post_delete], sender=Category)
@receiver([post_save, post_delete], sender=Course)
def invalidate_menu_cache(sender, instance, **kwargs):
    bump_menu_version()
