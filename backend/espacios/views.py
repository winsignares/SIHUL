from django.shortcuts import render
from .models import EspacioFisico, EspacioPermitido, TipoEspacio
from sedes.models import Sede
from usuarios.models import Usuario
from recursos.models import Recurso, EspacioRecurso
from horario.models import Horario
from prestamos.models import PrestamoEspacio
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Count

# ---------- TipoEspacio CRUD ----------
@csrf_exempt
def list_tipos_espacio(request):
    """Lista todos los tipos de espacio"""
    if request.method == 'GET':
        tipos = TipoEspacio.objects.all()
        lst = [{"id": t.id, "nombre": t.nombre, "descripcion": t.descripcion} for t in tipos]
        return JsonResponse({"tipos_espacio": lst}, status=200)

@csrf_exempt
def get_tipo_espacio(request, id=None):
    """Obtiene un tipo de espacio por ID"""
    if id is None:
        return JsonResponse({"error": "El ID es requerido en la URL"}, status=400)
    try:
        tipo = TipoEspacio.objects.get(id=id)
        return JsonResponse({"id": tipo.id, "nombre": tipo.nombre, "descripcion": tipo.descripcion}, status=200)
    except TipoEspacio.DoesNotExist:
        return JsonResponse({"error": "Tipo de espacio no encontrado."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

# ---------- EspacioFisico CRUD ----------
@csrf_exempt
def create_espacio(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            sede_id = data.get('sede_id')
            nombre = data.get('nombre')
            tipo_id = data.get('tipo_id')
            capacidad = data.get('capacidad')
            ubicacion = data.get('ubicacion')
            estado = data.get('estado', 'Disponible')
            recursos = data.get('recursos', [])  # Lista de objetos recursos {id, estado}
            
            if not sede_id or not nombre or not tipo_id or capacidad is None:
                return JsonResponse({"error": "sede_id, nombre, tipo_id y capacidad son requeridos"}, status=400)
            
            sede = Sede.objects.get(id=sede_id)
            tipo = TipoEspacio.objects.get(id=tipo_id)
            e = EspacioFisico(sede=sede, nombre=nombre, tipo=tipo, capacidad=int(capacidad), ubicacion=ubicacion, estado=estado)
            e.save()
            
            # Crear las relaciones con recursos
            for res_data in recursos:
                try:
                    recurso_id = res_data.get('id')
                    estado_recurso = res_data.get('estado', 'disponible')
                    if recurso_id:
                        recurso = Recurso.objects.get(id=recurso_id)
                        EspacioRecurso.objects.create(
                            espacio=e,
                            recurso=recurso,
                            estado=estado_recurso
                        )
                except Recurso.DoesNotExist:
                    pass  # Ignorar si el recurso no existe
            
            return JsonResponse({"message": "Espacio creado", "id": e.id}, status=201)
        except Sede.DoesNotExist:
            return JsonResponse({"error": "Sede no encontrada."}, status=404)
        except TipoEspacio.DoesNotExist:
            return JsonResponse({"error": "Tipo de espacio no encontrado."}, status=404)
        except ValueError:
            return JsonResponse({"error": "capacidad debe ser un entero"}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def update_espacio(request):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            if not id:
                return JsonResponse({"error": "ID es requerido"}, status=400)
            
            e = EspacioFisico.objects.get(id=id)
            if 'sede_id' in data:
                e.sede = Sede.objects.get(id=data.get('sede_id'))
            if 'nombre' in data:
                e.nombre = data.get('nombre')
            if 'tipo_id' in data:
                e.tipo = TipoEspacio.objects.get(id=data.get('tipo_id'))
            if 'capacidad' in data:
                e.capacidad = int(data.get('capacidad'))
            if 'ubicacion' in data:
                e.ubicacion = data.get('ubicacion')
            if 'estado' in data:
                e.estado = data.get('estado')
            e.save()
            
            # Actualizar recursos si se envían
            if 'recursos' in data:
                # Eliminar todas las relaciones actuales
                EspacioRecurso.objects.filter(espacio=e).delete()
                # Crear las nuevas relaciones
                recursos = data.get('recursos', [])
                for res_data in recursos:
                    try:
                        recurso_id = res_data.get('id')
                        estado_recurso = res_data.get('estado', 'disponible')
                        if recurso_id:
                            recurso = Recurso.objects.get(id=recurso_id)
                            EspacioRecurso.objects.create(
                                espacio=e,
                                recurso=recurso,
                                estado=estado_recurso
                            )
                    except Recurso.DoesNotExist:
                        pass
            
            return JsonResponse({"message": "Espacio actualizado", "id": e.id}, status=200)
        except EspacioFisico.DoesNotExist:
            return JsonResponse({"error": "Espacio no encontrado."}, status=404)
        except Sede.DoesNotExist:
            return JsonResponse({"error": "Sede no encontrada."}, status=404)
        except TipoEspacio.DoesNotExist:
            return JsonResponse({"error": "Tipo de espacio no encontrado."}, status=404)
        except ValueError:
            return JsonResponse({"error": "capacidad debe ser un entero"}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def delete_espacio(request):
    if request.method == 'DELETE':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            if not id:
                return JsonResponse({"error": "ID es requerido"}, status=400)
            e = EspacioFisico.objects.get(id=id)
            # Eliminar explícitamente las relaciones con recursos
            EspacioRecurso.objects.filter(espacio=e).delete()
            # Eliminar el espacio (esto también eliminará EspacioPermitido por CASCADE)
            e.delete()
            return JsonResponse({"message": "Espacio eliminado"}, status=200)
        except EspacioFisico.DoesNotExist:
            return JsonResponse({"error": "Espacio no encontrado."}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def get_espacio(request, id=None):
    if id is None:
        return JsonResponse({"error": "El ID es requerido en la URL"}, status=400)
    try:
        e = EspacioFisico.objects.get(id=id)
        # Obtener recursos del espacio
        recursos = []
        for er in e.espacio_recursos.all():
            recursos.append({
                "id": er.recurso.id,
                "nombre": er.recurso.nombre,
                "estado": er.estado
            })
        
        return JsonResponse({
            "id": e.id, 
            "sede_id": e.sede.id, 
            "nombre": e.nombre,
            "tipo_id": e.tipo.id,
            "tipo_espacio": {
                "id": e.tipo.id,
                "nombre": e.tipo.nombre,
                "descripcion": e.tipo.descripcion
            },
            "capacidad": e.capacidad, 
            "ubicacion": e.ubicacion, 
            "estado": e.estado,
            "recursos": recursos
        }, status=200)
    except EspacioFisico.DoesNotExist:
        return JsonResponse({"error": "Espacio no encontrado."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def list_espacios(request):
    if request.method == 'GET':
        items = EspacioFisico.objects.all()
        lst = []
        for i in items:
            # Obtener recursos del espacio
            recursos = []
            for er in i.espacio_recursos.all():
                recursos.append({
                    "id": er.recurso.id,
                    "nombre": er.recurso.nombre,
                    "estado": er.estado
                })
            
            lst.append({
                "id": i.id, 
                "sede_id": i.sede.id, 
                "nombre": i.nombre,
                "tipo_id": i.tipo.id,
                "tipo_espacio": {
                    "id": i.tipo.id,
                    "nombre": i.tipo.nombre,
                    "descripcion": i.tipo.descripcion
                },
                "capacidad": i.capacidad, 
                "ubicacion": i.ubicacion, 
                "estado": i.estado,
                "recursos": recursos
            })
        return JsonResponse({"espacios": lst}, status=200)

# ---------- EspacioPermitido CRUD ----------
@csrf_exempt
def create_espacio_permitido(request):
    """Crear un nuevo EspacioPermitido"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            espacio_id = data.get('espacio_id')
            usuario_id = data.get('usuario_id')
            
            if not espacio_id or not usuario_id:
                return JsonResponse({"error": "espacio_id y usuario_id son requeridos"}, status=400)
            
            espacio = EspacioFisico.objects.get(id=espacio_id)
            usuario = Usuario.objects.get(id=usuario_id)
            
            # Verificar si ya existe
            if EspacioPermitido.objects.filter(espacio=espacio, usuario=usuario).exists():
                return JsonResponse({"error": "Este permiso ya existe"}, status=400)
            
            espacio_permitido = EspacioPermitido(espacio=espacio, usuario=usuario)
            espacio_permitido.save()
            
            return JsonResponse({
                "message": "EspacioPermitido creado exitosamente",
                "id": espacio_permitido.id,
                "espacio_id": espacio_permitido.espacio.id,
                "usuario_id": espacio_permitido.usuario.id
            }, status=201)
        except EspacioFisico.DoesNotExist:
            return JsonResponse({"error": "Espacio no encontrado"}, status=404)
        except Usuario.DoesNotExist:
            return JsonResponse({"error": "Usuario no encontrado"}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Solo se permite POST"}, status=405)


@csrf_exempt
def list_espacios_permitidos(request):
    """Listar todos los EspaciosPermitidos"""
    if request.method == 'GET':
        try:
            espacios_permitidos = EspacioPermitido.objects.all().select_related('espacio', 'usuario')
            lista = [
                {
                    "id": ep.id,
                    "espacio_id": ep.espacio.id,
                    "espacio_tipo": ep.espacio.tipo.nombre,
                    "espacio_ubicacion": ep.espacio.ubicacion,
                    "usuario_id": ep.usuario.id,
                    "usuario_nombre": ep.usuario.nombre,
                    "usuario_correo": ep.usuario.correo
                }
                for ep in espacios_permitidos
            ]
            return JsonResponse({"espacios_permitidos": lista}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Solo se permite GET"}, status=405)


@csrf_exempt
def get_espacio_permitido(request, id=None):
    """Obtener un EspacioPermitido por ID"""
    if id is None:
        return JsonResponse({"error": "El ID es requerido en la URL"}, status=400)
    try:
        espacio_permitido = EspacioPermitido.objects.select_related('espacio', 'usuario').get(id=id)
        return JsonResponse({
            "id": espacio_permitido.id,
            "espacio_id": espacio_permitido.espacio.id,
            "espacio_tipo": espacio_permitido.espacio.tipo.nombre,
            "espacio_ubicacion": espacio_permitido.espacio.ubicacion,
            "usuario_id": espacio_permitido.usuario.id,
            "usuario_nombre": espacio_permitido.usuario.nombre,
            "usuario_correo": espacio_permitido.usuario.correo
        }, status=200)
    except EspacioPermitido.DoesNotExist:
        return JsonResponse({"error": "EspacioPermitido no encontrado"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def delete_espacio_permitido(request):
    """Eliminar un EspacioPermitido"""
    if request.method == 'DELETE':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            
            if not id:
                return JsonResponse({"error": "El ID es requerido"}, status=400)
            
            espacio_permitido = EspacioPermitido.objects.get(id=id)
            espacio_permitido.delete()
            
            return JsonResponse({
                "message": "EspacioPermitido eliminado exitosamente"
            }, status=200)
        except EspacioPermitido.DoesNotExist:
            return JsonResponse({"error": "EspacioPermitido no encontrado"}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Solo se permite DELETE"}, status=405)


@csrf_exempt
def list_espacios_by_usuario(request, usuario_id=None):
    """Listar todos los espacios permitidos para un usuario específico"""
    if usuario_id is None:
        return JsonResponse({"error": "El usuario_id es requerido en la URL"}, status=400)
    try:
        usuario = Usuario.objects.get(id=usuario_id)
        espacios_permitidos = EspacioPermitido.objects.filter(usuario=usuario).select_related('espacio')
        lista = []
        for ep in espacios_permitidos:
            # Obtener recursos del espacio
            recursos = []
            for er in ep.espacio.espacio_recursos.all():
                recursos.append({
                    "id": er.recurso.id,
                    "nombre": er.recurso.nombre,
                    "estado": er.estado
                })
            
            lista.append({
                "id": ep.espacio.id,
                "tipo_id": ep.espacio.tipo.id,
                "tipo_espacio": {
                    "id": ep.espacio.tipo.id,
                    "nombre": ep.espacio.tipo.nombre,
                    "descripcion": ep.espacio.tipo.descripcion
                },
                "nombre": ep.espacio.nombre,
                "capacidad": ep.espacio.capacidad,
                "ubicacion": ep.espacio.ubicacion,
                "estado": ep.espacio.estado,
                "sede_id": ep.espacio.sede.id,
                "recursos": recursos
            })
        return JsonResponse({"espacios": lista}, status=200)
    except Usuario.DoesNotExist:
        return JsonResponse({"error": "Usuario no encontrado"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# ========== APERTURA Y CIERRE DE SALONES ==========
def get_dia_semana_actual():
    """Retorna el día de la semana en español"""
    dias = {
        0: 'Lunes',
        1: 'Martes', 
        2: 'Miércoles',
        3: 'Jueves',
        4: 'Viernes',
        5: 'Sábado',
        6: 'Domingo'
    }
    return dias[datetime.now().weekday()]


@csrf_exempt
def proximos_apertura_cierre(request):
    """
    Endpoint para obtener las aperturas y cierres pendientes de salones
    para el Supervisor General autenticado.
    
    Retorna:
    - aperturasPendientes: Lista de espacios que están por abrir (15 min antes)
    - cierresPendientes: Lista de espacios que están por cerrar (5 min antes)
    """
    if request.method != 'GET':
        return JsonResponse({"error": "Solo se permite GET"}, status=405)
    
    try:
        # Obtener usuario autenticado del contexto de auth
        # El frontend envía el user_id en localStorage como 'user'
        from usuarios.models import Usuario
        
        # Intentar obtener userId del token/header o del contexto de sesión
        usuario_id = request.session.get('user_id')
        
        # Si no está en sesión, intentar del query param (para pruebas/desarrollo)
        if not usuario_id:
            # Buscar en cookies o headers
            auth_user = request.COOKIES.get('user_id')
            if auth_user:
                usuario_id = auth_user
        
        # Si aún no encontramos el user, intentar extraerlo del contexto de React
        # Para desarrollo, podemos usar query params temporalmente
        if not usuario_id:
            usuario_id = request.GET.get('user_id')
        
        if not usuario_id:
            return JsonResponse({
                "error": "Usuario no autenticado. Por favor inicia sesión.",
                "aperturasPendientes": [],
                "cierresPendientes": [],
                "horaActual": datetime.now().strftime('%H:%M'),
                "diaActual": get_dia_semana_actual(),
                "fechaActual": datetime.now().date().strftime('%Y-%m-%d')
            }, status=200)  # Cambiado a 200 para no bloquear la UI
        
        # Obtener hora actual del servidor
        ahora = datetime.now()
        hora_actual = ahora.time()
        fecha_actual = ahora.date()
        dia_actual = get_dia_semana_actual()
        
        # Obtener espacios permitidos para este usuario
        espacios_permitidos = EspacioPermitido.objects.filter(
            usuario_id=usuario_id
        ).select_related('espacio', 'espacio__sede', 'espacio__tipo')
        
        if not espacios_permitidos.exists():
            return JsonResponse({
                "aperturasPendientes": [],
                "cierresPendientes": [],
                "horaActual": hora_actual.strftime('%H:%M'),
                "diaActual": dia_actual,
                "fechaActual": fecha_actual.strftime('%Y-%m-%d')
            }, status=200)
        
        # Extraer IDs de espacios
        espacios_ids = [ep.espacio.id for ep in espacios_permitidos]
        
        # Crear un mapa de espacios para fácil acceso
        espacios_map = {ep.espacio.id: ep.espacio for ep in espacios_permitidos}
        
        # Listas para almacenar resultados
        aperturas_pendientes = []
        cierres_pendientes = []
        
        # ========== CONSULTAR HORARIOS ==========
        # Buscar horarios del día actual en los espacios permitidos
        horarios = Horario.objects.filter(
            espacio_id__in=espacios_ids,
            dia_semana=dia_actual
        ).select_related('espacio', 'espacio__sede', 'espacio__tipo', 'asignatura', 'docente')
        
        for horario in horarios:
            espacio = espacios_map.get(horario.espacio.id)
            if not espacio:
                continue
            
            # Calcular ventana de apertura (15 minutos antes)
            hora_apertura_inicio = (
                datetime.combine(fecha_actual, horario.hora_inicio) - timedelta(minutes=15)
            ).time()
            hora_apertura_fin = horario.hora_inicio
            
            # Calcular ventana de cierre (5 minutos antes)
            hora_cierre_inicio = (
                datetime.combine(fecha_actual, horario.hora_fin) - timedelta(minutes=5)
            ).time()
            hora_cierre_fin = horario.hora_fin
            
            # Verificar si está en ventana de apertura
            if hora_apertura_inicio <= hora_actual < hora_apertura_fin:
                aperturas_pendientes.append({
                    "idEspacio": espacio.id,
                    "nombreEspacio": espacio.nombre,
                    "sede": espacio.sede.nombre if espacio.sede else "Sin sede",
                    "piso": espacio.ubicacion or "No especificado",
                    "tipoUso": "Clase",
                    "asignatura": horario.asignatura.nombre if horario.asignatura else "Sin asignatura",
                    "docente": horario.docente.nombre if horario.docente else "Sin docente",
                    "horaInicio": horario.hora_inicio.strftime('%H:%M'),
                    "horaFin": horario.hora_fin.strftime('%H:%M'),
                    "diaSemana": dia_actual
                })
            
            # Verificar si está en ventana de cierre
            if hora_cierre_inicio <= hora_actual < hora_cierre_fin:
                cierres_pendientes.append({
                    "idEspacio": espacio.id,
                    "nombreEspacio": espacio.nombre,
                    "sede": espacio.sede.nombre if espacio.sede else "Sin sede",
                    "piso": espacio.ubicacion or "No especificado",
                    "tipoUso": "Clase",
                    "asignatura": horario.asignatura.nombre if horario.asignatura else "Sin asignatura",
                    "docente": horario.docente.nombre if horario.docente else "Sin docente",
                    "horaInicio": horario.hora_inicio.strftime('%H:%M'),
                    "horaFin": horario.hora_fin.strftime('%H:%M'),
                    "diaSemana": dia_actual
                })
        
        # ========== CONSULTAR PRÉSTAMOS ==========
        # Buscar préstamos del día actual en los espacios permitidos
        prestamos = PrestamoEspacio.objects.filter(
            espacio_id__in=espacios_ids,
            fecha=fecha_actual,
            estado='Aprobado'  # Solo préstamos aprobados
        ).select_related('espacio', 'espacio__sede', 'espacio__tipo', 'usuario', 'tipo_actividad')
        
        for prestamo in prestamos:
            espacio = espacios_map.get(prestamo.espacio.id)
            if not espacio:
                continue
            
            # Calcular ventana de apertura (15 minutos antes)
            hora_apertura_inicio = (
                datetime.combine(fecha_actual, prestamo.hora_inicio) - timedelta(minutes=15)
            ).time()
            hora_apertura_fin = prestamo.hora_inicio
            
            # Calcular ventana de cierre (5 minutos antes)
            hora_cierre_inicio = (
                datetime.combine(fecha_actual, prestamo.hora_fin) - timedelta(minutes=5)
            ).time()
            hora_cierre_fin = prestamo.hora_fin
            
            # Verificar si está en ventana de apertura
            if hora_apertura_inicio <= hora_actual < hora_apertura_fin:
                aperturas_pendientes.append({
                    "idEspacio": espacio.id,
                    "nombreEspacio": espacio.nombre,
                    "sede": espacio.sede.nombre if espacio.sede else "Sin sede",
                    "piso": espacio.ubicacion or "No especificado",
                    "tipoUso": "Préstamo",
                    "tipoActividad": prestamo.tipo_actividad.nombre if prestamo.tipo_actividad else "Sin especificar",
                    "solicitante": prestamo.usuario.nombre if prestamo.usuario else "Sin solicitante",
                    "horaInicio": prestamo.hora_inicio.strftime('%H:%M'),
                    "horaFin": prestamo.hora_fin.strftime('%H:%M'),
                    "fecha": prestamo.fecha.strftime('%Y-%m-%d')
                })
            
            # Verificar si está en ventana de cierre
            if hora_cierre_inicio <= hora_actual < hora_cierre_fin:
                cierres_pendientes.append({
                    "idEspacio": espacio.id,
                    "nombreEspacio": espacio.nombre,
                    "sede": espacio.sede.nombre if espacio.sede else "Sin sede",
                    "piso": espacio.ubicacion or "No especificado",
                    "tipoUso": "Préstamo",
                    "tipoActividad": prestamo.tipo_actividad.nombre if prestamo.tipo_actividad else "Sin especificar",
                    "solicitante": prestamo.usuario.nombre if prestamo.usuario else "Sin solicitante",
                    "horaInicio": prestamo.hora_inicio.strftime('%H:%M'),
                    "horaFin": prestamo.hora_fin.strftime('%H:%M'),
                    "fecha": prestamo.fecha.strftime('%Y-%m-%d')
                })
        
        return JsonResponse({
            "aperturasPendientes": aperturas_pendientes,
            "cierresPendientes": cierres_pendientes,
            "horaActual": hora_actual.strftime('%H:%M'),
            "diaActual": dia_actual,
            "fechaActual": fecha_actual.strftime('%Y-%m-%d')
        }, status=200)
        
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# ========== ESTADO Y HORARIO DE ESPACIOS (SUPERVISOR) ==========

@csrf_exempt
def get_estado_espacio(request, espacio_id=None):
    """
    Obtiene el estado actual y la próxima clase de un espacio.
    """
    if request.method != 'GET':
        return JsonResponse({"error": "Solo se permite GET"}, status=405)
    
    if espacio_id is None:
        return JsonResponse({"error": "El espacio_id es requerido"}, status=400)

    try:
        espacio = EspacioFisico.objects.get(id=espacio_id)
        
        # 1. Verificar estado manual (Mantenimiento tiene prioridad)
        if espacio.estado == 'Mantenimiento':
            return JsonResponse({
                "estado": "mantenimiento",
                "texto_estado": "En Mantenimiento",
                "proxima_clase": None
            }, status=200)

        # 2. Obtener hora y día actual
        ahora = datetime.now()
        hora_actual = ahora.time()
        dia_actual = get_dia_semana_actual()
        
        # 3. Buscar clases de hoy para este espacio
        clases_hoy = Horario.objects.filter(
            espacio=espacio,
            dia_semana=dia_actual
        ).select_related('asignatura', 'docente', 'grupo').order_by('hora_inicio')
        
        estado_actual = "disponible"
        texto_estado = "Disponible"
        proxima_clase_data = None
        
        # 4. Determinar estado basado en clases
        for clase in clases_hoy:
            # Si hay una clase ocurriendo AHORA
            if clase.hora_inicio <= hora_actual < clase.hora_fin:
                estado_actual = "ocupado"
                texto_estado = "Ocupado"
                proxima_clase_data = {
                    "asignatura": clase.asignatura.nombre,
                    "docente": clase.docente.nombre if clase.docente else "Sin docente",
                    "hora_inicio": clase.hora_inicio.strftime('%H:%M'),
                    "hora_fin": clase.hora_fin.strftime('%H:%M'),
                    "grupo": clase.grupo.nombre
                }
                break # Ya encontramos el estado actual, salimos
            
            # Si es una clase futura (la primera que encontremos será la próxima)
            if clase.hora_inicio > hora_actual:
                if proxima_clase_data is None: # Solo guardamos la primera futura
                    proxima_clase_data = {
                        "asignatura": clase.asignatura.nombre,
                        "docente": clase.docente.nombre if clase.docente else "Sin docente",
                        "hora_inicio": clase.hora_inicio.strftime('%H:%M'),
                        "hora_fin": clase.hora_fin.strftime('%H:%M'),
                        "grupo": clase.grupo.nombre
                    }
                    
                    # Calcular si falta poco para esta clase (ej. 1 hora)
                    inicio_dt = datetime.combine(ahora.date(), clase.hora_inicio)
                    diff = inicio_dt - ahora
                    if diff.total_seconds() <= 3600: # Menos de 1 hora
                         texto_estado = f"Próxima clase a las {clase.hora_inicio.strftime('%H:%M')}"
        
        # Si no hay clase actual ni futura, y no está en mantenimiento
        if estado_actual == "disponible" and proxima_clase_data is None:
             texto_estado = "Sin clases pendientes hoy"
        elif estado_actual == "disponible" and proxima_clase_data:
             texto_estado = f"Próxima clase a las {proxima_clase_data['hora_inicio']}"

        return JsonResponse({
            "estado": estado_actual,
            "texto_estado": texto_estado,
            "proxima_clase": proxima_clase_data
        }, status=200)

    except EspacioFisico.DoesNotExist:
        return JsonResponse({"error": "Espacio no encontrado"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def get_horario_espacio(request, espacio_id=None):
    """
    Obtiene el horario semanal completo de un espacio.
    """
    if request.method != 'GET':
        return JsonResponse({"error": "Solo se permite GET"}, status=405)
    
    if espacio_id is None:
        return JsonResponse({"error": "El espacio_id es requerido"}, status=400)

    try:
        # Verificar que el espacio existe
        if not EspacioFisico.objects.filter(id=espacio_id).exists():
             return JsonResponse({"error": "Espacio no encontrado"}, status=404)

        # Obtener todos los horarios del espacio
        horarios = Horario.objects.filter(
            espacio_id=espacio_id
        ).select_related('asignatura', 'docente', 'grupo')
        
        lista_horarios = []
        for h in horarios:
            lista_horarios.append({
                "dia": h.dia_semana,
                "hora_inicio": h.hora_inicio.hour, # Frontend espera entero para el grid
                "hora_fin": h.hora_fin.hour,       # Frontend espera entero
                "materia": h.asignatura.nombre,
                "docente": h.docente.nombre if h.docente else "Sin docente",
                "grupo": h.grupo.nombre,
                "estado": "ocupado" # Por defecto ocupado si hay clase
            })
            
        return JsonResponse({
            "horario": lista_horarios
        }, status=200)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def ocupacion_semanal(request):
    """
    Calcula y retorna la ocupación semanal de espacios.
    
    Parámetros GET opcionales:
    - tipo_espacio_id: ID del tipo de espacio para filtrar
    - semana_offset: 0 (semana actual), 1 (próxima semana), -1 (semana pasada)
    - espacio_id: ID del espacio específico (opcional)
    
    Retorna un array con la ocupación de cada espacio considerando:
    - Horarios (clases)
    - Préstamos de espacios
    - Rango de trabajo: 6:00 - 22:00 (16 horas/día)
    - Jornadas: Mañana (6-12), Tarde (12-18), Noche (18-22)
    """
    if request.method != 'GET':
        return JsonResponse({"error": "Solo se permite GET"}, status=405)
    
    try:
        from datetime import datetime, timedelta
        from django.utils import timezone
        
        # Obtener parámetros
        tipo_espacio_id = request.GET.get('tipo_espacio_id')
        espacio_id = request.GET.get('espacio_id')
        semana_offset = int(request.GET.get('semana_offset', 0))
        
        # Calcular rango de fechas (Lunes a Sábado)
        hoy = timezone.now().date()
        dias_hasta_lunes = (hoy.weekday() - 0) % 7  # 0 = Monday
        lunes = hoy - timedelta(days=dias_hasta_lunes)
        lunes += timedelta(weeks=semana_offset)
        sabado = lunes + timedelta(days=5)  # Lunes + 5 días = Sábado
        
        # Mapeo de nombres de días (inglés a español y variantes)
        dias_nombre = {
            'Monday': 'Lunes',
            'Tuesday': 'Martes',
            'Wednesday': 'Miércoles',
            'Thursday': 'Jueves',
            'Friday': 'Viernes',
            'Saturday': 'Sábado',
            'Sunday': 'Domingo'
        }
        
        # Obtener espacios
        espacios_query = EspacioFisico.objects.all().select_related('tipo', 'sede')
        
        if tipo_espacio_id:
            espacios_query = espacios_query.filter(tipo_id=tipo_espacio_id)
        
        if espacio_id:
            espacios_query = espacios_query.filter(id=espacio_id)
        
        ocupacion_list = []
        
        for espacio in espacios_query:
            # Calcular horas ocupadas por cada jornada
            horas_manana = 0.0      # 6-12 (6 horas máx)
            horas_tarde = 0.0       # 12-18 (6 horas máx)
            horas_noche = 0.0       # 18-22 (4 horas máx)
            horas_totales = 0.0
            
            # Horas disponibles en la semana: 16 horas/día * 6 días = 96 horas
            horas_disponibles = 16 * 6  # 96 horas
            
            # Recorrer cada día de la semana (Lunes a Sábado)
            fecha_actual = lunes
            while fecha_actual <= sabado:
                dia_nombre_en = fecha_actual.strftime('%A')
                dia_nombre_es = dias_nombre.get(dia_nombre_en, dia_nombre_en)
                
                # Obtener horarios (clases) para este día y espacio
                # Buscar con variantes de dia_semana (en español, en inglés, etc.)
                horarios_dia = Horario.objects.filter(
                    espacio=espacio,
                    dia_semana__iexact=dia_nombre_es  # Case-insensitive search
                )
                
                # Si no encuentra con español, buscar con inglés
                if not horarios_dia.exists():
                    horarios_dia = Horario.objects.filter(
                        espacio=espacio,
                        dia_semana__iexact=dia_nombre_en
                    )
                
                # Obtener préstamos aprobados para este día y espacio
                prestamos_dia = PrestamoEspacio.objects.filter(
                    espacio=espacio,
                    fecha=fecha_actual,
                    estado='Aprobado'
                )
                
                # Calcular horas ocupadas por horarios
                for horario in horarios_dia:
                    duracion = _calcular_duracion_horas(horario.hora_inicio, horario.hora_fin)
                    horas_ocupadas_en_jornadas = _distribuir_horas_en_jornadas(
                        horario.hora_inicio, 
                        horario.hora_fin
                    )
                    horas_manana += horas_ocupadas_en_jornadas['manana']
                    horas_tarde += horas_ocupadas_en_jornadas['tarde']
                    horas_noche += horas_ocupadas_en_jornadas['noche']
                
                # Calcular horas ocupadas por préstamos
                for prestamo in prestamos_dia:
                    duracion = _calcular_duracion_horas(prestamo.hora_inicio, prestamo.hora_fin)
                    horas_ocupadas_en_jornadas = _distribuir_horas_en_jornadas(
                        prestamo.hora_inicio,
                        prestamo.hora_fin
                    )
                    horas_manana += horas_ocupadas_en_jornadas['manana']
                    horas_tarde += horas_ocupadas_en_jornadas['tarde']
                    horas_noche += horas_ocupadas_en_jornadas['noche']
                
                fecha_actual += timedelta(days=1)
            
            # Limitar horas máximas por jornada (para evitar duplicados)
            # Máximo 6 horas mañana (lunes-sábado)
            horas_manana = min(horas_manana, 36)  # 6 horas * 6 días
            # Máximo 6 horas tarde (lunes-sábado)
            horas_tarde = min(horas_tarde, 36)  # 6 horas * 6 días
            # Máximo 4 horas noche (lunes-sábado)
            horas_noche = min(horas_noche, 24)  # 4 horas * 6 días
            
            horas_totales = horas_manana + horas_tarde + horas_noche
            
            # Calcular porcentajes por jornada
            porcentaje_manana = (horas_manana / 36) * 100 if horas_manana > 0 else 0
            porcentaje_tarde = (horas_tarde / 36) * 100 if horas_tarde > 0 else 0
            porcentaje_noche = (horas_noche / 24) * 100 if horas_noche > 0 else 0
            
            # Calcular porcentaje de ocupación semanal
            porcentaje_ocupacion = (horas_totales / horas_disponibles) * 100 if horas_totales > 0 else 0
            
            ocupacion_list.append({
                'id': espacio.id,
                'nombre': espacio.nombre,
                'tipo': espacio.tipo.nombre,
                'ubicacion': espacio.ubicacion or 'Sin ubicación',
                'capacidad': espacio.capacidad,
                'sede': espacio.sede.nombre if espacio.sede else 'Sin sede',
                'edificio': espacio.ubicacion.split('-')[0] if espacio.ubicacion and '-' in espacio.ubicacion else 'N/A',
                'horasOcupadasSemana': round(horas_totales, 2),
                'horasDisponibles': horas_disponibles,
                'horasOcupadasManana': round(horas_manana, 2),
                'horasOcupadasTarde': round(horas_tarde, 2),
                'horasOcupadasNoche': round(horas_noche, 2),
                'porcentajeOcupacion': round(porcentaje_ocupacion, 2),
                'porcentajeManana': round(porcentaje_manana, 2),
                'porcentajeTarde': round(porcentaje_tarde, 2),
                'porcentajeNoche': round(porcentaje_noche, 2),
                'jornada': {
                    'manana': round(porcentaje_manana, 1),
                    'tarde': round(porcentaje_tarde, 1),
                    'noche': round(porcentaje_noche, 1)
                },
                'estado': espacio.estado
            })
        
        return JsonResponse({
            'semana_inicio': lunes.isoformat(),
            'semana_fin': sabado.isoformat(),
            'ocupacion': ocupacion_list
        }, status=200)
    
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


def _calcular_duracion_horas(hora_inicio, hora_fin):
    """Calcula la duración en horas entre dos tiempos."""
    from datetime import datetime, time
    
    # Convertir a datetime si son objetos time
    if isinstance(hora_inicio, time):
        inicio_dt = datetime.combine(datetime.today(), hora_inicio)
    else:
        inicio_dt = hora_inicio
    
    if isinstance(hora_fin, time):
        fin_dt = datetime.combine(datetime.today(), hora_fin)
    else:
        fin_dt = hora_fin
    
    duracion = (fin_dt - inicio_dt).total_seconds() / 3600
    return max(0, duracion)  # Asegurar que no sea negativo


def _distribuir_horas_en_jornadas(hora_inicio, hora_fin):
    """
    Distribuye las horas ocupadas en las jornadas: Mañana (6-12), Tarde (12-18), Noche (18-22).
    Retorna un diccionario con horas en cada jornada.
    """
    from datetime import time, datetime, timedelta
    
    # Definir horas de jornadas
    hora_6 = time(6, 0)
    hora_12 = time(12, 0)
    hora_18 = time(18, 0)
    hora_22 = time(22, 0)
    
    # Convertir a datetime para cálculos
    if isinstance(hora_inicio, time):
        inicio_dt = datetime.combine(datetime.today(), hora_inicio)
    else:
        inicio_dt = hora_inicio
    
    if isinstance(hora_fin, time):
        fin_dt = datetime.combine(datetime.today(), hora_fin)
    else:
        fin_dt = hora_fin
    
    horas_manana = 0
    horas_tarde = 0
    horas_noche = 0
    
    # Calcular intersección en cada jornada
    # MAÑANA (6:00 - 12:00)
    manana_inicio = datetime.combine(datetime.today(), hora_6)
    manana_fin = datetime.combine(datetime.today(), hora_12)
    horas_manana = _calcular_interseccion_horas(inicio_dt, fin_dt, manana_inicio, manana_fin)
    
    # TARDE (12:00 - 18:00)
    tarde_inicio = datetime.combine(datetime.today(), hora_12)
    tarde_fin = datetime.combine(datetime.today(), hora_18)
    horas_tarde = _calcular_interseccion_horas(inicio_dt, fin_dt, tarde_inicio, tarde_fin)
    
    # NOCHE (18:00 - 22:00)
    noche_inicio = datetime.combine(datetime.today(), hora_18)
    noche_fin = datetime.combine(datetime.today(), hora_22)
    horas_noche = _calcular_interseccion_horas(inicio_dt, fin_dt, noche_inicio, noche_fin)
    
    return {
        'manana': horas_manana,
        'tarde': horas_tarde,
        'noche': horas_noche
    }


def _calcular_interseccion_horas(inicio1, fin1, inicio2, fin2):
    """
    Calcula las horas de intersección entre dos rangos de tiempo.
    """
    inicio_interseccion = max(inicio1, inicio2)
    fin_interseccion = min(fin1, fin2)
    
    if inicio_interseccion >= fin_interseccion:
        return 0
    
    duracion = (fin_interseccion - inicio_interseccion).total_seconds() / 3600
    return max(0, duracion)


@csrf_exempt
def debug_ocupacion(request):
    """
    Endpoint de debug para ver qué datos hay en la BD.
    """
    if request.method != 'GET':
        return JsonResponse({"error": "Solo GET"}, status=405)
    
    try:
        from datetime import datetime, timedelta
        from django.utils import timezone
        
        hoy = timezone.now().date()
        dias_hasta_lunes = (hoy.weekday() - 0) % 7
        lunes = hoy - timedelta(days=dias_hasta_lunes)
        sabado = lunes + timedelta(days=5)
        
        # Mapeo de nombres de días
        dias_nombre_es = {
            'Monday': 'Lunes',
            'Tuesday': 'Martes',
            'Wednesday': 'Miércoles',
            'Thursday': 'Jueves',
            'Friday': 'Viernes',
            'Saturday': 'Sábado'
        }
        
        debug_data = {
            'semana': {
                'lunes': lunes.isoformat(),
                'sabado': sabado.isoformat(),
            },
            'totales': {
                'horarios': Horario.objects.count(),
                'prestamos': PrestamoEspacio.objects.count(),
                'prestamos_aprobados': PrestamoEspacio.objects.filter(estado='Aprobado').count(),
                'espacios': EspacioFisico.objects.count(),
            },
            'horarios_por_espacio': {},
            'prestamos_por_espacio': {},
        }
        
        # Ver horarios agrupados por espacio
        horarios_por_espacio = Horario.objects.values('espacio__id', 'espacio__nombre', 'dia_semana').annotate(
            count=Count('id')
        ).order_by('espacio__nombre')
        
        for h in horarios_por_espacio[:10]:
            key = f"{h['espacio__id']} - {h['espacio__nombre']}"
            if key not in debug_data['horarios_por_espacio']:
                debug_data['horarios_por_espacio'][key] = []
            debug_data['horarios_por_espacio'][key].append({
                'dia': h['dia_semana'],
                'cantidad': h['count']
            })
        
        # Ver préstamos agrupados por espacio
        prestamos_por_espacio = PrestamoEspacio.objects.filter(
            estado='Aprobado'
        ).values('espacio__id', 'espacio__nombre').annotate(
            count=Count('id')
        ).order_by('espacio__nombre')
        
        for p in prestamos_por_espacio[:10]:
            key = f"{p['espacio__id']} - {p['espacio__nombre']}"
            debug_data['prestamos_por_espacio'][key] = p['count']
        
        # Mostrar detalles de algunos horarios específicos
        debug_data['muestra_horarios_detallados'] = []
        horarios_muestra = Horario.objects.select_related('espacio')[:5]
        for h in horarios_muestra:
            debug_data['muestra_horarios_detallados'].append({
                'espacio_id': h.espacio.id,
                'espacio': h.espacio.nombre,
                'dia_semana': h.dia_semana,
                'hora_inicio': str(h.hora_inicio),
                'hora_fin': str(h.hora_fin),
            })
        
        # Mostrar detalles de algunos préstamos
        debug_data['muestra_prestamos_detallados'] = []
        prestamos_muestra = PrestamoEspacio.objects.filter(estado='Aprobado').select_related('espacio')[:5]
        for p in prestamos_muestra:
            debug_data['muestra_prestamos_detallados'].append({
                'espacio_id': p.espacio.id,
                'espacio': p.espacio.nombre,
                'fecha': p.fecha.isoformat(),
                'hora_inicio': str(p.hora_inicio),
                'hora_fin': str(p.hora_fin),
            })
        
        # Ver valores únicos de dia_semana en BD
        dias_en_bd = list(Horario.objects.values_list('dia_semana', flat=True).distinct())
        debug_data['dias_semana_unicos_en_bd'] = dias_en_bd
        
        return JsonResponse(debug_data, status=200)
    
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)



@csrf_exempt
def generar_pdf_ocupacion_semanal(request):
    """
    Genera un PDF con el reporte de ocupación semanal.
    
    Parámetros POST:
    - tipo_espacio_id: ID del tipo de espacio (opcional)
    - semana_offset: 0 (semana actual), 1 (próxima semana), etc.
    """
    if request.method != 'POST':
        return JsonResponse({"error": "Solo se permite POST"}, status=405)
    
    try:
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_CENTER, TA_LEFT
        from datetime import datetime, timedelta
        from django.utils import timezone
        from io import BytesIO
        from django.http import FileResponse
        
        data = json.loads(request.body) if request.body else {}
        tipo_espacio_id = data.get('tipo_espacio_id')
        semana_offset = int(data.get('semana_offset', 0))
        
        # Calcular rango de fechas
        hoy = timezone.now().date()
        dias_hasta_lunes = (hoy.weekday() - 0) % 7
        lunes = hoy - timedelta(days=dias_hasta_lunes)
        lunes += timedelta(weeks=semana_offset)
        sabado = lunes + timedelta(days=5)
        
        # Obtener espacios
        espacios_query = EspacioFisico.objects.all().select_related('tipo', 'sede')
        
        if tipo_espacio_id:
            espacios_query = espacios_query.filter(tipo_id=tipo_espacio_id)
        
        # Crear PDF en memoria
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
        # Estilos personalizados
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e293b'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=12,
            textColor=colors.HexColor('#475569'),
            spaceAfter=12
        )
        
        # Título
        title = Paragraph('Reporte de Ocupación Semanal de Espacios', title_style)
        elements.append(title)
        elements.append(Spacer(1, 0.2*inch))
        
        # Información de período
        periodo_texto = f'<b>Período:</b> {lunes.strftime("%d/%m/%Y")} a {sabado.strftime("%d/%m/%Y")}'
        elements.append(Paragraph(periodo_texto, styles['Normal']))
        elements.append(Spacer(1, 0.2*inch))
        
        # Tabla de datos
        table_data = [['Espacio', 'Tipo', 'Ubicación', 'Horas Ocupadas', 'Ocupación %']]
        
        for espacio in espacios_query:
            # Calcular ocupación (simplificado para el PDF)
            horas_ocupadas = 0.0
            
            fecha_actual = lunes
            while fecha_actual <= sabado:
                horarios = Horario.objects.filter(espacio=espacio, dia_semana__iexact=_get_dia_nombre(fecha_actual))
                for h in horarios:
                    horas_ocupadas += _calcular_duracion_horas(h.hora_inicio, h.hora_fin)
                
                prestamos = PrestamoEspacio.objects.filter(
                    espacio=espacio,
                    fecha=fecha_actual,
                    estado='Aprobado'
                )
                for p in prestamos:
                    horas_ocupadas += _calcular_duracion_horas(p.hora_inicio, p.hora_fin)
                
                fecha_actual += timedelta(days=1)
            
            porcentaje = (horas_ocupadas / 96) * 100 if horas_ocupadas > 0 else 0
            
            table_data.append([
                espacio.nombre,
                espacio.tipo.nombre,
                espacio.ubicacion or 'N/A',
                f'{horas_ocupadas:.1f}h',
                f'{porcentaje:.1f}%'
            ])
        
        # Crear tabla
        table = Table(table_data, colWidths=[2.2*inch, 1.2*inch, 1.5*inch, 1.2*inch, 1*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(table)
        
        # Construir PDF
        doc.build(elements)
        buffer.seek(0)
        
        # Retornar PDF como archivo
        response = FileResponse(buffer, as_attachment=True, filename=f'ocupacion-semanal-{lunes.isoformat()}.pdf')
        response['Content-Type'] = 'application/pdf'
        return response
    
    except ImportError:
        return JsonResponse({"error": "ReportLab no está instalado"}, status=500)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


def _get_dia_nombre(fecha):
    """Retorna el nombre del día en español."""
    dias_nombre = {
        0: 'Lunes',
        1: 'Martes',
        2: 'Miércoles',
        3: 'Jueves',
        4: 'Viernes',
        5: 'Sábado'
    }
    return dias_nombre.get(fecha.weekday(), '')


# ---------- REPORTE DE OCUPACIÓN ----------
@csrf_exempt
def reporte_ocupacion(request):
    """
    Endpoint para obtener datos de reporte de ocupación por jornada y espacios más usados.
    
    Parámetros GET opcionales:
    - semana_offset: 0 (semana actual), 1 (próxima semana), -1 (semana pasada)
    
    Retorna:
    {
        "periodo": "2025-1",
        "semana_inicio": "2025-01-XX",
        "semana_fin": "2025-01-XX",
        "ocupacion_por_jornada": [
            {
                "jornada": "Mañana (07:00 - 12:00)",
                "ocupacion": 85,
                "espacios": 45
            },
            ...
        ],
        "espacios_mas_usados": [
            {
                "espacio": "Aula 101",
                "usos": 28,
                "ocupacion": 95
            },
            ...
        ]
    }
    """
    if request.method != 'GET':
        return JsonResponse({"error": "Solo se permite GET"}, status=405)
    
    try:
        # Obtener parámetro de semana
        semana_offset = int(request.GET.get('semana_offset', 0))
        
        # Calcular rango de fechas (Lunes a Sábado)
        hoy = timezone.now().date()
        dias_hasta_lunes = (hoy.weekday() - 0) % 7
        lunes = hoy - timedelta(days=dias_hasta_lunes)
        lunes += timedelta(weeks=semana_offset)
        sabado = lunes + timedelta(days=5)
        
        # Mapeo de nombres de días
        dias_nombre = {
            'Monday': 'Lunes',
            'Tuesday': 'Martes',
            'Wednesday': 'Miércoles',
            'Thursday': 'Jueves',
            'Friday': 'Viernes',
            'Saturday': 'Sábado',
            'Sunday': 'Domingo'
        }
        
        # Obtener todos los espacios
        espacios = EspacioFisico.objects.all().select_related('tipo', 'sede')
        
        if not espacios.exists():
            return JsonResponse({
                "periodo": "2025-1",
                "semana_inicio": lunes.isoformat(),
                "semana_fin": sabado.isoformat(),
                "ocupacion_por_jornada": [],
                "espacios_mas_usados": []
            }, status=200)
        
        # ======== OCUPACIÓN POR JORNADA ========
        ocupacion_por_jornada = _calcular_ocupacion_por_jornada_reporte(
            espacios, lunes, sabado, dias_nombre
        )
        
        # ======== ESPACIOS MÁS USADOS ========
        espacios_mas_usados = _calcular_espacios_mas_usados_reporte(
            espacios, lunes, sabado, dias_nombre
        )
        
        # Construcción del periodo
        periodo = "2025-1"  # TODO: Obtener del contexto actual
        
        return JsonResponse({
            "periodo": periodo,
            "semana_inicio": lunes.isoformat(),
            "semana_fin": sabado.isoformat(),
            "ocupacion_por_jornada": ocupacion_por_jornada,
            "espacios_mas_usados": espacios_mas_usados
        }, status=200)
    
    except ValueError as e:
        return JsonResponse({"error": f"Error de valor: {str(e)}"}, status=400)
    except Exception as e:
        import traceback
        error_msg = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Error en reporte_ocupacion: {error_msg}")
        return JsonResponse({"error": f"Error del servidor: {str(e)}"}, status=500)


def _calcular_ocupacion_por_jornada_reporte(espacios, lunes, sabado, dias_nombre):
    """
    Calcula el porcentaje de ocupación por jornada para todos los espacios.
    Retorna: lista con ocupación de cada jornada
    """
    try:
        # Inicializar contadores
        espacios_con_clases_manana = set()
        espacios_con_clases_tarde = set()
        espacios_con_clases_noche = set()
        
        espacios_totales = set(e.id for e in espacios)
        
        # Recorrer cada día de la semana
        fecha_actual = lunes
        while fecha_actual <= sabado:
            dia_nombre_en = fecha_actual.strftime('%A')
            dia_nombre_es = dias_nombre.get(dia_nombre_en, dia_nombre_en)
            
            # Obtener horarios y préstamos para este día
            horarios_dia = Horario.objects.filter(
                dia_semana__iexact=dia_nombre_es
            ).values_list('espacio_id', 'hora_inicio', 'hora_fin')
            
            if not horarios_dia.exists():
                horarios_dia = Horario.objects.filter(
                    dia_semana__iexact=dia_nombre_en
                ).values_list('espacio_id', 'hora_inicio', 'hora_fin')
            
            prestamos_dia = PrestamoEspacio.objects.filter(
                fecha=fecha_actual,
                estado='Aprobado'
            ).values_list('espacio_id', 'hora_inicio', 'hora_fin')
            
            # Procesar horarios
            for espacio_id, hora_inicio, hora_fin in horarios_dia:
                try:
                    jornadas = _obtener_jornadas_de_horario_reporte(hora_inicio, hora_fin)
                    if 'manana' in jornadas:
                        espacios_con_clases_manana.add(espacio_id)
                    if 'tarde' in jornadas:
                        espacios_con_clases_tarde.add(espacio_id)
                    if 'noche' in jornadas:
                        espacios_con_clases_noche.add(espacio_id)
                except Exception as e:
                    print(f"Error procesando horario {espacio_id}: {str(e)}")
                    continue
            
            # Procesar préstamos
            for espacio_id, hora_inicio, hora_fin in prestamos_dia:
                try:
                    jornadas = _obtener_jornadas_de_horario_reporte(hora_inicio, hora_fin)
                    if 'manana' in jornadas:
                        espacios_con_clases_manana.add(espacio_id)
                    if 'tarde' in jornadas:
                        espacios_con_clases_tarde.add(espacio_id)
                    if 'noche' in jornadas:
                        espacios_con_clases_noche.add(espacio_id)
                except Exception as e:
                    print(f"Error procesando préstamo {espacio_id}: {str(e)}")
                    continue
            
            fecha_actual += timedelta(days=1)
        
        # Calcular porcentajes
        total_espacios = len(espacios_totales) if espacios_totales else 1
        
        ocupacion = [
            {
                "jornada": "Mañana (07:00 - 12:00)",
                "ocupacion": int((len(espacios_con_clases_manana) / total_espacios * 100)),
                "espacios": len(espacios_con_clases_manana)
            },
            {
                "jornada": "Tarde (14:00 - 18:00)",
                "ocupacion": int((len(espacios_con_clases_tarde) / total_espacios * 100)),
                "espacios": len(espacios_con_clases_tarde)
            },
            {
                "jornada": "Noche (18:00 - 21:00)",
                "ocupacion": int((len(espacios_con_clases_noche) / total_espacios * 100)),
                "espacios": len(espacios_con_clases_noche)
            }
        ]
        
        return ocupacion
    except Exception as e:
        print(f"Error en _calcular_ocupacion_por_jornada_reporte: {str(e)}")
        return []


def _calcular_espacios_mas_usados_reporte(espacios, lunes, sabado, dias_nombre):
    """
    Calcula los espacios más utilizados durante la semana.
    Retorna: lista ordenada de espacios con más usos
    """
    try:
        espacios_uso = {}
        
        # Recorrer cada espacio
        for espacio in espacios:
            try:
                contador_usos = 0
                contador_ocupacion_horas = 0
                horas_totales_posibles = 16 * 6  # 16 horas/día * 6 días = 96 horas
                
                # Recorrer cada día de la semana
                fecha_actual = lunes
                while fecha_actual <= sabado:
                    dia_nombre_en = fecha_actual.strftime('%A')
                    dia_nombre_es = dias_nombre.get(dia_nombre_en, dia_nombre_en)
                    
                    # Contar horarios (clases)
                    horarios_dia = Horario.objects.filter(
                        espacio=espacio,
                        dia_semana__iexact=dia_nombre_es
                    )
                    
                    if not horarios_dia.exists():
                        horarios_dia = Horario.objects.filter(
                            espacio=espacio,
                            dia_semana__iexact=dia_nombre_en
                        )
                    
                    contador_usos += horarios_dia.count()
                    
                    # Sumar horas ocupadas
                    for horario in horarios_dia:
                        try:
                            duracion = _calcular_duracion_horas_reporte(horario.hora_inicio, horario.hora_fin)
                            contador_ocupacion_horas += duracion
                        except Exception as e:
                            print(f"Error calculando duración de horario: {str(e)}")
                            continue
                    
                    # Contar préstamos
                    prestamos_dia = PrestamoEspacio.objects.filter(
                        espacio=espacio,
                        fecha=fecha_actual,
                        estado='Aprobado'
                    )
                    
                    contador_usos += prestamos_dia.count()
                    
                    # Sumar horas ocupadas de préstamos
                    for prestamo in prestamos_dia:
                        try:
                            duracion = _calcular_duracion_horas_reporte(prestamo.hora_inicio, prestamo.hora_fin)
                            contador_ocupacion_horas += duracion
                        except Exception as e:
                            print(f"Error calculando duración de préstamo: {str(e)}")
                            continue
                    
                    fecha_actual += timedelta(days=1)
                
                # Calcular porcentaje de ocupación
                porcentaje_ocupacion = int((contador_ocupacion_horas / horas_totales_posibles * 100)) if horas_totales_posibles > 0 else 0
                
                espacios_uso[espacio.id] = {
                    "espacio": espacio.nombre,
                    "usos": contador_usos,
                    "ocupacion": porcentaje_ocupacion
                }
            except Exception as e:
                print(f"Error procesando espacio {espacio.id}: {str(e)}")
                continue
        
        # Ordenar por usos descendente y tomar top 5
        espacios_ordenados = sorted(
            espacios_uso.values(),
            key=lambda x: x['usos'],
            reverse=True
        )[:5]
        
        return espacios_ordenados
    except Exception as e:
        print(f"Error en _calcular_espacios_mas_usados_reporte: {str(e)}")
        return []


def _obtener_jornadas_de_horario_reporte(hora_inicio, hora_fin):
    """
    Determina en qué jornadas cae un horario.
    Retorna: set con las jornadas ('manana', 'tarde', 'noche')
    """
    jornadas = set()
    
    # Convertir a objetos time si es necesario
    if isinstance(hora_inicio, str):
        try:
            hora_inicio = datetime.strptime(hora_inicio, '%H:%M').time()
        except:
            hora_inicio = datetime.strptime(hora_inicio, '%H:%M:%S').time()
    if isinstance(hora_fin, str):
        try:
            hora_fin = datetime.strptime(hora_fin, '%H:%M').time()
        except:
            hora_fin = datetime.strptime(hora_fin, '%H:%M:%S').time()
    
    # Jornadas: Mañana (7-12), Tarde (14-18), Noche (18-21)
    manana_inicio = datetime.strptime('07:00', '%H:%M').time()
    manana_fin = datetime.strptime('12:00', '%H:%M').time()
    tarde_inicio = datetime.strptime('14:00', '%H:%M').time()
    tarde_fin = datetime.strptime('18:00', '%H:%M').time()
    noche_inicio = datetime.strptime('18:00', '%H:%M').time()
    noche_fin = datetime.strptime('21:00', '%H:%M').time()
    
    # Verificar solapamientos
    if not (hora_fin <= manana_inicio or hora_inicio >= manana_fin):
        jornadas.add('manana')
    if not (hora_fin <= tarde_inicio or hora_inicio >= tarde_fin):
        jornadas.add('tarde')
    if not (hora_fin <= noche_inicio or hora_inicio >= noche_fin):
        jornadas.add('noche')
    
    return jornadas


def _calcular_duracion_horas_reporte(hora_inicio, hora_fin):
    """
    Calcula la duración en horas entre dos horarios.
    """
    try:
        if isinstance(hora_inicio, str):
            try:
                hora_inicio = datetime.strptime(hora_inicio, '%H:%M').time()
            except:
                hora_inicio = datetime.strptime(hora_inicio, '%H:%M:%S').time()
        if isinstance(hora_fin, str):
            try:
                hora_fin = datetime.strptime(hora_fin, '%H:%M').time()
            except:
                hora_fin = datetime.strptime(hora_fin, '%H:%M:%S').time()
        
        inicio = datetime.combine(datetime.today(), hora_inicio)
        fin = datetime.combine(datetime.today(), hora_fin)
        
        duracion = (fin - inicio).total_seconds() / 3600
        return duracion if duracion > 0 else 0
    except Exception:
        return 0
