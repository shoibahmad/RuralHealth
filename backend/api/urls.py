from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    CurrentUserView,
    PatientListCreateView,
    PatientDetailView,
    ScreeningListCreateView,
    AppointmentListCreateView,
    AppointmentDetailView,
    RecommendationListView,
    RecommendationDetailView,
    DashboardStatsView,
    AnalyticsView,
    AIAnalysisView,
    AIVoiceVitalsView,
    # Health Officer views
    HealthWorkerListView,
    HealthWorkerDetailView,
    OfficerDashboardStatsView,
    AllPatientsView,
    SystemAnalyticsView,
    UpdateWorkerStatusView,
    UpdatePatientView,
    PatientHistoryView,
    # Settings views
    UpdateProfileView,
    ChangePasswordView,
    # Patient Portal views
    PatientDashboardView,
    PatientSelfScreeningView,
    PatientScreeningHistoryView,
    PatientProfileSetupView,
)

urlpatterns = [
    # Auth endpoints
    path('auth/register', RegisterView.as_view(), name='register'),
    path('auth/login', LoginView.as_view(), name='login'),
    path('auth/me', CurrentUserView.as_view(), name='current_user'),
    path('auth/update-profile', UpdateProfileView.as_view(), name='update_profile'),
    path('auth/change-password', ChangePasswordView.as_view(), name='change_password'),
    
    # Patient endpoints
    path('screening/patients', PatientListCreateView.as_view(), name='patients'),
    path('screening/patients/<int:pk>', PatientDetailView.as_view(), name='patient_detail'),
    path('screening/patients/<int:pk>/history', PatientHistoryView.as_view(), name='patient_history'),
    
    # Screening endpoints
    path('screening/screenings', ScreeningListCreateView.as_view(), name='screenings'),
    
    # Appointment endpoints
    path('appointments', AppointmentListCreateView.as_view(), name='appointments'),
    path('appointments/<int:pk>', AppointmentDetailView.as_view(), name='appointment_detail'),
    
    # Recommendation endpoints
    path('recommendations', RecommendationListView.as_view(), name='recommendations'),
    path('recommendations/<int:pk>', RecommendationDetailView.as_view(), name='recommendation_detail'),
    
    # Stats endpoints (Health Workers)
    path('stats/dashboard', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('stats/analytics', AnalyticsView.as_view(), name='analytics'),
    
    # AI endpoints
    path('ai/analyze', AIAnalysisView.as_view(), name='ai_analyze'),
    path('ai/voice-vitals', AIVoiceVitalsView.as_view(), name='voice_vitals'),
    
    # Health Officer endpoints
    path('officer/workers', HealthWorkerListView.as_view(), name='health_workers'),
    path('officer/workers/<int:pk>', HealthWorkerDetailView.as_view(), name='health_worker_detail'),
    path('officer/workers/<int:pk>/update', UpdateWorkerStatusView.as_view(), name='update_worker'),
    path('officer/dashboard', OfficerDashboardStatsView.as_view(), name='officer_dashboard'),
    path('officer/patients', AllPatientsView.as_view(), name='all_patients'),
    path('officer/patients/<int:pk>/update', UpdatePatientView.as_view(), name='update_patient'),
    path('officer/analytics', SystemAnalyticsView.as_view(), name='system_analytics'),
    
    # Patient Portal endpoints
    path('patient/dashboard', PatientDashboardView.as_view(), name='patient_dashboard'),
    path('patient/screening', PatientSelfScreeningView.as_view(), name='patient_self_screening'),
    path('patient/history', PatientScreeningHistoryView.as_view(), name='patient_screening_history'),
    path('patient/profile', PatientProfileSetupView.as_view(), name='patient_profile_setup'),
]
