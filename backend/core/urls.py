from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrganizationDetailsViewSet,
    JobPostViewSet,
    ApplicationViewSet,
    InterviewViewSet,
)
from .cv_api import parse_cv_api, parse_cv_text, test_cv_endpoint

router = DefaultRouter()
router.register(r'organizations', OrganizationDetailsViewSet, basename='organization')
router.register(r'jobs', JobPostViewSet, basename='job')
router.register(r'applications', ApplicationViewSet, basename='application')
router.register(r'interviews', InterviewViewSet, basename='interview')

urlpatterns = [
    path('', include(router.urls)),
    path('test-cv/', test_cv_endpoint, name='test-cv'),
    path('parse-cv/', parse_cv_api, name='parse-cv'),
    path('parse-cv-text/', parse_cv_text, name='parse-cv-text'),
]
