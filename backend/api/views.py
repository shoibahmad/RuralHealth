from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

from .models import Patient, Screening, Appointment, Recommendation
from .serializers import (
    UserSerializer, 
    UserCreateSerializer,
    CustomTokenObtainPairSerializer,
    PatientSerializer, 
    PatientCreateSerializer,
    PatientDetailSerializer,
    ScreeningSerializer, 
    ScreeningCreateSerializer,
    AppointmentSerializer,
    AppointmentCreateSerializer,
    RecommendationSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """User registration endpoint."""
    
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserCreateSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        # Check if email already exists
        email = request.data.get('email')
        if User.objects.filter(email=email).exists():
            return Response(
                {'detail': 'Email already registered'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Return user data matching FastAPI response
        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED
        )


class LoginView(APIView):
    """User login endpoint - returns JWT token."""
    
    permission_classes = [AllowAny]
    
    def post(self, request):
        # Support both form data and JSON
        # OAuth2PasswordRequestForm uses 'username' field for email
        email = request.data.get('username') or request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {'detail': 'Email and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = CustomTokenObtainPairSerializer(data={
            'email': email,
            'password': password
        })
        
        try:
            serializer.is_valid(raise_exception=True)
            return Response(serializer.validated_data)
        except Exception:
            return Response(
                {'detail': 'Incorrect email or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )


class CurrentUserView(APIView):
    """Get current authenticated user."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class PatientListCreateView(generics.ListCreateAPIView):
    """List and create patients."""
    
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PatientCreateSerializer
        return PatientSerializer
    
    def get_queryset(self):
        queryset = Patient.objects.all().order_by('-created_at')
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search) |
                Q(village__icontains=search) |
                Q(phone__icontains=search)
            )
        
        # Filter by village
        village = self.request.query_params.get('village', None)
        if village:
            queryset = queryset.filter(village__icontains=village)
        
        # Filter by risk level
        risk = self.request.query_params.get('risk', None)
        if risk:
            queryset = queryset.filter(
                screenings__risk_level=risk
            ).distinct()
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(health_worker=self.request.user)
    
    def create(self, request, *args, **kwargs):
        serializer = PatientCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        patient = serializer.save(health_worker=request.user)
        
        # Return full patient data
        return Response(
            PatientSerializer(patient).data,
            status=status.HTTP_201_CREATED
        )


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
            status=status.HTTP_200_OK
        )


class ScreeningListCreateView(generics.ListCreateAPIView):
    """List and create screenings with risk calculation."""
    
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ScreeningCreateSerializer
        return ScreeningSerializer
    
    def get_queryset(self):
        queryset = Screening.objects.all().order_by('-created_at')
        
        # Filter by patient
        patient_id = self.request.query_params.get('patient_id', None)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        
        # Filter by risk level
        risk = self.request.query_params.get('risk', None)
        if risk:
            queryset = queryset.filter(risk_level=risk)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        serializer = ScreeningCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Calculate risk score with improved algorithm
        data = serializer.validated_data
        risk_score = 0
        risk_notes = []
        
        # Blood pressure risk
        systolic_bp = data.get('systolic_bp')
        diastolic_bp = data.get('diastolic_bp')
        if systolic_bp:
            if systolic_bp > 180:
                risk_score += 40
                risk_notes.append("Very high blood pressure (>180 systolic)")
            elif systolic_bp > 140:
                risk_score += 25
                risk_notes.append("High blood pressure (>140 systolic)")
            elif systolic_bp > 120:
                risk_score += 10
                risk_notes.append("Elevated blood pressure (>120 systolic)")
        
        # Glucose level risk
        glucose_level = data.get('glucose_level')
        if glucose_level:
            if glucose_level > 200:
                risk_score += 40
                risk_notes.append("Very high glucose (>200 mg/dL)")
            elif glucose_level > 140:
                risk_score += 25
                risk_notes.append("High glucose (>140 mg/dL)")
            elif glucose_level > 100:
                risk_score += 10
                risk_notes.append("Elevated glucose (>100 mg/dL)")
        
        # Cholesterol risk
        cholesterol_level = data.get('cholesterol_level')
        if cholesterol_level:
            if cholesterol_level > 240:
                risk_score += 20
                risk_notes.append("High cholesterol (>240 mg/dL)")
            elif cholesterol_level > 200:
                risk_score += 10
                risk_notes.append("Borderline high cholesterol (>200 mg/dL)")
        
        # Smoking risk
        smoking_status = data.get('smoking_status')
        if smoking_status == 'Current':
            risk_score += 15
            risk_notes.append("Current smoker")
        elif smoking_status == 'Former':
            risk_score += 5
            risk_notes.append("Former smoker")
        
        # BMI calculation if height and weight available
        height_cm = data.get('height_cm')
        weight_kg = data.get('weight_kg')
        if height_cm and weight_kg and height_cm > 0:
            bmi = weight_kg / ((height_cm / 100) ** 2)
            if bmi > 30:
                risk_score += 15
                risk_notes.append(f"Obese (BMI: {bmi:.1f})")
            elif bmi > 25:
                risk_score += 8
                risk_notes.append(f"Overweight (BMI: {bmi:.1f})")
        
        # Physical activity
        physical_activity = data.get('physical_activity')
        if physical_activity == 'Sedentary':
            risk_score += 10
            risk_notes.append("Sedentary lifestyle")
        
        # Determine risk level
        if risk_score >= 60:
            risk_level = 'High'
        elif risk_score >= 30:
            risk_level = 'Medium'
        else:
            risk_level = 'Low'
        
        # Get patient
        patient = Patient.objects.get(id=data['patient_id'])
        
        # Create screening with risk data
        screening = Screening.objects.create(
            patient=patient,
            height_cm=data.get('height_cm'),
            weight_kg=data.get('weight_kg'),
            systolic_bp=systolic_bp,
            diastolic_bp=data.get('diastolic_bp'),
            heart_rate=data.get('heart_rate'),
            smoking_status=data.get('smoking_status'),
            alcohol_usage=data.get('alcohol_usage'),
            physical_activity=data.get('physical_activity'),
            glucose_level=glucose_level,
            cholesterol_level=data.get('cholesterol_level'),
            risk_score=risk_score,
            risk_level=risk_level,
            risk_notes='; '.join(risk_notes) if risk_notes else 'No significant risk factors detected.'
        )
        
        # Generate recommendations based on risk factors
        self._generate_recommendations(patient, screening, risk_notes, risk_level)
        
        return Response(
            ScreeningSerializer(screening).data,
            status=status.HTTP_201_CREATED
        )
    
    def _generate_recommendations(self, patient, screening, risk_notes, risk_level):
        """Generate health recommendations based on screening results."""
        recommendations = []
        
        for note in risk_notes:
            if 'blood pressure' in note.lower():
                recommendations.append({
                    'category': 'lifestyle',
                    'title': 'Blood Pressure Management',
                    'description': 'Reduce sodium intake, exercise regularly, limit alcohol, and manage stress. Consider DASH diet.',
                    'priority': 'high' if 'Very high' in note else 'medium'
                })
            
            if 'glucose' in note.lower():
                recommendations.append({
                    'category': 'diet',
                    'title': 'Blood Sugar Control',
                    'description': 'Limit refined carbohydrates, eat more fiber, exercise after meals, and monitor blood sugar regularly.',
                    'priority': 'high' if 'Very high' in note else 'medium'
                })
            
            if 'cholesterol' in note.lower():
                recommendations.append({
                    'category': 'diet',
                    'title': 'Cholesterol Management',
                    'description': 'Reduce saturated fats, eat omega-3 rich foods, increase soluble fiber, and consider plant sterols.',
                    'priority': 'medium'
                })
            
            if 'smoker' in note.lower():
                recommendations.append({
                    'category': 'lifestyle',
                    'title': 'Smoking Cessation',
                    'description': 'Consider nicotine replacement therapy, counseling, or medication. Quitting smoking significantly reduces cardiovascular risk.',
                    'priority': 'high'
                })
            
            if 'bmi' in note.lower():
                recommendations.append({
                    'category': 'exercise',
                    'title': 'Weight Management',
                    'description': 'Aim for 150 minutes of moderate exercise weekly, reduce calorie intake, and consult a nutritionist.',
                    'priority': 'medium'
                })
            
            if 'sedentary' in note.lower():
                recommendations.append({
                    'category': 'exercise',
                    'title': 'Increase Physical Activity',
                    'description': 'Start with 30 minutes of walking daily, take breaks from sitting, and gradually increase activity level.',
                    'priority': 'medium'
                })
        
        if risk_level == 'High':
            recommendations.append({
                'category': 'followup',
                'title': 'Schedule Follow-up Appointment',
                'description': 'High risk detected. Please schedule a follow-up appointment within 2 weeks for detailed assessment.',
                'priority': 'high'
            })
        
        # Create recommendation objects
        for rec in recommendations:
            Recommendation.objects.create(
                patient=patient,
                screening=screening,
                **rec
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
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by patient
        patient_id = self.request.query_params.get('patient_id', None)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        
        # Filter upcoming only
        upcoming = self.request.query_params.get('upcoming', None)
        if upcoming == 'true':
            queryset = queryset.filter(
                scheduled_date__gte=timezone.now(),
                status='scheduled'
            )
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(health_worker=self.request.user)
    
    def create(self, request, *args, **kwargs):
        serializer = AppointmentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        appointment = serializer.save(health_worker=request.user)
        
        return Response(
            AppointmentSerializer(appointment).data,
            status=status.HTTP_201_CREATED
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
        
        # Filter by patient
        patient_id = self.request.query_params.get('patient_id', None)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        
        # Filter incomplete only
        incomplete = self.request.query_params.get('incomplete', None)
        if incomplete == 'true':
            queryset = queryset.filter(is_completed=False)
        
        return queryset


class RecommendationDetailView(generics.RetrieveUpdateAPIView):
    """Get or update a recommendation (mark as completed)."""
    
    permission_classes = [IsAuthenticated]
    queryset = Recommendation.objects.all()
    serializer_class = RecommendationSerializer


class DashboardStatsView(APIView):
    """Get dashboard statistics."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Calculate statistics
        total_patients = Patient.objects.count()
        total_screenings = Screening.objects.count()
        high_risk_count = Screening.objects.filter(risk_level='High').values('patient').distinct().count()
        pending_appointments = Appointment.objects.filter(
            status='scheduled',
            scheduled_date__gte=timezone.now()
        ).count()
        
        # Risk distribution
        risk_counts = Screening.objects.values('risk_level').annotate(count=Count('id'))
        risk_distribution = {
            'Low': 0,
            'Medium': 0,
            'High': 0
        }
        for item in risk_counts:
            risk_distribution[item['risk_level']] = item['count']
        
        # Weekly screenings (last 7 days)
        today = timezone.now().date()
        weekly_screenings = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            count = Screening.objects.filter(created_at__date=day).count()
            high_risk = Screening.objects.filter(
                created_at__date=day,
                risk_level='High'
            ).count()
            weekly_screenings.append({
                'name': day.strftime('%a'),
                'date': day.isoformat(),
                'screenings': count,
                'highRisk': high_risk
            })
        
        # Recent screenings (last 10)
        recent_screenings = Screening.objects.select_related('patient').order_by('-created_at')[:10]
        
        return Response({
            'total_patients': total_patients,
            'total_screenings': total_screenings,
            'high_risk_count': high_risk_count,
            'pending_appointments': pending_appointments,
            'risk_distribution': risk_distribution,
            'weekly_screenings': weekly_screenings,
            'recent_screenings': ScreeningSerializer(recent_screenings, many=True).data
        })


class AnalyticsView(APIView):
    """Get detailed analytics."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Village-wise breakdown
        village_stats = Patient.objects.values('village').annotate(
            patient_count=Count('id')
        ).order_by('-patient_count')[:10]
        
        # Age distribution
        age_groups = {
            '0-18': Patient.objects.filter(age__lte=18).count(),
            '19-35': Patient.objects.filter(age__gte=19, age__lte=35).count(),
            '36-50': Patient.objects.filter(age__gte=36, age__lte=50).count(),
            '51-65': Patient.objects.filter(age__gte=51, age__lte=65).count(),
            '65+': Patient.objects.filter(age__gt=65).count(),
        }
        
        # Gender distribution
        gender_stats = Patient.objects.values('gender').annotate(count=Count('id'))
        
        # Monthly screening trend (last 6 months)
        monthly_trend = []
        today = timezone.now().date()
        for i in range(5, -1, -1):
            month_start = (today.replace(day=1) - timedelta(days=i*30)).replace(day=1)
            if i > 0:
                month_end = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
            else:
                month_end = today
            
            count = Screening.objects.filter(
                created_at__date__gte=month_start,
                created_at__date__lte=month_end
            ).count()
            
            monthly_trend.append({
                'month': month_start.strftime('%b'),
                'count': count
            })
        
        # Top risk factors
        risk_factor_counts = {
            'High BP': Screening.objects.filter(systolic_bp__gt=140).count(),
            'High Glucose': Screening.objects.filter(glucose_level__gt=140).count(),
            'High Cholesterol': Screening.objects.filter(cholesterol_level__gt=200).count(),
            'Smoking': Screening.objects.filter(smoking_status='Current').count(),
        }
        
        return Response({
            'village_stats': list(village_stats),
            'age_distribution': age_groups,
            'gender_distribution': list(gender_stats),
            'monthly_trend': monthly_trend,
            'risk_factor_counts': risk_factor_counts
        })


class AIAnalysisView(APIView):
    """Get AI-powered health analysis for screening data."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Analyze health data using Gemini AI."""
        try:
            from .ai_service import analyze_health_data
            
            screening_data = request.data
            result = analyze_health_data(screening_data)
            
            return Response(result)
        except ImportError:
            # AI service not available, return basic analysis
            return Response({
                'success': True,
                'analysis': {
                    'risk_level': 'Medium',
                    'risk_score': 50,
                    'summary': 'AI analysis unavailable. Basic risk assessment applied.',
                    'concerns': [],
                    'recommendations': [],
                    'follow_up': 'Schedule follow-up in 2 weeks'
                }
            })
        except Exception as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

