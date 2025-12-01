from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from .models import PrestamoEspacio, TipoActividad, PrestamoRecurso
from espacios.models import EspacioFisico
from usuarios.models import Usuario
from recursos.models import Recurso
from horario.models import Horario
import json
import datetime

# ========== Helper Functions ==========

def check_espacio_disponible(espacio_id, fecha, hora_inicio, hora_fin, prestamo_id=None):
    """
    Verifica si un espacio está disponible en la fecha y horas especificadas
    Returns: (bool, str) - (is_available, error_message)
    """
    try:
        # Convertir strings a objetos date y time si es necesario
        if isinstance(fecha, str):
            fecha = datetime.date.fromisoformat(fecha)
        if isinstance(hora_inicio, str):
            hora_inicio = datetime.time.fromisoformat(hora_inicio)
        if isinstance(hora_fin, str):
            hora_fin = datetime.time.fromisoformat(hora_fin)
        
        # 1. Validar contra Préstamos existentes
        prestamos_conflicto = PrestamoEspacio.objects.filter(
            espacio_id=espacio_id,
            fecha=fecha,
            estado__in=['Pendiente', 'Aprobado']  # Solo préstamos activos
        ).exclude(
            id=prestamo_id  # Excluir el préstamo actual si estamos actualizando
        ).filter(
            # Verificar solapamiento de horarios
            Q(hora_inicio__lt=hora_fin, hora_fin__gt=hora_inicio)
        )
        
        if prestamos_conflicto.exists():
            conflicto = prestamos_conflicto.first()
            return False, f"El espacio ya está reservado de {conflicto.hora_inicio} a {conflicto.hora_fin} para el mismo día (Préstamo)"

        # 2. Validar contra Horarios Académicos
        dias_semana = {
            0: 'Lunes', 1: 'Martes', 2: 'Miércoles', 3: 'Jueves', 
            4: 'Viernes', 5: 'Sábado', 6: 'Domingo'
        }
        dia_nombre = dias_semana[fecha.weekday()]
        
        horarios_conflicto = Horario.objects.filter(
            espacio_id=espacio_id,
            dia_semana__iexact=dia_nombre, # Case insensitive por seguridad
            hora_inicio__lt=hora_fin,
            hora_fin__gt=hora_inicio
        )
        
        if horarios_conflicto.exists():
            conflicto = horarios_conflicto.first()
            return False, f"El espacio está ocupado por clase de {conflicto.asignatura.nombre} ({conflicto.hora_inicio} - {conflicto.hora_fin})"
        
        return True, ""
    except Exception as e:
        return False, f"Error al validar disponibilidad: {str(e)}"

# ========== TipoActividad Views ==========

@csrf_exempt
def list_tipos_actividad(request):
    """Lista todos los tipos de actividad"""
    if request.method == 'GET':
        tipos = TipoActividad.objects.all()
        lst = [{
            "id": t.id,
            "nombre": t.nombre,
            "descripcion": t.descripcion
        } for t in tipos]
        return JsonResponse({"tipos_actividad": lst}, status=200)
    return JsonResponse({"error": "Método no permitido"}, status=405)

@csrf_exempt
def create_tipo_actividad(request):
    """Crea un nuevo tipo de actividad"""
    if request.method != 'POST':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        nombre = data.get('nombre')
        descripcion = data.get('descripcion', '')
        
        if not nombre:
            return JsonResponse({"error": "El nombre es requerido"}, status=400)
        
        tipo = TipoActividad(nombre=nombre, descripcion=descripcion)
        tipo.save()
        return JsonResponse({"message": "Tipo de actividad creado", "id": tipo.id}, status=201)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

# ========== PrestamoEspacio Views ==========

@csrf_exempt
def create_prestamo(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        espacio_id = data.get('espacio_id')
        usuario_id = data.get('usuario_id')
        administrador_id = data.get('administrador_id')
        tipo_actividad_id = data.get('tipo_actividad_id')
        fecha = data.get('fecha')
        hora_inicio = data.get('hora_inicio')
        hora_fin = data.get('hora_fin')
        motivo = data.get('motivo')
        asistentes = data.get('asistentes', 0)
        telefono = data.get('telefono', '')
        estado = data.get('estado', 'Pendiente')
        recursos = data.get('recursos', [])  # Array de {recurso_id, cantidad}
        
        # Validar campos requeridos
        if not all([espacio_id, tipo_actividad_id, fecha, hora_inicio, hora_fin]):
            return JsonResponse({
                "error": "espacio_id, tipo_actividad_id, fecha, hora_inicio y hora_fin son requeridos"
            }, status=400)
        
        # Validar disponibilidad del espacio
        is_available, error_msg = check_espacio_disponible(espacio_id, fecha, hora_inicio, hora_fin)
        if not is_available:
            return JsonResponse({"error": error_msg}, status=409)  # 409 Conflict
        
        # Obtener objetos relacionados
        espacio = EspacioFisico.objects.get(id=espacio_id)
        tipo_actividad = TipoActividad.objects.get(id=tipo_actividad_id)
        usuario = Usuario.objects.get(id=usuario_id) if usuario_id else None
        administrador = Usuario.objects.get(id=administrador_id) if administrador_id else None
        
        # Crear préstamo
        f = datetime.date.fromisoformat(fecha)
        hi = datetime.time.fromisoformat(hora_inicio)
        hf = datetime.time.fromisoformat(hora_fin)
        
        p = PrestamoEspacio(
            espacio=espacio,
            usuario=usuario,
            administrador=administrador,
            tipo_actividad=tipo_actividad,
            fecha=f,
            hora_inicio=hi,
            hora_fin=hf,
            motivo=motivo,
            asistentes=asistentes,
            telefono=telefono,
            estado=estado
        )
        p.save()
        
        # Crear relaciones con recursos
        for recurso_data in recursos:
            recurso_id = recurso_data.get('recurso_id')
            cantidad = recurso_data.get('cantidad', 1)
            if recurso_id:
                recurso = Recurso.objects.get(id=recurso_id)
                PrestamoRecurso.objects.create(
                    prestamo=p,
                    recurso=recurso,
                    cantidad=cantidad
                )
        
        return JsonResponse({"message": "Prestamo creado", "id": p.id}, status=201)
        
    except EspacioFisico.DoesNotExist:
        return JsonResponse({"error": "Espacio no encontrado."}, status=404)
    except TipoActividad.DoesNotExist:
        return JsonResponse({"error": "Tipo de actividad no encontrado."}, status=404)
    except Usuario.DoesNotExist:
        return JsonResponse({"error": "Usuario no encontrado."}, status=404)
    except Recurso.DoesNotExist:
        return JsonResponse({"error": "Recurso no encontrado."}, status=404)
    except ValueError:
        return JsonResponse({"error": "Formato de fecha/hora inválido."}, status=400)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def update_prestamo(request):
    if request.method != 'PUT':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        id = data.get('id')
        if not id:
            return JsonResponse({"error": "ID es requerido"}, status=400)
        
        p = PrestamoEspacio.objects.get(id=id)
        
        # Si se está cambiando espacio, fecha u horas, validar disponibilidad
        espacio_id = data.get('espacio_id', p.espacio.id)
        fecha = data.get('fecha', str(p.fecha))
        hora_inicio = data.get('hora_inicio', str(p.hora_inicio))
        hora_fin = data.get('hora_fin', str(p.hora_fin))
        
        is_available, error_msg = check_espacio_disponible(
            espacio_id, fecha, hora_inicio, hora_fin, prestamo_id=id
        )
        if not is_available:
            return JsonResponse({"error": error_msg}, status=409)
        
        # Actualizar campos
        if 'espacio_id' in data:
            p.espacio = EspacioFisico.objects.get(id=data.get('espacio_id'))
        if 'usuario_id' in data:
            p.usuario = Usuario.objects.get(id=data.get('usuario_id')) if data.get('usuario_id') else None
        if 'administrador_id' in data:
            p.administrador = Usuario.objects.get(id=data.get('administrador_id')) if data.get('administrador_id') else None
        if 'tipo_actividad_id' in data:
            p.tipo_actividad = TipoActividad.objects.get(id=data.get('tipo_actividad_id'))
        if 'fecha' in data:
            p.fecha = datetime.date.fromisoformat(data.get('fecha'))
        if 'hora_inicio' in data:
            p.hora_inicio = datetime.time.fromisoformat(data.get('hora_inicio'))
        if 'hora_fin' in data:
            p.hora_fin = datetime.time.fromisoformat(data.get('hora_fin'))
        if 'motivo' in data:
            p.motivo = data.get('motivo')
        if 'asistentes' in data:
            p.asistentes = data.get('asistentes')
        if 'telefono' in data:
            p.telefono = data.get('telefono')
        if 'estado' in data:
            p.estado = data.get('estado')
        
        p.save()
        return JsonResponse({"message": "Prestamo actualizado", "id": p.id}, status=200)
    except PrestamoEspacio.DoesNotExist:
        return JsonResponse({"error": "Prestamo no encontrado."}, status=404)
    except (EspacioFisico.DoesNotExist, Usuario.DoesNotExist, TipoActividad.DoesNotExist):
        return JsonResponse({"error": "Relacionada no encontrada."}, status=404)
    except ValueError:
        return JsonResponse({"error": "Formato de fecha/hora inválido."}, status=400)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def delete_prestamo(request):
    if request.method != 'DELETE':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        id = data.get('id')
        if not id:
            return JsonResponse({"error": "ID es requerido"}, status=400)
        p = PrestamoEspacio.objects.get(id=id)
        p.delete()
        return JsonResponse({"message": "Prestamo eliminado"}, status=200)
    except PrestamoEspacio.DoesNotExist:
        return JsonResponse({"error": "Prestamo no encontrado."}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

def get_prestamo(request, id=None):
    if id is None:
        return JsonResponse({"error": "El ID es requerido en la URL"}, status=400)
    try:
        p = PrestamoEspacio.objects.select_related(
            'espacio', 'usuario', 'administrador', 'tipo_actividad'
        ).prefetch_related('prestamo_recursos__recurso').get(id=id)
        
        # Obtener recursos asociados
        recursos = [{
            "recurso_id": pr.recurso.id,
            "recurso_nombre": pr.recurso.nombre,
            "cantidad": pr.cantidad
        } for pr in p.prestamo_recursos.all()]
        
        return JsonResponse({
            "id": p.id,
            "espacio_id": p.espacio.id,
            "espacio_nombre": p.espacio.nombre,
            "espacio_tipo": p.espacio.tipo.nombre,
            "usuario_id": (p.usuario.id if p.usuario else None),
            "usuario_nombre": (p.usuario.nombre if p.usuario else None),
            "usuario_correo": (p.usuario.correo if p.usuario else None),
            "administrador_id": (p.administrador.id if p.administrador else None),
            "administrador_nombre": (p.administrador.nombre if p.administrador else None),
            "tipo_actividad_id": p.tipo_actividad.id,
            "tipo_actividad_nombre": p.tipo_actividad.nombre,
            "fecha": str(p.fecha),
            "hora_inicio": str(p.hora_inicio),
            "hora_fin": str(p.hora_fin),
            "motivo": p.motivo,
            "asistentes": p.asistentes,
            "telefono": p.telefono,
            "estado": p.estado,
            "recursos": recursos
        }, status=200)
    except PrestamoEspacio.DoesNotExist:
        return JsonResponse({"error": "Prestamo no encontrado."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
def list_prestamos(request):
    if request.method == 'GET':
        items = PrestamoEspacio.objects.select_related(
            'espacio', 'usuario', 'administrador', 'tipo_actividad'
        ).prefetch_related('prestamo_recursos__recurso').all()
        
        lst = []
        for i in items:
            recursos = [{
                "recurso_id": pr.recurso.id,
                "recurso_nombre": pr.recurso.nombre,
                "cantidad": pr.cantidad
            } for pr in i.prestamo_recursos.all()]
            
            lst.append({
                "id": i.id,
                "espacio_id": i.espacio.id,
                "espacio_nombre": i.espacio.nombre,
                "espacio_tipo": i.espacio.tipo.nombre,
                "usuario_id": (i.usuario.id if i.usuario else None),
                "usuario_nombre": (i.usuario.nombre if i.usuario else None),
                "usuario_correo": (i.usuario.correo if i.usuario else None),
                "administrador_id": (i.administrador.id if i.administrador else None),
                "administrador_nombre": (i.administrador.nombre if i.administrador else None),
                "tipo_actividad_id": i.tipo_actividad.id,
                "tipo_actividad_nombre": i.tipo_actividad.nombre,
                "fecha": str(i.fecha),
                "hora_inicio": str(i.hora_inicio),
                "hora_fin": str(i.hora_fin),
                "motivo": i.motivo,
                "asistentes": i.asistentes,
                "telefono": i.telefono,
                "estado": i.estado,
                "recursos": recursos
            })
        
        return JsonResponse({"prestamos": lst}, status=200)

def list_prestamos_by_user(request, usuario_id):
    """
    Lista todos los préstamos de un usuario específico
    """
    if request.method == 'GET':
        try:
            # Verificar que el usuario existe
            usuario = Usuario.objects.get(id=usuario_id)
            
            # Filtrar préstamos por usuario
            items = PrestamoEspacio.objects.select_related(
                'espacio', 'usuario', 'administrador', 'tipo_actividad'
            ).prefetch_related('prestamo_recursos__recurso').filter(
                usuario=usuario
            ).order_by('-fecha', '-hora_inicio')
            
            lst = []
            for i in items:
                recursos = [{
                    "recurso_id": pr.recurso.id,
                    "recurso_nombre": pr.recurso.nombre,
                    "cantidad": pr.cantidad
                } for pr in i.prestamo_recursos.all()]
                
                lst.append({
                    "id": i.id,
                    "espacio_id": i.espacio.id,
                    "espacio_nombre": i.espacio.nombre,
                    "espacio_tipo": i.espacio.tipo.nombre,
                    "usuario_id": i.usuario.id,
                    "usuario_nombre": i.usuario.nombre,
                    "usuario_correo": i.usuario.correo,
                    "administrador_id": (i.administrador.id if i.administrador else None),
                    "administrador_nombre": (i.administrador.nombre if i.administrador else None),
                    "tipo_actividad_id": i.tipo_actividad.id,
                    "tipo_actividad_nombre": i.tipo_actividad.nombre,
                    "fecha": str(i.fecha),
                    "hora_inicio": str(i.hora_inicio),
                    "hora_fin": str(i.hora_fin),
                    "motivo": i.motivo,
                    "asistentes": i.asistentes,
                    "telefono": i.telefono,
                    "estado": i.estado,
                    "recursos": recursos
                })
            
            return JsonResponse({"prestamos": lst}, status=200)
        except Usuario.DoesNotExist:
            return JsonResponse({"error": "Usuario no encontrado."}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)