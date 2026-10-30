from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from accounts.models import UserProfile
from menu.models import Category, Product
from orders.models import Coupon

class Command(BaseCommand):
    help = 'Seeds initial menu categories, products, coupons, and superuser'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding database with initial SmashCity data..."))

        # 1. Superuser
        if not User.objects.filter(username='admin').exists():
            admin_user = User.objects.create_superuser('admin', 'admin@smashcity.com', 'admin123')
            UserProfile.objects.get_or_create(user=admin_user, defaults={'phone_number': '+1 555-0199'})
            self.stdout.write(self.style.SUCCESS("Superuser created: username 'admin', password 'admin123'"))
        else:
            self.stdout.write("Superuser 'admin' already exists.")

        # 2. Categories
        categories_data = [
            {'name': 'Burgers', 'display_order': 1, 'description': 'Signature smashed patties with crispy lace edges.'},
            {'name': 'Sides', 'display_order': 2, 'description': 'Golden crunch fries and loaded favorites.'},
            {'name': 'Sauces', 'display_order': 3, 'description': 'House-made fresh sauces every morning.'},
            {'name': 'Beverages', 'display_order': 4, 'description': 'Refreshing cold sodas and craft shakes.'},
        ]

        cat_objs = {}
        for cat_data in categories_data:
            cat, _ = Category.objects.update_or_create(
                name=cat_data['name'],
                defaults={
                    'display_order': cat_data['display_order'],
                    'description': cat_data['description'],
                    'is_active': True
                }
            )
            cat_objs[cat.name] = cat
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(cat_objs)} categories."))

        # 3. Products (Matching exact frontend items and images)
        products_data = [
            # Burgers
            {
                'name': 'The Classic Smash',
                'category': cat_objs['Burgers'],
                'type_label': 'Single Patty',
                'description': 'Our signature 4oz chicken patty, American cheese, house pickles, and smash sauce on a potato bun.',
                'price': Decimal('8.50'),
                'image_url': '/burger-1.webp',
                'ingredients': ['Chicken', 'American Cheese', 'Pickles', 'Smash Sauce'],
                'is_vegetarian': False,
                'is_featured': True,
                'is_available': True,
                'stock_count': 150
            },
            {
                'name': 'The Double Trouble',
                'category': cat_objs['Burgers'],
                'type_label': 'Double Patty',
                'description': 'Two smashed patties, double cheese, caramelized onions, and spicy mayo.',
                'price': Decimal('12.00'),
                'image_url': '/burger-2.webp',
                'ingredients': ['Double Chicken', 'Double Cheese', 'Caramelized Onions', 'Spicy Mayo'],
                'is_vegetarian': False,
                'is_featured': True,
                'is_available': True,
                'stock_count': 120
            },
            {
                'name': 'The Inferno',
                'category': cat_objs['Burgers'],
                'type_label': 'Spicy Specialty',
                'description': 'Pepper jack, fresh jalapeños, crispy bacon, and our blazing habanero aioli.',
                'price': Decimal('11.50'),
                'image_url': '/burger-3.webp',
                'ingredients': ['Chicken', 'Pepper Jack', 'Jalapeños', 'Bacon', 'Habanero Aioli'],
                'is_vegetarian': False,
                'is_featured': True,
                'is_available': True,
                'stock_count': 90
            },
            {
                'name': 'The Truffle Mushroom',
                'category': cat_objs['Burgers'],
                'type_label': 'Premium',
                'description': 'Swiss cheese, sautéed wild mushrooms, and rich truffle mayo.',
                'price': Decimal('13.00'),
                'image_url': '/burger-4.webp',
                'ingredients': ['Chicken', 'Swiss Cheese', 'Mushrooms', 'Truffle Mayo'],
                'is_vegetarian': False,
                'is_featured': True,
                'is_available': True,
                'stock_count': 80
            },
            # Sides
            {
                'name': 'Crispy Fries',
                'category': cat_objs['Sides'],
                'type_label': 'Side',
                'description': 'Double-fried for maximum crunch, tossed in our signature seasoning.',
                'price': Decimal('4.00'),
                'image_url': '/side-1.webp',
                'ingredients': ['Potato', 'Signature Seasoning'],
                'is_vegetarian': True,
                'is_featured': False,
                'is_available': True,
                'stock_count': 300
            },
            {
                'name': 'Loaded Smash Fries',
                'category': cat_objs['Sides'],
                'type_label': 'Loaded Side',
                'description': 'Fries topped with cheese sauce, caramelized onions, and chopped smash patty.',
                'price': Decimal('7.50'),
                'image_url': '/side-2.webp',
                'ingredients': ['Fries', 'Cheese Sauce', 'Chicken', 'Onions'],
                'is_vegetarian': False,
                'is_featured': False,
                'is_available': True,
                'stock_count': 200
            },
            # Sauces
            {
                'name': 'House Smash Sauce',
                'category': cat_objs['Sauces'],
                'type_label': 'House Dip',
                'description': 'Our creamy, tangy, proprietary secret smash sauce made fresh daily.',
                'price': Decimal('1.50'),
                'image_url': '/bur.webp',
                'ingredients': ['Mayo', 'Relish', 'Smoked Paprika', 'Secret Spices'],
                'is_vegetarian': True,
                'is_featured': False,
                'is_available': True,
                'stock_count': 500
            },
            {
                'name': 'Blazing Habanero Aioli',
                'category': cat_objs['Sauces'],
                'type_label': 'Spicy Dip',
                'description': 'Fire-roasted habanero chilies blended into smooth garlic aioli.',
                'price': Decimal('1.75'),
                'image_url': '/bur.webp',
                'ingredients': ['Habanero', 'Garlic', 'Lime', 'Aioli'],
                'is_vegetarian': True,
                'is_featured': False,
                'is_available': True,
                'stock_count': 400
            },
        ]

        for p_data in products_data:
            Product.objects.update_or_create(
                name=p_data['name'],
                defaults=p_data
            )
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(products_data)} products."))

        # 4. Coupons
        coupons = [
            {
                'code': 'SMASH10',
                'discount_type': Coupon.PERCENTAGE,
                'value': Decimal('10.00'),
                'min_order_amount': Decimal('10.00'),
                'max_discount_amount': Decimal('15.00'),
                'is_active': True
            },
            {
                'code': 'BURGER5',
                'discount_type': Coupon.FIXED,
                'value': Decimal('5.00'),
                'min_order_amount': Decimal('20.00'),
                'max_discount_amount': Decimal('5.00'),
                'is_active': True
            }
        ]

        for c_data in coupons:
            Coupon.objects.update_or_create(
                code=c_data['code'],
                defaults=c_data
            )
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(coupons)} coupons."))
        self.stdout.write(self.style.SUCCESS("Database seeding completed successfully!"))
