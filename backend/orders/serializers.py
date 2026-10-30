from rest_framework import serializers
from decimal import Decimal
from .models import Order, OrderItem, OrderStatusHistory, Coupon
from menu.models import Product

class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = ['code', 'discount_type', 'value', 'min_order_amount', 'is_active']

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_image', 'unit_price', 'quantity', 'total_price']
        read_only_fields = ['id', 'product_name', 'product_image', 'unit_price', 'total_price']

class OrderStatusHistorySerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = OrderStatusHistory
        fields = ['id', 'status', 'status_display', 'note', 'created_at']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    can_cancel = serializers.BooleanField(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer_name', 'customer_email', 'customer_phone',
            'delivery_address', 'city', 'state', 'postal_code', 'delivery_instructions',
            'subtotal', 'delivery_fee', 'discount_amount', 'total_amount',
            'status', 'status_display', 'payment_method', 'payment_method_display',
            'payment_status', 'items', 'status_history', 'estimated_delivery_time',
            'can_cancel', 'delivery_otp', 'assigned_delivery_partner', 'delivery_partner_phone',
            'delivered_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'order_number', 'subtotal', 'delivery_fee', 'discount_amount',
            'total_amount', 'status', 'status_display', 'payment_status', 'items',
            'status_history', 'estimated_delivery_time', 'can_cancel', 'delivery_otp',
            'delivered_at', 'created_at', 'updated_at'
        ]

class CreateOrderInputItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)

class CreateOrderSerializer(serializers.Serializer):
    customer_name = serializers.CharField(max_length=150)
    customer_email = serializers.EmailField(required=False, allow_blank=True)
    customer_phone = serializers.CharField(max_length=20)
    delivery_address = serializers.CharField()
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100, required=False, allow_blank=True)
    postal_code = serializers.CharField(max_length=20)
    delivery_instructions = serializers.CharField(required=False, allow_blank=True)
    payment_method = serializers.ChoiceField(choices=Order.PAYMENT_METHOD_CHOICES, default=Order.PAYMENT_COD)
    coupon_code = serializers.CharField(required=False, allow_blank=True)
    items = CreateOrderInputItemSerializer(many=True, required=False)
    idempotency_key = serializers.CharField(required=False, allow_blank=True)
