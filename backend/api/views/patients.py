"""Patient CRUD and history endpoints."""

from django.db.models import Q
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Appointment, Patient, Recommendation, Screening
from ..serializers import (
    AppointmentSerializer,
    PatientCreateSerializer,
    PatientDetailSerializer,
    PatientSerializer,
    RecommendationSerializer,
    ScreeningSerializer,
)


def filter_patients(queryset, query_params, user=None):
    """
    Apply the shared search/village/risk/worker filters to a patient queryset.

    Used by both the health-worker patient list and the officer-wide list so the
    two stay in step.
    """
    search = query_params.get('search')
    if search:
        queryset = queryset.filter(
            Q(full_name__icontains=search)
            | Q(village__icontains=search)
            | Q(phone__icontains=search)
        )

    village = query_params.get('village')
    if village:
        queryset = queryset.filter(village__icontains=village)

    risk = query_params.get('risk')
    if risk:
        queryset = queryset.filter(screenings__risk_level=risk).distinct()

    worker_id = query_params.get('health_worker_id')
    # Only officers may slice the list by an arbitrary health worker.
    if worker_id and (user is None or user.is_health_officer()):
        queryset = queryset.filter(health_worker_id=worker_id)

    return queryset


class PatientListCreateView(generics.ListCreateAPIView):
    """List and create patients."""

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PatientCreateSerializer
        return PatientSerializer

    def get_queryset(self):
        queryset = Patient.objects.all().order_by('-created_at')

        # Health workers only see the patients they registered; officers see all.
        if self.request.user.role == 'health_worker':
            queryset = queryset.filter(health_worker=self.request.user)

        return filter_patients(queryset, self.request.query_params, self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = PatientCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        patient = serializer.save(health_worker=request.user)

        return Response(PatientSerializer(patient).data, status=status.HTTP_201_CREATED)


class PatientDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a specific patient."""

    permission_classes = [IsAuthenticated]
    queryset = Patient.objects.all()
    serializer_class = PatientDetailSerializer

    def destroy(self, request, *args, **kwargs):
        patient = self.get_object()
        patient_name = patient.full_name
        patient.delete()
        return Response(
            {'detail': f'Patient {patient_name} deleted successfully'},
            status=status.HTTP_200_OK,
        )


class PatientHistoryView(APIView):
    """Get a patient's complete screening history."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            patient = Patient.objects.get(id=pk)
        except Patient.DoesNotExist:
            return Response({'detail': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role == 'health_worker' and patient.health_worker != request.user:
            return Response(
                {'detail': 'You do not have permission to view this patient'},
                status=status.HTTP_403_FORBIDDEN,
            )

        screenings = Screening.objects.filter(patient=patient).order_by('-created_at')
        appointments = Appointment.objects.filter(patient=patient).order_by('-scheduled_date')
        recommendations = Recommendation.objects.filter(patient=patient).order_by('-created_at')

        latest = screenings.first()

        return Response(
            {
                'patient': PatientSerializer(patient).data,
                'screenings': ScreeningSerializer(screenings, many=True).data,
                'appointments': AppointmentSerializer(appointments, many=True).data,
                'recommendations': RecommendationSerializer(recommendations, many=True).data,
                'total_screenings': screenings.count(),
                'latest_screening': (ScreeningSerializer(latest).data if latest else None),
            }
        )
