from django.urls import path
from .views import (
    DeliveryTrackingView,
    StaffUpdateStatusView,
    VerifyDeliveryOtpView,
    DeliveryPartnerPickupView,
    DeliveryOrdersListView
)

urlpatterns = [
    path('orders/', DeliveryOrdersListView.as_view(), name='delivery-orders-list'),
    path('<str:order_number>/', DeliveryTrackingView.as_view(), name='delivery-tracking'),
    path('<str:order_number>/status/', StaffUpdateStatusView.as_view(), name='staff-update-status'),
    path('<str:order_number>/verify-otp/', VerifyDeliveryOtpView.as_view(), name='delivery-verify-otp'),
    path('<str:order_number>/pickup/', DeliveryPartnerPickupView.as_view(), name='delivery-pickup'),
]
