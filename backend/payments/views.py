from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.conf import settings
from orders.models import Order
from .models import Payment
from .services import create_razorpay_order, verify_razorpay_signature

class CreateRazorpayOrderView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        order_number = request.data.get('order_number')
        if not order_number:
            return Response({'error': 'order_number is required.'}, status=status.HTTP_400_BAD_REQUEST)

        order = get_object_or_404(Order, order_number=order_number)

        if order.payment_status == Order.PAY_STATUS_PAID:
            return Response({'error': 'Order has already been paid.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            rzp_order = create_razorpay_order(order.total_amount, order.order_number)
            rzp_order_id = rzp_order.get('id')

            payment, _ = Payment.objects.get_or_create(
                order=order,
                payment_method=Order.PAYMENT_RAZORPAY,
                defaults={
                    'amount': order.total_amount,
                    'currency': 'USD',
                    'razorpay_order_id': rzp_order_id,
                    'status': Payment.STATUS_PENDING,
                    'gateway_response': rzp_order
                }
            )
            payment.razorpay_order_id = rzp_order_id
            payment.save()

            return Response({
                'razorpay_order_id': rzp_order_id,
                'amount': int(order.total_amount * 100),
                'currency': 'USD',
                'key_id': settings.RAZORPAY_KEY_ID,
                'order_number': order.order_number,
                'customer_name': order.customer_name,
                'customer_email': order.customer_email,
                'customer_phone': order.customer_phone,
                'is_test_mode': settings.RAZORPAY_TEST_MODE
            })
        except Exception as e:
            return Response({'error': f'Failed to create payment order: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerifyPaymentView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        order_number = request.data.get('order_number')
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')

        if not all([order_number, razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            return Response({'error': 'Missing required payment verification details.'}, status=status.HTTP_400_BAD_REQUEST)

        order = get_object_or_404(Order, order_number=order_number)

        is_valid = verify_razorpay_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature)
        payment = Payment.objects.filter(order=order, razorpay_order_id=razorpay_order_id).first()

        if not payment:
            payment = Payment.objects.create(
                order=order,
                payment_method=Order.PAYMENT_RAZORPAY,
                amount=order.total_amount,
                currency='USD',
                razorpay_order_id=razorpay_order_id
            )

        if is_valid:
            payment.status = Payment.STATUS_SUCCESS
            payment.razorpay_payment_id = razorpay_payment_id
            payment.razorpay_signature = razorpay_signature
            payment.save()

            order.payment_status = Order.PAY_STATUS_PAID
            if order.status == Order.STATUS_PLACED:
                order.status = Order.STATUS_CONFIRMED
            order.save()
            order.add_status_history(
                order.status,
                note=f"Payment verified successfully (ID: {razorpay_payment_id})."
            )

            return Response({
                'success': True,
                'message': 'Payment verified successfully.',
                'order_number': order.order_number,
                'payment_status': order.payment_status,
                'order_status': order.status
            })
        else:
            payment.status = Payment.STATUS_FAILED
            payment.error_message = 'Signature verification failed.'
            payment.save()
            return Response({'error': 'Payment verification failed: Invalid signature.'}, status=status.HTTP_400_BAD_REQUEST)

class RazorpayWebhookView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Webhook payload handling
        payload = request.data
        event = payload.get('event')
        
        if event == 'payment.captured':
            payment_entity = payload.get('payload', {}).get('payment', {}).get('entity', {})
            rzp_order_id = payment_entity.get('order_id')
            rzp_payment_id = payment_entity.get('id')
            
            if rzp_order_id:
                payment = Payment.objects.filter(razorpay_order_id=rzp_order_id).first()
                if payment and payment.status != Payment.STATUS_SUCCESS:
                    payment.status = Payment.STATUS_SUCCESS
                    payment.razorpay_payment_id = rzp_payment_id
                    payment.save()

                    order = payment.order
                    order.payment_status = Order.PAY_STATUS_PAID
                    if order.status == Order.STATUS_PLACED:
                        order.status = Order.STATUS_CONFIRMED
                    order.save()
                    order.add_status_history(
                        order.status,
                        note=f"Payment captured via webhook (ID: {rzp_payment_id})."
                    )

        return Response({'status': 'ok'})
