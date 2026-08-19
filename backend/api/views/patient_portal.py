"""Endpoints backing the patient-facing portal."""
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Appointment, Patient, Recommendation, Screening
from ..permissions import IsPatient
from ..serializers import (
    AppointmentSerializer,
    PatientProfileSerializer,
    PatientSerializer,
    RecommendationSerializer,
    ScreeningCreateSerializer,
    ScreeningSerializer,
)
from .screenings import record_screening

PROFILE_REQUIRED_DETAIL = 'Patient profile not found. Please complete your profile.'


def get_patient_profile(user):
    """Return the Patient row linked to ``user``, or None when not set up yet."""
    return Patient.objects.filter(user=user).first()


class PatientPortalView(APIView):
    """
    Base view for endpoints that operate on the caller's own patient record.

    Subclasses read ``self.patient``, which is resolved once per request; the
    403/404 responses for non-patients and incomplete profiles are handled here.
    """

    permission_classes = [IsPatient]

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        self.patient = get_patient_profile(request.user)

    def profile_required(self):
        """Return a 404 response when the caller has no patient profile yet."""
        return Response(
            {'detail': PROFILE_REQUIRED_DETAIL}, status=status.HTTP_404_NOT_FOUND
        )


class PatientDashboardView(PatientPortalView):
    """Get the signed-in patient's own dashboard data."""

    def get(self, request):
        if self.patient is None:
            return self.profile_required()

        screenings = Screening.objects.filter(patient=self.patient).order_by(
            '-created_at'
        )
        latest_screening = screenings.first()

        upcoming_appointments = Appointment.objects.filter(
            patient=self.patient,
            status='scheduled',
            scheduled_date__gte=timezone.now(),
        ).order_by('scheduled_date')

        active_recommendations = Recommendation.objects.filter(
            patient=self.patient, is_completed=False
        ).order_by('-priority', '-created_at')

        return Response(
            {
                'patient': PatientSerializer(self.patient).data,
                'total_screenings': screenings.count(),
                'latest_screening': (
                    ScreeningSerializer(latest_screening).data
                    if latest_screening
                    else None
                ),
                'upcoming_appointments': AppointmentSerializer(
                    upcoming_appointments, many=True
                ).data,
                'active_recommendations': RecommendationSerializer(
                    active_recommendations[:5], many=True
                ).data,
            }
        )


class PatientSelfScreeningView(PatientPortalView):
    """Let a patient record a screening against their own profile."""

    def post(self, request):
        if self.patient is None:
            return self.profile_required()

        # patient_id always comes from the session, never from the request body,
        # so a patient cannot file a screening against somebody else's record.
        data = {
            key: value for key, value in request.data.items() if key != 'patient_id'
        }
        data['patient_id'] = self.patient.id

        serializer = ScreeningCreateSerializer(data=data)
        serializer.is_valid(raise_exception=True)

        screening = record_screening(self.patient, serializer.validated_data)

        return Response(
            ScreeningSerializer(screening).data, status=status.HTTP_201_CREATED
        )


class PatientScreeningHistoryView(PatientPortalView):
    """Get the signed-in patient's own screening history."""

    def get(self, request):
        if self.patient is None:
            return Response(
                {'detail': 'Patient profile not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        screenings = Screening.objects.filter(patient=self.patient).order_by(
            '-created_at'
        )
        appointments = Appointment.objects.filter(patient=self.patient).order_by(
            '-scheduled_date'
        )
        recommendations = Recommendation.objects.filter(patient=self.patient).order_by(
            '-created_at'
        )

        return Response(
            {
                'patient': PatientSerializer(self.patient).data,
                'screenings': ScreeningSerializer(screenings, many=True).data,
                'appointments': AppointmentSerializer(appointments, many=True).data,
                'recommendations': RecommendationSerializer(
                    recommendations, many=True
                ).data,
            }
        )


class PatientProfileSetupView(PatientPortalView):
    """Create or update the signed-in patient's own profile."""

    def get(self, request):
        if self.patient is None:
            return self.profile_required()
        return Response(PatientSerializer(self.patient).data)

    def post(self, request):
        serializer = PatientProfileSerializer(
            self.patient, data=request.data, partial=self.patient is not None
        )
        serializer.is_valid(raise_exception=True)

        # Bind the profile to the caller so patient_profile lookups resolve later.
        patient = serializer.save(user=request.user)

        return Response(PatientSerializer(patient).data, status=status.HTTP_200_OK)
