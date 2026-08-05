from rest_framework import serializers
from django.utils import timezone

from .models import PeriodoAcademico


class PeriodoAcademicoSerializer(serializers.ModelSerializer):
    programas_activos = serializers.SerializerMethodField(read_only=True)
    horarios_registrados = serializers.SerializerMethodField(read_only=True)
    fecha_servidor = serializers.SerializerMethodField(read_only=True)

    def get_programas_activos(self, obj: PeriodoAcademico) -> int:
        return obj.grupos.values('programa').distinct().count()

    def get_horarios_registrados(self, obj: PeriodoAcademico) -> int:
        from horario.models import Horario
        return Horario.objects.filter(grupo__periodo=obj).count()

    def get_fecha_servidor(self, obj: PeriodoAcademico) -> str:
        return timezone.localdate().isoformat()

    class Meta:
        model = PeriodoAcademico
        fields = [
            'id',
            'nombre',
            'fecha_inicio',
            'fecha_fin',
            'activo',
            'origen',
            'programas_activos',
            'horarios_registrados',
            'fecha_servidor',
        ]
        read_only_fields = ['origen']
