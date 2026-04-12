"""
Management command to detect and fix corrupted JSONField data in core models.

This command is useful for:
1. Detecting if there are corrupted JSON fields in the database
2. Attempting to fix them by re-saving through Django ORM
3. Debugging JSON serialization issues
"""

from django.core.management.base import BaseCommand
from django.db import connection
from core.models import Application, JobPost
import json


class Command(BaseCommand):
    help = 'Detect and fix corrupted JSONField data in JobPost and Application models'

    def add_arguments(self, parser):
        parser.add_argument(
            '--fix',
            action='store_true',
            help='Actually fix the corrupted data (default is dry-run)',
        )
        parser.add_argument(
            '--check-only',
            action='store_true',
            help='Only check for corruption without fixing',
        )

    def check_sqlite_corruption(self):
        """Check for corrupted JSON data in SQLite database"""
        issues = []
        
        with connection.cursor() as cursor:
            # Check job_posts table
            cursor.execute("""
                SELECT id, required_skills, pre_assessment_questions 
                FROM job_posts
            """)
            
            for row_id, req_skills, pre_assess in cursor.fetchall():
                if req_skills is not None:
                    try:
                        # Try to parse as JSON
                        if isinstance(req_skills, str):
                            json.loads(req_skills)
                    except (json.JSONDecodeError, TypeError) as e:
                        issues.append(f"JobPost {row_id}: corrupted required_skills - {str(e)}")
                
                if pre_assess is not None:
                    try:
                        if isinstance(pre_assess, str):
                            json.loads(pre_assess)
                    except (json.JSONDecodeError, TypeError) as e:
                        issues.append(f"JobPost {row_id}: corrupted pre_assessment_questions - {str(e)}")
        
        return issues

    def fix_jobpost_data(self, dry_run=True):
        """Fix corrupted JSONField data in JobPost model"""
        fixed_count = 0
        error_count = 0
        
        for job_post in JobPost.objects.all():
            try:
                # Initialize empty lists if None
                job_post.required_skills = job_post.required_skills or []
                job_post.pre_assessment_questions = job_post.pre_assessment_questions or []
                
                if not dry_run:
                    job_post.save(update_fields=['required_skills', 'pre_assessment_questions'])
                
                fixed_count += 1
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error fixing JobPost {job_post.id}: {str(e)}')
                )
                error_count += 1
        
        return fixed_count, error_count

    def fix_application_data(self, dry_run=True):
        """Fix corrupted JSONField data in Application model"""
        fixed_count = 0
        error_count = 0
        
        for application in Application.objects.all():
            try:
                # Initialize with proper defaults
                application.candidate_skills = application.candidate_skills or []
                application.candidate_education = application.candidate_education or []
                application.candidate_experience = application.candidate_experience or []
                application.parsed_resume = application.parsed_resume or None
                application.interview_results = application.interview_results or None
                
                if not dry_run:
                    application.save(update_fields=[
                        'candidate_skills',
                        'candidate_education',
                        'candidate_experience',
                        'parsed_resume',
                        'interview_results'
                    ])
                
                fixed_count += 1
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error fixing Application {application.id}: {str(e)}')
                )
                error_count += 1
        
        return fixed_count, error_count

    def handle(self, *args, **options):
        fix = options.get('fix', False)
        check_only = options.get('check_only', False)
        dry_run = not fix
        
        self.stdout.write(self.style.SUCCESS('Starting JSON corruption check...'))
        
        if check_only or dry_run:
            self.stdout.write(self.style.WARNING('Running in DRY-RUN mode. No changes will be made.'))
        
        # Check for corruption
        self.stdout.write('\nChecking SQLite for corrupted JSON...')
        issues = self.check_sqlite_corruption()
        
        if issues:
            self.stdout.write(self.style.ERROR(f'\nFound {len(issues)} potential issues:'))
            for issue in issues:
                self.stdout.write(f'  - {issue}')
        else:
            self.stdout.write(self.style.SUCCESS('No obvious corrupted JSON found in SQLite.'))
        
        # Fix JobPost data
        self.stdout.write('\n' + '='*60)
        self.stdout.write('Processing JobPost records...')
        job_post_fixed, job_post_errors = self.fix_jobpost_data(dry_run=dry_run)
        self.stdout.write(f'JobPost: {job_post_fixed} processed, {job_post_errors} errors')
        
        # Fix Application data
        self.stdout.write('\n' + '='*60)
        self.stdout.write('Processing Application records...')
        app_fixed, app_errors = self.fix_application_data(dry_run=dry_run)
        self.stdout.write(f'Application: {app_fixed} processed, {app_errors} errors')
        
        # Final message
        self.stdout.write('\n' + '='*60)
        if dry_run and not check_only:
            self.stdout.write(
                self.style.WARNING(
                    'DRY-RUN completed. Run with --fix flag to actually apply changes.'
                )
            )
        elif fix:
            self.stdout.write(
                self.style.SUCCESS('All data has been fixed and saved to database!')
            )
