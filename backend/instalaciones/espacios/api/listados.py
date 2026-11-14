from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from ..models import EspacioFisico, EspacioPermitido
from academico.horario.models import Horario
from identidad.usuarios.models import Usuario
from nucleo.auth_helpers import (
    SECCIONAL_PUBLICA_REQUERIDA, seccional_publica,
)
from nucleo.auth_helpers import respuesta_sin_seccional as _missing_seccional_response
from .filtros import _filtrar_espacios_por_sede_usuario, _filtrar_horarios_por_rango_fecha, _usuario_sin_seccional


@csrf_exempt
def list_all_espacios_with_horarios(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Solo se permite GET'}, status=405)

    try:
        from django.db.models import Prefetch

        if _usuario_sin_seccional(request):
            return _missing_seccional_response()

        base = _filtrar_espacios_por_sede_usuario(request, EspacioFisico.objects.all())
        if getattr(request, 'user_obj', None) is None:
            # Consulta pública: solo los espacios de la seccional que eligió el visitante
            seccional_id = seccional_publica(request)
            if not seccional_id:
                return JsonResponse(SECCIONAL_PUBLICA_REQUERIDA, status=400)
            base = base.filter(sede__seccional_id=seccional_id)

        espacios = base.select_related('sede', 'tipo').prefetch_related(
            Prefetch(
                'horarios',
                queryset=Horario.objects.filter(estado='aprobado').select_related('asignatura', 'docente', 'grupo'),
            )
        )

        lista = []
        for espacio in espacios:
            horarios = []
            for h in espacio.horarios.all():
                horarios.append(
                    {
                        'dia': h.dia_semana,
                        'hora_inicio': h.hora_inicio.hour,
                        'hora_fin': h.hora_fin.hour,
                        'materia': h.asignatura.nombre if h.asignatura else 'Sin asignatura',
                        'docente': h.docente.nombre if h.docente else 'Sin docente',
                        'grupo': h.grupo.nombre if h.grupo else 'Sin grupo',
                    }
                )

            lista.append(
                {
                    'id': espacio.id,
                    'nombre': espacio.nombre,
                    'tipo': espacio.tipo.nombre if espacio.tipo else 'Sin tipo',
                    'capacidad': espacio.capacidad,
                    'sede': espacio.sede.nombre if espacio.sede else 'Sin sede',
                    'edificio': espacio.ubicacion or 'Sin ubicación',
                    'estado': espacio.estado,
                    'ubicacion': espacio.ubicacion or 'Sin ubicación',
                    'esta_abierto': espacio.esta_abierto,
                    'horarios': horarios,
                }
            )

        return JsonResponse({'espacios': lista}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def list_supervisor_espacios_with_horarios(request, usuario_id=None):
    if request.method != 'GET':
        return JsonResponse({'error': 'Solo se permite GET'}, status=405)

    if not usuario_id:
        return JsonResponse({'error': 'usuario_id es requerido'}, status=400)

    try:
        from django.db.models import Prefetch

        try:
            usuario = Usuario.objects.select_related('sede', 'sede__seccional').get(id=usuario_id)
        except Usuario.DoesNotExist:
            return JsonResponse({'error': 'Usuario no encontrado'}, status=404)

        espacios_permitidos = EspacioPermitido.objects.filter(usuario=usuario).select_related(
            'espacio', 'espacio__sede', 'espacio__tipo'
        )
        if getattr(usuario, 'sede_id', None):
            espacios_permitidos = espacios_permitidos.filter(espacio__sede_id=usuario.sede_id)

        if not espacios_permitidos.exists():
            return JsonResponse({'espacios': []}, status=200)

        espacios_ids = [ep.espacio.id for ep in espacios_permitidos]
        espacios = EspacioFisico.objects.filter(id__in=espacios_ids).select_related('sede', 'tipo').prefetch_related(
            Prefetch(
                'horarios',
                queryset=Horario.objects.filter(estado='aprobado').select_related('asignatura', 'docente', 'grupo'),
            )
        )

        lista = []
        for espacio in espacios:
            horarios = []
            for h in espacio.horarios.all():
                horarios.append(
                    {
                        'dia': h.dia_semana,
                        'hora_inicio': h.hora_inicio.hour,
                        'hora_fin': h.hora_fin.hour,
                        'materia': h.asignatura.nombre if h.asignatura else 'Sin asignatura',
                        'docente': h.docente.nombre if h.docente else 'Sin docente',
                        'grupo': h.grupo.nombre if h.grupo else 'Sin grupo',
                    }
                )

            lista.append(
                {
                    'id': espacio.id,
                    'nombre': espacio.nombre,
                    'tipo': espacio.tipo.nombre if espacio.tipo else 'Sin tipo',
                    'capacidad': espacio.capacidad,
                    'sede': espacio.sede.nombre if espacio.sede else 'Sin sede',
                    'edificio': espacio.ubicacion or 'Sin ubicación',
                    'estado': espacio.estado,
                    'ubicacion': espacio.ubicacion or 'Sin ubicación',
                    'esta_abierto': espacio.esta_abierto,
                    'horarios': horarios,
                }
            )

        return JsonResponse({'espacios': lista}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def list_all_espacios_disponibles_with_horarios(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Solo se permite GET'}, status=405)

    try:
        from django.db.models import Prefetch

        if _usuario_sin_seccional(request):
            return _missing_seccional_response()

        base = _filtrar_espacios_por_sede_usuario(request, EspacioFisico.objects.all())

        horarios_qs = _filtrar_horarios_por_rango_fecha(
            request, Horario.objects.filter(estado='aprobado')
        ).select_related('asignatura', 'docente', 'grupo')

        espacios = base.filter(estado='Disponible').select_related('sede', 'tipo').prefetch_related(
            Prefetch('horarios', queryset=horarios_qs)
        )

        lista = []
        for espacio in espacios:
            horarios = []
            for h in espacio.horarios.all():
                horarios.append(
                    {
                        'id': h.id,
                        'dia': h.dia_semana,
                        'hora_inicio': h.hora_inicio.hour,
                        'hora_fin': h.hora_fin.hour,
                        'materia': h.asignatura.nombre if h.asignatura else 'Sin asignatura',
                        'docente': h.docente.nombre if h.docente else 'Sin docente',
                        'grupo': h.grupo.nombre if h.grupo else 'Sin grupo',
                        'fecha_inicio': str(h.fecha_inicio) if h.fecha_inicio else None,
                        'fecha_fin': str(h.fecha_fin) if h.fecha_fin else None,
                    }
                )

            lista.append(
                {
                    'id': espacio.id,
                    'nombre': espacio.nombre,
                    'tipo': espacio.tipo.nombre if espacio.tipo else 'Sin tipo',
                    'capacidad': espacio.capacidad,
                    'sede': espacio.sede.nombre if espacio.sede else 'Sin sede',
                    'edificio': espacio.ubicacion or 'Sin ubicación',
                    'estado': espacio.estado,
                    'ubicacion': espacio.ubicacion or 'Sin ubicación',
                    'esta_abierto': espacio.esta_abierto,
                    'horarios': horarios,
                }
            )

        return JsonResponse({'espacios': lista}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def list_supervisor_espacios_disponibles_with_horarios(request, usuario_id=None):
    if request.method != 'GET':
        return JsonResponse({'error': 'Solo se permite GET'}, status=405)

    if not usuario_id:
        return JsonResponse({'error': 'usuario_id es requerido'}, status=400)

    try:
        from django.db.models import Prefetch

        try:
            usuario = Usuario.objects.select_related('sede', 'sede__seccional').get(id=usuario_id)
        except Usuario.DoesNotExist:
            return JsonResponse({'error': 'Usuario no encontrado'}, status=404)

        espacios_permitidos = EspacioPermitido.objects.filter(usuario=usuario).select_related(
            'espacio', 'espacio__sede', 'espacio__tipo'
        )
        if getattr(usuario, 'sede_id', None):
            espacios_permitidos = espacios_permitidos.filter(espacio__sede_id=usuario.sede_id)

        if not espacios_permitidos.exists():
            return JsonResponse({'espacios': []}, status=200)

        espacios_ids = [ep.espacio.id for ep in espacios_permitidos]
        horarios_qs = _filtrar_horarios_por_rango_fecha(
            request, Horario.objects.filter(estado='aprobado')
        ).select_related('asignatura', 'docente', 'grupo')
        espacios = EspacioFisico.objects.filter(id__in=espacios_ids, estado='Disponible').select_related('sede', 'tipo').prefetch_related(
            Prefetch('horarios', queryset=horarios_qs)
        )

        lista = []
        for espacio in espacios:
            horarios = []
            for h in espacio.horarios.all():
                horarios.append(
                    {
                        'id': h.id,
                        'dia': h.dia_semana,
                        'hora_inicio': h.hora_inicio.hour,
                        'hora_fin': h.hora_fin.hour,
                        'materia': h.asignatura.nombre if h.asignatura else 'Sin asignatura',
                        'docente': h.docente.nombre if h.docente else 'Sin docente',
                        'grupo': h.grupo.nombre if h.grupo else 'Sin grupo',
                        'fecha_inicio': str(h.fecha_inicio) if h.fecha_inicio else None,
                        'fecha_fin': str(h.fecha_fin) if h.fecha_fin else None,
                    }
                )

            lista.append(
                {
                    'id': espacio.id,
                    'nombre': espacio.nombre,
                    'tipo': espacio.tipo.nombre if espacio.tipo else 'Sin tipo',
                    'capacidad': espacio.capacidad,
                    'sede': espacio.sede.nombre if espacio.sede else 'Sin sede',
                    'edificio': espacio.ubicacion or 'Sin ubicación',
                    'estado': espacio.estado,
                    'ubicacion': espacio.ubicacion or 'Sin ubicación',
                    'esta_abierto': espacio.esta_abierto,
                    'horarios': horarios,
                }
            )

        return JsonResponse({'espacios': lista}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def list_espacios_by_usuario(request, usuario_id=None):
    if usuario_id is None:
        return JsonResponse({'error': 'El usuario_id es requerido en la URL'}, status=400)

    try:
        usuario = Usuario.objects.select_related('sede').get(id=usuario_id)
        espacios_permitidos = EspacioPermitido.objects.filter(usuario=usuario).select_related('espacio')
        if getattr(usuario, 'sede_id', None):
            espacios_permitidos = espacios_permitidos.filter(espacio__sede_id=usuario.sede_id)

        lista = []
        for ep in espacios_permitidos:
            recursos = []
            for er in ep.espacio.espacio_recursos.all():
                recursos.append({'id': er.recurso.id, 'nombre': er.recurso.nombre, 'estado': er.estado})

            lista.append(
                {
                    'id': ep.espacio.id,
                    'tipo_id': ep.espacio.tipo.id,
                    'tipo_espacio': {
                        'id': ep.espacio.tipo.id,
                        'nombre': ep.espacio.tipo.nombre,
                        'descripcion': ep.espacio.tipo.descripcion,
                    },
                    'nombre': ep.espacio.nombre,
                    'capacidad': ep.espacio.capacidad,
                    'ubicacion': ep.espacio.ubicacion,
                    'estado': ep.espacio.estado,
                    'sede_id': ep.espacio.sede.id,
                    'recursos': recursos,
                    'individual': ep.individual,
                }
            )

        return JsonResponse({'espacios': lista}, status=200)
    except Usuario.DoesNotExist:
        return JsonResponse({'error': 'Usuario no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
