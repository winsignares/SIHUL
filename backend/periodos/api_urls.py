from django.urls import path

from .api_views import PeriodoAcademicoDetailAPIView, PeriodoAcademicoListCreateAPIView

urlpatterns = [
    path('', PeriodoAcademicoListCreateAPIView.as_view(), name='api-periodo-list-create'),
    path('<int:pk>/', PeriodoAcademicoDetailAPIView.as_view(), name='api-periodo-detail'),
]
