from django.db import transaction
from django.db.models import Count
from rest_framework import serializers

from usuarios.models import Usuario

from .admin_views import PuedeGestionarChatbots, ids_chatbots_permitidos
from .models import Agente, AgenteResponsable, Conversacion, PreguntaSugerida
from .views import _resolve_user_sede_value


class AgenteSerializer(serializers.ModelSerializer):
    # Ids de las personas encargadas de cargar la documentación de este chatbot (solo escritura).
    responsables_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False, allow_empty=True,
    )

    class Meta:
        model = Agente
        fields = '__all__'

    def validate_responsables_ids(self, ids):
        ids = list(dict.fromkeys(ids))  # sin repetidos, conservando el orden
        usuarios = {u.id: u for u in Usuario.objects.filter(id__in=ids, activo=True).select_related('seccional', 'sede__seccional')}
        faltantes = [i for i in ids if i not in usuarios]
        if faltantes:
            raise serializers.ValidationError('Hay responsables que no existen o están inactivos.')
        sin_seccional = [u.nombre for u in usuarios.values() if not _resolve_user_sede_value(u)]
        if sin_seccional:
            raise serializers.ValidationError(
                'No tienen seccional asignada (necesaria para saber a cuál suben): ' + ', '.join(sin_seccional)
            )
        return ids

    def _guardar_responsables(self, agente, ids):
        if ids is None:
            return
        AgenteResponsable.objects.filter(agente=agente).exclude(usuario_id__in=ids).delete()
        existentes = set(AgenteResponsable.objects.filter(agente=agente).values_list('usuario_id', flat=True))
        AgenteResponsable.objects.bulk_create(
            [AgenteResponsable(agente=agente, usuario_id=i) for i in ids if i not in existentes]
        )

    @transaction.atomic
    def create(self, validated_data):
        ids = validated_data.pop('responsables_ids', None)
        agente = super().create(validated_data)
        self._guardar_responsables(agente, ids)
        return agente

    @transaction.atomic
    def update(self, instance, validated_data):
        ids = validated_data.pop('responsables_ids', None)
        agente = super().update(instance, validated_data)
        self._guardar_responsables(agente, ids)
        return agente

    def _chatbots_permitidos(self):
        # Se calcula una vez por petición y se reutiliza para todos los chatbots del listado.
        contexto = self.context
        if '_chatbots_permitidos' not in contexto:
            request = contexto.get('request')
            contexto['_chatbots_permitidos'] = ids_chatbots_permitidos(request) if request else set()
        return contexto['_chatbots_permitidos']

    def validate_max_documentos(self, value):
        # El límite se aplica por seccional: no puede quedar por debajo de los documentos que
        # el agente ya tiene en la seccional que más tenga (no se borra nada automáticamente).
        if value is None or self.instance is None:
            return value
        mayor = (
            self.instance.documentos.values('sede').annotate(n=Count('id')).order_by('-n').first()
        )
        if mayor and value < mayor['n']:
            raise serializers.ValidationError(
                f"No puedes bajar el límite a {value}: este chatbot ya tiene {mayor['n']} documentos "
                f"en la seccional {mayor['sede']}. Elimina documentos antes de reducirlo."
            )
        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Las instrucciones adicionales son configuración interna del asistente: solo las
        # ve quien puede gestionarlo.
        request = self.context.get('request')
        administra = bool(request and PuedeGestionarChatbots().has_permission(request, None))
        if not administra:
            data.pop('instrucciones_adicionales', None)

        # Si puede cargar documentación en este chatbot (la pantalla solo le ofrece esos).
        permitidos = self._chatbots_permitidos()
        data['puede_gestionar_documentos'] = permitidos is None or instance.id in permitidos

        # Quiénes son los responsables: solo lo ve quien administra chatbots.
        if administra:
            data['responsables'] = [
                {
                    'id': r.usuario_id,
                    'nombre': r.usuario.nombre,
                    'correo': r.usuario.correo,
                    'seccional': _resolve_user_sede_value(r.usuario),
                }
                for r in instance.responsables.all()
            ]
        return data


class PreguntaSugeridaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PreguntaSugerida
        fields = '__all__'


class ConversacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversacion
        fields = '__all__'
