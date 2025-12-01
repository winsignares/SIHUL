"""
URLs para las notificaciones
"""
from django.urls import path
from . import views

urlpatterns = [
    # CRUD básico
    path('', views.create_notificacion, name='create_notificacion'),
    path('update/', views.update_notificacion, name='update_notificacion'),
    path('delete/', views.delete_notificacion, name='delete_notificacion'),
    path('<int:id>/', views.get_notificacion, name='get_notificacion'),
    path('list/', views.list_notificaciones, name='list_notificaciones'),
    
    # Acciones personalizadas
    path('mis-notificaciones/', views.mis_notificaciones, name='mis_notificaciones'),
    path('estadisticas/', views.estadisticas, name='estadisticas_notificaciones'),
    path('marcar-leida/<int:id>/', views.marcar_como_leida, name='marcar_notificacion_leida'),
    path('marcar-todas-leidas/', views.marcar_todas_como_leidas, name='marcar_todas_notificaciones_leidas'),
]
