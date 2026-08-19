"""Appointment and recommendation endpoints."""
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import Appointment, Patient, Recommendation
from ..serializers import (
    AppointmentCreateSerializer,
    AppointmentSerializer,
    RecommendationSerializer,
)


class AppointmentListCreateView(generics.ListCreateAPIView):
    """List and create appointments."""

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AppointmentCreateSerializer
        return AppointmentSerializer

    def get_queryset(self):
        queryset = Appointment.objects.all()

        # Health workers only see appointments they own.
        if self.request.user.role == 'health_worker':
            queryset = queryset.filter(health_worker=self.request.user)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)

        if self.request.query_params.get('upcoming') == 'true':
            queryset = queryset.filter(
                scheduled_date__gte=timezone.now(), status='scheduled'
            )

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = AppointmentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        appointment = serializer.save(health_worker=request.user)

        return Response(
            AppointmentSerializer(appointment).data, status=status.HTTP_201_CREATED
        )


class AppointmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a specific appointment."""

    permission_classes = [IsAuthenticated]
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer


class RecommendationListView(generics.ListAPIView):
    """List recommendations."""

    permission_classes = [IsAuthenticated]
    serializer_class = RecommendationSerializer

    def get_queryset(self):
        queryset = Recommendation.objects.all()

        # Health workers only see recommendations for their own patients.
        if self.request.user.role == 'health_worker':
            patient_ids = Patient.objects.filter(
                health_worker=self.request.user
            ).values_list('id', flat=True)
            queryset = queryset.filter(patient_id__in=patient_ids)

        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)

        if self.request.query_params.get('incomplete') == 'true':
            queryset = queryset.filter(is_completed=False)

        return queryset


class RecommendationDetailView(generics.RetrieveUpdateAPIView):
    """Get or update a recommendation (for example, mark it completed)."""

    permission_classes = [IsAuthenticated]
    queryset = Recommendation.objects.all()
    serializer_class = RecommendationSerializer
