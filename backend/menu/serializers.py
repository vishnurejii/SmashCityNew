from rest_framework import serializers
from .models import Category, Product

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'display_order', 'is_active']

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    image = serializers.SerializerMethodField()
    slug = serializers.CharField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category', 'category_name', 'category_slug',
            'type_label', 'description', 'price', 'image', 'image_url', 'ingredients',
            'is_vegetarian', 'is_featured', 'is_available', 'stock_count'
        ]

    def get_image(self, obj):
        request = self.context.get('request')
        url = obj.effective_image_url
        if obj.image and request:
            return request.build_absolute_uri(url)
        return url
