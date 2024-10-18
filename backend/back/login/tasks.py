from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model

User = get_user_model()

@shared_task
def delete_inactive_users():
    # Удаляем пользователей, которые не активны и созданы более 24 часов назад
    deadline = timezone.now() - timedelta(hours=1)
    users_deleted = User.objects.filter(is_active=False, date_joined__lt=deadline).delete()
    return users_deleted
