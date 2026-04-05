"""
Test settings for Django - Uses mocks instead of database
"""
import os
from pathlib import Path
from .settings import *

# For tests using mocks, we don't need a real database
# If any test absolutely requires database, it should use @pytest.mark.django_db
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
        'ATOMIC_REQUESTS': False,
    }
}
