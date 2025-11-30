from django.urls import path
from . import views

urlpatterns = [
    path('agentes/', views.list_agentes, name='list_agentes'),
    path('pregunta/', views.enviar_pregunta, name='enviar_pregunta'),
]
