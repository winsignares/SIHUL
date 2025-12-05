from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from .models import PrestamoEspacio, PrestamoEspacioPublico, TipoActividad, PrestamoRecurso
from espacios.models import EspacioFisico
from usuarios.models import Usuario
from recursos.models import Recurso
from horario.models import Horario
import json
import datetime

# ========== Helper Functions ==========

def check_espacio_disponible(espacio_id, fecha, hora_inicio, hora_fin, prestamo_id=None, es_publico=False):
    """
    Verifica si un espacio está disponible en la fecha y horas especificadas
    Valida contra préstamos autenticados, públicos y horarios académicos
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
        
        # 1. Validar contra Préstamos de usuarios autenticados
        prestamos_conflicto = PrestamoEspacio.objects.filter(
            espacio_id=espacio_id,
            fecha=fecha,
            estado__in=['Pendiente', 'Aprobado']  # Solo préstamos activos
        )
        
        # Si estamos actualizando un préstamo autenticado, excluirlo
        if not es_publico and prestamo_id:
            prestamos_conflicto = prestamos_conflicto.exclude(id=prestamo_id)
        
        prestamos_conflicto = prestamos_conflicto.filter(
            # Verificar solapamiento de horarios
            Q(hora_inicio__lt=hora_fin, hora_fin__gt=hora_inicio)
        )
        
        if prestamos_conflicto.exists():
            conflicto = prestamos_conflicto.first()
            return False, f"El espacio ya está reservado de {conflicto.hora_inicio} a {conflicto.hora_fin} para el mismo día (Préstamo Usuario)"
        
        # 2. Validar contra Préstamos públicos
        prestamos_publicos_conflicto = PrestamoEspacioPublico.objects.filter(
            espacio_id=espacio_id,
            fecha=fecha,
            estado__in=['Pendiente', 'Aprobado']
        )
        
        # Si estamos actualizando un préstamo público, excluirlo
        if es_publico and prestamo_id:
            prestamos_publicos_conflicto = prestamos_publicos_conflicto.exclude(id=prestamo_id)
        
        prestamos_publicos_conflicto = prestamos_publicos_conflicto.filter(
            Q(hora_inicio__lt=hora_fin, hora_fin__gt=hora_inicio)
        )
        
        if prestamos_publicos_conflicto.exists():
            conflicto = prestamos_publicos_conflicto.first()
            return False, f"El espacio ya está reservado de {conflicto.hora_inicio} a {conflicto.hora_fin} para el mismo día (Préstamo Público)"

        # 3. Validar contra Horarios Académicos
        dias_semana = {
            0: 'Lunes', 1: 'Martes', 2: 'Miércoles', 3: 'Jueves', 
            4: 'Viernes', 5: 'Sábado', 6: 'Domingo'
        }
        dia_nombre = dias_semana[fecha.weekday()]
        
        horarios_conflicto = Horario.objects.filter(
            espacio_id=espacio_id,
            dia_semana__iexact=dia_nombre, # Case insensitive por seguridad
            hora_inicio__lt=hora_fin,
            hora_fin__gt=hora_inicio,
            estado='aprobado'
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
        
        # Validar capacidad del espacio
        if asistentes > espacio.capacidad:
            return JsonResponse({
                "error": f"El número de asistentes ({asistentes}) excede la capacidad del espacio ({espacio.capacidad})"
            }, status=400)
        
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
    """
    Lista préstamos de usuarios AUTENTICADOS solamente
    """
    if request.method == 'GET':
        # Obtener sede del usuario desde middleware
        user_sede = getattr(request, 'sede', None)
        
        # Filtrar prestamos por la misma ciudad de la sede del usuario (a través de espacio -> sede)
        if user_sede and user_sede.ciudad:
            items = PrestamoEspacio.objects.select_related(
                'espacio__sede', 'espacio', 'usuario', 'administrador', 'tipo_actividad'
            ).prefetch_related('prestamo_recursos__recurso').filter(
                espacio__sede__ciudad=user_sede.ciudad
            )
        else:
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

def list_prestamos_todos_admin(request):
    """
    Lista TODOS los préstamos (autenticados y públicos) para el panel de administración
    Combina ambas tablas en una sola respuesta
    """
    if request.method == 'GET':
        user_sede = getattr(request, 'sede', None)
        lst = []
        
        # 1. Obtener préstamos de usuarios autenticados
        if user_sede and user_sede.ciudad:
            items_auth = PrestamoEspacio.objects.select_related(
                'espacio__sede', 'espacio', 'usuario', 'administrador', 'tipo_actividad'
            ).prefetch_related('prestamo_recursos__recurso').filter(
                espacio__sede__ciudad=user_sede.ciudad
            )
        else:
            items_auth = PrestamoEspacio.objects.select_related(
                'espacio', 'usuario', 'administrador', 'tipo_actividad'
            ).prefetch_related('prestamo_recursos__recurso').all()
        
        for i in items_auth:
            recursos = [{
                "recurso_id": pr.recurso.id,
                "recurso_nombre": pr.recurso.nombre,
                "cantidad": pr.cantidad
            } for pr in i.prestamo_recursos.all()]
            
            lst.append({
                "id": f"auth-{i.id}",  # ID único para evitar colisiones
                "id_real": i.id,  # ID original de la base de datos
                "tipo_prestamo": "autenticado",  # Para distinguir en frontend
                "espacio_id": i.espacio.id,
                "espacio_nombre": i.espacio.nombre,
                "espacio_tipo": i.espacio.tipo.nombre,
                "espacio_capacidad": i.espacio.capacidad,
                "usuario_id": i.usuario.id if i.usuario else None,
                "usuario_nombre": i.usuario.nombre if i.usuario else None,
                "usuario_correo": i.usuario.correo if i.usuario else None,
                "administrador_id": i.administrador.id if i.administrador else None,
                "administrador_nombre": i.administrador.nombre if i.administrador else None,
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
        
        # 2. Obtener préstamos públicos
        if user_sede and user_sede.ciudad:
            items_public = PrestamoEspacioPublico.objects.select_related(
                'espacio__sede', 'espacio', 'administrador', 'tipo_actividad'
            ).filter(
                espacio__sede__ciudad=user_sede.ciudad
            )
        else:
            items_public = PrestamoEspacioPublico.objects.select_related(
                'espacio', 'administrador', 'tipo_actividad'
            ).all()
        
        for i in items_public:
            # PrestamoEspacioPublico no tiene recursos por ahora (simplificado)
            recursos = []
            
            lst.append({
                "id": f"public-{i.id}",  # ID único para evitar colisiones
                "id_real": i.id,  # ID original de la base de datos
                "tipo_prestamo": "publico",  # Para distinguir en frontend
                "espacio_id": i.espacio.id,
                "espacio_nombre": i.espacio.nombre,
                "espacio_tipo": i.espacio.tipo.nombre,
                "espacio_capacidad": i.espacio.capacidad,
                "usuario_id": None,  # No hay usuario autenticado
                "usuario_nombre": i.nombre_solicitante,
                "usuario_correo": i.correo_solicitante,
                "solicitante_publico_nombre": i.nombre_solicitante,
                "solicitante_publico_correo": i.correo_solicitante,
                "solicitante_publico_telefono": i.telefono_solicitante,
                "solicitante_publico_identificacion": i.identificacion_solicitante,
                "administrador_id": i.administrador.id if i.administrador else None,
                "administrador_nombre": i.administrador.nombre if i.administrador else None,
                "tipo_actividad_id": i.tipo_actividad.id,
                "tipo_actividad_nombre": i.tipo_actividad.nombre,
                "fecha": str(i.fecha),
                "hora_inicio": str(i.hora_inicio),
                "hora_fin": str(i.hora_fin),
                "motivo": i.motivo,
                "asistentes": i.asistentes,
                "telefono": i.telefono_solicitante,
                "estado": i.estado,
                "recursos": recursos
            })
        
        # Ordenar por ID descendente (proxy de fecha de creación para mostrar los más recientes arriba)
        lst.sort(key=lambda x: x['id_real'], reverse=True)
        
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


# ========== ENDPOINTS PARA USUARIOS PÚBLICOS ==========

@csrf_exempt
def create_prestamo_publico(request):
    """
    Crea un préstamo para usuarios públicos (sin autenticación)
    Requiere datos personales en lugar de usuario_id
    """
    if request.method != 'POST':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        
        # Datos personales (en lugar de usuario_id)
        nombre_completo = data.get('nombre_completo')
        correo_institucional = data.get('correo_institucional')
        telefono = data.get('telefono')
        identificacion = data.get('identificacion')
        
        # Datos del préstamo
        espacio_id = data.get('espacio_id')
        tipo_actividad_id = data.get('tipo_actividad_id')
        fecha = data.get('fecha')
        hora_inicio = data.get('hora_inicio')
        hora_fin = data.get('hora_fin')
        motivo = data.get('motivo')
        asistentes = data.get('asistentes', 0)
        
        # Validar campos requeridos
        if not all([nombre_completo, correo_institucional, telefono, identificacion, 
                   espacio_id, tipo_actividad_id, fecha, hora_inicio, hora_fin, motivo]):
            return JsonResponse({
                "error": "Todos los campos son requeridos"
            }, status=400)
        
        # Validar correo institucional (debe terminar en el dominio de la universidad)
        dominios_validos = ['@unilibre.edu.co', '@unilibrepereira.edu.co']
        if not any(correo_institucional.endswith(dominio) for dominio in dominios_validos):
            return JsonResponse({
                "error": "El correo debe ser institucional (@unilibre.edu.co o @unilibrepereira.edu.co)"
            }, status=400)
        
        # Validar teléfono (solo números, 7-10 dígitos)
        telefono_limpio = telefono.replace(' ', '').replace('-', '')
        if not telefono_limpio.isdigit() or len(telefono_limpio) < 7 or len(telefono_limpio) > 10:
            return JsonResponse({
                "error": "El teléfono debe tener entre 7 y 10 dígitos"
            }, status=400)
        
        # Validar asistentes
        if asistentes < 1:
            return JsonResponse({
                "error": "El número de asistentes debe ser al menos 1"
            }, status=400)
        
        # Validar disponibilidad del espacio
        is_available, error_msg = check_espacio_disponible(espacio_id, fecha, hora_inicio, hora_fin, es_publico=True)
        if not is_available:
            return JsonResponse({"error": error_msg}, status=409)
        
        # Obtener objetos relacionados
        espacio = EspacioFisico.objects.get(id=espacio_id)
        
        # Validar capacidad del espacio
        if asistentes > espacio.capacidad:
            return JsonResponse({
                "error": f"El número de asistentes ({asistentes}) excede la capacidad del espacio ({espacio.capacidad})"
            }, status=400)
        
        tipo_actividad = TipoActividad.objects.get(id=tipo_actividad_id)
        
        # Convertir fecha y horas
        f = datetime.date.fromisoformat(fecha)
        hi = datetime.time.fromisoformat(hora_inicio)
        hf = datetime.time.fromisoformat(hora_fin)
        
        # Crear el préstamo PÚBLICO (tabla separada con datos del solicitante incluidos)
        p = PrestamoEspacioPublico(
            espacio=espacio,
            nombre_solicitante=nombre_completo,
            correo_solicitante=correo_institucional,
            telefono_solicitante=telefono,
            identificacion_solicitante=identificacion,
            administrador=None,
            tipo_actividad=tipo_actividad,
            fecha=f,
            hora_inicio=hi,
            hora_fin=hf,
            motivo=motivo,
            asistentes=asistentes,
            estado='Pendiente'
        )
        p.save()
        
        return JsonResponse({
            "message": "Solicitud de préstamo enviada exitosamente. Recibirás una notificación al correo proporcionado.",
            "id": p.id
        }, status=201)
        
    except EspacioFisico.DoesNotExist:
        return JsonResponse({"error": "Espacio no encontrado."}, status=404)
    except TipoActividad.DoesNotExist:
        return JsonResponse({"error": "Tipo de actividad no encontrado."}, status=404)
    except ValueError as e:
        return JsonResponse({"error": f"Formato de datos inválido: {str(e)}"}, status=400)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def list_espacios_disponibles_publico(request):
    """
    Lista espacios disponibles para una fecha y hora específica
    Filtrado por sede (opcional)
    """
    if request.method == 'GET':
        try:
            fecha = request.GET.get('fecha')
            hora_inicio = request.GET.get('hora_inicio')
            hora_fin = request.GET.get('hora_fin')
            sede_id = request.GET.get('sede_id')
            
            if not all([fecha, hora_inicio, hora_fin]):
                return JsonResponse({
                    "error": "fecha, hora_inicio y hora_fin son requeridos"
                }, status=400)
            
            # Obtener todos los espacios (opcionalmente filtrados por sede)
            espacios_query = EspacioFisico.objects.select_related('tipo', 'sede')
            if sede_id:
                espacios_query = espacios_query.filter(sede_id=sede_id)
            
            espacios_disponibles = []
            
            for espacio in espacios_query:
                is_available, _ = check_espacio_disponible(
                    espacio.id, fecha, hora_inicio, hora_fin
                )
                
                if is_available:
                    espacios_disponibles.append({
                        "id": espacio.id,
                        "nombre": espacio.nombre,
                        "capacidad": espacio.capacidad,
                        "tipo": espacio.tipo.nombre,
                        "sede": espacio.sede.nombre,
                        "sede_id": espacio.sede.id,
                        "ubicacion": espacio.ubicacion
                    })
            
            return JsonResponse({
                "espacios": espacios_disponibles,
                "total": len(espacios_disponibles)
            }, status=200)
            
        except ValueError as e:
            return JsonResponse({"error": f"Formato inválido: {str(e)}"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)

@csrf_exempt
def get_prestamo_publico(request, id=None):
    """
    Obtiene un préstamo público por ID
    """
    if id is None:
        return JsonResponse({"error": "El ID es requerido en la URL"}, status=400)
    try:
        p = PrestamoEspacioPublico.objects.select_related(
            'espacio', 'administrador', 'tipo_actividad'
        ).get(id=id)
        
        return JsonResponse({
            "id": p.id,
            "espacio_id": p.espacio.id,
            "espacio_nombre": p.espacio.nombre,
            "espacio_tipo": p.espacio.tipo.nombre,
            "usuario_id": None,  # Público no tiene usuario
            "usuario_nombre": p.nombre_solicitante,
            "usuario_correo": p.correo_solicitante,
            "administrador_id": (p.administrador.id if p.administrador else None),
            "administrador_nombre": (p.administrador.nombre if p.administrador else None),
            "tipo_actividad_id": p.tipo_actividad.id,
            "tipo_actividad_nombre": p.tipo_actividad.nombre,
            "fecha": str(p.fecha),
            "hora_inicio": str(p.hora_inicio),
            "hora_fin": str(p.hora_fin),
            "motivo": p.motivo,
            "asistentes": p.asistentes,
            "telefono": p.telefono_solicitante,
            "estado": p.estado,
            "recursos": []  # Préstamos públicos no tienen recursos por ahora
        }, status=200)
    except PrestamoEspacioPublico.DoesNotExist:
        return JsonResponse({"error": "Prestamo público no encontrado."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def update_prestamo_publico(request):
    """
    Actualiza un préstamo público
    """
    if request.method != 'PUT':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        id = data.get('id')
        if not id:
            return JsonResponse({"error": "ID es requerido"}, status=400)
        
        p = PrestamoEspacioPublico.objects.get(id=id)
        
        # Si se está cambiando espacio, fecha u horas, validar disponibilidad
        espacio_id = data.get('espacio_id', p.espacio.id)
        fecha = data.get('fecha', str(p.fecha))
        hora_inicio = data.get('hora_inicio', str(p.hora_inicio))
        hora_fin = data.get('hora_fin', str(p.hora_fin))
        
        # Usar la misma validación pero para préstamos públicos
        is_available, error_msg = check_espacio_disponible(
            espacio_id, fecha, hora_inicio, hora_fin, prestamo_id=id, es_publico=True
        )
        if not is_available:
            return JsonResponse({"error": error_msg}, status=409)
        
        # Actualizar campos
        if 'espacio_id' in data:
            p.espacio = EspacioFisico.objects.get(id=data.get('espacio_id'))
        if 'nombre_solicitante' in data:
            p.nombre_solicitante = data.get('nombre_solicitante')
        if 'correo_solicitante' in data:
            p.correo_solicitante = data.get('correo_solicitante')
        if 'telefono_solicitante' in data or 'telefono' in data:
            p.telefono_solicitante = data.get('telefono_solicitante') or data.get('telefono')
        if 'identificacion_solicitante' in data:
            p.identificacion_solicitante = data.get('identificacion_solicitante')
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
        if 'estado' in data:
            p.estado = data.get('estado')
        
        p.save()
        
        return JsonResponse({
            "message": "Prestamo público actualizado exitosamente",
            "id": p.id
        }, status=200)
    except PrestamoEspacioPublico.DoesNotExist:
        return JsonResponse({"error": "Prestamo público no encontrado."}, status=404)
    except EspacioFisico.DoesNotExist:
        return JsonResponse({"error": "Espacio no encontrado."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
