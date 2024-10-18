from django.http import JsonResponse
import requests
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import json


@csrf_exempt
def openai_assistant_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_message = data.get('message')
        except json.JSONDecodeError:
            user_message = request.POST.get('message')

        if not user_message:
            return JsonResponse({'error': 'No message provided'}, status=400)

        openai_response = send_message_to_openai(user_message)
        return JsonResponse({'response': openai_response})

    return JsonResponse({'error': 'Invalid request'}, status=400)


def send_message_to_openai(message):
    headers = {
        'api-key': '27aceb1e35e24107b228f3ce5a765ae1',  # Replace with your actual subscription key
        'Content-Type': 'application/json',
    }
    data = {
        "messages": [
            {"role": "user", "content": message}
        ],
        "max_tokens": 100
    }
    endpoint = 'https://pliiz-pliz.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2024-08-01-preview'

    response = requests.post(endpoint, headers=headers, json=data)

    if response.status_code != 200:
        return f"Error: {response.status_code}, {response.text}"

    return response.json()["choices"][0]["message"]["content"]