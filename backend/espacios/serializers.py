from rest_framework import serializers

from .models import EspacioFisico, EspacioPermitido, TipoEspacio


class TipoEspacioSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoEspacio
        fields = '__all__'


class EspacioFisicoSerializer(serializers.ModelSerializer):
    sede_id = serializers.IntegerField(source='sede.id', read_only=True)
    sede_seccional_id = serializers.IntegerField(source='sede.seccional_id', read_only=True)
    tipo_id = serializers.IntegerField(source='tipo.id', read_only=True)
    tipo_espacio = TipoEspacioSerializer(source='tipo', read_only=True)
    recursos = serializers.SerializerMethodField()

    def get_recursos(self, obj):
        return obj.recursos_con_estado

    class Meta:
        model = EspacioFisico
        fields = '__all__'


class EspacioPermitidoSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        attrs = super().validate(attrs)
        espacio = attrs.get('espacio') or getattr(self.instance, 'espacio', None)
        usuario = attrs.get('usuario') or getattr(self.instance, 'usuario', None)

        if espacio and usuario:
            usuario_sede_id = getattr(usuario, 'sede_id', None)
            espacio_sede = getattr(espacio, 'sede', None)
            espacio_sede_id = getattr(espacio_sede, 'id', None)

            if not usuario_sede_id:
                raise serializers.ValidationError({
                    'usuario': 'El usuario debe tener una sede para asignarle espacios.'
                })

            if espacio_sede_id != usuario_sede_id:
                raise serializers.ValidationError({
                    'espacio': 'El espacio no pertenece a la sede del usuario.'
                })

        return attrs

    class Meta:
        model = EspacioPermitido
        fields = '__all__'
