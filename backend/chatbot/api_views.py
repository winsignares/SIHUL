from rest_framework import generics, permissions

from .models import Agente, Conversacion, PreguntaSugerida
from .serializers import AgenteSerializer, ConversacionSerializer, PreguntaSugeridaSerializer


class AgenteListCreateAPIView(generics.ListCreateAPIView):
    queryset = Agente.objects.all().order_by('orden', 'nombre')
    serializer_class = AgenteSerializer
    permission_classes = [permissions.IsAuthenticated]


class AgenteDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Agente.objects.all()
    serializer_class = AgenteSerializer
    permission_classes = [permissions.IsAuthenticated]


class PreguntaSugeridaListCreateAPIView(generics.ListCreateAPIView):
    queryset = PreguntaSugerida.objects.select_related('agente').all().order_by('agente_id', 'orden')
    serializer_class = PreguntaSugeridaSerializer
    permission_classes = [permissions.IsAuthenticated]


class PreguntaSugeridaDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PreguntaSugerida.objects.select_related('agente').all()
    serializer_class = PreguntaSugeridaSerializer
    permission_classes = [permissions.IsAuthenticated]


class ConversacionListCreateAPIView(generics.ListCreateAPIView):
    queryset = Conversacion.objects.select_related('chatbot').all().order_by('-fecha')
    serializer_class = ConversacionSerializer
    permission_classes = [permissions.IsAuthenticated]


class ConversacionDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Conversacion.objects.select_related('chatbot').all()
    serializer_class = ConversacionSerializer
    permission_classes = [permissions.IsAuthenticated]
