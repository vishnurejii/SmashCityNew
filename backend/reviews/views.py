from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Avg, Count
from .models import Review
from .serializers import ReviewSerializer


class ReviewListCreateView(APIView):
    """
    GET /api/reviews/ -> Returns approved reviews along with average rating & counts.
    POST /api/reviews/ -> Accepts new review submission from any visitor / authenticated customer.
    """
    def get(self, request):
        reviews = Review.objects.filter(is_approved=True)
        serializer = ReviewSerializer(reviews, many=True)
        
        aggregates = reviews.aggregate(
            avg_rating=Avg('rating'),
            total_count=Count('id')
        )
        avg = aggregates['avg_rating'] or 5.0

        # Distribution count per star (1..5)
        distribution = {}
        for star in range(1, 6):
            distribution[star] = reviews.filter(rating=star).count()

        return Response({
            'success': True,
            'stats': {
                'average_rating': round(float(avg), 1),
                'total_reviews': aggregates['total_count'] or 0,
                'distribution': distribution,
            },
            'reviews': serializer.data
        })

    def post(self, request):
        data = request.data.copy()
        user = request.user if request.user and request.user.is_authenticated else None

        # Auto-fill name if authenticated and not explicitly provided
        if user and not data.get('customer_name'):
            data['customer_name'] = user.get_full_name() or user.username

        serializer = ReviewSerializer(data=data)
        if serializer.is_valid():
            review = serializer.save(
                user=user,
                customer_name=data.get('customer_name') or 'Happy Customer'
            )
            return Response({
                'success': True,
                'message': 'Thank you! Your feedback has been received and published.',
                'review': ReviewSerializer(review).data
            }, status=status.HTTP_201_CREATED)

        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
