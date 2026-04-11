from django.urls import path

from .api_views import (
    PeriodoAcademicoActivoAPIView,
    PeriodoAcademicoCopyAPIView,
    PeriodoAcademicoDetailAPIView,
    PeriodoAcademicoListCreateAPIView,
)

urlpatterns = [
    path('activo/', PeriodoAcademicoActivoAPIView.as_view(), name='api-periodo-activo'),
    path('', PeriodoAcademicoListCreateAPIView.as_view(), name='api-periodo-list-create'),
    path('copy/', PeriodoAcademicoCopyAPIView.as_view(), name='api-periodo-copy'),
    path('<int:pk>/', PeriodoAcademicoDetailAPIView.as_view(), name='api-periodo-detail'),
]
