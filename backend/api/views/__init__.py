"""
API views, split by domain.

Re-exported here so ``from api.views import RegisterView`` keeps working after
the split out of the original single views module.
"""

from .ai import (
    AIAnalysisView,
    AILabExtractionView,
    AITextVitalsView,
    AIVoiceVitalsView,
)
from .analytics import AnalyticsView, DashboardStatsView
from .appointments import (
    AppointmentDetailView,
    AppointmentListCreateView,
    RecommendationDetailView,
    RecommendationListView,
)
from .auth import (
    ChangePasswordView,
    CurrentUserView,
    LoginView,
    RegisterView,
    UpdateProfileView,
)
from .officer import (
    AllPatientsView,
    HealthWorkerDetailView,
    HealthWorkerListView,
    OfficerDashboardStatsView,
    SystemAnalyticsView,
    UpdatePatientView,
    UpdateWorkerStatusView,
)
from .patient_portal import (
    PatientDashboardView,
    PatientProfileSetupView,
    PatientScreeningHistoryView,
    PatientSelfScreeningView,
)
from .patients import PatientDetailView, PatientHistoryView, PatientListCreateView
from .screenings import ScreeningListCreateView

__all__ = [
    # Auth
    'RegisterView',
    'LoginView',
    'CurrentUserView',
    'UpdateProfileView',
    'ChangePasswordView',
    # Patients
    'PatientListCreateView',
    'PatientDetailView',
    'PatientHistoryView',
    # Screenings
    'ScreeningListCreateView',
    # Appointments and recommendations
    'AppointmentListCreateView',
    'AppointmentDetailView',
    'RecommendationListView',
    'RecommendationDetailView',
    # Analytics
    'DashboardStatsView',
    'AnalyticsView',
    # AI
    'AIAnalysisView',
    'AIVoiceVitalsView',
    'AILabExtractionView',
    'AITextVitalsView',
    # Health officer
    'HealthWorkerListView',
    'HealthWorkerDetailView',
    'OfficerDashboardStatsView',
    'AllPatientsView',
    'SystemAnalyticsView',
    'UpdateWorkerStatusView',
    'UpdatePatientView',
    # Patient portal
    'PatientDashboardView',
    'PatientSelfScreeningView',
    'PatientScreeningHistoryView',
    'PatientProfileSetupView',
]
