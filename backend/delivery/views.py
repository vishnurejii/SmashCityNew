from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from orders.models import Order
from orders.serializers import OrderSerializer, OrderStatusHistorySerializer

class DeliveryTrackingView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, order_number):
        order = get_object_or_404(Order, order_number=order_number)

        # Standard 6-step delivery lifecycle
        stepper_steps = [
            {'key': Order.STATUS_PLACED, 'label': 'Order Placed', 'description': 'Received by kitchen'},
            {'key': Order.STATUS_CONFIRMED, 'label': 'Order Confirmed', 'description': 'Order approved and queued'},
            {'key': Order.STATUS_PREPARING, 'label': 'Preparing', 'description': 'Grilling patties & fresh toppings'},
            {'key': Order.STATUS_READY, 'label': 'Ready for Pickup', 'description': 'Packaged and waiting for rider'},
            {'key': Order.STATUS_OUT_FOR_DELIVERY, 'label': 'Out for Delivery', 'description': 'Rider is on the way'},
            {'key': Order.STATUS_DELIVERED, 'label': 'Delivered', 'description': 'Delivered to your door'},
        ]

        # Calculate current step index
        status_keys = [s['key'] for s in stepper_steps]
        current_step_index = -1
        if order.status in status_keys:
            current_step_index = status_keys.index(order.status)
        elif order.status == Order.STATUS_CANCELLED:
            current_step_index = -2 # Special cancelled status
        elif order.status == Order.STATUS_FAILED:
            current_step_index = -3

        history = order.status_history.all().order_by('created_at')

        return Response({
            'order_number': order.order_number,
            'current_status': order.status,
            'status_display': order.get_status_display(),
            'current_step_index': current_step_index,
            'is_terminal': order.status in [Order.STATUS_DELIVERED, Order.STATUS_CANCELLED, Order.STATUS_FAILED],
            'estimated_delivery_time': order.estimated_delivery_time,
            'customer_name': order.customer_name,
            'customer_phone': order.customer_phone,
            'delivery_address': f"{order.delivery_address}, {order.city} {order.postal_code}",
            'delivery_otp': order.delivery_otp,
            'assigned_delivery_partner': order.assigned_delivery_partner,
            'delivery_partner_phone': order.delivery_partner_phone,
            'delivered_at': order.delivered_at,
            'steps': stepper_steps,
            'history': OrderStatusHistorySerializer(history, many=True).data,
            'order_summary': {
                'items_count': sum(item.quantity for item in order.items.all()),
                'total_amount': str(order.total_amount),
                'payment_method': order.get_payment_method_display(),
                'payment_status': order.get_payment_status_display(),
            }
        })

class StaffUpdateStatusView(APIView):
    """
    Allows staff/admin to update an order's delivery status & rider info
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, order_number):
        order = get_object_or_404(Order, order_number=order_number)
        new_status = request.data.get('status')
        note = request.data.get('note', '')
        rider_name = request.data.get('assigned_delivery_partner')
        rider_phone = request.data.get('delivery_partner_phone')

        valid_statuses = [choice[0] for choice in Order.ORDER_STATUS_CHOICES]
        if new_status and new_status not in valid_statuses:
            return Response(
                {'error': f"Invalid status '{new_status}'. Valid choices: {', '.join(valid_statuses)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_status:
            order.status = new_status
            if new_status == Order.STATUS_DELIVERED:
                order.delivered_at = timezone.now()
                if order.payment_method == Order.PAYMENT_COD:
                    order.payment_status = Order.PAY_STATUS_PAID

        if rider_name is not None:
            order.assigned_delivery_partner = rider_name
        if rider_phone is not None:
            order.delivery_partner_phone = rider_phone

        order.save()

        staff_name = request.user.username if (request.user and request.user.is_authenticated) else 'Admin/Operations'
        order.add_status_history(
            order.status,
            note=note or f"Status updated to {order.get_status_display()} by {staff_name}."
        )

        return Response({
            'message': f"Order status updated to {order.get_status_display()}.",
            'order': OrderSerializer(order).data
        })

class VerifyDeliveryOtpView(APIView):
    """
    Allows delivery boy / partner to complete delivery by validating user OTP
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, order_number):
        order = get_object_or_404(Order, order_number=order_number)
        submitted_otp = str(request.data.get('otp', '')).strip()
        rider_name = request.data.get('rider_name', '').strip() or order.assigned_delivery_partner or 'Delivery Partner'
        rider_phone = request.data.get('rider_phone', '').strip() or order.delivery_partner_phone

        if not submitted_otp:
            return Response(
                {'error': 'Delivery OTP is required. Please ask the customer for their 4-digit code.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if order.status == Order.STATUS_DELIVERED:
            return Response({
                'message': 'This order has already been marked as DELIVERED.',
                'order': OrderSerializer(order).data
            }, status=status.HTTP_200_OK)

        if order.status == Order.STATUS_CANCELLED:
            return Response(
                {'error': 'This order was cancelled and cannot be delivered.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate OTP
        if order.delivery_otp != submitted_otp:
            return Response(
                {'error': f"Incorrect OTP '{submitted_otp}'. Please ask the customer for the correct 4-digit OTP from their SmashCity tracking screen."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # OTP is verified! Mark order DELIVERED
        order.status = Order.STATUS_DELIVERED
        order.delivered_at = timezone.now()
        if rider_name:
            order.assigned_delivery_partner = rider_name
        if rider_phone:
            order.delivery_partner_phone = rider_phone

        if order.payment_method == Order.PAYMENT_COD:
            order.payment_status = Order.PAY_STATUS_PAID

        order.save()

        order.add_status_history(
            Order.STATUS_DELIVERED,
            note=f"Delivered and verified via Customer OTP ({submitted_otp}) by {rider_name}."
        )

        return Response({
            'success': True,
            'message': f"Order {order.order_number} verified and successfully delivered!",
            'order': OrderSerializer(order).data
        }, status=status.HTTP_200_OK)

class DeliveryPartnerPickupView(APIView):
    """
    Allows delivery partner to accept/pick up order and begin transit
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, order_number):
        order = get_object_or_404(Order, order_number=order_number)
        rider_name = request.data.get('rider_name', '').strip() or 'Delivery Partner'
        rider_phone = request.data.get('rider_phone', '').strip()

        if order.status in [Order.STATUS_DELIVERED, Order.STATUS_CANCELLED]:
            return Response(
                {'error': f"Cannot pick up an order with status '{order.get_status_display()}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = Order.STATUS_OUT_FOR_DELIVERY
        order.assigned_delivery_partner = rider_name
        if rider_phone:
            order.delivery_partner_phone = rider_phone
        order.save()

        order.add_status_history(
            Order.STATUS_OUT_FOR_DELIVERY,
            note=f"Order picked up by {rider_name} and is out for delivery."
        )

        return Response({
            'success': True,
            'message': f"Order {order.order_number} is now Out for Delivery.",
            'order': OrderSerializer(order).data
        })

class DeliveryOrdersListView(APIView):
    """
    Returns active orders for delivery partners (Ready for Pickup, Out for Delivery, or recent Delivered)
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        status_filter = request.query_params.get('status')
        if status_filter:
            orders = Order.objects.filter(status=status_filter.upper()).order_by('-created_at')
        else:
            # Default to active delivery orders + recent deliveries
            orders = Order.objects.filter(
                status__in=[
                    Order.STATUS_CONFIRMED,
                    Order.STATUS_PREPARING,
                    Order.STATUS_READY,
                    Order.STATUS_OUT_FOR_DELIVERY,
                    Order.STATUS_DELIVERED
                ]
            ).order_by('-created_at')[:50]

        return Response(OrderSerializer(orders, many=True).data)
