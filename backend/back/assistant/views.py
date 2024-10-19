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


User = get_user_model()  # Используем кастомную модель пользователя
@csrf_exempt
def upload_image_or_text_api(request):
    auth_header = request.headers.get('Authorization')

    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse({'error': 'Требуется аутентификация: заголовок Authorization отсутствует или неверный'}, status=403)

    token = auth_header.split(' ')[1]  # Извлекаем токен из заголовка

    try:
        # Декодируем и валидируем токен
        access_token = AccessToken(token)
        # Получаем идентификатор пользователя из токена
        user_id = access_token['user_id']
        user = CustomUser.objects.get(id=user_id)

        # Проверяем, активен ли пользователь
        if not user.is_active:
            return JsonResponse({'error': 'Пользователь деактивирован'}, status=403)

    except CustomUser.DoesNotExist:
        return JsonResponse({'error': 'Пользователь не найден'}, status=403)

    except Exception as e:
        return JsonResponse({'error': f'Ошибка аутентификации: {str(e)}'}, status=403)


    # Получение текста и изображения из запроса
    description = request.POST.get('description')
    image = request.FILES.get('image')

    chat_title = request.POST.get('chat_title', 'New Chat')
    chat, created = Chat.objects.get_or_create(user=user, title=chat_title)

    if not description and not image:
        return JsonResponse({'error': 'Необходимо предоставить описание или изображение'}, status=400)
    access_token = AccessToken(token)
    context = get_chat_context(chat_title, access_token)
    # Сохраняем изображение, если оно есть
    context = get_chat_context(chat_title, access_token)
    openai_response = send_message_to_openai(description, context)
    if image:
        if request.method == 'POST' and request.FILES['image']:
            image = request.FILES['image']

            # Сохраняем фото во временную папку
            temp_photo_path = os.path.join(settings.MEDIA_ROOT, image.name)
            with open(temp_photo_path, 'wb+') as destination:
                for chunk in image.chunks():
                    destination.write(chunk)

            # Отправляем фото в Azure Computer Vision API
            result = analyze_image_with_azure(temp_photo_path)

            # Удаляем временное фото после анализа
            os.remove(temp_photo_path)

            description = f"{description} Image analysis: {result['description']['captions'][0]['text']}" if description else f"Image analysis: {result['description']['captions'][0]['text']}"

        # Создаем сообщение с изображением и анализом
            message = Message.objects.create(chat=chat, sender=user, role='user', content=description, image=image)

            # Возвращаем результат анализа в формате JSON
        #     return JsonResponse(result, safe=False)
        # return JsonResponse({"error": "No photo uploaded"}, status=400)
        # message = Message.objects.create(chat=chat, sender=user, role='user', image=image)
        # answer = upload_photo(request.FILES.get('image'))
    # if description:
    #     message = Message.objects.create(chat=chat, sender=user, role='user', content=description)
    # # context = [
    #     {"role": "system", "content": "You are a medical assistant. You can only provide answers to medical-related questions. "
    #                               "If the user asks something unrelated to medicine, respond with 'I can only assist with medical inquiries. "
    #                               "Please ask a question related to medicine.'"},
    # ]
    else:
        message = Message.objects.create(chat=chat, sender=user, role='user', content=description)


    message.response = openai_response
    message.save()
    # Отладочная информация перед проверкой
    message_count = chat.messages.count()
    print(f"Количество сообщений в чате: {message_count}")

    if message_count == 1:
        time.sleep(8)
        print("Входим в условие: сообщений в чате ровно 1")

        # Формируем запрос для генерации названия чата с помощью GPT
        gpt_title_prompt = f"Запрос пользователя: '{description}'. Придумай подходящее название для этого чата.должно быть меньше 255 символов. ответь просто названием"

        # Отправляем запрос для генерации названия чата
        new_chat_title = send_message_to_openai(gpt_title_prompt, [])

        if len(new_chat_title) > 255:
            new_chat_title = new_chat_title[:255]

        # Обновляем название чата
        chat.title = new_chat_title
        chat.save()

        print(f"Название чата обновлено на: {chat.title}")
    else:
        print("Условие не выполнено: сообщений больше или меньше 1")


    return JsonResponse({'message': 'Запрос успешно обработан!', 'result': openai_response,'chat_title':chat.title})

# def prepare_openai_context(context_data):
#     # Начальный системный контекст
#     openai_context = [
#         {
#             "role": "system",
#             "content": "You are a helpful assistant that can only answer medical-related questions. "
#                        "If the user asks something unrelated to medicine, politely guide them to ask medical-related questions."
#         }
#     ]

#     # Преобразуем контекст чата
#     for entry in context_data['context']:
#         # Добавляем запрос пользователя
#         openai_context.append({
#             "role": entry['role'],  # Например 'user'
#             "content": entry['content']  # Контент запроса от пользователя
#         })
#         # Если есть ответ от модели (assistant), добавляем его
#         if entry['response']:
#             openai_context.append({
#                 "role": "assistant",
#                 "content": entry['response']  # Ответ от GPT/ассистента
#             })

#     return openai_context


# def get_chat_context(chat_id):
#     chat = Chat.objects.get(id=chat_id)
#     messages = chat.messages.all().order_by('created_at')

#     context = []
#     for message in messages:
#         if message.content:
#             context.append({
#                 "role": message.role,
#                 "content": message.content
#             })
#         if message.response:
#             context.append({
#                 "role": 'assistant',
#                 "content": message.response
#             })

#     return context


def send_message_to_openai(prompt, context):
    if not context:  # Проверяем, что контекст не пустой
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
        'api-key': '27aceb1e35e24107b228f3ce5a765ae1',  # Replace with your actual subscription key
        'Content-Type': 'application/json',
    }
    data = {
        "messages": context,
        "max_tokens": 250
    }
    endpoint = 'https://pliiz-pliz.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2024-08-01-preview'

    response = requests.post(endpoint, headers=headers, json=data)

    if response.status_code == 200:
        print(response)
        result = response.json()
            # Возвращаем текстовый ответ модели
        return result.get('choices')[0]['message']['content']
    else:
        return f"Error: {response.status_code}, {response.text}"


# Включаем возможность загрузки файла через POST запрос
# @csrf_exempt
# def upload_photo(request):
#     if request.method == 'POST' and request.FILES['photo']:
#         photo = request.FILES['photo']

#         # Сохраняем фото во временную папку
#         temp_photo_path = os.path.join(settings.MEDIA_ROOT, photo.name)
#         with open(temp_photo_path, 'wb+') as destination:
#             for chunk in photo.chunks():
#                 destination.write(chunk)

#         # Отправляем фото в Azure Computer Vision API
#         result = analyze_image_with_azure(temp_photo_path)

#         # Удаляем временное фото после анализа
#         os.remove(temp_photo_path)

#         # Возвращаем результат анализа в формате JSON
#         return JsonResponse(result, safe=False)
#     return JsonResponse({"error": "No photo uploaded"}, status=400)

def analyze_image_with_azure(photo_path):
    subscription_key = "aed2ebdc0edc4da09b149ac7257ec3a7"  # Используйте ваш ключ подписки
    endpoint = "https://pliiz-plizq.cognitiveservices.azure.com"
    analyze_url = f"{endpoint}/vision/v3.0/analyze"

    with open(photo_path, 'rb') as image:
        headers = {
            'Ocp-Apim-Subscription-Key': subscription_key,
            'Content-Type': 'application/octet-stream'
        }
        params = {
            'visualFeatures': 'Categories,Description,Tags,Color,Faces,ImageType,Adult,Objects,Brands',
        }
        response = requests.post(analyze_url, headers=headers, params=params, data=image)

        if response.status_code == 200:
            return response.json()
        else:
            return {"error": "Failed to analyze image", "status_code": response.status_code}
User = get_user_model()
def get_chat_context(chat_title, access_token):
    user_id = access_token['user_id']
    user = CustomUser.objects.get(id=user_id)
    try:
        chat = Chat.objects.get(Q(user=user) & Q(title__iexact=chat_title.strip()))
    except Chat.DoesNotExist:
        return JsonResponse({'error': 'Чат с таким названием не найден'}, status=404)
    messages = chat.messages.all().order_by('created_at')

    context = [
        {
            "role": "system",
            "content": "You are a medical assistant. You can only provide answers to medical-related questions. "
                       "If the user asks something unrelated to medicine, respond with 'I can only assist with medical inquiries. "
                       "Please ask a question related to medicine.'"
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