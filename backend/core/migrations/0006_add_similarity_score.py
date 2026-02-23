# Generated migration

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_application_candidate_education_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='application',
            name='similarity_score',
            field=models.FloatField(blank=True, help_text='AI-calculated similarity score between CV and job description (0-100)', null=True),
        ),
    ]
