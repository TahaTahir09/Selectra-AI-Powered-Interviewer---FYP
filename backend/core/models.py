from django.db import models
from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.utils import timezone


class OrganizationDetails(models.Model):
    """
    Extended details for organization users.
    Linked 1-to-1 with User model.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='organization_details'
    )
    organization_name = models.CharField(max_length=255)
    address = models.TextField()
    contact_number = models.CharField(max_length=20)
    contact_person = models.CharField(max_length=255)
    legal_document_url = models.URLField(blank=True, null=True)
    website_link = models.URLField(blank=True, null=True)
    company_description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'organization_details'
        verbose_name = 'Organization Detail'
        verbose_name_plural = 'Organization Details'
    
    def __str__(self):
        return self.organization_name


class JobPost(models.Model):
    """
    Job postings created by organizations.
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('closed', 'Closed'),
    ]
    
    organization = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='job_posts'
    )
    job_title = models.CharField(max_length=255)
    job_description = models.TextField()
    required_skills = ArrayField(
        models.CharField(max_length=100),
        default=list,
        blank=True
    )
    experience_required = models.CharField(max_length=255, blank=True, null=True)
    qualification = models.CharField(max_length=255, blank=True, null=True)
    responsibilities = models.TextField(blank=True, null=True)
    benefits = models.TextField(blank=True, null=True)
    employment_type = models.CharField(max_length=50, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    salary_range = models.CharField(max_length=100, blank=True, null=True)
    application_link = models.URLField(blank=True, null=True)
    pre_assessment_questions = ArrayField(
        models.TextField(),
        default=list,
        blank=True
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'job_posts'
        verbose_name = 'Job Post'
        verbose_name_plural = 'Job Posts'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.job_title} - {self.organization.username}"


class Application(models.Model):
    """
    Job applications submitted by candidates.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('reviewed', 'Reviewed'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    
    job_post = models.ForeignKey(
        JobPost,
        on_delete=models.CASCADE,
        related_name='applications',
        null=True  # Allow null temporarily for migration
    )
    candidate = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='applications'
    )
    candidate_name = models.CharField(max_length=255, default='Unknown')
    candidate_email = models.EmailField(default='no-reply@example.com')
    candidate_phone = models.CharField(max_length=20, blank=True, null=True)
    candidate_location = models.CharField(max_length=255, blank=True, null=True)
    candidate_linkedin = models.URLField(blank=True, null=True)
    candidate_github = models.URLField(blank=True, null=True)
    candidate_skills = models.JSONField(default=list, blank=True)
    candidate_education = models.JSONField(default=list, blank=True)
    candidate_experience = models.JSONField(default=list, blank=True)
    years_of_experience = models.CharField(max_length=50, blank=True, null=True)
    cv_url = models.FileField(upload_to='cvs/', blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Additional fields for AI processing
    parsed_resume = models.JSONField(null=True, blank=True)
    embedding_vector_reference = models.CharField(max_length=512, blank=True, null=True)
    similarity_score = models.FloatField(null=True, blank=True, help_text="AI-calculated similarity score between CV and job description (0-1)")
    interview_link = models.CharField(max_length=255, blank=True, null=True, help_text="Auto-generated unique interview link when similarity score >= 50%")
    
    class Meta:
        db_table = 'applications'
        verbose_name = 'Application'
        verbose_name_plural = 'Applications'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.candidate_name} - {self.job_post.job_title}"


class Interview(models.Model):
    """
    Interview schedules for applications.
    """
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='interviews'
    )
    scheduled_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='scheduled'
    )
    interview_type = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'interviews'
        verbose_name = 'Interview'
        verbose_name_plural = 'Interviews'
        ordering = ['-scheduled_date']
    
    def __str__(self):
        return f"Interview for {self.application.candidate_name} - {self.status}"
