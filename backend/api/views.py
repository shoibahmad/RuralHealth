from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Count, Q, Avg
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
from .permissions import IsHealthOfficer, IsHealthWorker

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
        
        # Health Workers can only see their own patients (excluding self-registered patients)
        if self.request.user.role == 'health_worker':
            queryset = queryset.filter(health_worker=self.request.user)
        
        # Health Officers can see all patients
        # Patients can only see their own profile (handled in patient-specific views)
        
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
        
        # Filter by health worker (Health Officers only)
        worker_id = self.request.query_params.get('health_worker_id', None)
        if worker_id and self.request.user.is_health_officer():
            queryset = queryset.filter(health_worker_id=worker_id)
        
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
        
        # Health Workers can only see screenings for their patients
        if self.request.user.role == 'health_worker':
            queryset = queryset.filter(patient__health_worker=self.request.user)
        
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
        
        # Trigger Gemini AI Analysis (Background or Synchronous)
        try:
            from .ai_service import analyze_health_data
            # Prepare data for AI
            ai_data = {
                'age': patient.age,
                'gender': patient.gender,
                'height_cm': data.get('height_cm'),
                'weight_kg': data.get('weight_kg'),
                'systolic_bp': systolic_bp,
                'diastolic_bp': data.get('diastolic_bp'),
                'heart_rate': data.get('heart_rate'),
                'glucose_level': glucose_level,
                'cholesterol_level': data.get('cholesterol_level'),
                'smoking_status': data.get('smoking_status'),
                'alcohol_usage': data.get('alcohol_usage'),
                'physical_activity': data.get('physical_activity'),
                'risk_level': risk_level,
                'risk_score': risk_score
            }
            
            # Get analysis from Gemini
            analysis_result = analyze_health_data(ai_data)
            
            if analysis_result.get('success'):
                # Save the formatted insights to the screening record
                screening.ai_insights = analysis_result['analysis'].get('formatted_insights')
                screening.save()
                
        except Exception as e:
            print(f"AI Analysis failed during screening creation: {e}")
        
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
        
        # Health workers only see their own appointments
        if self.request.user.role == 'health_worker':
            queryset = queryset.filter(health_worker=self.request.user)
        
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
        
        # Health workers only see recommendations for their patients
        if self.request.user.role == 'health_worker':
            patient_ids = Patient.objects.filter(health_worker=self.request.user).values_list('id', flat=True)
            queryset = queryset.filter(patient_id__in=patient_ids)
        
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
        # Filter patients based on role
        if request.user.role == 'health_worker':
            # Health workers only see their own patients
            patients = Patient.objects.filter(health_worker=request.user)
            patient_ids = patients.values_list('id', flat=True)
            screenings = Screening.objects.filter(patient_id__in=patient_ids)
            appointments = Appointment.objects.filter(health_worker=request.user)
        else:
            # Health officers see all
            patients = Patient.objects.all()
            screenings = Screening.objects.all()
            appointments = Appointment.objects.all()
        
        # Calculate statistics
        total_patients = patients.count()
        total_screenings = screenings.count()
        high_risk_count = screenings.filter(risk_level='High').values('patient').distinct().count()
        pending_appointments = appointments.filter(
            status='scheduled',
            scheduled_date__gte=timezone.now()
        ).count()
        
        # Risk distribution
        risk_counts = screenings.values('risk_level').annotate(count=Count('id'))
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
            count = screenings.filter(created_at__date=day).count()
            high_risk = screenings.filter(
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
        recent_screenings = screenings.select_related('patient').order_by('-created_at')[:10]
        
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
        # Filter patients based on role
        if request.user.role == 'health_worker':
            # Health workers only see their own patients
            patients = Patient.objects.filter(health_worker=request.user)
            patient_ids = patients.values_list('id', flat=True)
            screenings = Screening.objects.filter(patient_id__in=patient_ids)
        else:
            # Health officers see all
            patients = Patient.objects.all()
            screenings = Screening.objects.all()
        
        # Village-wise breakdown
        village_stats = patients.values('village').annotate(
            patient_count=Count('id')
        ).order_by('-patient_count')[:10]
        
        # Age distribution
        age_groups = {
            '0-18': patients.filter(age__lte=18).count(),
            '19-35': patients.filter(age__gte=19, age__lte=35).count(),
            '36-50': patients.filter(age__gte=36, age__lte=50).count(),
            '51-65': patients.filter(age__gte=51, age__lte=65).count(),
            '65+': patients.filter(age__gt=65).count(),
        }
        
        # Gender distribution
        gender_stats = patients.values('gender').annotate(count=Count('id'))
        
        # Monthly screening trend (last 6 months)
        monthly_trend = []
        today = timezone.now().date()
        for i in range(5, -1, -1):
            month_start = (today.replace(day=1) - timedelta(days=i*30)).replace(day=1)
            if i > 0:
                month_end = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
            else:
                month_end = today
            
            count = screenings.filter(
                created_at__date__gte=month_start,
                created_at__date__lte=month_end
            ).count()
            
            monthly_trend.append({
                'month': month_start.strftime('%b'),
                'count': count
            })
        
        # Top risk factors
        risk_factor_counts = {
            'High BP': screenings.filter(systolic_bp__gt=140).count(),
            'High Glucose': screenings.filter(glucose_level__gt=140).count(),
            'High Cholesterol': screenings.filter(cholesterol_level__gt=200).count(),
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





class AIVoiceVitalsView(APIView):
    """Process voice input to extract vitals using AI."""
    
    permission_classes = [IsAuthenticated]
    from rest_framework.parsers import MultiPartParser, FormParser
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        """Upload audio and extract vitals."""
        # Check for audio file
        if 'audio' not in request.FILES:
            return Response(
                {'detail': 'No audio file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        audio_file = request.FILES['audio']
        
        # Save to temp file
        import tempfile
        import os
        
        # Get extension
        suffix = '.webm'
        if audio_file.name.endswith('.mp3'):
            suffix = '.mp3'
        elif audio_file.name.endswith('.wav'):
            suffix = '.wav'
            
        temp_file_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
                for chunk in audio_file.chunks():
                    temp_file.write(chunk)
                temp_file_path = temp_file.name
                
            from .ai_service import extract_vitals_from_audio
            result = extract_vitals_from_audio(temp_file_path)
            
            # Clean up temp file
            try:
                if temp_file_path:
                    os.unlink(temp_file_path)
            except:
                pass
                
            if result.get('success'):
                # Return data
                return Response(result.get('data', {}))
            else:
                return Response(
                    {'detail': result.get('error', 'AI processing failed')},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        except Exception as e:
            # Clean up on error
            try:
                if temp_file_path and os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
            except:
                pass
                
            return Response(
                {'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ============= HEALTH OFFICER SPECIFIC VIEWS =============

class HealthWorkerListView(APIView):
    """List all health workers (Health Officers only)."""
    
    permission_classes = [IsHealthOfficer]
    
    def get(self, request):
        workers = User.objects.filter(role='health_worker').order_by('-date_joined')
        
        # Add statistics for each worker
        worker_data = []
        for worker in workers:
            patient_count = Patient.objects.filter(health_worker=worker).count()
            screening_count = Screening.objects.filter(patient__health_worker=worker).count()
            high_risk_count = Screening.objects.filter(
                patient__health_worker=worker,
                risk_level='High'
            ).count()
            
            worker_data.append({
                'id': worker.id,
                'email': worker.email,
                'full_name': worker.full_name,
                'is_active': worker.is_active,
                'date_joined': worker.date_joined,
                'stats': {
                    'total_patients': patient_count,
                    'total_screenings': screening_count,
                    'high_risk_patients': high_risk_count
                }
            })
        
        return Response(worker_data)


class HealthWorkerDetailView(APIView):
    """Get detailed information about a specific health worker (Health Officers only)."""
    
    permission_classes = [IsHealthOfficer]
    
    def get(self, request, pk):
        try:
            worker = User.objects.get(id=pk, role='health_worker')
        except User.DoesNotExist:
            return Response(
                {'detail': 'Health worker not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get worker's patients
        patients = Patient.objects.filter(health_worker=worker).order_by('-created_at')
        
        # Get worker's statistics
        total_patients = patients.count()
        total_screenings = Screening.objects.filter(patient__health_worker=worker).count()
        
        # Risk distribution
        risk_counts = Screening.objects.filter(
            patient__health_worker=worker
        ).values('risk_level').annotate(count=Count('id'))
        
        risk_distribution = {'Low': 0, 'Medium': 0, 'High': 0}
        for item in risk_counts:
            risk_distribution[item['risk_level']] = item['count']
        
        # Recent activity (last 7 days)
        week_ago = timezone.now() - timedelta(days=7)
        recent_screenings = Screening.objects.filter(
            patient__health_worker=worker,
            created_at__gte=week_ago
        ).count()
        
        # Average risk score
        avg_risk = Screening.objects.filter(
            patient__health_worker=worker
        ).aggregate(avg_score=Avg('risk_score'))['avg_score'] or 0
        
        return Response({
            'worker': {
                'id': worker.id,
                'email': worker.email,
                'full_name': worker.full_name,
                'is_active': worker.is_active,
                'date_joined': worker.date_joined
            },
            'stats': {
                'total_patients': total_patients,
                'total_screenings': total_screenings,
                'risk_distribution': risk_distribution,
                'recent_screenings_7d': recent_screenings,
                'average_risk_score': round(avg_risk, 2)
            },
            'patients': PatientSerializer(patients[:10], many=True).data
        })


class OfficerDashboardStatsView(APIView):
    """Get comprehensive dashboard statistics for Health Officers."""
    
    permission_classes = [IsHealthOfficer]
    
    def get(self, request):
        # Overall statistics
        total_patients = Patient.objects.count()
        total_screenings = Screening.objects.count()
        total_workers = User.objects.filter(role='health_worker').count()
        active_workers = User.objects.filter(role='health_worker', is_active=True).count()
        
        # Risk statistics
        high_risk_count = Screening.objects.filter(risk_level='High').values('patient').distinct().count()
        medium_risk_count = Screening.objects.filter(risk_level='Medium').values('patient').distinct().count()
        low_risk_count = Screening.objects.filter(risk_level='Low').values('patient').distinct().count()
        
        # Pending appointments
        pending_appointments = Appointment.objects.filter(
            status='scheduled',
            scheduled_date__gte=timezone.now()
        ).count()
        
        # Risk distribution
        risk_distribution = {
            'Low': low_risk_count,
            'Medium': medium_risk_count,
            'High': high_risk_count
        }
        
        # Monthly trend (last 6 months)
        monthly_data = []
        today = timezone.now().date()
        for i in range(5, -1, -1):
            month_start = (today.replace(day=1) - timedelta(days=i*30)).replace(day=1)
            if i > 0:
                month_end = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
            else:
                month_end = today
            
            screenings = Screening.objects.filter(
                created_at__date__gte=month_start,
                created_at__date__lte=month_end
            ).count()
            
            patients = Patient.objects.filter(
                created_at__date__gte=month_start,
                created_at__date__lte=month_end
            ).count()
            
            monthly_data.append({
                'month': month_start.strftime('%b %Y'),
                'screenings': screenings,
                'patients': patients
            })
        
        # Village-wise breakdown
        village_stats = Patient.objects.values('village').annotate(
            patient_count=Count('id')
        ).order_by('-patient_count')[:10]
        
        # Top performing workers
        worker_performance = []
        workers = User.objects.filter(role='health_worker', is_active=True)
        for worker in workers:
            screening_count = Screening.objects.filter(patient__health_worker=worker).count()
            if screening_count > 0:
                worker_performance.append({
                    'id': worker.id,
                    'name': worker.full_name or worker.email,
                    'screenings': screening_count
                })
        
        worker_performance = sorted(worker_performance, key=lambda x: x['screenings'], reverse=True)[:10]
        
        # Recent high-risk cases
        high_risk_cases = Screening.objects.filter(
            risk_level='High'
        ).select_related('patient').order_by('-created_at')[:10]
        
        return Response({
            'overview': {
                'total_patients': total_patients,
                'total_screenings': total_screenings,
                'total_workers': total_workers,
                'active_workers': active_workers,
                'high_risk_count': high_risk_count,
                'pending_appointments': pending_appointments
            },
            'risk_distribution': risk_distribution,
            'monthly_trend': monthly_data,
            'village_stats': list(village_stats),
            'top_workers': worker_performance,
            'recent_high_risk': ScreeningSerializer(high_risk_cases, many=True).data
        })


class AllPatientsView(APIView):
    """Get all patients across all health workers (Health Officers only)."""
    
    permission_classes = [IsHealthOfficer]
    
    def get(self, request):
        patients = Patient.objects.all().order_by('-created_at')
        
        # Apply filters
        search = request.query_params.get('search', None)
        if search:
            patients = patients.filter(
                Q(full_name__icontains=search) |
                Q(village__icontains=search) |
                Q(phone__icontains=search)
            )
        
        village = request.query_params.get('village', None)
        if village:
            patients = patients.filter(village__icontains=village)
        
        risk = request.query_params.get('risk', None)
        if risk:
            patients = patients.filter(screenings__risk_level=risk).distinct()
        
        worker_id = request.query_params.get('health_worker_id', None)
        if worker_id:
            patients = patients.filter(health_worker_id=worker_id)
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        start = (page - 1) * page_size
        end = start + page_size
        
        total = patients.count()
        patients_page = patients[start:end]
        
        return Response({
            'total': total,
            'page': page,
            'page_size': page_size,
            'results': PatientSerializer(patients_page, many=True).data
        })


class SystemAnalyticsView(APIView):
    """Get system-wide analytics (Health Officers only)."""
    
    permission_classes = [IsHealthOfficer]
    
    def get(self, request):
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
        
        # Risk factors prevalence
        total_screenings = Screening.objects.count()
        risk_factors = {
            'High Blood Pressure': Screening.objects.filter(systolic_bp__gt=140).count(),
            'High Glucose': Screening.objects.filter(glucose_level__gt=140).count(),
            'High Cholesterol': Screening.objects.filter(cholesterol_level__gt=200).count(),
            'Current Smoker': Screening.objects.filter(smoking_status='Current').count(),
            'Overweight/Obese': 0  # Would need BMI calculation
        }
        
        # Calculate percentages
        risk_factor_percentages = {}
        if total_screenings > 0:
            for factor, count in risk_factors.items():
                risk_factor_percentages[factor] = round((count / total_screenings) * 100, 1)
        
        # Screening completion rate by worker
        workers = User.objects.filter(role='health_worker')
        worker_completion = []
        for worker in workers:
            patient_count = Patient.objects.filter(health_worker=worker).count()
            screening_count = Screening.objects.filter(patient__health_worker=worker).count()
            
            if patient_count > 0:
                completion_rate = round((screening_count / patient_count) * 100, 1)
                worker_completion.append({
                    'worker_name': worker.full_name or worker.email,
                    'patients': patient_count,
                    'screenings': screening_count,
                    'completion_rate': completion_rate
                })
        
        # Geographic distribution
        geographic_data = Patient.objects.values('village').annotate(
            total=Count('id'),
            high_risk=Count('id', filter=Q(screenings__risk_level='High'))
        ).order_by('-total')
        
        return Response({
            'age_distribution': age_groups,
            'gender_distribution': list(gender_stats),
            'risk_factor_prevalence': risk_factor_percentages,
            'worker_performance': worker_completion,
            'geographic_distribution': list(geographic_data)
        })



class UpdateWorkerStatusView(APIView):
    """Update health worker status (Health Officers only)."""
    
    permission_classes = [IsHealthOfficer]
    
    def patch(self, request, pk):
        try:
            worker = User.objects.get(id=pk, role='health_worker')
        except User.DoesNotExist:
            return Response(
                {'detail': 'Health worker not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Update allowed fields
        if 'is_active' in request.data:
            worker.is_active = request.data['is_active']
        if 'full_name' in request.data:
            worker.full_name = request.data['full_name']
        
        worker.save()
        
        return Response({
            'id': worker.id,
            'email': worker.email,
            'full_name': worker.full_name,
            'is_active': worker.is_active,
            'role': worker.role
        })


class UpdatePatientView(APIView):
    """Update patient details (Health Officers only)."""
    
    permission_classes = [IsHealthOfficer]
    
    def patch(self, request, pk):
        try:
            patient = Patient.objects.get(id=pk)
        except Patient.DoesNotExist:
            return Response(
                {'detail': 'Patient not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Update allowed fields
        if 'full_name' in request.data:
            patient.full_name = request.data['full_name']
        if 'age' in request.data:
            patient.age = request.data['age']
        if 'gender' in request.data:
            patient.gender = request.data['gender']
        if 'village' in request.data:
            patient.village = request.data['village']
        if 'phone' in request.data:
            patient.phone = request.data['phone']
        if 'health_worker_id' in request.data:
            try:
                new_worker = User.objects.get(id=request.data['health_worker_id'], role='health_worker')
                patient.health_worker = new_worker
            except User.DoesNotExist:
                return Response(
                    {'detail': 'Health worker not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        patient.save()
        
        return Response(PatientSerializer(patient).data)


class PatientHistoryView(APIView):
    """Get patient's complete screening history."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        try:
            patient = Patient.objects.get(id=pk)
        except Patient.DoesNotExist:
            return Response(
                {'detail': 'Patient not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permissions
        if request.user.role == 'health_worker' and patient.health_worker != request.user:
            return Response(
                {'detail': 'You do not have permission to view this patient'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all screenings for this patient
        screenings = Screening.objects.filter(patient=patient).order_by('-created_at')
        
        # Get appointments
        appointments = Appointment.objects.filter(patient=patient).order_by('-scheduled_date')
        
        # Get recommendations
        recommendations = Recommendation.objects.filter(patient=patient).order_by('-created_at')
        
        return Response({
            'patient': PatientSerializer(patient).data,
            'screenings': ScreeningSerializer(screenings, many=True).data,
            'appointments': AppointmentSerializer(appointments, many=True).data,
            'recommendations': RecommendationSerializer(recommendations, many=True).data,
            'total_screenings': screenings.count(),
            'latest_screening': ScreeningSerializer(screenings.first()).data if screenings.exists() else None
        })



class UpdateProfileView(APIView):
    """Update user profile information."""
    
    permission_classes = [IsAuthenticated]
    
    def patch(self, request):
        user = request.user
        
        # Update allowed fields
        if 'full_name' in request.data:
            user.full_name = request.data['full_name']
        
        email_changed = False
        if 'email' in request.data and request.data['email'] != user.email:
            # Check if email already exists
            if User.objects.filter(email=request.data['email']).exclude(id=user.id).exists():
                return Response(
                    {'detail': 'Email already in use'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.email = request.data['email']
            user.username = request.data['email']  # Update username as well
            email_changed = True
        
        user.save()
        
        response_data = {
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'role': user.role
        }
        
        # If email changed, generate new token
        if email_changed:
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(user)
            response_data['new_token'] = str(refresh.access_token)
        
        return Response(response_data)


class ChangePasswordView(APIView):
    """Change user password."""
    
    permission_classes = [IsAuthenticated]
    
    def patch(self, request):
        user = request.user
        
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not current_password or not new_password:
            return Response(
                {'detail': 'Current password and new password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify current password
        if not user.check_password(current_password):
            return Response(
                {'detail': 'Current password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate new password
        if len(new_password) < 6:
            return Response(
                {'detail': 'New password must be at least 6 characters long'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        return Response({
            'detail': 'Password changed successfully'
        })


# ============= PATIENT PORTAL VIEWS =============

class PatientDashboardView(APIView):
    """Get patient's own dashboard data."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from .permissions import IsPatient
        
        # Check if user is a patient
        if request.user.role != 'patient':
            return Response(
                {'detail': 'Access denied. Patient role required.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            patient = request.user.patient_profile
        except:
            return Response(
                {'detail': 'Patient profile not found. Please complete your profile.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get screening history
        screenings = Screening.objects.filter(patient=patient).order_by('-created_at')
        latest_screening = screenings.first()
        
        # Get appointments
        upcoming_appointments = Appointment.objects.filter(
            patient=patient,
            status='scheduled',
            scheduled_date__gte=timezone.now()
        ).order_by('scheduled_date')
        
        # Get recommendations
        active_recommendations = Recommendation.objects.filter(
            patient=patient,
            is_completed=False
        ).order_by('-priority', '-created_at')
        
        return Response({
            'patient': PatientSerializer(patient).data,
            'total_screenings': screenings.count(),
            'latest_screening': ScreeningSerializer(latest_screening).data if latest_screening else None,
            'upcoming_appointments': AppointmentSerializer(upcoming_appointments, many=True).data,
            'active_recommendations': RecommendationSerializer(active_recommendations[:5], many=True).data,
        })


class PatientSelfScreeningView(APIView):
    """Patient creates their own screening."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        if request.user.role != 'patient':
            return Response(
                {'detail': 'Access denied. Patient role required.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            patient = request.user.patient_profile
        except:
            return Response(
                {'detail': 'Patient profile not found. Please complete your profile.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create screening with patient's data
        data = request.data.copy()
        data['patient'] = patient.id
        
        serializer = ScreeningCreateSerializer(data=data)
        if serializer.is_valid():
            screening = serializer.save()
            return Response(
                ScreeningSerializer(screening).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PatientScreeningHistoryView(APIView):
    """Get patient's own screening history."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'patient':
            return Response(
                {'detail': 'Access denied. Patient role required.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            patient = request.user.patient_profile
        except:
            return Response(
                {'detail': 'Patient profile not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        screenings = Screening.objects.filter(patient=patient).order_by('-created_at')
        appointments = Appointment.objects.filter(patient=patient).order_by('-scheduled_date')
        recommendations = Recommendation.objects.filter(patient=patient).order_by('-created_at')
        
        return Response({
            'patient': PatientSerializer(patient).data,
            'screenings': ScreeningSerializer(screenings, many=True).data,
            'appointments': AppointmentSerializer(appointments, many=True).data,
            'recommendations': RecommendationSerializer(recommendations, many=True).data,
        })


class PatientProfileSetupView(APIView):
    """Create or update patient profile for logged-in user."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        if request.user.role != 'patient':
            return Response(
                {'detail': 'Access denied. Patient role required.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if profile already exists
        try:
            patient = request.user.patient_profile
            # Update existing profile
            serializer = PatientSerializer(patient, data=request.data, partial=True)
        except:
            # Create new profile
            data = request.data.copy()
            data['user'] = request.user.id
            serializer = PatientSerializer(data=data)
        
        if serializer.is_valid():
            patient = serializer.save()
            return Response(
                PatientSerializer(patient).data,
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get(self, request):
        """Get current patient profile."""
        if request.user.role != 'patient':
            return Response(
                {'detail': 'Access denied. Patient role required.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            patient = request.user.patient_profile
            return Response(PatientSerializer(patient).data)
        except:
            return Response(
                {'detail': 'Patient profile not found. Please complete your profile.'},
                status=status.HTTP_404_NOT_FOUND
            )
