from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model for RuralHealthAI."""
    
    ROLE_CHOICES = [
        ('patient', 'Patient'),
        ('health_worker', 'Health Worker'),
        ('health_officer', 'Health Officer'),
        ('admin', 'Admin'),
    ]
    
    # Use email as the username field
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255, blank=True, null=True)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='health_worker')
    is_active = models.BooleanField(default=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        db_table = 'users'
    
    def __str__(self):
        return self.email
    
    def is_health_officer(self):
        return self.role in ['health_officer', 'admin']
    
    def is_health_worker(self):
        return self.role == 'health_worker'
    
    def is_patient(self):
        return self.role == 'patient'


class Patient(models.Model):
    """Patient model for health screening."""
    
    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ]
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='patient_profile',
        null=True,
        blank=True
    )
    health_worker = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='patients'
    )
    full_name = models.CharField(max_length=255, db_index=True)
    age = models.IntegerField()
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    village = models.CharField(max_length=255, db_index=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'patients'
    
    def __str__(self):
        return f"{self.full_name} ({self.village})"


class Screening(models.Model):
    """Health screening model with risk assessment."""
    
    RISK_LEVEL_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
    ]
    
    SMOKING_CHOICES = [
        ('Never', 'Never'),
        ('Former', 'Former'),
        ('Current', 'Current'),
    ]
    
    patient = models.ForeignKey(
        Patient, 
        on_delete=models.CASCADE, 
        related_name='screenings'
    )
    
    # Vitals
    height_cm = models.FloatField(blank=True, null=True)
    weight_kg = models.FloatField(blank=True, null=True)
    systolic_bp = models.IntegerField(blank=True, null=True)
    diastolic_bp = models.IntegerField(blank=True, null=True)
    heart_rate = models.IntegerField(blank=True, null=True)
    
    # Lifestyle
    smoking_status = models.CharField(max_length=20, blank=True, null=True)
    alcohol_usage = models.CharField(max_length=50, blank=True, null=True)
    physical_activity = models.CharField(max_length=50, blank=True, null=True)
    
    # Lab Data (Optional)
    glucose_level = models.FloatField(blank=True, null=True)
    cholesterol_level = models.FloatField(blank=True, null=True)
    
    # Result
    risk_score = models.FloatField(blank=True, null=True)
    risk_level = models.CharField(
        max_length=10, 
        choices=RISK_LEVEL_CHOICES, 
        default='Low'
    )
    risk_notes = models.TextField(blank=True, null=True)
    ai_insights = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'screenings'
    
    def __str__(self):
        return f"Screening for {self.patient.full_name} - {self.risk_level}"


class Appointment(models.Model):
    """Follow-up appointment for patients."""
    
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('missed', 'Missed'),
    ]
    
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='appointments'
    )
    health_worker = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='appointments'
    )
    scheduled_date = models.DateTimeField()
    reason = models.CharField(max_length=255)
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='scheduled'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'appointments'
        ordering = ['-scheduled_date']
    
    def __str__(self):
        return f"Appointment for {self.patient.full_name} on {self.scheduled_date}"


class Recommendation(models.Model):
    """Health recommendations for patients based on screening results."""
    
    CATEGORY_CHOICES = [
        ('diet', 'Diet'),
        ('exercise', 'Exercise'),
        ('medication', 'Medication'),
        ('lifestyle', 'Lifestyle'),
        ('followup', 'Follow-up'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='recommendations'
    )
    screening = models.ForeignKey(
        Screening,
        on_delete=models.CASCADE,
        related_name='recommendations',
        null=True,
        blank=True
    )
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    title = models.CharField(max_length=255)
    description = models.TextField()
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium'
    )
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'recommendations'
        ordering = ['-priority', '-created_at']
    
    def __str__(self):
        return f"{self.title} for {self.patient.full_name}"
