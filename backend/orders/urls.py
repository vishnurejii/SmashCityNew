from django.urls import path
from .views import (
    OrderListCreateView, OrderDetailView, CancelOrderView, ValidateCouponView
)

urlpatterns = [
    path('', OrderListCreateView.as_view(), name='order-list-create'),
    path('validate-coupon/', ValidateCouponView.as_view(), name='validate-coupon'),
    path('<str:order_number>/', OrderDetailView.as_view(), name='order-detail'),
    path('<str:order_number>/cancel/', CancelOrderView.as_view(), name='order-cancel'),
]
