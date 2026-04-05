from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import OrganizationDetails, JobPost, Application, Interview
from users.serializers import UserSerializer

User = get_user_model()


class OrganizationDetailsSerializer(serializers.ModelSerializer):
    """
    Serializer for organization details.
    """
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = OrganizationDetails
        fields = [
            'id', 'user', 'organization_name', 'address', 'contact_number',
            'contact_person', 'legal_document_url', 'website_link',
            'company_description', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class OrganizationDetailsCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating organization details.
    """
    class Meta:
        model = OrganizationDetails
        fields = [
            'organization_name', 'address', 'contact_number',
            'contact_person', 'legal_document_url', 'website_link',
            'company_description'
        ]


class JobPostListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing job posts.
    """
    organization_name = serializers.CharField(source='organization.username', read_only=True)
    application_count = serializers.SerializerMethodField()
    
    class Meta:
        model = JobPost
        fields = [
            'id', 'job_title', 'organization_name', 'location',
            'employment_type', 'salary_range', 'status',
            'application_count', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_application_count(self, obj):
        return obj.applications.count()


class JobPostSerializer(serializers.ModelSerializer):
    """
    Full serializer for job posts (CRUD operations).
    """
    organization = UserSerializer(read_only=True)
    application_count = serializers.SerializerMethodField()
    
    class Meta:
        model = JobPost
        fields = [
            'id', 'organization', 'job_title', 'job_description',
            'required_skills', 'experience_required', 'qualification',
            'responsibilities', 'benefits', 'employment_type',
            'location', 'salary_range', 'application_link',
            'pre_assessment_questions', 'status', 'application_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'organization', 'created_at', 'updated_at']
    
    def get_application_count(self, obj):
        return obj.applications.count()


class JobPostCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating job posts.
    """
    class Meta:
        model = JobPost
        fields = [
            'job_title', 'job_description', 'required_skills',
            'experience_required', 'qualification', 'responsibilities',
            'benefits', 'employment_type', 'location', 'salary_range',
            'application_link', 'pre_assessment_questions', 'status'
        ]
    
    def validate_required_skills(self, value):
        """Ensure required_skills is a list."""
        if not isinstance(value, list):
            raise serializers.ValidationError("Required skills must be a list.")
        return value
    
    def validate_pre_assessment_questions(self, value):
        """Ensure pre_assessment_questions is a list."""
        if not isinstance(value, list):
            raise serializers.ValidationError("Pre-assessment questions must be a list.")
        return value


class ApplicationListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing applications with full job post details.
    """
    job_post = JobPostListSerializer(read_only=True)
    interview_count = serializers.SerializerMethodField()
    has_interview_results = serializers.SerializerMethodField()
    interview_overall_score = serializers.SerializerMethodField()
    
    class Meta:
        model = Application
        fields = [
            'id', 'job_post', 'candidate_name', 'candidate_email',
            'candidate_phone', 'candidate_location', 'candidate_linkedin',
            'candidate_github', 'candidate_skills', 'candidate_education',
            'candidate_experience', 'years_of_experience',
            'status', 'similarity_score', 'interview_link', 'interview_count', 
            'interview_results', 'interview_completed_at', 'has_interview_results',
            'interview_overall_score', 'created_at', 'updated_at', 'cv_url', 'parsed_resume'
        ]
        read_only_fields = ['id', 'similarity_score', 'interview_link', 'created_at', 'updated_at']
    
    def get_interview_count(self, obj):
        return obj.interviews.count()
    
    def get_has_interview_results(self, obj):
        return obj.interview_results is not None
    
    def get_interview_overall_score(self, obj):
        if obj.interview_results and 'overall_score' in obj.interview_results:
            return obj.interview_results.get('overall_score')
        return None


class ApplicationSerializer(serializers.ModelSerializer):
    """
    Full serializer for applications with job post details.
    """
    job_post = JobPostListSerializer(read_only=True)
    candidate = UserSerializer(read_only=True)
    
    class Meta:
        model = Application
        fields = [
            'id', 'job_post', 'candidate', 'candidate_name',
            'candidate_email', 'cv_url', 'status', 'parsed_resume',
            'embedding_vector_reference', 'similarity_score', 'interview_link',
            'interview_results', 'interview_completed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'candidate', 'similarity_score', 'interview_link', 'created_at', 'updated_at']


class InterviewResultsSerializer(serializers.Serializer):
    """
    Serializer for saving interview results.
    """
    interview_token = serializers.CharField(help_text="Interview link token to identify the application")
    overall_score = serializers.IntegerField(min_value=1, max_value=10)
    recommendation = serializers.ChoiceField(choices=['recommend', 'consider', 'not_recommend'])
    summary = serializers.CharField()
    strengths = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    areas_for_improvement = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    cv_verification = serializers.CharField(required=False, default='')
    job_fit = serializers.CharField(required=False, default='')
    questions_and_answers = serializers.ListField(
        child=serializers.DictField(),
        help_text="List of Q&A with scores: [{question, answer, score, feedback}]"
    )

    def validate_questions_and_answers(self, value):
        """Ensure every interview question has answer, score, and feedback for HR review."""
        if not isinstance(value, list) or not value:
            raise serializers.ValidationError("questions_and_answers must be a non-empty list.")

        required_keys = {'question', 'answer', 'score', 'feedback'}
        validated_rows = []

        for index, row in enumerate(value):
            if not isinstance(row, dict):
                raise serializers.ValidationError(f"Entry {index + 1} must be an object.")

            missing = required_keys - set(row.keys())
            if missing:
                missing_str = ', '.join(sorted(missing))
                raise serializers.ValidationError(f"Entry {index + 1} is missing fields: {missing_str}.")

            question = str(row.get('question', '')).strip()
            answer = str(row.get('answer', '')).strip()
            feedback = str(row.get('feedback', '')).strip()

            if not question:
                raise serializers.ValidationError(f"Entry {index + 1} question cannot be empty.")
            if not answer:
                raise serializers.ValidationError(f"Entry {index + 1} answer cannot be empty.")

            try:
                score = float(row.get('score'))
            except (TypeError, ValueError):
                raise serializers.ValidationError(f"Entry {index + 1} score must be numeric.")

            if score < 1 or score > 10:
                raise serializers.ValidationError(f"Entry {index + 1} score must be between 1 and 10.")

            validated_rows.append({
                'question': question,
                'answer': answer,
                'score': score,
                'feedback': feedback,
            })

        return validated_rows


class ApplicationCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating applications.
    """
    class Meta:
        model = Application
        fields = [
            'job_post', 'candidate_name', 'candidate_email', 'cv_url',
            'candidate_phone', 'candidate_location', 'candidate_linkedin',
            'candidate_github', 'candidate_skills', 'candidate_education',
            'candidate_experience', 'years_of_experience'
        ]
        extra_kwargs = {
            'candidate_phone': {'required': False},
            'candidate_location': {'required': False},
            'candidate_linkedin': {'required': False},
            'candidate_github': {'required': False},
            'candidate_skills': {'required': False},
            'candidate_education': {'required': False},
            'candidate_experience': {'required': False},
            'years_of_experience': {'required': False},
        }
    
    def validate_cv_url(self, value):
        """Validate CV file if uploaded."""
        if value:
            # Check file size (e.g., max 5MB)
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("CV file size must not exceed 5MB.")
            # Check file extension
            allowed_extensions = ['.pdf', '.doc', '.docx']
            if not any(value.name.endswith(ext) for ext in allowed_extensions):
                raise serializers.ValidationError("Only PDF, DOC, and DOCX files are allowed.")
        return value


class ApplicationUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating application status (organization use).
    """
    class Meta:
        model = Application
        fields = ['status', 'parsed_resume', 'embedding_vector_reference']


class InterviewSerializer(serializers.ModelSerializer):
    """
    Serializer for interviews.
    """
    application = ApplicationListSerializer(read_only=True)
    candidate_name = serializers.CharField(source='application.candidate_name', read_only=True)
    job_title = serializers.CharField(source='application.job_post.job_title', read_only=True)
    
    class Meta:
        model = Interview
        fields = [
            'id', 'application', 'candidate_name', 'job_title',
            'scheduled_date', 'status', 'interview_type', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class InterviewCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating interviews.
    """
    class Meta:
        model = Interview
        fields = ['application', 'scheduled_date', 'status', 'interview_type', 'notes']
    
    def validate_scheduled_date(self, value):
        """Ensure interview is scheduled in the future."""
        from django.utils import timezone
        if value and value < timezone.now():
            raise serializers.ValidationError("Interview cannot be scheduled in the past.")
        return value
