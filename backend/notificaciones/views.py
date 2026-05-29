from django.shortcuts import render
from .models import Notificacion
from django.http import JsonResponse
from django.db.models import Q
from django.core.exceptions import ValidationError
import json
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime
from mysite.auth_helpers import is_admin_global
from mysite.xss_protection import NOTIFICACION_SCHEMA, sanitize_dict


def _get_current_user(request):
    user = getattr(request, 'user', None)
    if user and getattr(user, 'is_authenticated', False):
        return user
    return getattr(request, 'user_obj', None)


def _require_auth(request):
    user = _get_current_user(request)
    if not user:
        return None, JsonResponse({"error": "Autenticación requerida"}, status=403)
    return user, None


def _resolve_target_user_id(request, requested_user_id):
    current_user = _get_current_user(request)
    if not current_user:
        return requested_user_id

    if is_admin_global(current_user):
        return requested_user_id or current_user.id

    return current_user.id


def _filter_relevantes_por_rol(notificaciones, user):
    if not user:
        return notificaciones

    if is_admin_global(user):
        return notificaciones

    rol_nombre = (getattr(getattr(user, 'rol', None), 'nombre', '') or '').strip().lower()
    if rol_nombre in {'admin', 'admin financiero'}:
        return notificaciones

    tipos_irrelevantes = [
        'usuario_creado',
        'usuario_actualizado',
        'usuario_eliminado',
        'rol_creado',
        'rol_actualizado',
        'rol_eliminado',
        'facultad_creada',
        'facultad_actualizada',
        'facultad_eliminada',
        'componente_creado',
        'componente_actualizado',
        'componente_eliminado',
        'componente_rol_asignado',
        'componente_rol_actualizado',
        'componente_rol_eliminado',
    ]

    filtros_admin = Q()
    for tipo in tipos_irrelevantes:
        filtros_admin |= Q(tipo_notificacion__iexact=tipo)

    return notificaciones.exclude(filtros_admin)

# ---------- Notificacion CRUD ----------
@csrf_exempt
def create_notificacion(request):
    if request.method == 'POST':
        try:
            user, auth_error = _require_auth(request)
            if auth_error:
                return auth_error
            data = json.loads(request.body)

            # Sanitizar inputs contra XSS
            try:
                sanitized_data = sanitize_dict(data, NOTIFICACION_SCHEMA)
            except ValidationError as e:
                return JsonResponse({"error": f"Validación fallida: {str(e)}"}, status=400)

            if is_admin_global(user):
                id_usuario = data.get('id_usuario')
            else:
                id_usuario = user.id

            tipo_notificacion = sanitized_data.get('tipo_notificacion')
            mensaje = sanitized_data.get('mensaje')
            prioridad = sanitized_data.get('prioridad', 'media')
            
            if not id_usuario:
                return JsonResponse({"error": "El id_usuario es requerido"}, status=400)
            if not tipo_notificacion:
                return JsonResponse({"error": "El tipo_notificacion es requerido"}, status=400)
            if not mensaje:
                return JsonResponse({"error": "El mensaje es requerido"}, status=400)
            
            notif = Notificacion(
                id_usuario=id_usuario,
                tipo_notificacion=tipo_notificacion,
                mensaje=mensaje,
                prioridad=prioridad,
                es_leida=False
            )
            notif.save()
            return JsonResponse({
                "message": "Notificación creada",
                "id": notif.id,
                "fecha_creacion": notif.fecha_creacion.isoformat()
            }, status=201)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def update_notificacion(request):
    if request.method == 'PUT':
        try:
            user, auth_error = _require_auth(request)
            if auth_error:
                return auth_error
            data = json.loads(request.body)
            id = data.get('id')
            if not id:
                return JsonResponse({"error": "ID es requerido"}, status=400)
            
            notif = Notificacion.objects.get(id=id)
            if not is_admin_global(user) and notif.id_usuario != user.id:
                return JsonResponse({"error": "No autorizado para actualizar esta notificación"}, status=403)

            schema = {k: {**v, 'required': False} for k, v in NOTIFICACION_SCHEMA.items()}
            try:
                sanitized_data = sanitize_dict(data, schema)
            except ValidationError as e:
                return JsonResponse({"error": f"Validación fallida: {str(e)}"}, status=400)

            if 'tipo_notificacion' in sanitized_data:
                notif.tipo_notificacion = sanitized_data.get('tipo_notificacion')
            if 'mensaje' in sanitized_data:
                notif.mensaje = sanitized_data.get('mensaje')
            if 'prioridad' in sanitized_data:
                notif.prioridad = sanitized_data.get('prioridad')
            if 'es_leida' in data:
                notif.es_leida = bool(data.get('es_leida'))
            notif.save()
            return JsonResponse({"message": "Notificación actualizada", "id": notif.id}, status=200)
        except Notificacion.DoesNotExist:
            return JsonResponse({"error": "Notificación no encontrada."}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def delete_notificacion(request):
    if request.method == 'DELETE':
        try:
            user, auth_error = _require_auth(request)
            if auth_error:
                return auth_error
            data = json.loads(request.body)
            id = data.get('id')
            if not id:
                return JsonResponse({"error": "ID es requerido"}, status=400)
            
            notif = Notificacion.objects.get(id=id)
            if not is_admin_global(user) and notif.id_usuario != user.id:
                return JsonResponse({"error": "No autorizado para eliminar esta notificación"}, status=403)
            notif.delete()
            return JsonResponse({"message": "Notificación eliminada"}, status=200)
        except Notificacion.DoesNotExist:
            return JsonResponse({"error": "Notificación no encontrada."}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def get_notificacion(request, id=None):
    if id is None:
        return JsonResponse({"error": "El ID es requerido en la URL"}, status=400)
    try:
        user, auth_error = _require_auth(request)
        if auth_error:
            return auth_error

        notif = Notificacion.objects.get(id=id)
        if not is_admin_global(user) and notif.id_usuario != user.id:
            return JsonResponse({"error": "No autorizado"}, status=403)
        return JsonResponse({
            "id": notif.id,
            "id_usuario": notif.id_usuario,
            "tipo_notificacion": notif.tipo_notificacion,
            "mensaje": notif.mensaje,
            "es_leida": notif.es_leida,
            "fecha_creacion": notif.fecha_creacion.isoformat(),
            "prioridad": notif.prioridad
        }, status=200)
    except Notificacion.DoesNotExist:
        return JsonResponse({"error": "Notificación no encontrada."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def list_notificaciones(request):
    if request.method == 'GET': 
        user, auth_error = _require_auth(request)
        if auth_error:
            return auth_error
        # Filtros opcionales
        id_usuario = request.GET.get('id_usuario')
        no_leidas = request.GET.get('no_leidas', 'false').lower() == 'true'

        if not is_admin_global(user):
            id_usuario = user.id

        if id_usuario:
            notificaciones = Notificacion.objects.filter(id_usuario=id_usuario)
        else:
            notificaciones = Notificacion.objects.all()
        
        if no_leidas:
            notificaciones = notificaciones.filter(es_leida=False)
        
        notificaciones = notificaciones.order_by('-fecha_creacion')
        
        lst = [{
            "id": n.id,
            "id_usuario": n.id_usuario,
            "tipo_notificacion": n.tipo_notificacion,
            "mensaje": n.mensaje,
            "es_leida": n.es_leida,
            "fecha_creacion": n.fecha_creacion.isoformat(),
            "prioridad": n.prioridad
        } for n in notificaciones]
        
        return JsonResponse({"notificaciones": lst}, status=200)


@csrf_exempt
def mis_notificaciones(request):
    """Obtiene las notificaciones del usuario específico con soporte para paginación y filtros"""
    if request.method == 'GET':
        from datetime import timedelta
        from django.utils import timezone

        user, auth_error = _require_auth(request)
        if auth_error:
            return auth_error

        id_usuario = request.GET.get('id_usuario')
        no_leidas = request.GET.get('no_leidas', 'false').lower() == 'true'
        pagina = int(request.GET.get('pagina', 1))
        limite = int(request.GET.get('limite', 10))
        busqueda = request.GET.get('busqueda', '').strip()
        tipo = request.GET.get('tipo', '').strip()
        prioridad = request.GET.get('prioridad', '').strip()
        filtro_tiempo = request.GET.get('filtro_tiempo', '').strip()
        categoria = request.GET.get('categoria', '').strip()
        
        current_user = user
        id_usuario_resuelto = _resolve_target_user_id(request, id_usuario)

        if not id_usuario_resuelto:
            return JsonResponse({"error": "id_usuario es requerido"}, status=400)
        
        # Validar parámetros de paginación
        if pagina < 1:
            pagina = 1
        if limite < 1 or limite > 100:
            limite = 10
        
        # Filtro base
        notificaciones = Notificacion.objects.filter(id_usuario=id_usuario_resuelto)
        notificaciones = _filter_relevantes_por_rol(notificaciones, current_user)
        
        # Filtro por leídas/no leídas
        if no_leidas:
            notificaciones = notificaciones.filter(es_leida=False)
        
        # Filtro por búsqueda en mensaje
        if busqueda:
            notificaciones = notificaciones.filter(
                Q(mensaje__icontains=busqueda) | Q(tipo_notificacion__icontains=busqueda)
            )
        
        # Filtro por categoría (SOLO 3 CATEGORÍAS PRINCIPALES)
        if categoria:
            TIPOS_IMPORTANTES = [
                'solicitud', 'solicitud_espacio', 'solicitud_aprobada', 'solicitud_rechazada',
                'horario', 'grupo', 'prestamo', 'profesor_sin_asignar', 'grupo_sin_espacio',
                'licencia', 'periodo_academico'
            ]
            
            if categoria == 'importantes':
                # IMPORTANTES: Solo notificaciones NO LEÍDAS de tipos importantes
                notificaciones = notificaciones.filter(
                    tipo_notificacion__in=TIPOS_IMPORTANTES,
                    es_leida=False
                )
            elif categoria == 'pendientes':
                # PENDIENTES: Todas las notificaciones NO LEÍDAS (sin importar tipo)
                notificaciones = notificaciones.filter(es_leida=False)
            elif categoria == 'leidas':
                # LEIDAS: Solo notificaciones YA LEÍDAS
                notificaciones = notificaciones.filter(es_leida=True)
        
        # Filtro por prioridad
        if prioridad and prioridad in ['alta', 'media', 'baja']:
            notificaciones = notificaciones.filter(prioridad=prioridad)
        
        # Filtro por tiempo
        if filtro_tiempo:
            now = timezone.now()
            if filtro_tiempo == 'dia':
                fecha_inicio = now - timedelta(days=1)
                notificaciones = notificaciones.filter(fecha_creacion__gte=fecha_inicio)
            elif filtro_tiempo == 'semana':
                fecha_inicio = now - timedelta(weeks=1)
                notificaciones = notificaciones.filter(fecha_creacion__gte=fecha_inicio)
            elif filtro_tiempo == 'mes':
                fecha_inicio = now - timedelta(days=30)
                notificaciones = notificaciones.filter(fecha_creacion__gte=fecha_inicio)
            # 'todo' no aplica ningún filtro de tiempo
        
        # Ordenar por fecha de creación (más recientes primero)
        notificaciones = notificaciones.order_by('-fecha_creacion')
        
        # Calcular totales antes de paginar
        total = notificaciones.count()
        
        # Aplicar paginación
        inicio = (pagina - 1) * limite
        fin = inicio + limite
        notificaciones_paginadas = notificaciones[inicio:fin]
        
        lst = [{
            "id": n.id,
            "id_usuario": n.id_usuario,
            "tipo_notificacion": n.tipo_notificacion,
            "mensaje": n.mensaje,
            "es_leida": n.es_leida,
            "fecha_creacion": n.fecha_creacion.isoformat(),
            "prioridad": n.prioridad
        } for n in notificaciones_paginadas]
        
        return JsonResponse({
            "notificaciones": lst,
            "total": total,
            "pagina_actual": pagina,
            "total_paginas": (total + limite - 1) // limite,  # Ceil division
            "tiene_siguiente": fin < total,
            "tiene_anterior": pagina > 1
        }, status=200)


@csrf_exempt
def estadisticas(request):
    """Obtiene estadísticas de notificaciones del usuario"""
    if request.method == 'GET':
        user, auth_error = _require_auth(request)
        if auth_error:
            return auth_error

        id_usuario = request.GET.get('id_usuario')
        current_user = user
        id_usuario_resuelto = _resolve_target_user_id(request, id_usuario)
        
        if not id_usuario_resuelto:
            return JsonResponse({"error": "id_usuario es requerido"}, status=400)

        base_qs = Notificacion.objects.filter(id_usuario=id_usuario_resuelto)
        base_qs = _filter_relevantes_por_rol(base_qs, current_user)
        
        total = base_qs.count()
        no_leidas = base_qs.filter(es_leida=False).count()
        leidas = total - no_leidas
        
        por_prioridad = {}
        for prioridad in ['alta', 'media', 'baja']:
            por_prioridad[prioridad] = base_qs.filter(prioridad=prioridad).count()
        
        return JsonResponse({
            "total": total,
            "leidas": leidas,
            "no_leidas": no_leidas,
            "por_prioridad": por_prioridad
        }, status=200)


@csrf_exempt
def marcar_como_leida(request, id=None):
    """Marca una notificación como leída"""
    if request.method == 'POST':
        if id is None:
            return JsonResponse({"error": "El ID es requerido en la URL"}, status=400)
        try:
            current_user, auth_error = _require_auth(request)
            if auth_error:
                return auth_error
            notif = Notificacion.objects.get(id=id)
            if current_user and not is_admin_global(current_user) and notif.id_usuario != current_user.id:
                return JsonResponse({"error": "No autorizado para actualizar esta notificación"}, status=403)
            notif.es_leida = True
            notif.save()
            return JsonResponse({
                "message": "Notificación marcada como leída",
                "id": notif.id
            }, status=200)
        except Notificacion.DoesNotExist:
            return JsonResponse({"error": "Notificación no encontrada."}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def marcar_todas_como_leidas(request):
    """Marca todas las notificaciones del usuario como leídas"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            current_user, auth_error = _require_auth(request)
            if auth_error:
                return auth_error
            id_usuario = data.get('id_usuario')
            id_usuario_resuelto = _resolve_target_user_id(request, id_usuario)
            
            if not id_usuario_resuelto:
                return JsonResponse({"error": "id_usuario es requerido"}, status=400)
            
            count = Notificacion.objects.filter(
                id_usuario=id_usuario_resuelto,
                es_leida=False
            ).update(es_leida=True)
            
            return JsonResponse({
                "message": f"{count} notificación(es) marcada(s) como leída(s)",
                "cantidad": count
            }, status=200)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

