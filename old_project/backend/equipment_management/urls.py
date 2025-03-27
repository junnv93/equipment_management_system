# equipment_management/urls.py
from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.reverse import reverse
from django.conf import settings
from django.conf.urls.static import static
from django.views.decorators.csrf import csrf_exempt

@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request, format=None):
    return Response({
        'users': reverse('user-list', request=request, format=format),
        'equipment': reverse('equipment-list', request=request, format=format),
        'loans': reverse('equipmentloan-list', request=request, format=format),
        'checkouts': reverse('equipmentcheckout-list', request=request, format=format),
        'dashboard': reverse('dashboard-list', request=request, format=format),
        'notifications': reverse('notification-list', request=request, format=format),
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('equipment.urls')),  # 'api/' 경로로 모든 equipment.urls 포함
    path('api-root/', api_root, name='api-root'),  # 인증 없이 접근 가능한 API 루트
    path('', RedirectView.as_view(url='/admin/', permanent=False)),  # 루트 URL을 /admin/으로 리다이렉트
]

# 미디어 파일 URL 설정 추가
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    import debug_toolbar
    urlpatterns = [
        path('__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns