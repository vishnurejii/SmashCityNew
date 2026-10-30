import hmac
import hashlib
from decimal import Decimal
from django.conf import settings
import razorpay

def get_razorpay_client():
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        return None
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

def create_razorpay_order(amount_decimal, order_number, currency='USD'):
    """
    Creates an order in Razorpay.
    Amount is converted to smallest currency sub-unit (cents or paise, i.e., * 100).
    """
    amount_subunits = int(amount_decimal * 100)
    
    # If in test mode or keys are dummy, generate simulated order id
    is_dummy_key = settings.RAZORPAY_KEY_ID.startswith('rzp_test_SmashCity') or not settings.RAZORPAY_KEY_ID
    if settings.RAZORPAY_TEST_MODE and is_dummy_key:
        import uuid
        simulated_order_id = f"order_test_{uuid.uuid4().hex[:14]}"
        return {
            'id': simulated_order_id,
            'amount': amount_subunits,
            'currency': currency,
            'is_test_mode': True
        }

    client = get_razorpay_client()
    if not client:
        import uuid
        return {
            'id': f"order_test_{uuid.uuid4().hex[:14]}",
            'amount': amount_subunits,
            'currency': currency,
            'is_test_mode': True
        }

    data = {
        'amount': amount_subunits,
        'currency': currency,
        'receipt': order_number[:40],
        'notes': {
            'order_number': order_number
        }
    }
    return client.order.create(data=data)

def verify_razorpay_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
    """
    Verifies Razorpay HMAC SHA256 payment signature.
    """
    is_dummy_key = settings.RAZORPAY_KEY_ID.startswith('rzp_test_SmashCity') or not settings.RAZORPAY_KEY_ID
    if settings.RAZORPAY_TEST_MODE and (is_dummy_key or razorpay_signature.startswith('test_sig_')):
        return True

    msg = f"{razorpay_order_id}|{razorpay_payment_id}".encode('utf-8')
    secret = settings.RAZORPAY_KEY_SECRET.encode('utf-8')
    generated_signature = hmac.new(secret, msg, hashlib.sha256).hexdigest()
    return hmac.compare_digest(generated_signature, razorpay_signature)
