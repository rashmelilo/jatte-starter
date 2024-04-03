from django.contrib import admin
from .models import Message, Room

# Register your models here.

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sent_by', 'body', 'created_at')
    list_filter = ('sent_by', 'created_at')
    search_fields = ('sent_by', 'body')
    date_hierarchy = 'created_at'

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('uuid', 'client', 'agent', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('uuid', 'client')
    date_hierarchy = 'created_at'
