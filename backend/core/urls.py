from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrganizationDetailsViewSet,
    JobPostViewSet,
    ApplicationViewSet,
    InterviewViewSet,
    save_interview_results,
    get_interview_results,
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
    path('interview-results/', save_interview_results, name='save-interview-results'),
    path('interview-results/<str:interview_token>/', get_interview_results, name='get-interview-results'),
]
