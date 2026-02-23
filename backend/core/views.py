from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os
import tempfile
import requests
import json
import uuid
from .models import OrganizationDetails, JobPost, Application, Interview
from .cv_parser import cv_parser
from .serializers import (
    OrganizationDetailsSerializer,
    OrganizationDetailsCreateSerializer,
    JobPostSerializer,
    JobPostListSerializer,
    JobPostCreateUpdateSerializer,
    ApplicationSerializer,
    ApplicationListSerializer,
    ApplicationCreateSerializer,
    ApplicationUpdateSerializer,
    InterviewSerializer,
    InterviewCreateUpdateSerializer
)

User = get_user_model()


def calculate_similarity_score(cv_text, job_description, job_id=None):
    """
    Calculate similarity score between CV and job description using Flask AI service.
    Returns a float between 0 and 100, or None if service is unavailable.
    """
    try:
        flask_url = os.getenv('FLASK_AI_SERVICE_URL', 'http://localhost:5000')
        print(f"Attempting to connect to Flask service at: {flask_url}")
        
        # Create/ensure job description in Flask service with proper job_id
        print(f"Creating/ensuring job in Flask service...")
        job_payload = {'description': job_description}
        if job_id:
            job_payload['job_id'] = str(job_id)
            
        job_response = requests.post(
            f'{flask_url}/job',
            json=job_payload,
            timeout=10
        )
        
        print(f"Job creation response status: {job_response.status_code}")
        # Accept both 201 (created) and 409 (already exists) as success
        if job_response.status_code not in [201, 409]:
            print(f"Failed to create job in Flask service: {job_response.status_code}, Response: {job_response.text}")
            return None
        
        # Use the provided job_id or get from response
        flask_job_id = str(job_id) if job_id else job_response.json().get('job_id')
        print(f"Using job ID: {flask_job_id}")
        
        # Compare CV with job description
        print(f"Comparing CV with job description...")
        compare_response = requests.post(
            f'{flask_url}/compare/{flask_job_id}',
            json={'cv': cv_text},
            timeout=10
        )
        
        print(f"Comparison response status: {compare_response.status_code}")
        if compare_response.status_code == 200:
            score = compare_response.json().get('score')
            # Convert to percentage (0-100)
            final_score = round(score * 100, 2) if score is not None else None
            print(f"Similarity score calculated: {final_score}%")
            return final_score
        else:
            print(f"Failed to compare CV: {compare_response.status_code}, Response: {compare_response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"Error connecting to Flask AI service: {e}")
        print(f"Make sure Flask service is running at {flask_url}")
        return None
    except Exception as e:
        print(f"Error calculating similarity score: {e}")
        import traceback
        traceback.print_exc()
        return None


def generate_interview_link(application):
    """
    Generate a unique interview link for an application if similarity score >= 50%.
    Returns the interview link or None if score is below threshold.
    """
    if application.similarity_score is None:
        return None
    
    if application.similarity_score >= 50:
        # Generate a unique interview token
        interview_token = str(uuid.uuid4())
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:8080')
        interview_link = f"{frontend_url}/interview/{interview_token}"
        return interview_link
    
    return None


class OrganizationDetailsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing organization details.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Only return organization details for organizations."""
        if self.request.user.user_type == 'organization':
            return OrganizationDetails.objects.filter(user=self.request.user)
        return OrganizationDetails.objects.all()
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return OrganizationDetailsCreateSerializer
        return OrganizationDetailsSerializer
    
    def perform_create(self, serializer):
        """Create organization details for current user."""
        serializer.save(user=self.request.user)


class JobPostViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing job posts.
    """
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['job_title', 'job_description', 'required_skills', 'location']
    ordering_fields = ['created_at', 'job_title']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Organizations see their own jobs.
        Candidates see all active jobs.
        """
        if self.request.user.user_type == 'organization':
            return JobPost.objects.filter(organization=self.request.user)
        return JobPost.objects.filter(status='active')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return JobPostListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return JobPostCreateUpdateSerializer
        return JobPostSerializer
    
    def get_permissions(self):
        """
        Allow unauthenticated users to retrieve individual jobs.
        Require authentication for listing jobs (so organizations see only their jobs).
        """
        if self.action == 'retrieve':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    def perform_create(self, serializer):
        """Create job post for current organization."""
        if self.request.user.user_type != 'organization':
            raise permissions.PermissionDenied("Only organizations can create job posts.")
        
        # Save the job first to get the ID
        job = serializer.save(organization=self.request.user)
        
        # Generate application link if not provided
        if not job.application_link:
            # You can customize this URL based on your frontend URL
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:8080')
            job.application_link = f"{frontend_url}/candidate/apply/{job.id}"
            job.save()
        
        # Save job description to ChromaDB via Flask service
        try:
            flask_url = os.getenv('FLASK_AI_SERVICE_URL', 'http://localhost:5000')
            print(f"\n=== Saving job {job.id} to ChromaDB ===")
            print(f"Flask service URL: {flask_url}")
            
            response = requests.post(
                f"{flask_url}/job",
                json={
                    'description': job.job_description,
                    'job_id': str(job.id)  # Send Django job ID
                },
                timeout=10
            )
            
            if response.status_code == 201:
                result = response.json()
                print(f"✓ Job {job.id} saved to ChromaDB with ID: {result.get('job_id')}")
            else:
                print(f"⚠ Failed to save job to ChromaDB: {response.status_code}")
                print(f"Response: {response.text}")
        except Exception as e:
            print(f"⚠ Error saving job to ChromaDB: {e}")
            # Don't fail job creation if ChromaDB save fails
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def description(self, request, pk=None):
        """Get job description for a specific job post."""
        job_post = self.get_object()
        return Response({
            'id': job_post.id,
            'job_title': job_post.job_title,
            'job_description': job_post.job_description,
            'required_skills': job_post.required_skills,
            'experience_required': job_post.experience_required,
            'qualification': job_post.qualification,
            'responsibilities': job_post.responsibilities,
            'employment_type': job_post.employment_type,
            'location': job_post.location,
        })
    
    @action(detail=True, methods=['get'])
    def applications(self, request, pk=None):
        """Get all applications for a specific job post."""
        job_post = self.get_object()
        
        # Only organization that created the job can see applications
        if request.user != job_post.organization:
            raise permissions.PermissionDenied("You don't have permission to view these applications.")
        
        applications = job_post.applications.all()
        serializer = ApplicationListSerializer(applications, many=True)
        return Response(serializer.data)


class ApplicationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing applications.
    """
    
    def get_permissions(self):
        """Only authenticated candidates can create applications."""
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        """
        Candidates see their own applications.
        Organizations see applications for their job posts.
        """
        user = self.request.user
        if user.user_type == 'candidate':
            return Application.objects.filter(candidate=user)
        elif user.user_type == 'organization':
            return Application.objects.filter(job_post__organization=user)
        return Application.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ApplicationListSerializer
        elif self.action == 'create':
            return ApplicationCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ApplicationUpdateSerializer
        return ApplicationSerializer
    
    def perform_create(self, serializer):
        """Create application for current candidate."""
        if self.request.user.user_type != 'candidate':
            raise permissions.PermissionDenied("Only candidates can submit applications.")
        
        # Save the application first
        application = serializer.save(
            candidate=self.request.user,
            candidate_name=self.request.user.get_full_name() or self.request.user.username,
            candidate_email=self.request.user.email
        )
        
        # Parse CV if uploaded
        if application.cv_url and not application.parsed_resume:
            print(f"\n=== Parsing CV for application {application.id} ===")
            try:
                cv_file_path = application.cv_url.path
                print(f"CV file path: {cv_file_path}")
                
                # Parse the CV using enhanced parser
                parsed_data = cv_parser.parse_cv_enhanced(cv_file_path, use_llm=True)
                
                if parsed_data and not parsed_data.get('error'):
                    application.parsed_resume = parsed_data
                    
                    # Update candidate fields from parsed data
                    if parsed_data.get('full_name') and application.candidate_name == 'Unknown':
                        application.candidate_name = parsed_data['full_name']
                    if parsed_data.get('email') and not application.candidate_email:
                        application.candidate_email = parsed_data['email']
                    if parsed_data.get('phone'):
                        application.candidate_phone = parsed_data['phone']
                    if parsed_data.get('location'):
                        application.candidate_location = parsed_data['location']
                    if parsed_data.get('skills'):
                        application.candidate_skills = parsed_data['skills']
                    if parsed_data.get('education'):
                        application.candidate_education = parsed_data['education']
                    if parsed_data.get('experience'):
                        application.candidate_experience = parsed_data['experience']
                    if parsed_data.get('total_experience'):
                        application.years_of_experience = parsed_data['total_experience']
                    if parsed_data.get('linkedin'):
                        application.candidate_linkedin = parsed_data['linkedin']
                    if parsed_data.get('github'):
                        application.candidate_github = parsed_data['github']
                    
                    application.save()
                    print(f"✓ CV parsed successfully. Method: {parsed_data.get('parsing_method', 'unknown')}")
                else:
                    print(f"✗ CV parsing failed: {parsed_data.get('error', 'Unknown error')}")
            except Exception as e:
                print(f"✗ Error parsing CV for application {application.id}: {e}")
                import traceback
                traceback.print_exc()
        
        # Calculate similarity score if parsed_resume and job description exist
        if application.parsed_resume and application.job_post:
            print(f"\n=== Starting similarity calculation for application {application.id} ===")
            try:
                # Extract CV text from parsed resume
                parsed_data = application.parsed_resume
                cv_text_parts = []
                
                # Build a text representation of the CV
                if parsed_data.get('summary'):
                    cv_text_parts.append(parsed_data['summary'])
                
                if parsed_data.get('skills'):
                    skills = parsed_data['skills']
                    if isinstance(skills, list):
                        cv_text_parts.append(' '.join(skills))
                    elif isinstance(skills, str):
                        cv_text_parts.append(skills)
                
                if parsed_data.get('experience'):
                    exp = parsed_data['experience']
                    if isinstance(exp, list):
                        for e in exp:
                            if isinstance(e, dict):
                                cv_text_parts.append(f"{e.get('title', '')} at {e.get('company', '')}. {e.get('description', '')}")
                            else:
                                cv_text_parts.append(str(e))
                    elif isinstance(exp, str):
                        cv_text_parts.append(exp)
                
                if parsed_data.get('education'):
                    edu = parsed_data['education']
                    if isinstance(edu, list):
                        for e in edu:
                            if isinstance(e, dict):
                                cv_text_parts.append(f"{e.get('degree', '')} from {e.get('institution', '')}")
                            else:
                                cv_text_parts.append(str(e))
                    elif isinstance(edu, str):
                        cv_text_parts.append(edu)
                
                cv_text = ' '.join(cv_text_parts)
                job_description = application.job_post.job_description
                job_id = application.job_post.id
                
                print(f"CV text length: {len(cv_text)} characters")
                print(f"Job description length: {len(job_description)} characters")
                
                # Calculate similarity score
                if cv_text and job_description:
                    print("Calling calculate_similarity_score...")
                    similarity = calculate_similarity_score(cv_text, job_description, job_id=job_id)
                    if similarity is not None:
                        application.similarity_score = similarity
                        # Generate interview link if score >= 50%
                        interview_link = generate_interview_link(application)
                        if interview_link:
                            application.interview_link = interview_link
                            print(f"✓ Interview link generated: {interview_link}")
                        application.save()
                        print(f"✓ Similarity score saved: {similarity}%")
                    else:
                        print("✗ Similarity calculation returned None")
                else:
                    print("✗ CV text or job description is empty")
            except Exception as e:
                print(f"✗ Error calculating similarity for application {application.id}: {e}")
                import traceback
                traceback.print_exc()
                # Don't fail the application creation if similarity calculation fails
        else:
            print(f"⚠ Skipping similarity calculation: parsed_resume={bool(application.parsed_resume)}, job_post={bool(application.job_post)}")
        
        # Save application CV to ChromaDB via Flask service
        try:
            flask_url = os.getenv('FLASK_AI_SERVICE_URL', 'http://localhost:5000')
            print(f"\n=== Saving application {application.id} to ChromaDB ===")
            
            # First, ensure the job exists on Flask
            if application.job_post:
                print(f"Ensuring job {application.job_post.id} exists on Flask...")
                try:
                    job_response = requests.post(
                        f"{flask_url}/job",
                        json={
                            'description': application.job_post.job_description,
                            'job_id': str(application.job_post.id)
                        },
                        timeout=10
                    )
                    if job_response.status_code in [201, 409]:
                        print(f"✓ Job {application.job_post.id} available on Flask")
                    else:
                        print(f"⚠ Unexpected response for job: {job_response.status_code}")
                except Exception as job_err:
                    print(f"⚠ Error ensuring job on Flask: {job_err}")
            
            # Extract CV text from parsed resume or CV file
            cv_text = None
            
            if application.parsed_resume:
                # Build CV text from parsed data
                parsed_data = application.parsed_resume
                cv_text_parts = []
                
                if parsed_data.get('summary'):
                    cv_text_parts.append(parsed_data['summary'])
                
                if parsed_data.get('skills'):
                    skills = parsed_data['skills']
                    if isinstance(skills, list):
                        cv_text_parts.append(' '.join(skills))
                    elif isinstance(skills, str):
                        cv_text_parts.append(skills)
                
                if parsed_data.get('experience'):
                    exp = parsed_data['experience']
                    if isinstance(exp, list):
                        for e in exp:
                            if isinstance(e, dict):
                                cv_text_parts.append(f"{e.get('title', '')} at {e.get('company', '')}. {e.get('description', '')}")
                            else:
                                cv_text_parts.append(str(e))
                    elif isinstance(exp, str):
                        cv_text_parts.append(exp)
                
                if parsed_data.get('education'):
                    edu = parsed_data['education']
                    if isinstance(edu, list):
                        for e in edu:
                            if isinstance(e, dict):
                                cv_text_parts.append(f"{e.get('degree', '')} from {e.get('institution', '')}")
                            else:
                                cv_text_parts.append(str(e))
                    elif isinstance(edu, str):
                        cv_text_parts.append(edu)
                
                cv_text = ' '.join(cv_text_parts)
            
            if cv_text:
                print(f"CV text length: {len(cv_text)} characters")
                
                response = requests.post(
                    f"{flask_url}/application",
                    json={
                        'application_id': str(application.id),
                        'cv_text': cv_text,
                        'job_id': str(application.job_post.id) if application.job_post else None,
                        'candidate_name': application.candidate_name,
                        'candidate_email': application.candidate_email
                    },
                    timeout=10
                )
                
                if response.status_code == 201:
                    result = response.json()
                    print(f"✓ Application {application.id} saved to ChromaDB")
                    
                    # Update similarity score from Flask response if not already set
                    flask_similarity = result.get('similarity_score')
                    if flask_similarity is not None and application.similarity_score is None:
                        # Convert to percentage (0-100)
                        application.similarity_score = round(flask_similarity * 100, 2)
                        # Generate interview link if score >= 50%
                        interview_link = generate_interview_link(application)
                        if interview_link:
                            application.interview_link = interview_link
                            print(f"✓ Interview link generated: {interview_link}")
                        application.save()
                        print(f"✓ Similarity score from Flask: {application.similarity_score}%")
                else:
                    print(f"⚠ Failed to save application to ChromaDB: {response.status_code}")
                    print(f"Response: {response.text}")
            else:
                print("⚠ No CV text available to save to ChromaDB")
        except Exception as e:
            print(f"⚠ Error saving application to ChromaDB: {e}")
            # Don't fail the application creation if ChromaDB save fails
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update application status (organization only)."""
        application = self.get_object()
        
        # Only the organization that posted the job can update status
        if request.user != application.job_post.organization:
            raise permissions.PermissionDenied("You don't have permission to update this application.")
        
        new_status = request.data.get('status')
        if new_status not in dict(Application.STATUS_CHOICES).keys():
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        application.status = new_status
        application.save()
        
        serializer = self.get_serializer(application)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def recalculate_similarity(self, request, pk=None):
        """
        Recalculate similarity score for an application (organization only).
        Use this if job description was updated or initial calculation failed.
        The score is stored in the database to avoid redundant computations.
        """
        application = self.get_object()
        
        # Only the organization that posted the job can recalculate
        if request.user != application.job_post.organization:
            raise permissions.PermissionDenied("You don't have permission to recalculate similarity for this application.")
        
        # If parsed_resume is missing but CV file exists, parse it first
        if not application.parsed_resume and application.cv_url:
            print(f"\n=== Parsing CV for application {application.id} (recalculate) ===")
            try:
                cv_file_path = application.cv_url.path
                print(f"CV file path: {cv_file_path}")
                
                parsed_data = cv_parser.parse_cv_enhanced(cv_file_path, use_llm=True)
                
                if parsed_data and not parsed_data.get('error'):
                    application.parsed_resume = parsed_data
                    
                    # Update candidate fields from parsed data
                    if parsed_data.get('full_name') and (not application.candidate_name or application.candidate_name == 'Unknown'):
                        application.candidate_name = parsed_data['full_name']
                    if parsed_data.get('phone'):
                        application.candidate_phone = parsed_data['phone']
                    if parsed_data.get('location'):
                        application.candidate_location = parsed_data['location']
                    if parsed_data.get('skills'):
                        application.candidate_skills = parsed_data['skills']
                    if parsed_data.get('education'):
                        application.candidate_education = parsed_data['education']
                    if parsed_data.get('experience'):
                        application.candidate_experience = parsed_data['experience']
                    if parsed_data.get('total_experience'):
                        application.years_of_experience = parsed_data['total_experience']
                    if parsed_data.get('linkedin'):
                        application.candidate_linkedin = parsed_data['linkedin']
                    if parsed_data.get('github'):
                        application.candidate_github = parsed_data['github']
                    
                    application.save()
                    print(f"✓ CV parsed successfully. Method: {parsed_data.get('parsing_method', 'unknown')}")
                else:
                    print(f"✗ CV parsing failed: {parsed_data.get('error', 'Unknown error')}")
                    return Response(
                        {'error': f'CV parsing failed: {parsed_data.get("error", "Unknown error")}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Exception as e:
                print(f"✗ Error parsing CV: {e}")
                import traceback
                traceback.print_exc()
                return Response(
                    {'error': f'Error parsing CV: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if not application.parsed_resume or not application.job_post:
            return Response(
                {'error': 'Cannot calculate similarity: missing parsed resume or job post'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract CV text from parsed resume
        parsed_data = application.parsed_resume
        cv_text_parts = []
        
        if parsed_data.get('summary'):
            cv_text_parts.append(parsed_data['summary'])
        
        if parsed_data.get('skills'):
            skills = parsed_data['skills']
            if isinstance(skills, list):
                cv_text_parts.append(' '.join(skills))
            elif isinstance(skills, str):
                cv_text_parts.append(skills)
        
        if parsed_data.get('experience'):
            exp = parsed_data['experience']
            if isinstance(exp, list):
                for e in exp:
                    if isinstance(e, dict):
                        cv_text_parts.append(f"{e.get('title', '')} at {e.get('company', '')}. {e.get('description', '')}")
                    else:
                        cv_text_parts.append(str(e))
            elif isinstance(exp, str):
                cv_text_parts.append(exp)
        
        if parsed_data.get('education'):
            edu = parsed_data['education']
            if isinstance(edu, list):
                for e in edu:
                    if isinstance(e, dict):
                        cv_text_parts.append(f"{e.get('degree', '')} from {e.get('institution', '')}")
                    else:
                        cv_text_parts.append(str(e))
            elif isinstance(edu, str):
                cv_text_parts.append(edu)
        
        cv_text = ' '.join(cv_text_parts)
        
        if not cv_text:
            return Response(
                {'error': 'Cannot calculate similarity: no CV text available'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate and store similarity score
        similarity = calculate_similarity_score(
            cv_text, 
            application.job_post.job_description, 
            job_id=application.job_post.id
        )
        
        if similarity is not None:
            application.similarity_score = similarity
            # Generate interview link if score >= 50%
            if similarity >= 50 and not application.interview_link:
                interview_link = generate_interview_link(application)
                if interview_link:
                    application.interview_link = interview_link
            application.save()
            
            serializer = self.get_serializer(application)
            return Response({
                'message': 'Similarity score recalculated and stored',
                'similarity_score': application.similarity_score,
                'interview_link': application.interview_link,
                'application': serializer.data
            })
        else:
            return Response(
                {'error': 'Failed to calculate similarity score. AI service may be unavailable.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )


class InterviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing interviews.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Candidates see their own interviews.
        Organizations see interviews for their job posts.
        """
        user = self.request.user
        if user.user_type == 'candidate':
            return Interview.objects.filter(application__candidate=user)
        elif user.user_type == 'organization':
            return Interview.objects.filter(application__job_post__organization=user)
        return Interview.objects.none()
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return InterviewCreateUpdateSerializer
        return InterviewSerializer
    
    def perform_create(self, serializer):
        """Create interview (organization only)."""
        application = serializer.validated_data.get('application')
        
        # Only the organization that posted the job can schedule interviews
        if self.request.user != application.job_post.organization:
            raise permissions.PermissionDenied("You don't have permission to schedule this interview.")
        
        serializer.save()
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update interview status."""
        interview = self.get_object()
        
        new_status = request.data.get('status')
        if new_status not in dict(Interview.STATUS_CHOICES).keys():
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        interview.status = new_status
        interview.save()
        
        serializer = self.get_serializer(interview)
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def parse_cv(request):
    """
    Parse uploaded CV and extract structured information.
    Uses NLP, NER, and pattern matching to extract:
    - Name, email, phone, location
    - Skills
    - Education
    - Work experience
    - Social profiles (LinkedIn, GitHub)
    """
    if 'cv_file' not in request.FILES:
        return Response(
            {'error': 'No CV file provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    cv_file = request.FILES['cv_file']
    
    # Validate file type
    allowed_extensions = ['.pdf', '.doc', '.docx']
    file_ext = os.path.splitext(cv_file.name)[1].lower()
    
    if file_ext not in allowed_extensions:
        return Response(
            {'error': f'Invalid file type. Allowed types: {", ".join(allowed_extensions)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate file size (max 5MB)
    if cv_file.size > 5 * 1024 * 1024:
        return Response(
            {'error': 'File size too large. Maximum size is 5MB'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Save file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
            for chunk in cv_file.chunks():
                tmp_file.write(chunk)
            tmp_file_path = tmp_file.name
        
        # Parse the CV
        parsed_data = cv_parser.parse_cv(tmp_file_path)
        
        # Clean up temp file
        os.unlink(tmp_file_path)
        
        # Return parsed data
        return Response({
            'success': True,
            'data': parsed_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        # Clean up temp file if it exists
        if 'tmp_file_path' in locals() and os.path.exists(tmp_file_path):
            os.unlink(tmp_file_path)
        
        return Response(
            {'error': f'Failed to parse CV: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
