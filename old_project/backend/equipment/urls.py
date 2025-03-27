#equipment/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (UserViewSet, EquipmentViewSet, EquipmentLoanViewSet, 
                    DashboardViewSet, NotificationViewSet, EquipmentCheckoutViewSet)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'equipment', EquipmentViewSet)
router.register(r'loans', EquipmentLoanViewSet)
router.register(r'checkouts', EquipmentCheckoutViewSet)
router.register(r'dashboard', DashboardViewSet, basename='dashboard')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]