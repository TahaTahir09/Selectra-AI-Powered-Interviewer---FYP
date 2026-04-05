# Testing Guide for Selectra AI Recruitment Platform

This directory contains comprehensive unit tests for the Selectra AI Recruitment Platform backend services.

## 📁 Directory Structure

```
tests/
├── __init__.py
├── conftest.py                 # Shared pytest configuration and fixtures
├── pytest.ini                  # Pytest configuration
├── README.md                   # This file
├── backend/                    # Django backend tests
│   ├── __init__.py
│   ├── test_models.py         # Tests for Django models
│   ├── test_views.py          # Tests for Django API views
│   ├── test_email_service.py  # Tests for email notifications
│   └── test_serializers.py    # Tests for DRF serializers
└── flask_services/            # Flask AI services tests
    ├── __init__.py
    ├── test_cv_matcher.py     # Tests for CV matching algorithm
    └── test_routes.py         # Tests for Flask API routes
```

## 🚀 Quick Start

### 1. Install Test Dependencies

```bash
# Install pytest and required packages
pip install pytest pytest-django pytest-cov

# Or install from requirements
pip install -r requirements-test.txt
```

### 2. Run All Tests

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run with coverage report
pytest --cov=.
```

### 3. Run Specific Test Categories

```bash
# Run only backend tests
pytest tests/backend/

# Run only Flask tests
pytest tests/flask_services/

# Run only unit tests
pytest -m unit

# Run specific test file
pytest tests/backend/test_models.py

# Run specific test class
pytest tests/backend/test_models.py::TestJobPost

# Run specific test method
pytest tests/backend/test_models.py::TestJobPost::test_create_job_post
```

## 📊 Available Test Markers

- `@pytest.mark.unit` - Unit tests (small, isolated)
- `@pytest.mark.integration` - Integration tests
- `@pytest.mark.django_db` - Tests requiring database access
- `@pytest.mark.slow` - Slow running tests

Example:
```bash
pytest -m unit              # Run only unit tests
pytest -m "not slow"       # Run all except slow tests
```

## 🔧 Test Fixtures

Common fixtures available in `conftest.py`:

- `api_client` - DRF API client
- `authenticated_user` - Test user account
- `authenticated_candidate` - Candidate user
- `authenticated_organization` - Organization user with details
- `authenticated_client` - Authenticated API client
- `job_post` - Sample job posting
- `application` - Sample application
- `sample_cv_text` - Sample CV content
- `sample_job_description` - Sample job description

### Using Fixtures in Tests

```python
@pytest.mark.django_db
def test_example(job_post, authenticated_client):
    """Test with fixtures"""
    response = authenticated_client.get(f'/api/jobs/{job_post.id}/')
    assert response.status_code == 200
```

## 📝 Test Coverage

### Backend Tests

**Models (`test_models.py`)**
- JobPost creation and validation
- Application status tracking
- Similarity score range validation
- Interview model operations
- OrganizationDetails creation

**Views (`test_views.py`)**
- Application list/detail endpoints
- JobPost filtering
- Interview threshold logic (40% threshold)
- API authentication

**Email Service (`test_email_service.py`)**
- Interview invitation emails
- Rejection emails
- Email validation

**Serializers (`test_serializers.py`)**
- Application serialization
- JobPost serialization
- Field validation

### Flask Services Tests

**CV Matcher (`test_cv_matcher.py`)**
- Text normalization
- Skill extraction
- Semantic similarity
- Keyword similarity
- Full CV-to-JD matching
- Match scoring accuracy

**Routes (`test_routes.py`)**
- Score calculation endpoint
- Score range validation
- Error handling

## 🎯 Interview Threshold Testing

All tests verify the **40% similarity score threshold**:
- Scores ≥ 40% trigger interview invitations
- Scores < 40% trigger rejection emails
- Boundary conditions at exactly 40%

```python
# Test threshold logic
def test_interview_threshold():
    app_accepted = Application(similarity_score=45)  # >= 40
    app_rejected = Application(similarity_score=35)  # < 40
    
    assert app_accepted.similarity_score >= 40
    assert app_rejected.similarity_score < 40
```

## 📈 Score Normalization Testing

Tests verify score conversions:
- **Flask**: Returns scores 0-1
- **Django**: Stores as 0-100 (multiply by 100)
- **Frontend**: Displays as 0-80 (multiply by 5, capped at 80)

```python
# Example: Flask 0.5 score journey
Flask:     0.5       (50% match)
Django:    50        (0.5 * 100)
Frontend:  2.5       (50 * 5 / 100, capped at 80)
```

## 🐛 Running Tests with Debugging

```bash
# Run with print statements visible
pytest -s tests/backend/test_models.py

# Run with full traceback
pytest --tb=long

# Run with pdb on failure
pytest --pdb

# Run with markers
pytest -m django_db -v
```

## 📊 Coverage Report

Generate detailed coverage:

```bash
# Generate coverage report
pytest --cov=. --cov-report=html

# View coverage
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
start htmlcov/index.html  # Windows
```

## ✅ Test Best Practices

1. **Isolation**: Each test should be independent
2. **Naming**: Test names should describe what they test
3. **Fixtures**: Use fixtures for setup/teardown
4. **Mocking**: Mock external dependencies (emails, APIs)
5. **Assertions**: Use clear, specific assertions

### Example:

```python
@pytest.mark.django_db
def test_application_with_high_score(job_post, authenticated_candidate):
    """Test that high similarity score passes threshold"""
    app = Application.objects.create(
        job_post=job_post,
        candidate=authenticated_candidate,
        candidate_name='Test',
        candidate_email='test@example.com',
        similarity_score=75.0  # High score
    )
    
    # Assert: Should pass 40% threshold
    assert app.similarity_score >= 40
    
    # Assert: Should generate interview
    interview_link = generate_interview_link(app)
    assert interview_link is not None
```

## 🔄 Continuous Testing

To run tests automatically on file changes:

```bash
# Install pytest-watch
pip install pytest-watch

# Run with auto-reload
ptw tests/
```

## 🚨 Common Issues

### Django Settings Not Found
```bash
# Set DJANGO_SETTINGS_MODULE
export DJANGO_SETTINGS_MODULE=config.settings
```

### Database Locked
```bash
# Use fresh database for each test (default with sqlite3)
# Remove any old test databases
rm db.sqlite3
```

### Import Errors
```bash
# Ensure paths are correct in conftest.py
# Add verbose output
pytest -v
```

## 📚 Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [Django Testing Guide](https://docs.djangoproject.com/en/stable/topics/testing/)
- [DRF Testing](https://www.django-rest-framework.org/api-guide/testing/)

## 👥 Contributing Tests

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass: `pytest`
3. Check coverage: `pytest --cov=.`
4. Add tests to appropriate test file
5. Follow existing test patterns

## 📞 Support

For issues or questions about tests:
1. Check this README
2. Review test examples
3. Check test output with `-v` flag
4. Use `--tb=long` for detailed tracebacks
