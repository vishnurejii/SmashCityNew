from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Product

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'display_order', 'is_active', 'product_count')
    list_editable = ('display_order', 'is_active')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)

    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = 'Products'

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('thumbnail', 'name', 'category', 'type_label', 'price', 'is_available', 'quick_status_badge', 'is_featured', 'stock_count')
    list_filter = ('category', 'is_available', 'is_featured', 'is_vegetarian')
    list_editable = ('price', 'is_available', 'is_featured', 'stock_count')
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}
    actions = ['mark_as_available', 'mark_as_not_available']
    fields = (
        'name', 'slug', 'category', 'type_label', 'description', 'price',
        'image', 'image_url', 'ingredients', 'is_vegetarian', 'is_featured',
        'is_available', 'stock_count'
    )

    def thumbnail(self, obj):
        url = obj.effective_image_url
        if url:
            return format_html('<img src="{}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 6px;" />', url)
        return '-'
    thumbnail.short_description = 'Image'

    def quick_status_badge(self, obj):
        if obj.is_available:
            return format_html('<span style="color: #10b981; font-weight: bold; background: #ecfdf5; padding: 3px 8px; border-radius: 4px; border: 1px solid #a7f3d0;">✓ Available</span>')
        return format_html('<span style="color: #ef4444; font-weight: bold; background: #fef2f2; padding: 3px 8px; border-radius: 4px; border: 1px solid #fecaca;">✕ Not Available (Sold Out)</span>')
    quick_status_badge.short_description = 'Status'

    @admin.action(description="Mark selected items as Available")
    def mark_as_available(self, request, queryset):
        updated = queryset.update(is_available=True)
        self.message_user(request, f"Successfully marked {updated} item(s) as Available.")

    @admin.action(description="Mark selected items as NOT Available (Sold Out)")
    def mark_as_not_available(self, request, queryset):
        updated = queryset.update(is_available=False)
        self.message_user(request, f"Successfully marked {updated} item(s) as NOT Available (Sold Out).")
