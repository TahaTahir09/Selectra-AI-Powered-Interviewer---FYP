import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your_default_secret_key'
    CHROMADB_URI = os.environ.get('CHROMADB_URI') or 'http://localhost:8000'
    DEBUG = os.environ.get('DEBUG', 'True') == 'True'