from django.urls import path
from . import views

urlpatterns = [
    # TipoEspacio routes
    path('tipos/list/', views.list_tipos_espacio, name='list_tipos_espacio'),
    path('tipos/<int:id>/', views.get_tipo_espacio, name='get_tipo_espacio'),
    
    # EspacioFisico routes
    path('', views.create_espacio, name='create_espacio'),
    path('update/', views.update_espacio, name='update_espacio'),
    path('delete/', views.delete_espacio, name='delete_espacio'),
    path('<int:id>/', views.get_espacio, name='get_espacio'),
    path('list/', views.list_espacios, name='list_espacios'),
    
    # Bulk endpoints para Disponibilidad de Espacios
    path('horarios/all/', views.list_all_espacios_with_horarios, name='list_all_espacios_with_horarios'),
    path('horarios/supervisor/<int:usuario_id>/', views.list_supervisor_espacios_with_horarios, name='list_supervisor_espacios_with_horarios'),
    
    # EspacioPermitido routes
    path('permitido/', views.create_espacio_permitido, name='create_espacio_permitido'),
    path('permitido/list/', views.list_espacios_permitidos, name='list_espacios_permitidos'),
    path('permitido/<int:id>/', views.get_espacio_permitido, name='get_espacio_permitido'),
    path('permitido/delete/', views.delete_espacio_permitido, name='delete_espacio_permitido'),
    path('permitido/usuario/<int:usuario_id>/', views.list_espacios_by_usuario, name='list_espacios_by_usuario'),
    
    # Apertura y cierre de salones
    path('apertura-cierre/proximos/', views.proximos_apertura_cierre, name='proximos_apertura_cierre'),
    
    # Estado y Horario (Supervisor)
    path('<int:espacio_id>/estado/', views.get_estado_espacio, name='get_estado_espacio'),
    path('<int:espacio_id>/horario/', views.get_horario_espacio, name='get_horario_espacio'),
    
    # Ocupación Semanal y Reportes
    path('ocupacion/semanal/', views.ocupacion_semanal, name='ocupacion_semanal'),
    path('ocupacion/pdf/', views.generar_pdf_ocupacion_semanal, name='generar_pdf_ocupacion_semanal'),
    path('debug/ocupacion/', views.debug_ocupacion, name='debug_ocupacion'),
    path('reporte/ocupacion/', views.reporte_ocupacion, name='reporte_ocupacion'),
    path('reporte/ocupacion/pdf/', views.generar_pdf_reporte_ocupacion, name='generar_pdf_reporte_ocupacion'),
    path('reporte/disponibilidad/', views.reporte_disponibilidad, name='reporte_disponibilidad'),
    path('reporte/disponibilidad/pdf/', views.generar_pdf_reporte_disponibilidad, name='generar_pdf_reporte_disponibilidad'),
    path('reporte/capacidad/', views.reporte_capacidad, name='reporte_capacidad'),
    path('reporte/capacidad/pdf/', views.generar_pdf_reporte_capacidad, name='generar_pdf_reporte_capacidad'),
]