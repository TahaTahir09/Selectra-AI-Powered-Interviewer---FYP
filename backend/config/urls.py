"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from core.cv_api import parse_cv_api, parse_cv_text, test_cv_endpoint

def api_root(request):
    return JsonResponse({
        'message': 'Selectra AI Interview API',
        'version': '1.0',
        'endpoints': {
            'admin': '/admin/',
            'auth': '/api/users/auth/',
            'jobs': '/api/jobs/',
            'applications': '/api/applications/',
            'interviews': '/api/interviews/',
            'cv_parsing': '/api/parse-cv/',
        }
    })

urlpatterns = [
    path('', api_root, name='api_root'),
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/core/', include('core.urls')),
    # CV Parsing endpoints (direct access without /core/ prefix)
    path('api/parse-cv/', parse_cv_api, name='parse-cv'),
    path('api/parse-cv-text/', parse_cv_text, name='parse-cv-text'),
    path('api/test-cv/', test_cv_endpoint, name='test-cv'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
