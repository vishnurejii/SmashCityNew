from django.contrib import admin
from .models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'payment_method', 'amount', 'currency', 'status', 'razorpay_payment_id', 'created_at')
    list_filter = ('status', 'payment_method', 'currency', 'created_at')
    search_fields = ('order__order_number', 'razorpay_order_id', 'razorpay_payment_id')
    readonly_fields = ('order', 'payment_method', 'amount', 'currency', 'razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature', 'created_at', 'updated_at')
