from django.contrib import admin
from django.contrib.auth import get_user_model
from .models import Patient, Screening, Appointment, Recommendation

User = get_user_model()


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'full_name', 'role', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active']
    search_fields = ['email', 'full_name']


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'age', 'gender', 'village', 'health_worker', 'created_at']
    list_filter = ['gender', 'village']
    search_fields = ['full_name', 'village', 'phone']


@admin.register(Screening)
class ScreeningAdmin(admin.ModelAdmin):
    list_display = ['patient', 'risk_level', 'risk_score', 'created_at']
    list_filter = ['risk_level', 'created_at']
    search_fields = ['patient__full_name']


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['patient', 'health_worker', 'scheduled_date', 'status', 'reason']
    list_filter = ['status', 'scheduled_date']
    search_fields = ['patient__full_name', 'reason']


@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = ['patient', 'title', 'category', 'priority', 'is_completed', 'created_at']
    list_filter = ['category', 'priority', 'is_completed']
    search_fields = ['patient__full_name', 'title']
