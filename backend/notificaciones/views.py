from django.shortcuts import render
from .models import Notificacion
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime

# ---------- Notificacion CRUD ----------
@csrf_exempt
def create_notificacion(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            id_usuario = data.get('id_usuario')
            tipo_notificacion = data.get('tipo_notificacion')
            mensaje = data.get('mensaje')
            prioridad = data.get('prioridad', 'media')
            
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
            data = json.loads(request.body)
            id = data.get('id')
            if not id:
                return JsonResponse({"error": "ID es requerido"}, status=400)
            
            notif = Notificacion.objects.get(id=id)
            notif.tipo_notificacion = data.get('tipo_notificacion', notif.tipo_notificacion)
            notif.mensaje = data.get('mensaje', notif.mensaje)
            notif.prioridad = data.get('prioridad', notif.prioridad)
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
            data = json.loads(request.body)
            id = data.get('id')
            if not id:
                return JsonResponse({"error": "ID es requerido"}, status=400)
            
            notif = Notificacion.objects.get(id=id)
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
        notif = Notificacion.objects.get(id=id)
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
        # Filtros opcionales
        id_usuario = request.GET.get('id_usuario')
        no_leidas = request.GET.get('no_leidas', 'false').lower() == 'true'
        
        # Obtener sede del usuario desde middleware
        user_sede = getattr(request, 'sede', None)
        
        # Filtrar notificaciones por usuarios de la misma ciudad
        if user_sede and user_sede.ciudad:
            from usuarios.models import Usuario
            usuarios_misma_ciudad = Usuario.objects.filter(
                sede__ciudad=user_sede.ciudad
            ).values_list('id', flat=True)
            notificaciones = Notificacion.objects.filter(id_usuario__in=usuarios_misma_ciudad)
        else:
            notificaciones = Notificacion.objects.all()
        
        if id_usuario:
            notificaciones = notificaciones.filter(id_usuario=id_usuario)
        
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
        id_usuario = request.GET.get('id_usuario')
        no_leidas = request.GET.get('no_leidas', 'false').lower() == 'true'
        pagina = int(request.GET.get('pagina', 1))
        limite = int(request.GET.get('limite', 10))
        busqueda = request.GET.get('busqueda', '').strip()
        tipo = request.GET.get('tipo', '').strip()
        prioridad = request.GET.get('prioridad', '').strip()
        
        if not id_usuario:
            return JsonResponse({"error": "id_usuario es requerido"}, status=400)
        
        # Validar parámetros de paginación
        if pagina < 1:
            pagina = 1
        if limite < 1 or limite > 100:
            limite = 10
        
        # Filtro base
        notificaciones = Notificacion.objects.filter(id_usuario=id_usuario)
        
        # Filtro por leídas/no leídas
        if no_leidas:
            notificaciones = notificaciones.filter(es_leida=False)
        
        # Filtro por búsqueda en mensaje
        if busqueda:
            from django.db.models import Q
            notificaciones = notificaciones.filter(
                Q(mensaje__icontains=busqueda) | Q(tipo_notificacion__icontains=busqueda)
            )
        
        # Filtro por tipo
        if tipo:
            # Mapeo de tipos para incluir tipos relacionados
            if tipo == 'horario':
                notificaciones = notificaciones.filter(
                    tipo_notificacion__in=['horario', 'solicitud']
                )
            elif tipo == 'espacio':
                notificaciones = notificaciones.filter(
                    tipo_notificacion__in=['espacio', 'prestamo', 'facultad', 'solicitud_espacio', 'solicitud_aprobada', 'solicitud_rechazada']
                )
            elif tipo == 'sistema':
                notificaciones = notificaciones.filter(
                    tipo_notificacion__in=['sistema', 'mensaje', 'alerta', 'exito', 'error', 'advertencia']
                )
            else:
                notificaciones = notificaciones.filter(tipo_notificacion=tipo)
        
        # Filtro por prioridad
        if prioridad and prioridad in ['alta', 'media', 'baja']:
            notificaciones = notificaciones.filter(prioridad=prioridad)
        
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
        id_usuario = request.GET.get('id_usuario')
        
        if not id_usuario:
            return JsonResponse({"error": "id_usuario es requerido"}, status=400)
        
        total = Notificacion.objects.filter(id_usuario=id_usuario).count()
        no_leidas = Notificacion.objects.filter(id_usuario=id_usuario, es_leida=False).count()
        leidas = total - no_leidas
        
        por_prioridad = {}
        for prioridad in ['alta', 'media', 'baja']:
            por_prioridad[prioridad] = Notificacion.objects.filter(
                id_usuario=id_usuario,
                prioridad=prioridad
            ).count()
        
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
            notif = Notificacion.objects.get(id=id)
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
            id_usuario = data.get('id_usuario')
            
            if not id_usuario:
                return JsonResponse({"error": "id_usuario es requerido"}, status=400)
            
            count = Notificacion.objects.filter(
                id_usuario=id_usuario,
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
