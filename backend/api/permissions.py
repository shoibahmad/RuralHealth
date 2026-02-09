from rest_framework import permissions


class IsHealthOfficer(permissions.BasePermission):
    """Permission for Health Officers only."""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['health_officer', 'admin']
        )


class IsHealthWorker(permissions.BasePermission):
    """Permission for Health Workers."""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'health_worker'
        )


class IsHealthOfficerOrReadOnly(permissions.BasePermission):
    """Health Officers have full access, others read-only."""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return request.user.role in ['health_officer', 'admin']


class IsPatient(permissions.BasePermission):
    """Permission for Patients only."""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'patient'
        )
