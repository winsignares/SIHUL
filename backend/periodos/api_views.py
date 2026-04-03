from rest_framework import generics, permissions

from .models import PeriodoAcademico
from .serializers import PeriodoAcademicoSerializer


class PeriodoAcademicoListCreateAPIView(generics.ListCreateAPIView):
    queryset = PeriodoAcademico.objects.all().order_by('-id')
    serializer_class = PeriodoAcademicoSerializer
    permission_classes = [permissions.IsAuthenticated]


class PeriodoAcademicoDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PeriodoAcademico.objects.all()
    serializer_class = PeriodoAcademicoSerializer
    permission_classes = [permissions.IsAuthenticated]
