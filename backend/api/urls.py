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
)

urlpatterns = [
    # Auth endpoints
    path('auth/register', RegisterView.as_view(), name='register'),
    path('auth/login', LoginView.as_view(), name='login'),
    path('auth/me', CurrentUserView.as_view(), name='current_user'),
    
    # Patient endpoints
    path('screening/patients', PatientListCreateView.as_view(), name='patients'),
    path('screening/patients/<int:pk>', PatientDetailView.as_view(), name='patient_detail'),
    
    # Screening endpoints
    path('screening/screenings', ScreeningListCreateView.as_view(), name='screenings'),
    
    # Appointment endpoints
    path('appointments', AppointmentListCreateView.as_view(), name='appointments'),
    path('appointments/<int:pk>', AppointmentDetailView.as_view(), name='appointment_detail'),
    
    # Recommendation endpoints
    path('recommendations', RecommendationListView.as_view(), name='recommendations'),
    path('recommendations/<int:pk>', RecommendationDetailView.as_view(), name='recommendation_detail'),
    
    # Stats endpoints
    path('stats/dashboard', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('stats/analytics', AnalyticsView.as_view(), name='analytics'),
    
    # AI endpoints
    path('ai/analyze', AIAnalysisView.as_view(), name='ai_analyze'),
]

