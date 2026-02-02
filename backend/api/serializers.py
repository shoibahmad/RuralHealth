from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from .models import Patient, Screening, Appointment, Recommendation

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user details."""
    
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'role', 'is_active']
        read_only_fields = ['id', 'is_active']


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    
    password = serializers.CharField(write_only=True, min_length=6)
    
    class Meta:
        model = User
        fields = ['email', 'full_name', 'password', 'role']
    
    def create(self, validated_data):
        # Use email as username
        email = validated_data['email']
        user = User.objects.create_user(
            username=email,
            email=email,
            password=validated_data['password'],
            full_name=validated_data.get('full_name', ''),
            role=validated_data.get('role', 'health_worker')
        )
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom token serializer to include user data and use email."""
    
    username_field = 'email'
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims to match FastAPI JWT structure
        token['sub'] = user.email
        token['email'] = user.email
        token['full_name'] = user.full_name or ''
        token['role'] = user.role
        
        return token
    
    def validate(self, attrs):
        # Use email field for authentication
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            try:
                user = User.objects.get(email=email)
                if not user.check_password(password):
                    raise serializers.ValidationError('Incorrect email or password')
                if not user.is_active:
                    raise serializers.ValidationError('User is not active')
            except User.DoesNotExist:
                raise serializers.ValidationError('Incorrect email or password')
            
            refresh = self.get_token(user)
            
            return {
                'access_token': str(refresh.access_token),
                'token_type': 'bearer',
            }
        
        raise serializers.ValidationError('Email and password are required')


class PatientSerializer(serializers.ModelSerializer):
    """Serializer for patient details."""
    
    health_worker_id = serializers.IntegerField(source='health_worker.id', read_only=True)
    screening_count = serializers.SerializerMethodField()
    latest_risk_level = serializers.SerializerMethodField()
    
    class Meta:
        model = Patient
        fields = [
            'id', 'health_worker_id', 'full_name', 'age', 
            'gender', 'village', 'phone', 'created_at',
            'screening_count', 'latest_risk_level'
        ]
        read_only_fields = ['id', 'health_worker_id', 'created_at']
    
    def get_screening_count(self, obj):
        return obj.screenings.count()
    
    def get_latest_risk_level(self, obj):
        latest = obj.screenings.order_by('-created_at').first()
        return latest.risk_level if latest else None


class PatientCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating patients."""
    
    class Meta:
        model = Patient
        fields = ['full_name', 'age', 'gender', 'village', 'phone']


class ScreeningSerializer(serializers.ModelSerializer):
    """Serializer for screening details."""
    
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    
    class Meta:
        model = Screening
        fields = [
            'id', 'patient_id', 'patient_name', 'height_cm', 'weight_kg', 
            'systolic_bp', 'diastolic_bp', 'heart_rate',
            'smoking_status', 'alcohol_usage', 'physical_activity',
            'glucose_level', 'cholesterol_level',
            'risk_score', 'risk_level', 'risk_notes', 'created_at'
        ]
        read_only_fields = ['id', 'risk_score', 'risk_level', 'risk_notes', 'created_at']


class ScreeningCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating screenings."""
    
    patient_id = serializers.IntegerField()
    
    class Meta:
        model = Screening
        fields = [
            'patient_id', 'height_cm', 'weight_kg', 
            'systolic_bp', 'diastolic_bp', 'heart_rate',
            'smoking_status', 'alcohol_usage', 'physical_activity',
            'glucose_level', 'cholesterol_level'
        ]
    
    def validate_patient_id(self, value):
        if not Patient.objects.filter(id=value).exists():
            raise serializers.ValidationError('Patient not found')
        return value


class AppointmentSerializer(serializers.ModelSerializer):
    """Serializer for appointment details."""
    
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    health_worker_name = serializers.CharField(source='health_worker.full_name', read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'patient_name', 'health_worker', 'health_worker_name',
            'scheduled_date', 'reason', 'notes', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'health_worker', 'created_at', 'updated_at']


class AppointmentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating appointments."""
    
    class Meta:
        model = Appointment
        fields = ['patient', 'scheduled_date', 'reason', 'notes']


class RecommendationSerializer(serializers.ModelSerializer):
    """Serializer for recommendation details."""
    
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    
    class Meta:
        model = Recommendation
        fields = [
            'id', 'patient', 'patient_name', 'screening', 'category',
            'title', 'description', 'priority', 'is_completed', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class PatientDetailSerializer(serializers.ModelSerializer):
    """Detailed patient serializer with screenings and appointments."""
    
    health_worker_id = serializers.IntegerField(source='health_worker.id', read_only=True)
    health_worker_name = serializers.CharField(source='health_worker.full_name', read_only=True)
    screenings = ScreeningSerializer(many=True, read_only=True)
    appointments = AppointmentSerializer(many=True, read_only=True)
    recommendations = RecommendationSerializer(many=True, read_only=True)
    
    class Meta:
        model = Patient
        fields = [
            'id', 'health_worker_id', 'health_worker_name', 'full_name', 'age', 
            'gender', 'village', 'phone', 'created_at',
            'screenings', 'appointments', 'recommendations'
        ]


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics."""
    
    total_patients = serializers.IntegerField()
    total_screenings = serializers.IntegerField()
    high_risk_count = serializers.IntegerField()
    pending_appointments = serializers.IntegerField()
    recent_screenings = ScreeningSerializer(many=True)
    risk_distribution = serializers.DictField()
    weekly_screenings = serializers.ListField()

