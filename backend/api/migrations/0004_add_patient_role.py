# Generated migration for patient role and user link

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_update_user_roles'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('patient', 'Patient'),
                    ('health_worker', 'Health Worker'),
                    ('health_officer', 'Health Officer'),
                    ('admin', 'Admin')
                ],
                default='health_worker',
                max_length=50
            ),
        ),
        migrations.AddField(
            model_name='patient',
            name='user',
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='patient_profile',
                to=settings.AUTH_USER_MODEL
            ),
        ),
        migrations.AlterField(
            model_name='patient',
            name='health_worker',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='patients',
                to=settings.AUTH_USER_MODEL
            ),
        ),
    ]
