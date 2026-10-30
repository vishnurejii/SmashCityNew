from decimal import Decimal
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Order, OrderItem, OrderStatusHistory, Coupon
from .serializers import (
    OrderSerializer, CreateOrderSerializer, CouponSerializer
)
from menu.models import Product
from cart.views import get_or_create_user_cart
from cart.models import CartItem

class ValidateCouponView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        code = request.data.get('code', '').strip().upper()
        subtotal = Decimal(str(request.data.get('subtotal', '0.00')))

        coupon = Coupon.objects.filter(code__iexact=code, is_active=True).first()
        if not coupon:
            return Response({'valid': False, 'message': 'Invalid coupon code.'}, status=status.HTTP_400_BAD_REQUEST)

        is_valid, msg = coupon.is_valid_for(subtotal)
        if not is_valid:
            return Response({'valid': False, 'message': msg}, status=status.HTTP_400_BAD_REQUEST)

        discount = coupon.calculate_discount(subtotal)
        return Response({
            'valid': True,
            'code': coupon.code,
            'discount_amount': str(discount),
            'discount_type': coupon.discount_type,
            'value': str(coupon.value),
            'message': f"Coupon applied! You saved ${discount:.2f}"
        })

class OrderListCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        status_filter = request.query_params.get('status')
        search_query = request.query_params.get('search')
        show_all = request.query_params.get('all') == 'true' or (request.user.is_authenticated and request.user.is_staff)

        if show_all:
            orders = Order.objects.all().order_by('-created_at')
            if status_filter and status_filter.upper() != 'ALL':
                orders = orders.filter(status=status_filter.upper())
            if search_query:
                from django.db.models import Q
                orders = orders.filter(
                    Q(order_number__icontains=search_query) |
                    Q(customer_name__icontains=search_query) |
                    Q(customer_phone__icontains=search_query) |
                    Q(customer_email__icontains=search_query)
                )
            serializer = OrderSerializer(orders, many=True)
            return Response(serializer.data)

        if request.user.is_authenticated:
            orders = Order.objects.filter(user=request.user).order_by('-created_at')
            if status_filter and status_filter.upper() != 'ALL':
                orders = orders.filter(status=status_filter.upper())
            serializer = OrderSerializer(orders, many=True)
            return Response(serializer.data)
        else:
            # For guest, allow lookup by order_number or email
            order_number = request.query_params.get('order_number')
            email = request.query_params.get('email')
            if order_number:
                order = get_object_or_404(Order, order_number=order_number)
                return Response([OrderSerializer(order).data])
            elif email:
                orders = Order.objects.filter(customer_email__iexact=email).order_by('-created_at')
                return Response(OrderSerializer(orders, many=True).data)
            return Response([])

    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        idempotency_key = data.get('idempotency_key')

        # Check idempotency to prevent duplicate orders
        if idempotency_key:
            existing_order = Order.objects.filter(idempotency_key=idempotency_key).first()
            if existing_order:
                return Response(OrderSerializer(existing_order).data, status=status.HTTP_200_OK)

        items_data = data.get('items')
        cart = None

        with transaction.atomic():
            # If no explicit items provided, read from cart
            order_items_to_create = []
            subtotal = Decimal('0.00')

            if items_data and len(items_data) > 0:
                for item_input in items_data:
                    p = Product.objects.filter(id=item_input['product_id'], is_available=True).first()
                    if not p:
                        return Response(
                            {'error': f"Product ID {item_input['product_id']} is no longer available."},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    qty = int(item_input['quantity'])
                    subtotal += p.price * qty
                    order_items_to_create.append({
                        'product': p,
                        'product_name': p.name,
                        'product_image': p.effective_image_url,
                        'unit_price': p.price,
                        'quantity': qty
                    })
            else:
                cart = get_or_create_user_cart(request)
                cart_items = cart.items.select_related('product').all()
                if not cart_items.exists():
                    return Response({'error': 'Your cart is empty.'}, status=status.HTTP_400_BAD_REQUEST)

                for ci in cart_items:
                    if not ci.product.is_available:
                        return Response(
                            {'error': f"Product '{ci.product.name}' is currently unavailable."},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    subtotal += ci.product.price * ci.quantity
                    order_items_to_create.append({
                        'product': ci.product,
                        'product_name': ci.product.name,
                        'product_image': ci.product.effective_image_url,
                        'unit_price': ci.product.price,
                        'quantity': ci.quantity
                    })

            # Calculate delivery fee: $2.50 or Free if order >= $30.00
            delivery_fee = Decimal('0.00') if subtotal >= Decimal('30.00') else Decimal('2.50')

            # Coupon discount calculation
            coupon_obj = None
            discount_amount = Decimal('0.00')
            coupon_code = data.get('coupon_code')
            if coupon_code:
                coupon_obj = Coupon.objects.filter(code__iexact=coupon_code.strip(), is_active=True).first()
                if coupon_obj:
                    is_valid, _ = coupon_obj.is_valid_for(subtotal)
                    if is_valid:
                        discount_amount = coupon_obj.calculate_discount(subtotal)
                        coupon_obj.times_used += 1
                        coupon_obj.save()

            total_amount = max(Decimal('0.00'), subtotal + delivery_fee - discount_amount)

            order = Order.objects.create(
                user=request.user if request.user.is_authenticated else None,
                customer_name=data['customer_name'],
                customer_email=data.get('customer_email', ''),
                customer_phone=data['customer_phone'],
                delivery_address=data['delivery_address'],
                city=data['city'],
                state=data.get('state', ''),
                postal_code=data['postal_code'],
                delivery_instructions=data.get('delivery_instructions', ''),
                subtotal=subtotal,
                delivery_fee=delivery_fee,
                discount_amount=discount_amount,
                total_amount=total_amount,
                coupon=coupon_obj,
                status=Order.STATUS_PLACED,
                payment_method=data.get('payment_method', Order.PAYMENT_COD),
                payment_status=Order.PAY_STATUS_PENDING,
                idempotency_key=idempotency_key
            )

            for item_info in order_items_to_create:
                OrderItem.objects.create(
                    order=order,
                    product=item_info['product'],
                    product_name=item_info['product_name'],
                    product_image=item_info['product_image'],
                    unit_price=item_info['unit_price'],
                    quantity=item_info['quantity']
                )

            # Record initial status history
            order.add_status_history(
                Order.STATUS_PLACED,
                note="Order submitted successfully and received by kitchen."
            )

            # Clear cart if cart was used
            if cart:
                cart.items.all().delete()

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

class OrderDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, order_number):
        if request.user.is_authenticated and not request.user.is_staff:
            order = get_object_or_404(Order, order_number=order_number, user=request.user)
        elif request.user.is_staff:
            order = get_object_or_404(Order, order_number=order_number)
        else:
            # Allow guest user tracking by order number
            order = get_object_or_404(Order, order_number=order_number)

        serializer = OrderSerializer(order)
        return Response(serializer.data)

class CancelOrderView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, order_number):
        if request.user.is_authenticated and not request.user.is_staff:
            order = get_object_or_404(Order, order_number=order_number, user=request.user)
        else:
            order = get_object_or_404(Order, order_number=order_number)

        if not order.can_cancel():
            return Response(
                {'error': f"Order cannot be cancelled because it is already in '{order.get_status_display()}' state."},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = Order.STATUS_CANCELLED
        order.save()
        order.add_status_history(
            Order.STATUS_CANCELLED,
            note="Order cancelled by customer."
        )

        return Response({
            'message': 'Order successfully cancelled.',
            'order': OrderSerializer(order).data
        })
