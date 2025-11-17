from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os
import tempfile
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
        """Allow unauthenticated users to list and retrieve jobs."""
        if self.action in ['list', 'retrieve']:
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
        
        # Set candidate information
        serializer.save(
            candidate=self.request.user,
            candidate_name=self.request.user.get_full_name() or self.request.user.username,
            candidate_email=self.request.user.email
        )
    
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
