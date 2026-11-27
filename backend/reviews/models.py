from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class Review(models.Model):
    user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='reviews'
    )
    customer_name = models.CharField(max_length=120)
    customer_role = models.CharField(
        max_length=100, 
        blank=True, 
        default='Smash City Fan',
        help_text='e.g., Verified Buyer, Food Blogger, Local Guide'
    )
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        default=5
    )
    tagline = models.CharField(
        max_length=160, 
        blank=True,
        help_text='Short catchy headline for the review'
    )
    comment = models.TextField()
    favorite_burger = models.CharField(
        max_length=100, 
        blank=True, 
        default='Double Smashed Chicken Burger'
    )
    is_approved = models.BooleanField(
        default=True,
        help_text='Set to false to hide review from public storefront'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Customer Review'
        verbose_name_plural = 'Customer Reviews'

    def __str__(self):
        return f"{self.customer_name} ({self.rating}★) - {self.tagline or self.comment[:30]}"
