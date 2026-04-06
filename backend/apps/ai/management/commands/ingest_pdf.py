from django.core.management.base import BaseCommand
import os
from apps.ai.vector_store import ingest_pdf
from apps.ai.config import DATA_FOLDER_PATH


class Command(BaseCommand):
    help = "Ingest all PDF files in data folder"

    def handle(self, *args, **kwargs):
        for filename in os.listdir(DATA_FOLDER_PATH):
            if filename.endswith(".pdf"):
                full_path = os.path.join(DATA_FOLDER_PATH, filename)
                print(f"Ingesting: {full_path}")
                ingest_pdf(full_path)