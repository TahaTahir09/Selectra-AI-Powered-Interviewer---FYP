from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Profile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Basic user serializer for displaying user information.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'user_type', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class ProfileSerializer(serializers.ModelSerializer):
    """
    Profile serializer with user information.
    """
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Profile
        fields = ['user', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration (both candidates and organizations).
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name', 'user_type']
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
        }
    
    def validate(self, attrs):
        """
        Validate that passwords match.
        """
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def validate_email(self, value):
        """
        Validate email uniqueness.
        """
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def create(self, validated_data):
        """
        Create user with hashed password.
        """
        validated_data.pop('password2')
        user_type = validated_data.get('user_type', 'candidate')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            user_type=user_type
        )
        
        # Create associated profile
        Profile.objects.create(user=user)
        
        # Create OrganizationDetails if user is an organization
        if user_type == 'organization':
            from core.models import OrganizationDetails
            OrganizationDetails.objects.create(
                user=user,
                organization_name=validated_data.get('first_name', user.username),
                address='',  # Can be updated later
                contact_number='',
                contact_person=user.username
            )
        
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Serializer for user login.
    """
    username = serializers.CharField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for password change.
    """
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    new_password2 = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs
