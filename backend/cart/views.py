from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer
from menu.models import Product

def get_or_create_user_cart(request):
    if request.user.is_authenticated:
        cart, _ = Cart.objects.get_or_create(user=request.user)
        # Check if there's a guest cart in headers to merge
        guest_key = request.headers.get('X-Guest-Cart-Key')
        if guest_key:
            guest_cart = Cart.objects.filter(session_key=guest_key).first()
            if guest_cart and guest_cart.id != cart.id:
                for item in guest_cart.items.all():
                    existing = CartItem.objects.filter(cart=cart, product=item.product).first()
                    if existing:
                        existing.quantity += item.quantity
                        existing.save()
                    else:
                        item.cart = cart
                        item.save()
                guest_cart.delete()
        return cart
    else:
        guest_key = request.headers.get('X-Guest-Cart-Key') or request.query_params.get('cart_key')
        if not guest_key:
            import uuid
            guest_key = uuid.uuid4().hex
        cart, _ = Cart.objects.get_or_create(session_key=guest_key)
        return cart

class CartView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        cart = get_or_create_user_cart(request)
        serializer = CartSerializer(cart)
        return Response({
            'cart_key': cart.session_key,
            **serializer.data
        })

    def delete(self, request):
        cart = get_or_create_user_cart(request)
        cart.items.all().delete()
        return Response({'message': 'Cart cleared.'})

class CartItemAddView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        cart = get_or_create_user_cart(request)
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))

        if quantity <= 0:
            return Response({'error': 'Quantity must be at least 1.'}, status=status.HTTP_400_BAD_REQUEST)

        product = get_object_or_404(Product, id=product_id, is_available=True)

        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity}
        )
        if not created:
            item.quantity += quantity
            item.save()

        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)

class CartItemDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def patch(self, request, pk):
        cart = get_or_create_user_cart(request)
        item = get_object_or_404(CartItem, pk=pk, cart=cart)
        quantity = request.data.get('quantity')

        if quantity is not None:
            quantity = int(quantity)
            if quantity <= 0:
                item.delete()
            else:
                item.quantity = quantity
                item.save()

        return Response(CartSerializer(cart).data)

    def delete(self, request, pk):
        cart = get_or_create_user_cart(request)
        item = get_object_or_404(CartItem, pk=pk, cart=cart)
        item.delete()
        return Response(CartSerializer(cart).data)
