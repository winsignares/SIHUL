from django.urls import path
from . import views

urlpatterns = [
    # Horario endpoints
    path('', views.create_horario, name='create_horario'),
    path('update/', views.update_horario, name='update_horario'),
    path('delete/', views.delete_horario, name='delete_horario'),
    path('<int:id>/', views.get_horario, name='get_horario'),
    path('list/', views.list_horarios, name='list_horarios'),
    path('list/extendidos/', views.list_horarios_extendidos, name='list_horarios_extendidos'),
    path('mi-horario/', views.mi_horario_docente, name='mi_horario_docente'),
    path('mi-horario-estudiante/', views.mi_horario_estudiante, name='mi_horario_estudiante'),
    path('inscribir-estudiante/', views.inscribir_estudiante, name='inscribir_estudiante'),
    path('exportar-pdf/', views.exportar_horarios_pdf_post, name='exportar_horario_pdf'),
    path('exportar-excel/', views.exportar_horarios_excel_post, name='exportar_horario_excel'),
    
    # HorarioFusionado endpoints
    path('fusionado/', views.create_horario_fusionado, name='create_horario_fusionado'),
    path('fusionado/update/', views.update_horario_fusionado, name='update_horario_fusionado'),
    path('fusionado/delete/', views.delete_horario_fusionado, name='delete_horario_fusionado'),
    path('fusionado/<int:id>/', views.get_horario_fusionado, name='get_horario_fusionado'),
    path('fusionado/list/', views.list_horarios_fusionados, name='list_horarios_fusionados'),
]
