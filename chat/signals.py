# chat/signals.py
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .red_flags import RED_FLAGS

def check_for_red_flags(sender, instance, **kwargs):
    for keyword in RED_FLAGS:
        if keyword in instance.text.lower():
            notify_agents(instance.text)

def notify_agents(message):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        'notifications',
        {
            'type': 'send_notification',
            'message': message
        }
    )
