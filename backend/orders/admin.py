from django.contrib import admin
from django.utils.html import format_html
from .models import Order, OrderItem, OrderStatusHistory, Coupon

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    fields = ('product_name', 'unit_price', 'quantity', 'total_price')
    readonly_fields = ('product_name', 'unit_price', 'quantity', 'total_price')

class OrderStatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    fields = ('status', 'note', 'created_at')
    readonly_fields = ('created_at',)

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'order_number', 'customer_name', 'customer_phone', 'total_amount_display',
        'payment_badge', 'status_badge', 'created_at'
    )
    list_filter = ('status', 'payment_status', 'payment_method', 'created_at')
    search_fields = ('order_number', 'customer_name', 'customer_phone', 'customer_email', 'delivery_address')
    readonly_fields = (
        'order_number', 'created_at', 'updated_at', 'subtotal',
        'delivery_fee', 'discount_amount', 'total_amount'
    )
    inlines = [OrderItemInline, OrderStatusHistoryInline]
    actions = [
        'mark_confirmed', 'mark_preparing', 'mark_ready',
        'mark_out_for_delivery', 'mark_delivered', 'mark_paid'
    ]

    fieldsets = (
        ('Order Identification', {
            'fields': ('order_number', 'user', 'status', 'estimated_delivery_time', 'created_at', 'updated_at')
        }),
        ('Customer & Delivery Information', {
            'fields': ('customer_name', 'customer_email', 'customer_phone', 'delivery_address', 'city', 'state', 'postal_code', 'delivery_instructions')
        }),
        ('Payment Details', {
            'fields': ('payment_method', 'payment_status', 'coupon', 'subtotal', 'delivery_fee', 'discount_amount', 'total_amount')
        }),
    )

    def total_amount_display(self, obj):
        return f"${obj.total_amount:.2f}"
    total_amount_display.short_description = 'Total'

    def status_badge(self, obj):
        colors = {
            Order.STATUS_PLACED: '#3b82f6', # blue
            Order.STATUS_CONFIRMED: '#6366f1', # indigo
            Order.STATUS_PREPARING: '#f59e0b', # amber
            Order.STATUS_READY: '#8b5cf6', # purple
            Order.STATUS_OUT_FOR_DELIVERY: '#06b6d4', # cyan
            Order.STATUS_DELIVERED: '#10b981', # green
            Order.STATUS_CANCELLED: '#ef4444', # red
            Order.STATUS_FAILED: '#6b7280', # gray
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'

    def payment_badge(self, obj):
        color = '#10b981' if obj.payment_status == Order.PAY_STATUS_PAID else '#f59e0b'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{} ({})</span>',
            color, obj.get_payment_status_display(), obj.payment_method
        )
    payment_badge.short_description = 'Payment'

    # Admin Actions for Order Lifecycle Management
    @admin.action(description="Set status: Order Confirmed")
    def mark_confirmed(self, request, queryset):
        for order in queryset:
            order.status = Order.STATUS_CONFIRMED
            order.save()
            order.add_status_history(Order.STATUS_CONFIRMED, note=f"Confirmed by staff {request.user.username}")

    @admin.action(description="Set status: Preparing")
    def mark_preparing(self, request, queryset):
        for order in queryset:
            order.status = Order.STATUS_PREPARING
            order.save()
            order.add_status_history(Order.STATUS_PREPARING, note="Kitchen started patty smash & assembly.")

    @admin.action(description="Set status: Ready for Pickup")
    def mark_ready(self, request, queryset):
        for order in queryset:
            order.status = Order.STATUS_READY
            order.save()
            order.add_status_history(Order.STATUS_READY, note="Order bagged and ready for rider.")

    @admin.action(description="Set status: Out for Delivery")
    def mark_out_for_delivery(self, request, queryset):
        for order in queryset:
            order.status = Order.STATUS_OUT_FOR_DELIVERY
            order.save()
            order.add_status_history(Order.STATUS_OUT_FOR_DELIVERY, note="Rider picked up and is en route.")

    @admin.action(description="Set status: Delivered")
    def mark_delivered(self, request, queryset):
        for order in queryset:
            order.status = Order.STATUS_DELIVERED
            if order.payment_method == Order.PAYMENT_COD:
                order.payment_status = Order.PAY_STATUS_PAID
            order.save()
            order.add_status_history(Order.STATUS_DELIVERED, note="Delivered to customer doorstep.")

    @admin.action(description="Mark Payment as Paid (COD Collected)")
    def mark_paid(self, request, queryset):
        queryset.update(payment_status=Order.PAY_STATUS_PAID)

@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_type', 'value', 'min_order_amount', 'times_used', 'is_active', 'valid_until')
    list_filter = ('discount_type', 'is_active')
    search_fields = ('code',)
