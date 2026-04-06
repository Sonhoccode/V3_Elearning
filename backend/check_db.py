import os
import django
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.classes.models import Submission

subs = Submission.objects.filter(assignment_id=7)
for s in subs:
    print(f"Sub {s.id} by {s.student.username}: score={s.score}, ai_feedback={s.ai_feedback}")
