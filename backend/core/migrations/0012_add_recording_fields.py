"""
Migration to add recording storage fields to Application model.

Adds camera_recording and screen_recording fields to store interview recordings.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0011_fix_jsonfield_column_types'),
    ]

    operations = [
        migrations.AddField(
            model_name='application',
            name='camera_recording',
            field=models.FileField(blank=True, help_text="Candidate's camera recording during interview", null=True, upload_to='interview_recordings/camera/'),
        ),
        migrations.AddField(
            model_name='application',
            name='screen_recording',
            field=models.FileField(blank=True, help_text='Screen recording during interview', null=True, upload_to='interview_recordings/screen/'),
        ),
    ]
