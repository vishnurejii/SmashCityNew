import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from orders.models import Order
from decimal import Decimal

c = Client()

print("--- Testing Security & Authorization ---")

# Create two test users
user1, _ = User.objects.get_or_create(username='user1', email='user1@example.com')
user1.set_password('pass123')
user1.save()
token1, _ = Token.objects.get_or_create(user=user1)

user2, _ = User.objects.get_or_create(username='user2', email='user2@example.com')
user2.set_password('pass123')
user2.save()
token2, _ = Token.objects.get_or_create(user=user2)

# User 1 creates an order
order1 = Order.objects.create(
    user=user1,
    customer_name="User One",
    customer_phone="1234567890",
    delivery_address="Address 1",
    city="City",
    postal_code="12345",
    subtotal=Decimal('10.00'),
    total_amount=Decimal('12.50'),
    status=Order.STATUS_PLACED
)

# User 2 tries to cancel User 1's order
headers2 = {'HTTP_AUTHORIZATION': f'Token {token2.key}'}
res = c.post(f'/api/orders/{order1.order_number}/cancel/', **headers2)
# Since user 2 is logged in and not staff, looking up User 1's order returns 404 (ownership restriction)
assert res.status_code == 404, f"Expected 404 unauthorized access, got {res.status_code}"
print("Security Check Passed: User 2 cannot access or cancel User 1's order (404 Not Found)!")

# User 1 cancels own order
headers1 = {'HTTP_AUTHORIZATION': f'Token {token1.key}'}
res = c.post(f'/api/orders/{order1.order_number}/cancel/', **headers1)
assert res.status_code == 200, f"Expected 200, got {res.status_code}"
order1.refresh_from_db()
assert order1.status == Order.STATUS_CANCELLED
print("User 1 successfully cancelled own order.")

# Try to cancel again after it is already cancelled
res = c.post(f'/api/orders/{order1.order_number}/cancel/', **headers1)
assert res.status_code == 400
print("Security Check Passed: Cannot cancel an already cancelled order.")

print("\nALL SECURITY TESTS PASSED!")
