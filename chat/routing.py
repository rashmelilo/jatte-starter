from django.urls import path
from .consumers import ChatConsumer, NotificationConsumer

websocket_urlpatterns = [
    path('ws/<str:room_name>/', ChatConsumer.as_asgi()),  
    path('ws/notifications/', NotificationConsumer.as_asgi()),  
]
