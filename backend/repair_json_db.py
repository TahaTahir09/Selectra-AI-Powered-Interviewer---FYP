#!/usr/bin/env python
"""
Direct SQLite repair script for corrupted JSONField data.
This script bypasses Django ORM to fix data at the database level.
"""

import sqlite3
import json
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(__file__))

def inspect_database(db_path):
    """Inspect the database to understand the corruption."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("=" * 70)
    print("DATABASE INSPECTION")
    print("=" * 70)
    
    # Check job_posts table
    print("\n[job_posts table]")
    cursor.execute("SELECT COUNT(*) FROM job_posts")
    count = cursor.fetchone()[0]
    print(f"Total records: {count}")
    
    if count > 0:
        cursor.execute("""
            SELECT id, 
                   typeof(required_skills) as req_type, 
                   typeof(pre_assessment_questions) as preq_type
            FROM job_posts
            LIMIT 3
        """)
        for row in cursor.fetchall():
            print(f"  ID {row[0]}: required_skills={row[1]}, pre_assessment_questions={row[2]}")
    
    # Check applications table
    print("\n[applications table]")
    cursor.execute("SELECT COUNT(*) FROM applications")
    count = cursor.fetchone()[0]
    print(f"Total records: {count}")
    
    if count > 0:
        cursor.execute("""
            SELECT id, 
                   typeof(candidate_skills) as skills_type,
                   typeof(candidate_education) as edu_type,
                   typeof(parsed_resume) as resume_type
            FROM applications
            LIMIT 3
        """)
        for row in cursor.fetchall():
            print(f"  ID {row[0]}: skills={row[1]}, education={row[2]}, resume={row[3]}")
    
    conn.close()


def fix_database(db_path):
    """Fix corrupted JSON data in the database."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("\n" + "=" * 70)
    print("DATABASE REPAIR")
    print("=" * 70)
    
    try:
        # Fix job_posts required_skills
        print("\n[Fixing job_posts.required_skills]")
        cursor.execute("""
            UPDATE job_posts 
            SET required_skills = '[]'
            WHERE required_skills IS NULL OR required_skills = ''
        """)
        print(f"  Updated {cursor.rowcount} rows with NULL/empty required_skills")
        
        # Fix job_posts pre_assessment_questions
        print("\n[Fixing job_posts.pre_assessment_questions]")
        cursor.execute("""
            UPDATE job_posts 
            SET pre_assessment_questions = '[]'
            WHERE pre_assessment_questions IS NULL OR pre_assessment_questions = ''
        """)
        print(f"  Updated {cursor.rowcount} rows with NULL/empty pre_assessment_questions")
        
        # Fix applications candidate_skills
        print("\n[Fixing applications.candidate_skills]")
        cursor.execute("""
            UPDATE applications 
            SET candidate_skills = '[]'
            WHERE candidate_skills IS NULL OR candidate_skills = ''
        """)
        print(f"  Updated {cursor.rowcount} rows with NULL/empty candidate_skills")
        
        # Fix applications candidate_education
        print("\n[Fixing applications.candidate_education]")
        cursor.execute("""
            UPDATE applications 
            SET candidate_education = '[]'
            WHERE candidate_education IS NULL OR candidate_education = ''
        """)
        print(f"  Updated {cursor.rowcount} rows with NULL/empty candidate_education")
        
        # Fix applications candidate_experience
        print("\n[Fixing applications.candidate_experience]")
        cursor.execute("""
            UPDATE applications 
            SET candidate_experience = '[]'
            WHERE candidate_experience IS NULL OR candidate_experience = ''
        """)
        print(f"  Updated {cursor.rowcount} rows with NULL/empty candidate_experience")
        
        conn.commit()
        print("\n✓ All database repairs committed successfully!")
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"\n✗ Error during repair: {str(e)}")
        return False
    finally:
        conn.close()


if __name__ == '__main__':
    db_path = 'db.sqlite3'
    auto_fix = '--auto' in sys.argv or '--fix' in sys.argv
    
    if not os.path.exists(db_path):
        print(f"Error: {db_path} not found!")
        sys.exit(1)
    
    # Inspect the database first
    inspect_database(db_path)
    
    if auto_fix:
        # Auto-fix mode
        print("\n[Auto-fix mode enabled]")
        if fix_database(db_path):
            print("\n✓ Database has been repaired!")
            sys.exit(0)
        else:
            print("\n✗ Database repair failed!")
            sys.exit(1)
    else:
        # Ask user to confirm before fixing
        print("\n" + "=" * 70)
        response = input("\nProceed with database repair? (yes/no): ").strip().lower()
        
        if response in ['yes', 'y']:
            if fix_database(db_path):
                print("\n✓ Database has been repaired!")
                sys.exit(0)
            else:
                print("\n✗ Database repair failed!")
                sys.exit(1)
        else:
            print("\nRepair cancelled.")
            sys.exit(0)
