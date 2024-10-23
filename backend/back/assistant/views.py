from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from django.conf import settings
import requests
import os
import json
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from login.models import CustomUser
from assistant.models import Chat, Message
import requests
from django.db.models import Q
import time
from PIL import Image
import torch
from torchvision import transforms
from modelPredictor.views import predict_tumor
from django.test import Client
from django.core.files.uploadedfile import SimpleUploadedFile

User = get_user_model() 
@csrf_exempt
def upload_image_or_text_api(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Требуется аутентификация: заголовок Authorization отсутствует или неверный'}, status=403)
    token = auth_header.split(' ')[1] 

    try:
        access_token = AccessToken(token)
        user_id = access_token['user_id']
        user = CustomUser.objects.get(id=user_id)
        if not user.is_active:
            return JsonResponse({'error': 'Пользователь деактивирован'}, status=403)
    except CustomUser.DoesNotExist:
        return JsonResponse({'error': 'Пользователь не найден'}, status=403)

    except Exception as e:
        return JsonResponse({'error': f'Ошибка аутентификации: {str(e)}'}, status=403)
    
    description = request.POST.get('description')

    image = request.FILES.get('image')

    print('[GAY PARTY]')
    print(image)
    print('[GAY PARTY IS OVER]')

    chat_title = request.POST.get('chat_title', 'New Chat')
    chat, created = Chat.objects.get_or_create(user=user, title=chat_title)
    
    if not description and not image:
        return JsonResponse({'error': 'Необходимо предоставить описание или изображение'}, status=400)
    access_token = AccessToken(token)
    context = get_chat_context(chat_title, access_token)

    if image:
        client = Client()
        oneorzero = client.post('http://127.0.0.1:8000/predict/', {'image': image})
        json_response = oneorzero.json()
        print('[GAY PARTY]')
        print(json_response)
        print('[GAY PARTY IS OVER]')
        # result = {'result': 1}
        if json_response == {'result': 1}:
            description += " SAY THAT I HAVE LIVER CANCER "
            if chat.already_said == None:
                chat.already_said = False
            # user.last_name = " this user has liver cancer"
            chat.is_cancer_related = True
            
        else:
            description += " SAY THAT I DONT HAVE LIVER CANCER"
            if chat.already_said == None:
                chat.already_said = False
                
            # user.last_name = " this user doent have liver cancer"
            chat.is_cancer_related = False
        chat.save()
        print(description)
        user.save()

        message = Message.objects.create(chat=chat, sender=user, role='user', content=description, image=image)

    else:
        message = Message.objects.create(chat=chat, sender=user, role='user', content=description)
    temp = description 
    a = 1
    tmp = ""
    if chat.is_cancer_related == 1:
        a = " Note: user have liver cancer "
        if chat.already_said == False:
            chat.already_said = True
            tmp = "Based on the provided data, signs of liver cancer have been detected. Please seek medical attention immediately for confirmation and further treatment. "
    elif chat.is_cancer_related == 0:
        a = " Note: user doesn't have liver cancer "
        
        if chat.already_said == False:
            chat.already_said = True
            tmp = "Based on the provided data, signs of liver cancer haven't been detected. Please seek medical attention immediately for confirmation and further treatment. "
 
    else:
        a = " "
        print("PORNO")
    chat.save()
    description += a
    description += temp
    print(description)
    print(description)
    context = context[-4:]
    openai_response = send_message_to_openai(description, context)
    print(context)
    message.response = openai_response
    message.save()


    
    # openai_response = send_message_to_openai(description, context)
    # cancer_message = "send your x-Ray"

    # # Проверяем, связано ли это с диагнозом рака
    # if chat.is_cancer_related == 1:
    #     cancer_message = "Based on the provided data, signs of liver cancer have been detected. Please seek medical attention immediately for confirmation and further treatment."
    # elif chat.is_cancer_related == 0:
    #     cancer_message = "Based on the provided data, signs of liver cancer haven't been detected. Please seek medical attention immediately for confirmation and further treatment."

    # # Предполагаем, что openai_response - это JSON-строка, распарсим её
    # try:
    #     openai_response = json.loads(openai_response)
    # except json.JSONDecodeError:
    #     # Если это не JSON, возвращаем ошибку
    #     return JsonResponse({"error": "Unable to parse the response as JSON."}, status=500)

    # # Извлекаем поле result
    # openai_result = openai_response.get("result", "")

    # # Добавляем сообщение о раке в начало
    # updated_result = f"{cancer_message}\n\n{openai_result}"

    # # Обновляем объект ответа
    # openai_response["result"] = updated_result

    # # Сохраняем сообщение
    # message.response = openai_response
    # message.save()



    # Возвращаем JSON-ответ
    print("penis")
    print(openai_response)
    print("penis ++")
    message_count = chat.messages.count()
    print(f"Количество сообщений в чате: {message_count}")

    if message_count == 1 and chat_title == "New Chat":
        time.sleep(8)
        print("Входим в условие: сообщений в чате ровно 1")
        
        gpt_title_prompt = f"Запрос пользователя: '{description}'. Придумай подходящее название для этого чата.должно быть меньше 255 символов. ответь просто названием"
        
        new_chat_title = send_message_to_openai(gpt_title_prompt, [])

        if len(new_chat_title) > 255:
            new_chat_title = new_chat_title[:255]

        # Обновляем название чата
        chat.title = new_chat_title
        chat.save()

        print(f"Название чата обновлено на: {chat.title}")
    else:
        print("Условие не выполнено: сообщений больше или меньше 1")

    if openai_response.startswith("Error: 429"):
        message.delete()
        openai_response = "Error! Please try again in a minute."
    return JsonResponse({'message': 'Запрос успешно обработан!', 'result': tmp + openai_response ,'chat_title':chat.title})


def send_message_to_openai(prompt, context):
    if not context: 
        context = [
            {
                "role": "system",
                "content": "You are a helpful assistant."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    api_key = '27aceb1e35e24107b228f3ce5a765ae1'
    api_version = '2024-08-01-preview'
    headers = {
        'api-key': '27aceb1e35e24107b228f3ce5a765ae1', 
        'Content-Type': 'application/json',
    }
    data = {
        "messages": context,
        "max_tokens": 500
    }
    endpoint = 'https://pliiz-pliz.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2024-08-01-preview'

    response = requests.post(endpoint, headers=headers, json=data)

    if response.status_code == 200:
        print(response)
        result = response.json()
        
        return result.get('choices')[0]['message']['content']
    else:
        return f"Error: {response.status_code}, {response.text}"


User = get_user_model()
def get_chat_context(chat_title, access_token):
    user_id = access_token['user_id']
    user = CustomUser.objects.get(id=user_id)
    try:
        chat = Chat.objects.get(Q(user=user) & Q(title__iexact=chat_title.strip()))
    except Chat.DoesNotExist:
        return JsonResponse({'error': 'Чат с таким названием не найден'}, status=404)
    messages = chat.messages.all().order_by('created_at')  
    
    if chat.is_cancer_related == 1:
        system_message = """
 You are an AI assistant specializing in liver health, with a focus on liver cancer. The user has been diagnosed with liver cancer. Your role is to provide accurate and compassionate guidance related to liver cancer, including diagnosis, treatment options, lifestyle adjustments, and preventive measures. Be ready to discuss the latest research, clinical trials, medications, and support the user in managing their condition. Provide thoughtful, respectful, and relevant responses to the user's questions regarding liver cancer and related health concerns.
 """
        
    elif chat.is_cancer_related == 0:
        system_message = """
You are an AI assistant specializing in liver health. The user does not have liver cancer, but they may have concerns or questions regarding liver health, diagnostics, preventive measures, and lifestyle recommendations to maintain a healthy liver. Provide accurate and compassionate guidance related to liver wellness, including advice on preventing liver diseases, understanding liver function tests, and supporting overall liver health. Be prepared to answer any questions the user may have about liver health, even if they do not currently have liver cancer.
"""

    else:
        system_message = "You are an AI assistant specialized in liver health, providing personalized and accurate guidance on all aspects of liver-related topics. Engage in conversations about liver health, including but not limited to liver diseases, diagnostics, treatment options, lifestyle changes, prevention, and overall liver wellness. Offer support that is both compassionate and informative, addressing the user's specific concerns and questions regarding liver-related issues."



    context = [
    {
        "role": "system",
        "content": system_message
    }
]
    for message in messages:
        if message.content:
            context.append({
                "role": message.role,
                "content": message.content
            })
        if message.response:
            context.append({
                "role": 'assistant',
                "content": message.response
            })

    return context



