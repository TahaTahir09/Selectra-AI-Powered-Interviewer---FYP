"""Common test fixtures and configuration for all tests - Using Mocks Instead of Database"""

import os
import sys
import django
import pytest
from pathlib import Path
from unittest.mock import Mock, MagicMock, patch
from datetime import datetime, timedelta

# Get the project root and backend paths
CURRENT_FILE = Path(__file__).resolve()
TESTS_DIR = CURRENT_FILE.parent
PROJECT_ROOT = TESTS_DIR.parent
BACKEND_PATH = PROJECT_ROOT / 'backend'
FLASK_PATH = PROJECT_ROOT / 'AI_Services_Flask_App'

# Add backend to Python path first (most important)
if str(BACKEND_PATH) not in sys.path:
    sys.path.insert(0, str(BACKEND_PATH))

if str(FLASK_PATH) not in sys.path:
    sys.path.insert(0, str(FLASK_PATH))

# Change working directory to backend if not already there
original_cwd = os.getcwd()
if 'backend' not in original_cwd:
    os.chdir(str(BACKEND_PATH))

# Set Django settings module to use test-specific settings
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings_test'

# Setup Django
try:
    django.setup()
except RuntimeError as e:
    # Django already setup or other runtime error
    if "Apps aren't loaded" not in str(e):
        pass

# Import after Django setup
from rest_framework.test import APIClient


# ============================================================================
# MOCK MODELS - No Database Required
# ============================================================================

class MockManager:
    """Mock Django manager for relationships"""
    def __init__(self, items=None):
        self.items = items or []
    
    def count(self):
        """Return count of items"""
        return len(self.items)
    
    def all(self):
        """Return all items"""
        return self.items
    
    def filter(self, **kwargs):
        """Mock filter - just returns items"""
        return self.items


class MockUser:
    """Mock User model"""
    def __init__(self, id=1, username='testuser', email='test@example.com', first_name='Test', 
                 last_name='User', user_type='candidate', is_active=True):
        self.id = id
        self.username = username
        self.email = email
        self.first_name = first_name
        self.last_name = last_name
        self.user_type = user_type
        self.is_active = is_active
        self.is_authenticated = True

    def __str__(self):
        return self.username
    
    def save(self):
        """Mock save method"""
        pass
    
    def refresh_from_db(self):
        """Mock refresh from db method"""
        pass


class MockJobPost:
    """Mock JobPost model"""
    def __init__(self, id=1, organization=None, job_title='Senior Python Developer', 
                 job_description='Description', location='San Francisco, CA', 
                 required_skills=None, salary_range='$100,000 - $150,000', status='active'):
        self.id = id
        self.organization = organization or MockUser(username='orguser', user_type='organization')
        self.job_title = job_title
        self.job_description = job_description
        self.location = location
        self.required_skills = required_skills or ['Python', 'Django', 'REST API', 'FastAPI']
        self.salary_range = salary_range
        self.status = status
        self.employment_type = 'Full-time'
        self.experience_required = '3+ years'
        self.applications = MockManager([])  # Mock related manager

    def __str__(self):
        return f"{self.job_title} - {self.organization}"
    
    def save(self):
        """Mock save method"""
        pass
    
    def refresh_from_db(self):
        """Mock refresh from db method"""
        pass


class MockApplication:
    """Mock Application model"""
    def __init__(self, id=1, job_post=None, candidate=None, candidate_name='John Candidate',
                 candidate_email='candidate@example.com', status='pending', similarity_score=75.5):
        self.id = id
        self.job_post = job_post or MockJobPost()
        self.candidate = candidate or MockUser(username='candidate')
        self.candidate_name = candidate_name
        self.candidate_email = candidate_email
        self.candidate_phone = '+1234567890'
        self.candidate_location = 'New York, NY'
        self.status = status
        self.similarity_score = similarity_score
        self.interview_link = None
        self.years_of_experience = '3 years'

    def __str__(self):
        return f"{self.candidate_name} - {self.job_post.job_title}"
    
    def save(self):
        """Mock save method"""
        pass
    
    def refresh_from_db(self):
        """Mock refresh from db method"""
        pass


class MockInterview:
    """Mock Interview model"""
    def __init__(self, id=1, application=None, status='scheduled', scheduled_date=None):
        self.id = id
        self.application = application or MockApplication()
        self.status = status
        self.scheduled_date = scheduled_date or (datetime.now() + timedelta(days=5))
        self.interview_type = 'AI Interview'
        self.notes = 'Test interview'

    def __str__(self):
        return f"Interview for {self.application.candidate_name} - {self.status}"
    
    def save(self):
        """Mock save method"""
        pass
    
    def refresh_from_db(self):
        """Mock refresh from db method"""
        pass


class MockOrganizationDetails:
    """Mock OrganizationDetails model"""
    def __init__(self, id=1, user=None, organization_name='Test Organization',
                 address='123 Business Street', contact_number='+1-555-0123'):
        self.id = id
        self.user = user or MockUser(username='org', user_type='organization')
        self.organization_name = organization_name
        self.address = address
        self.contact_number = contact_number
        self.contact_person = 'John Business'
        self.website_link = 'https://example.com'
        self.company_description = 'A test company'

    def __str__(self):
        return self.organization_name
    
    def save(self):
        """Mock save method"""
        pass
    
    def refresh_from_db(self):
        """Mock refresh from db method"""
        pass


# ============================================================================
# PYTEST AUTO-MARKERS - DISABLE DATABASE ACCESS BY DEFAULT
# ============================================================================

def pytest_collection_modifyitems(config, items):
    """
    Auto-mark all tests as unit tests.
    Explicitly mark tests to NOT use database unless @pytest.mark.django_db is set.
    """
    for item in items:
        # Check if already marked
        has_django_db = item.get_closest_marker('django_db') is not None
        has_unit = item.get_closest_marker('unit') is not None
        
        # Add unit marker if not already there
        if not has_unit and not has_django_db:
            item.add_marker(pytest.mark.unit)


# Disable pytest-django's database access by default
def pytest_configure(config):
    """Configure pytest to disable database access for unit tests"""
    config.option.nomigrations = True  # Skip Django migrations




# ============================================================================
# FIXTURES USING MOCKS
# ============================================================================

@pytest.fixture
def api_client():
    """Fixture for DRF API Client"""
    return APIClient()


@pytest.fixture
def authenticated_user():
    """Mock authenticated test user"""
    return MockUser(
        id=1,
        username='testuser',
        email='testuser@example.com',
        first_name='Test',
        last_name='User',
        user_type='candidate'
    )


@pytest.fixture
def authenticated_candidate():
    """Mock candidate user"""
    return MockUser(
        id=2,
        username='candidate',
        email='candidate@example.com',
        first_name='John',
        last_name='Candidate',
        user_type='candidate'
    )


@pytest.fixture
def authenticated_organization():
    """Mock organization user"""
    return MockUser(
        id=3,
        username='orguser',
        email='org@example.com',
        first_name='Org',
        last_name='User',
        user_type='organization'
    )


@pytest.fixture
def organization_details(authenticated_organization):
    """Mock organization details"""
    return MockOrganizationDetails(
        id=1,
        user=authenticated_organization,
        organization_name='Test Organization',
        address='123 Business Street, Tech City',
        contact_number='+1-555-0123'
    )


@pytest.fixture
def authenticated_client(api_client, authenticated_user):
    """Mock authenticated API client"""
    api_client.force_authenticate(user=authenticated_user)
    return api_client


@pytest.fixture
def job_post(authenticated_organization):
    """Mock job post"""
    return MockJobPost(
        id=1,
        organization=authenticated_organization,
        job_title='Senior Python Developer',
        job_description='Looking for an experienced Python developer',
        location='San Francisco, CA',
        required_skills=['Python', 'Django', 'REST API', 'PostgreSQL'],
        salary_range='$100,000 - $150,000',
        status='active'
    )


@pytest.fixture
def application(authenticated_candidate, job_post):
    """Mock application"""
    return MockApplication(
        id=1,
        job_post=job_post,
        candidate=authenticated_candidate,
        candidate_name='John Candidate',
        candidate_email='candidate@example.com',
        status='pending',
        similarity_score=75.5
    )


@pytest.fixture
def interview(application):
    """Mock interview"""
    return MockInterview(
        id=1,
        application=application,
        status='scheduled',
        scheduled_date=datetime.now() + timedelta(days=5)
    )


@pytest.fixture
def sample_cv_text():
    """Sample CV text for testing"""
    return """
    John Candidate
    john@example.com | +1234567890
    
    SKILLS
    Python, Django, REST API, PostgreSQL, Docker
    
    EXPERIENCE
    Senior Python Developer | Tech Company | 2022-Present
    Python Developer | Previous Corp | 2020-2022
    """


@pytest.fixture
def sample_job_description():
    """Sample job description for testing"""
    return """
    Senior Python Developer
    
    REQUIREMENTS
    - 3+ years of Python development experience
    - Strong Django and REST API knowledge
    - PostgreSQL expertise
    """

