from django.core.management.base import BaseCommand
from apps.ai.vector_store import ingest_documents


class Command(BaseCommand):
    help = "Ingest company documents into Supabase"

    def handle(self, *args, **kwargs):
        ingest_documents()