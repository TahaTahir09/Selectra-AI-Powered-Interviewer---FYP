#!/usr/bin/env python
"""
PostgreSQL repair script for corrupted JSONField data.
This script fixes corrupted JSON data that was stored as Python objects.
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection
import psycopg2
from psycopg2.extras import execute_values


def get_db_connection_params():
    """Get database connection parameters from Django settings."""
    from django.conf import settings
    db_config = settings.DATABASES['default']
    
    return {
        'dbname': db_config['NAME'],
        'user': db_config['USER'],
        'password': db_config['PASSWORD'],
        'host': db_config['HOST'],
        'port': db_config['PORT'],
    }


def inspect_corrupted_data():
    """Inspect the database for corrupted JSON data."""
    print("\n" + "=" * 70)
    print("DETECTING CORRUPTED JSON DATA IN POSTGRESQL")
    print("=" * 70)
    
    from core.models import JobPost, Application
    
    corrupted_items = []
    
    # Check JobPost objects that fail to load
    print("\n[Scanning JobPost records]")
    try:
        count = JobPost.objects.count()
        print(f"  Total records: {count}")
        
        # Try to iterate to find corrupted records
        corrupted = 0
        for job_post in JobPost.objects.all():
            try:
                # Try to access both JSONFields
                _ = job_post.required_skills
                _ = job_post.pre_assessment_questions
            except Exception as e:
                corrupted += 1
                corrupted_items.append(f"JobPost ID {job_post.id}: {str(e)}")
                
                if corrupted <= 5:  # Show first 5 errors
                    print(f"  ✗ JobPost ID {job_post.id}: {str(e)[:60]}")
        
        print(f"  Found {corrupted} corrupted records")
    except Exception as e:
        print(f"  ✗ Error scanning JobPost: {str(e)[:80]}")
    
    # Check Application objects
    print("\n[Scanning Application records]")
    try:
        count = Application.objects.count()
        print(f"  Total records: {count}")
        
        corrupted = 0
        for application in Application.objects.all():
            try:
                _ = application.candidate_skills
                _ = application.candidate_education
                _ = application.candidate_experience
                _ = application.parsed_resume
                _ = application.interview_results
            except Exception as e:
                corrupted += 1
                if corrupted <= 5:
                    print(f"  ✗ Application ID {application.id}: {str(e)[:60]}")
        
        print(f"  Found {corrupted} corrupted records")
    except Exception as e:
        print(f"  ✗ Error scanning applications: {str(e)[:80]}")
    
    return corrupted_items


def fix_json_with_django_orm():
    """Fix corrupted JSON by re-querying and re-saving through Django ORM."""
    print("\n" + "=" * 70)
    print("FIXING CORRUPTED DATA USING DJANGO ORM")
    print("=" * 70)
    
    from core.models import JobPost, Application
    from django.db import IntegrityError
    
    # Fix JobPost
    print("\n[Fixing JobPost records]")
    fixed_count = 0
    error_count = 0
    
    try:
        # Use raw SQL to fetch data that would fail through ORM
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, job_title 
                FROM job_posts 
                LIMIT 1000
            """)
            
            for job_post_id, _ in cursor.fetchall():
                try:
                    job_post = JobPost.objects.get(id=job_post_id)
                    
                    # Ensure JSONFields have proper defaults
                    if job_post.required_skills is None:
                        job_post.required_skills = []
                    if job_post.pre_assessment_questions is None:
                        job_post.pre_assessment_questions = []
                    
                    job_post.save()
                    fixed_count += 1
                except Exception as e:
                    error_count += 1
                    if error_count <= 3:
                        print(f"  ✗ Error fixing JobPost {job_post_id}: {str(e)[:60]}")
    except Exception as e:
        print(f"  ✗ Error fetching JobPost records: {str(e)[:80]}")
    
    print(f"  Fixed: {fixed_count}, Errors: {error_count}")
    
    # Fix Application
    print("\n[Fixing Application records]")
    app_fixed_count = 0
    app_error_count = 0
    
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id, candidate_name
                FROM applications
                LIMIT 1000
            """)
            
            for app_id, _ in cursor.fetchall():
                try:
                    application = Application.objects.get(id=app_id)
                    
                    # Ensure JSONFields have proper defaults
                    application.candidate_skills = application.candidate_skills or []
                    application.candidate_education = application.candidate_education or []
                    application.candidate_experience = application.candidate_experience or []
                    application.parsed_resume = application.parsed_resume or None
                    application.interview_results = application.interview_results or None
                    
                    application.save()
                    app_fixed_count += 1
                except Exception as e:
                    app_error_count += 1
                    if app_error_count <= 3:
                        print(f"  ✗ Error fixing Application {app_id}: {str(e)[:60]}")
    except Exception as e:
        print(f"  ✗ Error fetching Application records: {str(e)[:80]}")
    
    print(f"  Fixed: {app_fixed_count}, Errors: {app_error_count}")
    
    return fixed_count + app_fixed_count, error_count + app_error_count


def fix_json_with_raw_sql():
    """Fix corrupted JSON using raw SQL UPDATE statements."""
    print("\n" + "=" * 70)
    print("ATTEMPTING RAW SQL FIX")
    print("=" * 70)
    
    try:
        with connection.cursor() as cursor:
            # For job_posts - set NULL or invalid values to empty JSON arrays
            print("\n[Fixing job_posts]")
            
            cursor.execute("""
                UPDATE job_posts 
                SET required_skills = '[]'::jsonb
                WHERE required_skills IS NULL
                   OR required_skills = 'null'::jsonb
                   OR required_skills = ''::jsonb
                RETURNING id
            """)
            print(f"  Updated required_skills: {cursor.rowcount} rows")
            
            cursor.execute("""
                UPDATE job_posts 
                SET pre_assessment_questions = '[]'::jsonb
                WHERE pre_assessment_questions IS NULL
                   OR pre_assessment_questions = 'null'::jsonb
                   OR pre_assessment_questions = ''::jsonb
                RETURNING id
            """)
            print(f"  Updated pre_assessment_questions: {cursor.rowcount} rows")
            
            # For applications
            print("\n[Fixing applications]")
            
            cursor.execute("""
                UPDATE applications 
                SET candidate_skills = '[]'::jsonb
                WHERE candidate_skills IS NULL
                   OR candidate_skills = 'null'::jsonb
                   OR candidate_skills = ''::jsonb
            """)
            print(f"  Updated candidate_skills: {cursor.rowcount} rows")
            
            cursor.execute("""
                UPDATE applications 
                SET candidate_education = '[]'::jsonb
                WHERE candidate_education IS NULL
                   OR candidate_education = 'null'::jsonb
                   OR candidate_education = ''::jsonb
            """)
            print(f"  Updated candidate_education: {cursor.rowcount} rows")
            
            cursor.execute("""
                UPDATE applications 
                SET candidate_experience = '[]'::jsonb
                WHERE candidate_experience IS NULL
                   OR candidate_experience = 'null'::jsonb
                   OR candidate_experience = ''::jsonb
            """)
            print(f"  Updated candidate_experience: {cursor.rowcount} rows")
        
        connection.commit()
        print("\n✓ Raw SQL fixes applied successfully!")
        return True
    except Exception as e:
        print(f"\n✗ Error applying raw SQL fixes: {str(e)}")
        return False


if __name__ == '__main__':
    print("\nPostgreSQL JSON Corruption Repair Tool")
    print("=" * 70)
    
    # Inspect corrupted data
    corrupted_items = inspect_corrupted_data()
    
    # Try to fix with Django ORM first
    print("\n[STEP 1] Attempting Django ORM fix...")
    fixed_count, error_count = fix_json_with_django_orm()
    
    if error_count > 0:
        # Try raw SQL as fallback
        print("\n[STEP 2] Attempting raw SQL fix...")
        fix_json_with_raw_sql()
    
    print("\n" + "=" * 70)
    print("✓ Repair process completed")
    print("=" * 70)
