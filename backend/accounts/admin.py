from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import UserProfile, Address

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Customer Profile'

class AddressInline(admin.TabularInline):
    model = Address
    extra = 0
    fields = ('full_name', 'phone_number', 'street_address', 'city', 'postal_code', 'is_default')

class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline, AddressInline)
    list_display = ('username', 'email', 'first_name', 'last_name', 'get_phone', 'is_staff')

    def get_phone(self, obj):
        return getattr(obj.profile, 'phone_number', '-') if hasattr(obj, 'profile') else '-'
    get_phone.short_description = 'Phone Number'

admin.site.unregister(User)
admin.site.register(User, UserAdmin)

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ('user', 'full_name', 'phone_number', 'city', 'postal_code', 'is_default')
    search_fields = ('full_name', 'phone_number', 'street_address', 'city')
    list_filter = ('city', 'is_default')
