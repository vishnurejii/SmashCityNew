import uuid
from decimal import Decimal
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from menu.models import Product

class Coupon(models.Model):
    PERCENTAGE = 'PERCENTAGE'
    FIXED = 'FIXED'
    DISCOUNT_TYPES = (
        (PERCENTAGE, 'Percentage Discount'),
        (FIXED, 'Fixed Amount Discount'),
    )

    code = models.CharField(max_length=50, unique=True)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPES, default=PERCENTAGE)
    value = models.DecimalField(max_digits=6, decimal_places=2, help_text="Percentage (e.g. 10.00 for 10%) or Fixed dollar amount")
    min_order_amount = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))
    max_discount_amount = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    valid_from = models.DateTimeField(default=timezone.now)
    valid_until = models.DateTimeField(null=True, blank=True)
    usage_limit = models.PositiveIntegerField(default=1000)
    times_used = models.PositiveIntegerField(default=0)

    def is_valid_for(self, subtotal):
        if not self.is_active:
            return False, "This coupon is not active."
        now = timezone.now()
        if self.valid_from and now < self.valid_from:
            return False, "This coupon is not yet valid."
        if self.valid_until and now > self.valid_until:
            return False, "This coupon has expired."
        if self.times_used >= self.usage_limit:
            return False, "This coupon has reached its usage limit."
        if subtotal < self.min_order_amount:
            return False, f"Minimum order of ${self.min_order_amount:.2f} required for this coupon."
        return True, "Coupon is valid."

    def calculate_discount(self, subtotal):
        valid, _ = self.is_valid_for(subtotal)
        if not valid:
            return Decimal('0.00')

        if self.discount_type == self.PERCENTAGE:
            discount = (subtotal * self.value) / Decimal('100.00')
        else:
            discount = self.value

        if self.max_discount_amount and discount > self.max_discount_amount:
            discount = self.max_discount_amount

        return min(discount, subtotal).quantize(Decimal('0.01'))

    def __str__(self):
        return f"{self.code} ({self.discount_type}: {self.value})"

class Order(models.Model):
    # Order Status Choices
    STATUS_PLACED = 'ORDER_PLACED'
    STATUS_CONFIRMED = 'ORDER_CONFIRMED'
    STATUS_PREPARING = 'PREPARING'
    STATUS_READY = 'READY_FOR_PICKUP'
    STATUS_OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY'
    STATUS_DELIVERED = 'DELIVERED'
    STATUS_CANCELLED = 'CANCELLED'
    STATUS_FAILED = 'FAILED'

    ORDER_STATUS_CHOICES = (
        (STATUS_PLACED, 'Order Placed'),
        (STATUS_CONFIRMED, 'Order Confirmed'),
        (STATUS_PREPARING, 'Preparing'),
        (STATUS_READY, 'Ready for Pickup'),
        (STATUS_OUT_FOR_DELIVERY, 'Out for Delivery'),
        (STATUS_DELIVERED, 'Delivered'),
        (STATUS_CANCELLED, 'Cancelled'),
        (STATUS_FAILED, 'Failed'),
    )

    # Payment Methods
    PAYMENT_COD = 'COD'
    PAYMENT_RAZORPAY = 'RAZORPAY'
    PAYMENT_METHOD_CHOICES = (
        (PAYMENT_COD, 'Cash on Delivery'),
        (PAYMENT_RAZORPAY, 'Online Payment (Razorpay)'),
    )

    # Payment Status
    PAY_STATUS_PENDING = 'PENDING'
    PAY_STATUS_PAID = 'PAID'
    PAY_STATUS_FAILED = 'FAILED'
    PAY_STATUS_REFUNDED = 'REFUNDED'
    PAYMENT_STATUS_CHOICES = (
        (PAY_STATUS_PENDING, 'Pending'),
        (PAY_STATUS_PAID, 'Paid'),
        (PAY_STATUS_FAILED, 'Failed'),
        (PAY_STATUS_REFUNDED, 'Refunded'),
    )

    order_number = models.CharField(max_length=64, unique=True, editable=False, db_index=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    
    # Customer Info Snapshot
    customer_name = models.CharField(max_length=150)
    customer_email = models.EmailField(blank=True, default='')
    customer_phone = models.CharField(max_length=20)
    
    # Delivery Address Snapshot
    delivery_address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100, blank=True, default='')
    postal_code = models.CharField(max_length=20)
    delivery_instructions = models.TextField(blank=True, default='')

    # Monetary Breakdown
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_fee = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal('2.00'))
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)

    # Coupon applied
    coupon = models.ForeignKey(Coupon, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')

    # Status & Payment
    status = models.CharField(max_length=30, choices=ORDER_STATUS_CHOICES, default=STATUS_PLACED)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default=PAYMENT_COD)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default=PAY_STATUS_PENDING)

    # Idempotency token to prevent double-charging or duplicate submissions
    idempotency_key = models.CharField(max_length=100, blank=True, null=True, unique=True)

    # Delivery Assignment & OTP Verification
    delivery_otp = models.CharField(max_length=6, blank=True, default='')
    assigned_delivery_partner = models.CharField(max_length=120, blank=True, default='')
    delivery_partner_phone = models.CharField(max_length=30, blank=True, default='')
    delivered_at = models.DateTimeField(null=True, blank=True)

    # Timestamps
    estimated_delivery_time = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.order_number:
            date_str = timezone.now().strftime('%Y%m%d')
            unique_suffix = uuid.uuid4().hex[:6].upper()
            self.order_number = f"SC-{date_str}-{unique_suffix}"

        if not self.delivery_otp:
            import random
            self.delivery_otp = f"{random.randint(1000, 9999)}"
        
        # Set estimated delivery time 35-45 minutes from creation
        if not self.estimated_delivery_time and self.created_at:
            self.estimated_delivery_time = self.created_at + timezone.timedelta(minutes=40)
        elif not self.estimated_delivery_time:
            self.estimated_delivery_time = timezone.now() + timezone.timedelta(minutes=40)

        super().save(*args, **kwargs)

    def can_cancel(self):
        return self.status in [self.STATUS_PLACED, self.STATUS_CONFIRMED]

    def add_status_history(self, new_status, note=''):
        OrderStatusHistory.objects.create(
            order=self,
            status=new_status,
            note=note
        )

    def __str__(self):
        return f"{self.order_number} - {self.customer_name} (${self.total_amount})"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    product_name = models.CharField(max_length=150)
    product_image = models.CharField(max_length=255, blank=True, default='')
    unit_price = models.DecimalField(max_digits=8, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    def save(self, *args, **kwargs):
        self.total_price = (self.unit_price * self.quantity).quantize(Decimal('0.01'))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity}x {self.product_name} in {self.order.order_number}"

class OrderStatusHistory(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    status = models.CharField(max_length=30, choices=Order.ORDER_STATUS_CHOICES)
    note = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.order.order_number} -> {self.get_status_display()} at {self.created_at.strftime('%H:%M:%S')}"
