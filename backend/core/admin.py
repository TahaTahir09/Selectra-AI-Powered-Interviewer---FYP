from django.contrib import admin
from .models import OrganizationDetails, JobPost, Application, Interview


@admin.register(OrganizationDetails)
class OrganizationDetailsAdmin(admin.ModelAdmin):
    list_display = ['organization_name', 'contact_person', 'contact_number', 'created_at']
    search_fields = ['organization_name', 'contact_person', 'contact_number']
    list_filter = ['created_at']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(JobPost)
class JobPostAdmin(admin.ModelAdmin):
    list_display = ['job_title', 'organization', 'status', 'location', 'created_at']
    search_fields = ['job_title', 'job_description', 'location']
    list_filter = ['status', 'employment_type', 'created_at']
    readonly_fields = ['created_at', 'updated_at']
    filter_horizontal = []
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('organization', 'job_title', 'job_description', 'status')
        }),
        ('Requirements', {
            'fields': ('required_skills', 'experience_required', 'qualification')
        }),
        ('Details', {
            'fields': ('responsibilities', 'benefits', 'employment_type', 'location', 'salary_range')
        }),
        ('Application', {
            'fields': ('application_link', 'pre_assessment_questions')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ['candidate_name', 'candidate_email', 'job_post', 'status', 'created_at']
    search_fields = ['candidate_name', 'candidate_email']
    list_filter = ['status', 'created_at']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Candidate Information', {
            'fields': ('candidate', 'candidate_name', 'candidate_email', 'cv_url')
        }),
        ('Application Details', {
            'fields': ('job_post', 'status')
        }),
        ('AI Processing', {
            'fields': ('parsed_resume', 'embedding_vector_reference'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = ['application', 'scheduled_date', 'status', 'interview_type', 'created_at']
    search_fields = ['application__candidate_name', 'notes']
    list_filter = ['status', 'interview_type', 'scheduled_date']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Interview Information', {
            'fields': ('application', 'scheduled_date', 'status', 'interview_type')
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
