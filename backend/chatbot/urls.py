from django.urls import path
from . import views

# RUTAS HEREDADAS (prefijo /chatbot/). El frontend usa las de api_urls.py
# (/api/chatbot/...), que son las que se mantienen; estas apuntan a las mismas vistas
# y se conservan solo por si algún cliente externo todavía las llama.

urlpatterns = [
    path('agentes/', views.list_agentes, name='list_agentes'),
    path('pregunta/', views.enviar_pregunta, name='enviar_pregunta'),
    path('historial/', views.obtener_historial, name='obtener_historial'),
    path('conversaciones/', views.listar_conversaciones, name='listar_conversaciones'),
    
    # Endpoints públicos (sin autenticación, sin historial)
    path('public/agentes/', views.list_agentes_publico, name='list_agentes_publico'),
    path('public/pregunta/', views.enviar_pregunta_publico, name='enviar_pregunta_publico'),
]
