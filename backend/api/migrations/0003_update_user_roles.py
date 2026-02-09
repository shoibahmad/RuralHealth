# Generated migration for role-based access control

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_appointment_recommendation'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('health_worker', 'Health Worker'),
                    ('health_officer', 'Health Officer'),
                    ('admin', 'Admin')
                ],
                default='health_worker',
                max_length=50
            ),
        ),
    ]
