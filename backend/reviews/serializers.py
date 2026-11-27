from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    created_formatted = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            'id',
            'customer_name',
            'customer_role',
            'rating',
            'tagline',
            'comment',
            'favorite_burger',
            'is_approved',
            'created_at',
            'created_formatted',
        ]
        read_only_fields = ['id', 'is_approved', 'created_at', 'created_formatted']

    def get_created_formatted(self, obj):
        return obj.created_at.strftime('%b %d, %Y')
