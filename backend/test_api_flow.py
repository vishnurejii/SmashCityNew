import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
import json

c = Client()

print("--- 1. Testing Menu Products API ---")
res = c.get('/api/menu/products/')
assert res.status_code == 200, f"Expected 200, got {res.status_code}"
products = res.json()
print(f"Products loaded: {len(products)} products found.")
assert len(products) >= 6, "Expected at least 6 products"
first_product = products[0]
print(f"Sample product: {first_product['name']} - ${first_product['price']}")

print("\n--- 2. Testing Auth Registration ---")
reg_data = {
    'username': 'burgerfan99',
    'email': 'burgerfan@example.com',
    'password': 'password123',
    'full_name': 'Alex Smash',
    'phone_number': '+1 555-0123'
}
res = c.post('/api/auth/register/', data=json.dumps(reg_data), content_type='application/json')
assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.content}"
auth_res = res.json()
token = auth_res['token']
print(f"Registered user '{auth_res['user']['username']}' with token: {token[:10]}...")

print("\n--- 3. Testing Auth Login ---")
login_data = {
    'username': 'burgerfan@example.com', # test email login
    'password': 'password123'
}
res = c.post('/api/auth/login/', data=json.dumps(login_data), content_type='application/json')
assert res.status_code == 200, f"Expected 200, got {res.status_code}"
print("Login successful via email!")

print("\n--- 4. Testing Cart Flow ---")
auth_headers = {'HTTP_AUTHORIZATION': f'Token {token}'}
# Add item to cart
add_data = {'product_id': first_product['id'], 'quantity': 2}
res = c.post('/api/cart/items/', data=json.dumps(add_data), content_type='application/json', **auth_headers)
assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.content}"
cart_data = res.json()
print(f"Cart subtotal: ${cart_data['subtotal']}, items: {cart_data['total_items']}")

print("\n--- 5. Testing Coupon Validation ---")
res = c.post('/api/orders/validate-coupon/', data=json.dumps({'code': 'SMASH10', 'subtotal': '17.00'}), content_type='application/json')
assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.content}"
print(f"Coupon result: {res.json()['message']}")

print("\n--- 6. Testing Order Placement (COD) ---")
order_data = {
    'customer_name': 'Alex Smash',
    'customer_email': 'burgerfan@example.com',
    'customer_phone': '+1 555-0123',
    'delivery_address': '404 Smash Avenue, Apt 2B',
    'city': 'Downtown',
    'state': 'NY',
    'postal_code': '10001',
    'delivery_instructions': 'Leave with doorman',
    'payment_method': 'COD',
    'coupon_code': 'SMASH10'
}
res = c.post('/api/orders/', data=json.dumps(order_data), content_type='application/json', **auth_headers)
assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.content}"
order = res.json()
order_num = order['order_number']
print(f"Order created successfully: {order_num}")
print(f"Subtotal: ${order['subtotal']}, Fee: ${order['delivery_fee']}, Discount: ${order['discount_amount']}, Total: ${order['total_amount']}")

print("\n--- 7. Testing Delivery Tracking Endpoint ---")
res = c.get(f'/api/delivery/{order_num}/')
assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.content}"
tracking = res.json()
print(f"Tracking Status: {tracking['status_display']}, Step: {tracking['current_step_index']}")
print(f"Estimated Delivery: {tracking['estimated_delivery_time']}")

print("\n--- 8. Testing Razorpay Order Creation (Test Mode) ---")
res = c.post('/api/payments/create/', data=json.dumps({'order_number': order_num}), content_type='application/json')
assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.content}"
pay_info = res.json()
print(f"Payment Order ID: {pay_info['razorpay_order_id']}, Amount: {pay_info['amount']}")

print("\n--- 9. Testing Razorpay Verification (Test Mode) ---")
verify_data = {
    'order_number': order_num,
    'razorpay_order_id': pay_info['razorpay_order_id'],
    'razorpay_payment_id': 'pay_test_SmashCity12345',
    'razorpay_signature': 'test_sig_SmashCitySignature'
}
res = c.post('/api/payments/verify/', data=json.dumps(verify_data), content_type='application/json')
assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.content}"
verify_res = res.json()
print(f"Payment verification result: {verify_res['message']}, Order Status: {verify_res['order_status']}")

print("\nALL BACKEND API TESTS PASSED PERFECTLY!")
