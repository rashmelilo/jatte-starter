from django.http import HttpResponseBadRequest, JsonResponse, Http404
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.views.decorators.http import require_POST
from account.models import User
from .models import Room, Message
import json
from django.template.defaultfilters import first
from django.utils.text import slugify
from account.forms import AddUserForm, EditUserForm
from django.contrib import messages
from django.contrib.auth.models import Group
import requests
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt


@require_POST
def create_room(request, uuid):
    name = request.POST.get('name', '').strip()
    urls = request.POST.get('urls', '').strip()
    print("URLs received:", urls)
    if not name or not urls:
        return HttpResponseBadRequest(json.dumps({'message': 'Name and URL are required.'}), content_type="application/json")

    room = Room.objects.create(uuid=uuid, client=name, urls=urls)
    
    return JsonResponse({'message': 'Room created', 'room_uuid': str(room.uuid)})

@login_required
def admin(request):
    rooms = Room.objects.all()
    # Fetch users who are marked as staff
    users = User.objects.filter(is_staff=True)

    return render(request, 'chat/admin.html', {
        'rooms': rooms,
        'users': users,
    })


@login_required
def room(request, uuid):
    room = Room.objects.get(uuid=uuid)
    if room.status == Room.WAITING:
        room.status = Room.ACTIVE
        room.agent = request.user  # Corrected from request.users
        room.save()
    
    initials = slugify(first(room.agent.name)).upper()
    return render(request, 'chat/room.html', {
        'room': room,
        'initials': initials
        
    })
login_required
def delete_room(request, uuid):
    if request.user.has_perm('user.delete.room'):
        room = Room.objects.get(uuid=uuid)
        room.delete()
        messages.success(request, 'The room was deleted!')
        return redirect('/chat-admin/')

    else:
        messages.error(request, 'You do not have access to delete rooms!')
        return redirect('/chat-admin/')

@login_required
def user_detail(request, uuid):
    user = User.objects.get(pk=uuid)
    rooms = user.rooms.all()
    return render(request, 'chat/user_detail.html', {
        'user':user,
        'rooms': rooms
        
    })
@login_required
def edit_user(request, uuid):
    if request.user.has_perm('user.edit_user'):
        user = User.objects.get(pk=uuid)
        if request.method == 'POST':
            form = EditUserForm(request.POST, instance=user)
            if form.is_valid():
                form.save()
                messages.success(request, 'The user was updated!')
                return redirect('/chat-admin')
            
        else:    
            form = EditUserForm(instance=user)
        return render(request, 'chat/edit_user.html', {
            'user':user,
            'form': form
        })
    else: 
        messages.error(request, 'You do not have permission to edit users!')
        return redirect('/chat-admin/')
    
   
     
@login_required
def add_user(request):
    if request.user.has_perm('user.add_user'): 
        if request.method == 'POST':
            form = AddUserForm(request.POST)
            if form.is_valid():
                user = form.save(commit=False)
                user.is_staff = True
                user.set_password(request.POST.get('password'))
                user.save()
                if user.role == User.MANAGER:
                    group = Group.objects.get(name='Managers')
                    group.user_set.add(user)

                messages.success(request, 'The user was added!')
                return redirect('/chat-admin')
            
        else: 
            form = AddUserForm()

        return render(request, 'chat/add_user.html', {
        'form': form
        
        })
    else: 
        messages.error(request, 'You do not have permission to add users!')

        return redirect('/chat-admin/')  
    
VERIFY_TOKEN = 'HWSSchat_secure_verify_token_123456'
PAGE_ACCESS_TOKEN = 'EAAU0uzcOcQkBO5hQrCezadtGhxw5YL7ZBZCbJmVeyu0nQexQcfDBpy5Qsrz0olKspb25UEglWWs0yjCl7pPc0MjLKfMasTK43MGBhvGK7JZBbvBxrTvwsrnfWCQY6UqhFxefDMacSj2ZB677vKlFfqLYLsHmmIzEsaZAZCFwWbKWIORMEfj9sqsJJrLMOwAZAmUZABfnEJrUsM8XrC0ZD'  # Your Page Access Token

@csrf_exempt
def webhook(request):
    if request.method == 'GET':
        if request.GET.get('hub.verify_token') == VERIFY_TOKEN:
            return HttpResponse(request.GET.get('hub.challenge'))
        else:
            return HttpResponse('Error, invalid token')
    elif request.method == 'POST':
        payload = json.loads(request.body.decode('utf-8'))
        for event in payload['entry']:
            messaging = event['messaging']
            for message in messaging:
                if message.get('message'):
                    sender_id = message['sender']['id']
                    message_text = message['message']['text']
                    send_message(sender_id, message_text)
        return HttpResponse('Event received')

def send_message(recipient_id, message_text):
    url = f'https://graph.facebook.com/v13.0/me/messages?access_token={PAGE_ACCESS_TOKEN}'
    headers = {'Content-Type': 'application/json'}
    payload = {
        'recipient': {'id': recipient_id},
        'message': {'text': message_text},
    }
    response = requests.post(url, headers=headers, json=payload)
    return response.json()