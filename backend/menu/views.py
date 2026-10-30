from rest_framework import generics, permissions, filters, status
from rest_framework.response import Response
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer

class CategoryListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = Category.objects.filter(is_active=True).order_by('display_order', 'name')
    serializer_class = CategorySerializer

class ProductListView(generics.ListCreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ProductSerializer

    def get_queryset(self):
        show_all = self.request.query_params.get('all') == 'true' or self.request.query_params.get('include_unavailable') == 'true'
        is_available_param = self.request.query_params.get('is_available')

        if show_all:
            queryset = Product.objects.all()
        elif is_available_param is not None:
            queryset = Product.objects.filter(is_available=is_available_param.lower() in ('true', '1'))
        else:
            # Default returns all products so UI can show sold-out states and admin can manage
            queryset = Product.objects.all()

        category_slug = self.request.query_params.get('category')
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        featured = self.request.query_params.get('featured')
        if featured is not None:
            queryset = queryset.filter(is_featured=featured.lower() in ('true', '1'))
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search) | queryset.filter(description__icontains=search)
        return queryset

class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    lookup_field = 'id'
