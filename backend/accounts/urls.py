from django.urls import path
from .views import (
    RegisterView, LoginView, LogoutView, CurrentUserView,
    AddressListCreateView, AddressDetailView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', CurrentUserView.as_view(), name='auth-me'),
    path('addresses/', AddressListCreateView.as_view(), name='auth-addresses'),
    path('addresses/<int:pk>/', AddressDetailView.as_view(), name='auth-address-detail'),
]
