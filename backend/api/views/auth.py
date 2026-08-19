"""Registration, login and account-management endpoints."""
from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..responses import first_error_message
from ..serializers import (
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    UpdateProfileSerializer,
    UserCreateSerializer,
    UserSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """User registration endpoint."""

    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'detail': first_error_message(serializer.errors)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """User login endpoint - returns a JWT access token."""

    permission_classes = [AllowAny]

    def post(self, request):
        # OAuth2PasswordRequestForm posts the email under 'username'.
        email = request.data.get('username') or request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {'detail': 'Email and password are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = CustomTokenObtainPairSerializer(
            data={'email': email, 'password': password}
        )

        if not serializer.is_valid():
            return Response(
                {'detail': 'Incorrect email or password'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response(serializer.validated_data)


class CurrentUserView(APIView):
    """Get the currently authenticated user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class UpdateProfileView(APIView):
    """Update the authenticated user's profile information."""

    permission_classes = [IsAuthenticated]

    def patch(self, request):
        user = request.user
        serializer = UpdateProfileSerializer(
            user, data=request.data, partial=True, context={'request': request}
        )
        if not serializer.is_valid():
            return Response(
                {'detail': first_error_message(serializer.errors)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_email = serializer.validated_data.get('email')
        email_changed = bool(new_email) and new_email != user.email

        if email_changed:
            # Username mirrors email for this project's auth model.
            user.username = new_email

        user = serializer.save()

        response_data = {
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'role': user.role,
        }

        # The JWT embeds the email claim, so a changed email invalidates it.
        if email_changed:
            from rest_framework_simplejwt.tokens import RefreshToken

            refresh = RefreshToken.for_user(user)
            response_data['new_token'] = str(refresh.access_token)

        return Response(response_data)


class ChangePasswordView(APIView):
    """Change the authenticated user's password."""

    permission_classes = [IsAuthenticated]

    def patch(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={'request': request}
        )
        if not serializer.is_valid():
            return Response(
                {'detail': first_error_message(serializer.errors)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        return Response({'detail': 'Password changed successfully'})
