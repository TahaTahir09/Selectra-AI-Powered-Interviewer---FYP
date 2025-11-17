from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import UserRegistrationView, UserProfileView

urlpatterns = [
    # Authentication
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Registration
    path('register/', UserRegistrationView.as_view(), name='user_register'),
    
    # Profile
    path('profile/', UserProfileView.as_view(), name='user_profile'),
]
