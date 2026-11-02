from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def api_root_view(request):
    return JsonResponse({
        'status': 'online',
        'service': 'SmashCity Backend API',
        'version': '1.0.0',
        'message': 'SmashCity REST API is up and running successfully!',
        'endpoints': {
            'menu': '/api/menu/products/',
            'orders': '/api/orders/',
            'delivery': '/api/delivery/orders/',
            'admin': '/admin/',
        }
    })

urlpatterns = [
    path('', api_root_view, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/menu/', include('menu.urls')),
    path('api/cart/', include('cart.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/delivery/', include('delivery.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

admin.site.site_header = "SmashCity Administration"
admin.site.site_title = "SmashCity Admin Portal"
admin.site.index_title = "SmashCity Operations Dashboard"
