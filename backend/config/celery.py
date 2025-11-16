import os
from celery import Celery
from dotenv import load_dotenv
load_dotenv()

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
app = Celery('config', broker=os.getenv("CELERY_BROKER_URL"), backend=os.getenv("CELERY_RESULT_BACKEND"))
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
