from django.urls import path
from . import views

urlpatterns = [
    path('agentes/', views.list_agentes, name='list_agentes'),
    path('pregunta/', views.enviar_pregunta, name='enviar_pregunta'),
    path('historial/', views.obtener_historial, name='obtener_historial'),
    path('conversaciones/', views.listar_conversaciones, name='listar_conversaciones'),
    
    # Endpoints públicos (sin autenticación, sin historial)
    path('public/agentes/', views.list_agentes_publico, name='list_agentes_publico'),
    path('public/pregunta/', views.enviar_pregunta_publico, name='enviar_pregunta_publico'),
]
