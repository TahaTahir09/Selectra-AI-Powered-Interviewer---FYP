"""
Migration to fix corrupted JSONField columns stored as array types in PostgreSQL.

Issue: required_skills and pre_assessment_questions in job_posts table are 
stored as character varying[] (array type) instead of jsonb. This causes 
Django's JSONField deserializer to fail.

Solution: Use ALTER COLUMN to change the column type from array to jsonb.
"""

from django.db import migrations, connection


def fix_job_posts_schema(apps, schema_editor):
    """Migrate job_posts columns from array type to jsonb."""
    schema_editor.execute("""
        ALTER TABLE job_posts 
        ALTER COLUMN required_skills TYPE jsonb USING array_to_json(required_skills);
    """)
    schema_editor.execute("""
        ALTER TABLE job_posts 
        ALTER COLUMN pre_assessment_questions TYPE jsonb 
        USING array_to_json(pre_assessment_questions);
    """)


def reverse_fix_job_posts_schema(apps, schema_editor):
    """This cannot be easily reversed, so we just pass."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0010_fix_corrupt_json'),
    ]

    operations = [
        migrations.RunPython(fix_job_posts_schema, reverse_fix_job_posts_schema),
    ]
