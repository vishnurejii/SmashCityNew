from django.contrib import admin
from .models import Cart, CartItem

class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    fields = ('product', 'quantity', 'get_total')
    readonly_fields = ('get_total',)

    def get_total(self, obj):
        return f"${obj.get_total():.2f}"
    get_total.short_description = 'Total'

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'session_key', 'total_items', 'get_subtotal_display', 'updated_at')
    inlines = (CartItemInline,)

    def total_items(self, obj):
        return sum(item.quantity for item in obj.items.all())

    def get_subtotal_display(self, obj):
        return f"${obj.get_subtotal():.2f}"
    get_subtotal_display.short_description = 'Subtotal'
