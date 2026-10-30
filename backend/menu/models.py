from django.db import models
from django.utils.text import slugify

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True, default='')
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['display_order', 'name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Product(models.Model):
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=180, unique=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    type_label = models.CharField(max_length=80, blank=True, default='Burger', help_text="e.g. 'Single Patty', 'Double Patty', 'Side'")
    description = models.TextField()
    price = models.DecimalField(max_digits=8, decimal_places=2)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    image_url = models.CharField(max_length=255, blank=True, default='', help_text="Local path like /burger-1.webp or full URL")
    ingredients = models.JSONField(default=list, blank=True, help_text="List of ingredients strings")
    is_vegetarian = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    is_available = models.BooleanField(default=True)
    stock_count = models.IntegerField(default=100, help_text="Inventory count")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category__display_order', 'price', 'name']

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def effective_image_url(self):
        if self.image:
            return self.image.url
        if self.image_url:
            return self.image_url
        return '/burger-1.webp'

    def __str__(self):
        return f"{self.name} (${self.price})"
