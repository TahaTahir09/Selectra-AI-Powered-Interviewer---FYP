"""
Test script for serializers.
Run with: python manage.py shell < test_serializers.py
"""

from users.serializers import UserRegistrationSerializer, UserSerializer
from core.serializers import (
    OrganizationDetailsCreateSerializer,
    JobPostCreateUpdateSerializer,
    ApplicationCreateSerializer,
    InterviewCreateUpdateSerializer
)
from users.models import User
from core.models import OrganizationDetails, JobPost, Application, Interview

print("=" * 60)
print("TESTING SERIALIZERS")
print("=" * 60)

# Test 1: User Registration Serializer
print("\n1. Testing UserRegistrationSerializer...")
user_data = {
    'username': 'testuser',
    'email': 'test@example.com',
    'password': 'SecurePass123!',
    'password2': 'SecurePass123!',
    'user_type': 'candidate',
    'first_name': 'Test',
    'last_name': 'User'
}

serializer = UserRegistrationSerializer(data=user_data)
if serializer.is_valid():
    print("✅ Valid data")
    print(f"   Validated data: {serializer.validated_data.keys()}")
else:
    print("❌ Validation failed:")
    print(f"   Errors: {serializer.errors}")

# Test 2: User Registration with mismatched passwords
print("\n2. Testing password mismatch validation...")
bad_user_data = user_data.copy()
bad_user_data['password2'] = 'DifferentPass123!'
serializer = UserRegistrationSerializer(data=bad_user_data)
if serializer.is_valid():
    print("❌ Should have failed validation")
else:
    print("✅ Correctly rejected mismatched passwords")
    print(f"   Error: {serializer.errors.get('password', ['No error'])}")

# Test 3: Organization Details Serializer
print("\n3. Testing OrganizationDetailsCreateSerializer...")
org_data = {
    'organization_name': 'Tech Corp',
    'address': '123 Tech Street',
    'contact_number': '+1234567890',
    'contact_person': 'John Doe',
    'website_link': 'https://techcorp.com',
    'company_description': 'A leading tech company'
}

serializer = OrganizationDetailsCreateSerializer(data=org_data)
if serializer.is_valid():
    print("✅ Valid organization data")
    print(f"   Organization: {serializer.validated_data['organization_name']}")
else:
    print("❌ Validation failed:")
    print(f"   Errors: {serializer.errors}")

# Test 4: Job Post Serializer
print("\n4. Testing JobPostCreateUpdateSerializer...")
job_data = {
    'job_title': 'Senior Python Developer',
    'job_description': 'We are looking for an experienced Python developer...',
    'required_skills': ['Python', 'Django', 'PostgreSQL', 'REST APIs'],
    'experience_required': '3-5 years',
    'location': 'Remote',
    'employment_type': 'Full-time',
    'salary_range': '$80,000 - $120,000',
    'application_link': 'https://apply.techcorp.com/python-dev',
    'pre_assessment_questions': [
        'What is your experience with Django?',
        'Have you worked with PostgreSQL?'
    ],
    'status': 'active'
}

serializer = JobPostCreateUpdateSerializer(data=job_data)
if serializer.is_valid():
    print("✅ Valid job post data")
    print(f"   Job: {serializer.validated_data['job_title']}")
    print(f"   Skills count: {len(serializer.validated_data['required_skills'])}")
else:
    print("❌ Validation failed:")
    print(f"   Errors: {serializer.errors}")

# Test 5: Application Serializer with invalid CV size (simulate)
print("\n5. Testing ApplicationCreateSerializer validation...")
# Note: We can't test file upload in shell script easily, 
# but we can verify the serializer accepts the structure
print("   (File upload validation will be tested via API)")

# Test 6: Interview Serializer with past date
print("\n6. Testing InterviewCreateUpdateSerializer date validation...")
from django.utils import timezone
from datetime import timedelta

past_date = timezone.now() - timedelta(days=1)
interview_data = {
    'scheduled_date': past_date,
    'status': 'scheduled',
    'interview_type': 'Technical',
}

# We can't test without an application ID, but we can check the structure
print("   (Date validation requires actual application - will test via API)")

# Test 7: Check if models can be serialized
print("\n7. Testing model serialization...")
print("   Checking if User model can be serialized...")
users = User.objects.all()
if users.exists():
    user = users.first()
    serializer = UserSerializer(user)
    print(f"✅ User serialized successfully")
    print(f"   Data keys: {serializer.data.keys()}")
else:
    print("   ℹ️  No users in database yet (create superuser to test)")

print("\n" + "=" * 60)
print("SERIALIZER TESTS COMPLETE")
print("=" * 60)
print("\nNext steps:")
print("1. Run 'python manage.py runserver' to start the dev server")
print("2. Visit http://localhost:8000/admin/ to verify admin panel")
print("3. Proceed to Phase 3 (API Views and Routes)")
print("=" * 60)
