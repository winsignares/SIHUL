from django.urls import path

from .api.consentimiento import ConsentimientoView
from .api.mis_practicas import MisPracticasView
from .api.registrar import RegistrarView
from .api.registros import RegistrosDeAsignacionView

urlpatterns = [
    path('consentimiento/', ConsentimientoView.as_view(), name='api-asistencia-consentimiento'),
    path('mis-practicas/', MisPracticasView.as_view(), name='api-asistencia-mis-practicas'),
    path('registrar/', RegistrarView.as_view(), name='api-asistencia-registrar'),
    path('practicas/<int:asignacion_id>/registros/', RegistrosDeAsignacionView.as_view(), name='api-asistencia-registros'),
]
