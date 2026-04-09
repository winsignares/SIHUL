from django.urls import path

from .api_views import PeriodoAcademicoCopyAPIView, PeriodoAcademicoDetailAPIView, PeriodoAcademicoListCreateAPIView

urlpatterns = [
    path('', PeriodoAcademicoListCreateAPIView.as_view(), name='api-periodo-list-create'),
    path('copy/', PeriodoAcademicoCopyAPIView.as_view(), name='api-periodo-copy'),
    path('<int:pk>/', PeriodoAcademicoDetailAPIView.as_view(), name='api-periodo-detail'),
]
