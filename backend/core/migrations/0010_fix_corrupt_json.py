# Generated migration to fix corrupted JSONField data

from django.db import migrations
import json


def fix_corrupted_jsonfields(apps, schema_editor):
    """
    Fix corrupted JSONField data in JobPost and Application models.
    Issue: SQLite allows storing Python objects directly in JSON fields without serialization.
    This causes json.loads() to fail when Django tries to deserialize on retrieval.
    
    Solution: Query each model and re-save through Django ORM, which properly serializes JSON.
    """
    JobPost = apps.get_model('core', 'JobPost')
    Application = apps.get_model('core', 'Application')
    
    # Fix JobPost objects
    for job_post in JobPost.objects.all():
        try:
            # Simply re-access the fields to ensure they're properly initialized
            # Django's ORM will handle proper serialization on save
            job_post.required_skills = job_post.required_skills or []
            job_post.pre_assessment_questions = job_post.pre_assessment_questions or []
            job_post.save(update_fields=['required_skills', 'pre_assessment_questions'])
        except Exception as e:
            # Log any errors but continue
            print(f"Error fixing JobPost {job_post.id}: {str(e)}")
    
    # Fix Application objects  
    for application in Application.objects.all():
        try:
            # Ensure all JSONField values are properly initialized
            application.candidate_skills = application.candidate_skills or []
            application.candidate_education = application.candidate_education or []
            application.candidate_experience = application.candidate_experience or []
            application.parsed_resume = application.parsed_resume or None
            application.interview_results = application.interview_results or None
            application.save(update_fields=[
                'candidate_skills', 
                'candidate_education',
                'candidate_experience',
                'parsed_resume',
                'interview_results'
            ])
        except Exception as e:
            # Log any errors but continue
            print(f"Error fixing Application {application.id}: {str(e)}")


def reverse_migration(apps, schema_editor):
    """Reverse operation - no actual changes to reverse"""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0009_add_interview_results'),
    ]

    operations = [
        migrations.RunPython(fix_corrupted_jsonfields, reverse_migration),
    ]
