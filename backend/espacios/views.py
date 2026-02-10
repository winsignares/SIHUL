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
        # Obtener sede del usuario desde middleware
        user_sede = getattr(request, 'sede', None)
        
        # Filtrar espacios por la misma ciudad de la sede del usuario
        if user_sede and user_sede.ciudad:
            items = EspacioFisico.objects.select_related('sede').filter(
                sede__ciudad=user_sede.ciudad
            )
        else:
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


@csrf_exempt
def list_all_espacios_with_horarios(request):
    """
    Retorna todos los espacios con sus horarios completos en una sola petición.
    Para acceso de usuarios públicos.
    Solo muestra horarios con estado='aprobado'.
    """
    if request.method != 'GET':
        return JsonResponse({"error": "Solo se permite GET"}, status=405)
    
    try:
        from horario.models import Horario
        from django.db.models import Prefetch
        
        # Optimizar consulta con select_related y prefetch_related
        # Solo mostrar horarios aprobados
        espacios = EspacioFisico.objects.all().select_related(
            'sede', 'tipo'
        ).prefetch_related(
            Prefetch('horarios',
                queryset=Horario.objects.filter(
                    estado='aprobado'
                ).select_related(
                    'asignatura', 'docente', 'grupo'
                )
            )
        )
        
        lista = []
        for espacio in espacios:
            horarios = []
            for h in espacio.horarios.all():
                horarios.append({
                    "dia": h.dia_semana,
                    "hora_inicio": h.hora_inicio.hour,
                    "hora_fin": h.hora_fin.hour,
                    "materia": h.asignatura.nombre if h.asignatura else "Sin asignatura",
                    "docente": h.docente.nombre if h.docente else "Sin docente",
                    "grupo": h.grupo.nombre if h.grupo else "Sin grupo"
                })
            
            lista.append({
                "id": espacio.id,
                "nombre": espacio.nombre,
                "tipo": espacio.tipo.nombre if espacio.tipo else "Sin tipo",
                "capacidad": espacio.capacidad,
                "sede": espacio.sede.nombre if espacio.sede else "Sin sede",
                "edificio": espacio.ubicacion or "Sin ubicación",
                "estado": espacio.estado,
                "ubicacion": espacio.ubicacion or "Sin ubicación",
                "horarios": horarios
            })
        
        return JsonResponse({"espacios": lista}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def list_supervisor_espacios_with_horarios(request, usuario_id=None):
    """
    Retorna espacios permitidos para un supervisor con sus horarios completos.
    Filtra por EspacioPermitido del supervisor.
    Solo muestra horarios con estado='aprobado'.
    """
    if request.method != 'GET':
        return JsonResponse({"error": "Solo se permite GET"}, status=405)
    
    if not usuario_id:
        return JsonResponse({"error": "usuario_id es requerido"}, status=400)
    
    try:
        from horario.models import Horario
        from django.db.models import Prefetch
        
        # Verificar que el usuario existe
        try:
            usuario = Usuario.objects.get(id=usuario_id)
        except Usuario.DoesNotExist:
            return JsonResponse({"error": "Usuario no encontrado"}, status=404)
        
        # Obtener espacios permitidos para este supervisor
        espacios_permitidos = EspacioPermitido.objects.filter(
            usuario=usuario
        ).select_related('espacio', 'espacio__sede', 'espacio__tipo')
        
        if not espacios_permitidos.exists():
            return JsonResponse({"espacios": []}, status=200)
        
        # Extraer IDs de espacios
        espacios_ids = [ep.espacio.id for ep in espacios_permitidos]
        
        # Obtener espacios con horarios aprobados
        espacios = EspacioFisico.objects.filter(
            id__in=espacios_ids
        ).select_related(
            'sede', 'tipo'
        ).prefetch_related(
            Prefetch('horarios',
                queryset=Horario.objects.filter(
                    estado='aprobado'
                ).select_related(
                    'asignatura', 'docente', 'grupo'
                )
            )
        )
        
        lista = []
        for espacio in espacios:
            horarios = []
            for h in espacio.horarios.all():
                horarios.append({
                    "dia": h.dia_semana,
                    "hora_inicio": h.hora_inicio.hour,
                    "hora_fin": h.hora_fin.hour,
                    "materia": h.asignatura.nombre if h.asignatura else "Sin asignatura",
                    "docente": h.docente.nombre if h.docente else "Sin docente",
                    "grupo": h.grupo.nombre if h.grupo else "Sin grupo"
                })
            
            lista.append({
                "id": espacio.id,
                "nombre": espacio.nombre,
                "tipo": espacio.tipo.nombre if espacio.tipo else "Sin tipo",
                "capacidad": espacio.capacidad,
                "sede": espacio.sede.nombre if espacio.sede else "Sin sede",
                "edificio": espacio.ubicacion or "Sin ubicación",
                "estado": espacio.estado,
                "ubicacion": espacio.ubicacion or "Sin ubicación",
                "horarios": horarios
            })
        
        return JsonResponse({"espacios": lista}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


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
            dia_semana=dia_actual,
            estado='aprobado'
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
            dia_semana=dia_actual,
            estado='aprobado'
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
            espacio_id=espacio_id,
            estado='aprobado'
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
                
                # Obtener horarios (clases) para este día y espacio - Solo aprobados
                # Buscar con variantes de dia_semana (en español, en inglés, etc.)
                horarios_dia = Horario.objects.filter(
                    espacio=espacio,
                    dia_semana__iexact=dia_nombre_es,
                    estado='aprobado'  # Solo horarios aprobados
                )
                
                # Si no encuentra con español, buscar con inglés
                if not horarios_dia.exists():
                    horarios_dia = Horario.objects.filter(
                        espacio=espacio,
                        dia_semana__iexact=dia_nombre_en,
                        estado='aprobado'  # Solo horarios aprobados
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
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_CENTER
        from reportlab.graphics.shapes import Drawing
        from reportlab.graphics.charts.barcharts import HorizontalBarChart
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
        
        # Obtener espacios filtrados
        espacios_query = EspacioFisico.objects.all().select_related('tipo', 'sede')
        if tipo_espacio_id:
            espacios_query = espacios_query.filter(tipo_id=tipo_espacio_id)
        
        detalles_espacios = []
        for espacio in espacios_query:
            horas_ocupadas = 0.0
            horas_manana = 0.0
            horas_tarde = 0.0
            horas_noche = 0.0
            fecha_actual = lunes
            while fecha_actual <= sabado:
                horarios = Horario.objects.filter(
                    espacio=espacio,
                    dia_semana__iexact=_get_dia_nombre(fecha_actual),
                    estado='aprobado'
                )
                if not horarios.exists():
                    horarios = Horario.objects.filter(
                        espacio=espacio,
                        dia_semana__iexact=fecha_actual.strftime('%A'),
                        estado='aprobado'
                    )
                for h in horarios:
                    horas_ocupadas += _calcular_duracion_horas(h.hora_inicio, h.hora_fin)
                    horas_en_jornadas = _distribuir_horas_en_jornadas(h.hora_inicio, h.hora_fin)
                    horas_manana += horas_en_jornadas['manana']
                    horas_tarde += horas_en_jornadas['tarde']
                    horas_noche += horas_en_jornadas['noche']
                
                prestamos = PrestamoEspacio.objects.filter(
                    espacio=espacio,
                    fecha=fecha_actual,
                    estado='Aprobado'
                )
                for p in prestamos:
                    horas_ocupadas += _calcular_duracion_horas(p.hora_inicio, p.hora_fin)
                    horas_en_jornadas = _distribuir_horas_en_jornadas(p.hora_inicio, p.hora_fin)
                    horas_manana += horas_en_jornadas['manana']
                    horas_tarde += horas_en_jornadas['tarde']
                    horas_noche += horas_en_jornadas['noche']
                
                fecha_actual += timedelta(days=1)
            
            horas_manana = min(horas_manana, 36)
            horas_tarde = min(horas_tarde, 36)
            horas_noche = min(horas_noche, 24)
            porcentaje_manana = (horas_manana / 36) * 100 if horas_manana > 0 else 0
            porcentaje_tarde = (horas_tarde / 36) * 100 if horas_tarde > 0 else 0
            porcentaje_noche = (horas_noche / 24) * 100 if horas_noche > 0 else 0
            porcentaje_total = (horas_ocupadas / 96) * 100 if horas_ocupadas > 0 else 0
            detalles_espacios.append({
                'nombre': espacio.nombre,
                'tipo': espacio.tipo.nombre,
                'edificio': espacio.ubicacion.split('-')[0] if espacio.ubicacion and '-' in espacio.ubicacion else (espacio.ubicacion or 'N/A'),
                'capacidad': espacio.capacidad,
                'horasOcupadasSemana': round(horas_ocupadas, 1),
                'horasDisponibles': 96,
                'porcentajeOcupacion': round(porcentaje_total, 1),
                'porcentajeManana': round(porcentaje_manana, 1),
                'porcentajeTarde': round(porcentaje_tarde, 1),
                'porcentajeNoche': round(porcentaje_noche, 1)
            })
        
        total_espacios = len(detalles_espacios)
        promedio_ocupacion = (sum(e['porcentajeOcupacion'] for e in detalles_espacios) / total_espacios) if total_espacios > 0 else 0
        total_horas_ocupadas = sum(e['horasOcupadasSemana'] for e in detalles_espacios)
        total_horas_disponibles = sum(e['horasDisponibles'] for e in detalles_espacios)
        espacios_sobreocupados = sum(1 for e in detalles_espacios if e['porcentajeOcupacion'] >= 85)
        espacios_subutilizados = sum(1 for e in detalles_espacios if e['porcentajeOcupacion'] <= 50 and e['porcentajeOcupacion'] > 0)
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=inch * 0.6,
            leftMargin=inch * 0.6,
            topMargin=inch * 0.8,
            bottomMargin=inch * 0.8
        )
        elements = []
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#0f172a'),
            alignment=TA_CENTER,
            spaceAfter=18
        )
        subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#475569'),
            alignment=TA_CENTER
        )
        stat_title_style = ParagraphStyle(
            'StatTitle',
            parent=styles['Normal'],
            fontSize=7,
            textColor=colors.HexColor('#64748b')
        )
        stat_value_style = ParagraphStyle(
            'StatValue',
            parent=styles['Heading3'],
            fontSize=14,
            textColor=colors.HexColor('#0f172a')
        )
        body_small_style = ParagraphStyle(
            'BodySmall',
            parent=styles['BodyText'],
            fontSize=7,
            leading=8,
            textColor=colors.HexColor('#0f172a')
        )

        elements.append(Paragraph('Reporte de Ocupación Semanal de Espacios', title_style))
        periodo_parrafo = f'<b>Período:</b> {lunes.strftime("%d/%m/%Y")} - {sabado.strftime("%d/%m/%Y")} - <b>Semana:</b> {semana_offset:+d}'
        elements.append(Paragraph(periodo_parrafo, subtitle_style))
        elements.append(Spacer(1, 0.2 * inch))

        stats_data = [
            [
                Paragraph('Promedio ocupación', stat_title_style),
                Paragraph('Horas ocupadas', stat_title_style),
                Paragraph('Horas tot. disponibles', stat_title_style),
                Paragraph('Sobreocupados', stat_title_style),
                Paragraph('Subutilizados', stat_title_style)
            ],
            [
                Paragraph(f'{promedio_ocupacion:.1f}%', stat_value_style),
                Paragraph(f'{total_horas_ocupadas:.0f}h', stat_value_style),
                Paragraph(f'{total_horas_disponibles:.0f}h', stat_value_style),
                Paragraph(f'{espacios_sobreocupados}', stat_value_style),
                Paragraph(f'{espacios_subutilizados}', stat_value_style)
            ]
        ]
        stats_table = Table(stats_data, colWidths=[(doc.width) / 5] * 5)
        stats_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e0f2fe')),
            ('BACKGROUND', (0, 1), (-1, 1), colors.white),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5f5')),
            ('LINEBEFORE', (1, 0), (1, -1), 0.5, colors.HexColor('#cbd5f5')),
            ('LINEBEFORE', (2, 0), (2, -1), 0.5, colors.HexColor('#cbd5f5')),
            ('LINEBEFORE', (3, 0), (3, -1), 0.5, colors.HexColor('#cbd5f5')),
            ('LINEBEFORE', (4, 0), (4, -1), 0.5, colors.HexColor('#cbd5f5')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ]))
        elements.append(stats_table)
        elements.append(Spacer(1, 0.3 * inch))

        table_header = ['Espacio', 'Tipo', 'Edificio', 'Capacidad', 'Horas', 'Ocupación', 'Jornadas']
        table_data = [table_header]
        for espacio in detalles_espacios:
            jornadas = (
                f'M: {espacio["porcentajeManana"]:.1f}%\n'
                f'T: {espacio["porcentajeTarde"]:.1f}%\n'
                f'N: {espacio["porcentajeNoche"]:.1f}%'
            )
            table_data.append([
                espacio['nombre'],
                espacio['tipo'],
                espacio['edificio'],
                str(espacio['capacidad']),
                f'{espacio["horasOcupadasSemana"]:.1f} / {espacio["horasDisponibles"]}h',
                f'{espacio["porcentajeOcupacion"]:.1f}%',
                Paragraph(jornadas.replace('\n', '<br/>'), body_small_style)
            ])

        detail_col_widths = [2.0 * inch, 1.0 * inch, 1.0 * inch, 0.8 * inch, 1.0 * inch, 1.0 * inch, 1.4 * inch]
        detail_table = Table(table_data, colWidths=detail_col_widths)
        detail_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('FONTSIZE', (0, 1), (-1, -1), 7),
            ('ALIGN', (0, 0), (3, -1), 'LEFT'),
            ('ALIGN', (4, 0), (-2, -1), 'CENTER'),
            ('ALIGN', (-1, 0), (-1, -1), 'CENTER'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5f5')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
        ]))
        elements.append(detail_table)
        elements.append(Spacer(1, 0.4 * inch))

        top_espacios = sorted(detalles_espacios, key=lambda x: x['porcentajeOcupacion'], reverse=True)[:10]
        if top_espacios:
            elements.append(PageBreak())
            elements.append(Paragraph('Top 10 espacios por ocupación', styles['Heading3']))
            elements.append(Spacer(1, 0.1 * inch))
            chart_width = doc.width - (inch * 0.4)
            chart_height = 190
            drawing = Drawing(chart_width, chart_height)
            chart = HorizontalBarChart()
            chart.x = 0
            chart.y = 10
            chart.width = chart_width
            chart.height = chart_height - 10
            chart.data = [[espacio['porcentajeOcupacion'] for espacio in top_espacios]]
            chart.categoryAxis.categoryNames = [espacio['nombre'][:32] for espacio in top_espacios]
            chart.categoryAxis.labels.fontSize = 7
            chart.categoryAxis.strokeColor = colors.HexColor('#475569')
            chart.categoryAxis.labels.dy = -2
            chart.categoryAxis.categoryNames = [name if len(name) <= 32 else f'{name[:29]}...' for name in chart.categoryAxis.categoryNames]
            chart.valueAxis.valueMin = 0
            chart.valueAxis.valueMax = 100
            chart.valueAxis.valueStep = 20
            chart.valueAxis.labels.fontSize = 7
            chart.valueAxis.strokeColor = colors.HexColor('#94a3b8')
            chart.barLabels.nudge = 7
            chart.barLabels.fontSize = 7
            chart.barLabels.fillColor = colors.HexColor('#0f172a')
            chart.barLabels.dx = 0
            chart.barLabels.dy = 0
            chart.bars[0].fillColor = colors.HexColor('#2563eb')
            chart.bars[0].strokeWidth = 0
            drawing.add(chart)
            elements.append(drawing)

        doc.build(elements)
        buffer.seek(0)
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
    Usa la misma lógica que ocupacion_semanal para calcular horas.
    Retorna: lista con ocupación de cada jornada
    """
    try:
        # Inicializar contadores totales de horas por jornada
        horas_totales_manana = 0.0
        horas_totales_tarde = 0.0
        horas_totales_noche = 0.0
        
        # Recorrer cada espacio
        for espacio in espacios:
            horas_manana_espacio = 0.0
            horas_tarde_espacio = 0.0
            horas_noche_espacio = 0.0
            
            # Recorrer cada día de la semana
            fecha_actual = lunes
            while fecha_actual <= sabado:
                dia_nombre_en = fecha_actual.strftime('%A')
                dia_nombre_es = dias_nombre.get(dia_nombre_en, dia_nombre_en)
                
                # Obtener horarios para este día y espacio - Solo aprobados
                horarios_dia = Horario.objects.filter(
                    espacio=espacio,
                    dia_semana__iexact=dia_nombre_es,
                    estado='aprobado'
                )
                
                if not horarios_dia.exists():
                    horarios_dia = Horario.objects.filter(
                        espacio=espacio,
                        dia_semana__iexact=dia_nombre_en,
                        estado='aprobado'
                    )
                
                # Obtener préstamos aprobados para este día y espacio
                prestamos_dia = PrestamoEspacio.objects.filter(
                    espacio=espacio,
                    fecha=fecha_actual,
                    estado='Aprobado'
                )
                
                # Calcular horas ocupadas por horarios
                for horario in horarios_dia:
                    horas_ocupadas_en_jornadas = _distribuir_horas_en_jornadas(
                        horario.hora_inicio,
                        horario.hora_fin
                    )
                    horas_manana_espacio += horas_ocupadas_en_jornadas['manana']
                    horas_tarde_espacio += horas_ocupadas_en_jornadas['tarde']
                    horas_noche_espacio += horas_ocupadas_en_jornadas['noche']
                
                # Calcular horas ocupadas por préstamos
                for prestamo in prestamos_dia:
                    horas_ocupadas_en_jornadas = _distribuir_horas_en_jornadas(
                        prestamo.hora_inicio,
                        prestamo.hora_fin
                    )
                    horas_manana_espacio += horas_ocupadas_en_jornadas['manana']
                    horas_tarde_espacio += horas_ocupadas_en_jornadas['tarde']
                    horas_noche_espacio += horas_ocupadas_en_jornadas['noche']
                
                fecha_actual += timedelta(days=1)
            
            # Sumar las horas de este espacio al total
            horas_totales_manana += horas_manana_espacio
            horas_totales_tarde += horas_tarde_espacio
            horas_totales_noche += horas_noche_espacio
        
        # Calcular máximas horas posibles
        total_espacios = len(list(espacios))
        horas_max_manana = 36 * total_espacios if total_espacios > 0 else 1
        horas_max_tarde = 36 * total_espacios if total_espacios > 0 else 1
        horas_max_noche = 24 * total_espacios if total_espacios > 0 else 1
        
        # Calcular porcentajes de ocupación
        ocupacion_manana = int((horas_totales_manana / horas_max_manana * 100)) if horas_max_manana > 0 else 0
        ocupacion_tarde = int((horas_totales_tarde / horas_max_tarde * 100)) if horas_max_tarde > 0 else 0
        ocupacion_noche = int((horas_totales_noche / horas_max_noche * 100)) if horas_max_noche > 0 else 0
        
        # Contar cuántos espacios tienen clases en cada jornada
        espacios_con_clase_manana = 0
        espacios_con_clase_tarde = 0
        espacios_con_clase_noche = 0
        
        for espacio in espacios:
            fecha_actual = lunes
            tiene_manana = False
            tiene_tarde = False
            tiene_noche = False
            
            while fecha_actual <= sabado:
                dia_nombre_en = fecha_actual.strftime('%A')
                dia_nombre_es = dias_nombre.get(dia_nombre_en, dia_nombre_en)
                
                horarios_dia = Horario.objects.filter(
                    espacio=espacio,
                    dia_semana__iexact=dia_nombre_es,
                    estado='aprobado'
                )
                if not horarios_dia.exists():
                    horarios_dia = Horario.objects.filter(
                        espacio=espacio,
                        dia_semana__iexact=dia_nombre_en,
                        estado='aprobado'
                    )
                
                prestamos_dia = PrestamoEspacio.objects.filter(
                    espacio=espacio,
                    fecha=fecha_actual,
                    estado='Aprobado'
                )
                
                for horario in horarios_dia:
                    dist = _distribuir_horas_en_jornadas(horario.hora_inicio, horario.hora_fin)
                    if dist['manana'] > 0:
                        tiene_manana = True
                    if dist['tarde'] > 0:
                        tiene_tarde = True
                    if dist['noche'] > 0:
                        tiene_noche = True
                
                for prestamo in prestamos_dia:
                    dist = _distribuir_horas_en_jornadas(prestamo.hora_inicio, prestamo.hora_fin)
                    if dist['manana'] > 0:
                        tiene_manana = True
                    if dist['tarde'] > 0:
                        tiene_tarde = True
                    if dist['noche'] > 0:
                        tiene_noche = True
                
                fecha_actual += timedelta(days=1)
            
            if tiene_manana:
                espacios_con_clase_manana += 1
            if tiene_tarde:
                espacios_con_clase_tarde += 1
            if tiene_noche:
                espacios_con_clase_noche += 1
        
        ocupacion = [
            {
                "jornada": "Mañana (07:00 - 12:00)",
                "ocupacion": ocupacion_manana,
                "espacios": espacios_con_clase_manana
            },
            {
                "jornada": "Tarde (14:00 - 18:00)",
                "ocupacion": ocupacion_tarde,
                "espacios": espacios_con_clase_tarde
            },
            {
                "jornada": "Noche (18:00 - 21:00)",
                "ocupacion": ocupacion_noche,
                "espacios": espacios_con_clase_noche
            }
        ]
        
        return ocupacion
    except Exception as e:
        print(f"Error en _calcular_ocupacion_por_jornada_reporte: {str(e)}")
        return []


def _calcular_espacios_mas_usados_reporte(espacios, lunes, sabado, dias_nombre):
    """
    Calcula los espacios más utilizados durante la semana.
    Usa la misma lógica que ocupacion_semanal.
    Retorna: lista ordenada de espacios con más usos
    """
    try:
        espacios_uso = {}
        
        # Recorrer cada espacio
        for espacio in espacios:
            contador_usos = 0
            horas_ocupadas_total = 0.0
            horas_disponibles = 16 * 6  # 16 horas/día * 6 días = 96 horas
            
            # Recorrer cada día de la semana
            fecha_actual = lunes
            while fecha_actual <= sabado:
                dia_nombre_en = fecha_actual.strftime('%A')
                dia_nombre_es = dias_nombre.get(dia_nombre_en, dia_nombre_en)
                
                # Obtener horarios (clases) - Solo aprobados
                horarios_dia = Horario.objects.filter(
                    espacio=espacio,
                    dia_semana__iexact=dia_nombre_es,
                    estado='aprobado'
                )
                
                if not horarios_dia.exists():
                    horarios_dia = Horario.objects.filter(
                        espacio=espacio,
                        dia_semana__iexact=dia_nombre_en,
                        estado='aprobado'
                    )
                
                contador_usos += horarios_dia.count()
                
                # Sumar horas ocupadas por horarios
                for horario in horarios_dia:
                    duracion = _calcular_duracion_horas(horario.hora_inicio, horario.hora_fin)
                    horas_ocupadas_total += duracion
                
                # Obtener préstamos aprobados
                prestamos_dia = PrestamoEspacio.objects.filter(
                    espacio=espacio,
                    fecha=fecha_actual,
                    estado='Aprobado'
                )
                
                contador_usos += prestamos_dia.count()
                
                # Sumar horas ocupadas por préstamos
                for prestamo in prestamos_dia:
                    duracion = _calcular_duracion_horas(prestamo.hora_inicio, prestamo.hora_fin)
                    horas_ocupadas_total += duracion
                
                fecha_actual += timedelta(days=1)
            
            # Calcular porcentaje de ocupación
            porcentaje_ocupacion = int((horas_ocupadas_total / horas_disponibles * 100)) if horas_disponibles > 0 else 0
            
            if contador_usos > 0:  # Solo incluir espacios que tengan usos
                espacios_uso[espacio.id] = {
                    "espacio": espacio.nombre,
                    "usos": contador_usos,
                    "ocupacion": porcentaje_ocupacion
                }
        
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


@csrf_exempt
def generar_pdf_reporte_ocupacion(request):
    """
    Genera un PDF para el reporte de ocupación (Ocupación por Jornada - Semana Actual
    y Espacios Más Utilizados).

    Parámetros POST (opcionales):
    - semana_offset: int (default 0)
    - tipo_espacio_id: int | null (filtra espacios por tipo)
    - espacios: lista de nombres de espacios (filtra por los espacios visibles en el frontend)

    Nota: Si se envía `espacios`, ese filtro tiene prioridad (para exportar exactamente
    lo que el usuario está viendo).
    """
    if request.method != 'POST':
        return JsonResponse({"error": "Solo se permite POST"}, status=405)

    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_CENTER
        from datetime import timedelta
        from io import BytesIO
        from django.http import FileResponse

        data = json.loads(request.body) if request.body else {}
        semana_offset = int(data.get('semana_offset', 0))
        tipo_espacio_id = data.get('tipo_espacio_id')
        espacios_nombres = data.get('espacios')

        # Calcular rango de fechas (Lunes a Sábado)
        hoy = timezone.now().date()
        dias_hasta_lunes = (hoy.weekday() - 0) % 7
        lunes = hoy - timedelta(days=dias_hasta_lunes)
        lunes += timedelta(weeks=semana_offset)
        sabado = lunes + timedelta(days=5)

        dias_nombre = {
            'Monday': 'Lunes',
            'Tuesday': 'Martes',
            'Wednesday': 'Miércoles',
            'Thursday': 'Jueves',
            'Friday': 'Viernes',
            'Saturday': 'Sábado',
            'Sunday': 'Domingo'
        }

        espacios_qs = EspacioFisico.objects.all().select_related('tipo', 'sede')

        if isinstance(espacios_nombres, list) and len(espacios_nombres) > 0:
            espacios_qs = espacios_qs.filter(nombre__in=espacios_nombres)
        elif tipo_espacio_id:
            espacios_qs = espacios_qs.filter(tipo_id=tipo_espacio_id)

        ocupacion_por_jornada = _calcular_ocupacion_por_jornada_reporte(
            espacios_qs, lunes, sabado, dias_nombre
        )
        espacios_mas_usados = _calcular_espacios_mas_usados_reporte(
            espacios_qs, lunes, sabado, dias_nombre
        )

        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=inch * 0.6,
            leftMargin=inch * 0.6,
            topMargin=inch * 0.8,
            bottomMargin=inch * 0.8
        )
        elements = []
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'RptTitle',
            parent=styles['Heading1'],
            fontSize=20,
            textColor=colors.HexColor('#0f172a'),
            alignment=TA_CENTER,
            spaceAfter=10
        )
        subtitle_style = ParagraphStyle(
            'RptSubtitle',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#475569'),
            alignment=TA_CENTER
        )
        section_style = ParagraphStyle(
            'RptSection',
            parent=styles['Heading3'],
            fontSize=12,
            textColor=colors.HexColor('#0f172a'),
            spaceAfter=6
        )
        body_small_style = ParagraphStyle(
            'RptBodySmall',
            parent=styles['BodyText'],
            fontSize=8,
            leading=9,
            textColor=colors.HexColor('#0f172a')
        )

        elements.append(Paragraph('Reporte: Ocupación de Espacios', title_style))
        elements.append(
            Paragraph(
                f'<b>Semana:</b> {lunes.strftime("%d/%m/%Y")} - {sabado.strftime("%d/%m/%Y")}',
                subtitle_style
            )
        )
        elements.append(Spacer(1, 0.25 * inch))

        # ===== Ocupación por jornada =====
        elements.append(Paragraph('Ocupación por Jornada - Semana Actual', section_style))

        header = ['Jornada', 'Ocupación', 'Espacios']
        table_data = [header]

        # Colores UI
        jornada_colors = [
            colors.HexColor('#2563eb'),  # blue-600
            colors.HexColor('#dc2626'),  # red-600
            colors.HexColor('#ca8a04')   # yellow-600 (aprox)
        ]

        for idx, item in enumerate(ocupacion_por_jornada or []):
            table_data.append([
                item.get('jornada', ''),
                f"{item.get('ocupacion', 0)}%",
                str(item.get('espacios', 0))
            ])

        jornada_table = Table(table_data, colWidths=[3.3 * inch, 1.2 * inch, 1.0 * inch])
        jornada_table_style = [
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5f5')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (1, 1), (-1, -1), 'CENTER')
        ]
        # Colorear columna de ocupación como barra simple (fondo)
        for i in range(1, len(table_data)):
            color_idx = min(i - 1, len(jornada_colors) - 1)
            jornada_table_style.append(('TEXTCOLOR', (1, i), (1, i), jornada_colors[color_idx]))

        jornada_table.setStyle(TableStyle(jornada_table_style))
        elements.append(jornada_table)
        elements.append(Spacer(1, 0.3 * inch))

        # ===== Espacios más utilizados =====
        elements.append(Paragraph('Espacios Más Utilizados', section_style))

        espacios_header = ['#', 'Espacio', 'Usos', 'Ocupación']
        espacios_data = [espacios_header]
        for idx, item in enumerate(espacios_mas_usados or []):
            espacios_data.append([
                str(idx + 1),
                item.get('espacio', ''),
                str(item.get('usos', 0)),
                f"{item.get('ocupacion', 0)}%"
            ])

        espacios_table = Table(espacios_data, colWidths=[0.4 * inch, 3.1 * inch, 0.9 * inch, 1.1 * inch])
        espacios_table_style = [
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5f5')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('ALIGN', (2, 1), (-1, -1), 'CENTER')
        ]
        # Badge-like ocupación en azul
        for i in range(1, len(espacios_data)):
            espacios_table_style.append(('TEXTCOLOR', (3, i), (3, i), colors.HexColor('#2563eb')))

        espacios_table.setStyle(TableStyle(espacios_table_style))
        elements.append(espacios_table)
        elements.append(Spacer(1, 0.1 * inch))
        elements.append(Paragraph('Generado por SIHUL', body_small_style))

        doc.build(elements)
        buffer.seek(0)

        response = FileResponse(
            buffer,
            as_attachment=True,
            filename=f'reporte-ocupacion-{lunes.isoformat()}.pdf'
        )
        response['Content-Type'] = 'application/pdf'
        return response
    except ImportError:
        return JsonResponse({"error": "ReportLab no está instalado"}, status=500)
    except Exception as e:
        import traceback
        error_msg = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Error en generar_pdf_reporte_ocupacion: {error_msg}")
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def reporte_disponibilidad(request):
    """
    Endpoint para obtener datos de reporte de disponibilidad de espacios.
    
    Parámetros GET opcionales:
    - semana_offset: 0 (semana actual), 1 (próxima semana), -1 (semana pasada)
    
    Retorna:
    {
        "periodo": "2025-1",
        "semana_inicio": "2025-01-XX",
        "semana_fin": "2025-01-XX",
        "disponibilidad": [
            {
                "nombre": "Aula 101",
                "tipo": "Aula",
                "horasDisponibles": 45,
                "horasOcupadas": 51,
                "porcentajeOcupacion": 53
            },
            ...
        ],
        "resumen": {
            "total_disponible": 450,
            "total_ocupado": 510,
            "promedio_ocupacion": 53
        }
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
                "disponibilidad": [],
                "resumen": {
                    "total_disponible": 0,
                    "total_ocupado": 0,
                    "promedio_ocupacion": 0
                }
            }, status=200)
        
        # ======== CÁLCULO DE DISPONIBILIDAD ========
        disponibilidad, resumen = _calcular_disponibilidad_reporte(
            espacios, lunes, sabado, dias_nombre
        )
        
        # Construcción del periodo
        periodo = "2025-1"  # TODO: Obtener del contexto actual
        
        return JsonResponse({
            "periodo": periodo,
            "semana_inicio": lunes.isoformat(),
            "semana_fin": sabado.isoformat(),
            "disponibilidad": disponibilidad,
            "resumen": resumen
        }, status=200)
    
    except ValueError as e:
        return JsonResponse({"error": f"Error de valor: {str(e)}"}, status=400)
    except Exception as e:
        import traceback
        error_msg = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Error en reporte_disponibilidad: {error_msg}")
        return JsonResponse({"error": f"Error del servidor: {str(e)}"}, status=500)


def _calcular_disponibilidad_reporte(espacios, lunes, sabado, dias_nombre):
    """
    Calcula la disponibilidad (horas disponibles vs ocupadas) para cada espacio.
    Retorna: tupla (lista con disponibilidad de cada espacio, dict con resumen)
    """
    try:
        disponibilidad = []
        total_horas_disponibles = 0
        total_horas_ocupadas = 0
        
        for espacio in espacios:
            horas_ocupadas_total = 0.0
            
            # Recorrer cada día de la semana
            fecha_actual = lunes
            while fecha_actual <= sabado:
                dia_nombre_en = fecha_actual.strftime('%A')
                dia_nombre_es = dias_nombre.get(dia_nombre_en, dia_nombre_en)
                
                # Obtener horarios
                horarios_dia = Horario.objects.filter(
                    espacio=espacio,
                    dia_semana__iexact=dia_nombre_es,
                    estado='aprobado'
                )
                
                if not horarios_dia.exists():
                    horarios_dia = Horario.objects.filter(
                        espacio=espacio,
                        dia_semana__iexact=dia_nombre_en,
                        estado='aprobado'
                    )
                
                # Sumar horas ocupadas por horarios
                for horario in horarios_dia:
                    duracion = _calcular_duracion_horas(horario.hora_inicio, horario.hora_fin)
                    horas_ocupadas_total += duracion
                
                # Obtener préstamos aprobados
                prestamos_dia = PrestamoEspacio.objects.filter(
                    espacio=espacio,
                    fecha=fecha_actual,
                    estado='Aprobado'
                )
                
                # Sumar horas ocupadas por préstamos
                for prestamo in prestamos_dia:
                    duracion = _calcular_duracion_horas(prestamo.hora_inicio, prestamo.hora_fin)
                    horas_ocupadas_total += duracion
                
                fecha_actual += timedelta(days=1)
            
            # Calcular horas disponibles (16 horas/día * 6 días)
            horas_disponibles = 16 * 6  # 96 horas
            horas_libres = horas_disponibles - horas_ocupadas_total
            
            # Calcular porcentaje de ocupación
            porcentaje_ocupacion = int((horas_ocupadas_total / horas_disponibles * 100)) if horas_disponibles > 0 else 0
            
            # Acumular totales para el resumen
            total_horas_disponibles += horas_disponibles
            total_horas_ocupadas += horas_ocupadas_total
            
            disponibilidad.append({
                "nombre": espacio.nombre,
                "tipo": espacio.tipo.nombre,
                "horasDisponibles": max(0, int(horas_libres)),
                "horasOcupadas": int(horas_ocupadas_total),
                "porcentajeOcupacion": porcentaje_ocupacion
            })
        
        # Calcular promedio de ocupación general
        promedio_ocupacion = int((total_horas_ocupadas / total_horas_disponibles * 100)) if total_horas_disponibles > 0 else 0
        
        resumen = {
            "total_disponible": int(total_horas_disponibles - total_horas_ocupadas),
            "total_ocupado": int(total_horas_ocupadas),
            "promedio_ocupacion": promedio_ocupacion
        }
        
        return disponibilidad, resumen
    except Exception as e:
        print(f"Error en _calcular_disponibilidad_reporte: {str(e)}")
        return [], {"total_disponible": 0, "total_ocupado": 0, "promedio_ocupacion": 0}


@csrf_exempt
def reporte_capacidad(request):
    """
    Endpoint para obtener datos de reporte de capacidad utilizada.
    
    Parámetros GET opcionales:
    - semana_offset: 0 (semana actual), 1 (próxima semana), -1 (semana pasada)
    
    Retorna:
    {
        "periodo": "2025-1",
        "semana_inicio": "2025-01-XX",
        "semana_fin": "2025-01-XX",
        "capacidad": [
            {
                "tipo": "Aula",
                "capacidadTotal": 250,
                "capacidadUsada": 180,
                "porcentaje": 72
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
                "capacidad": []
            }, status=200)
        
        # ======== CÁLCULO DE CAPACIDAD ========
        capacidad = _calcular_capacidad_reporte(
            espacios, lunes, sabado, dias_nombre
        )
        
        # Construcción del periodo
        periodo = "2025-1"  # TODO: Obtener del contexto actual
        
        return JsonResponse({
            "periodo": periodo,
            "semana_inicio": lunes.isoformat(),
            "semana_fin": sabado.isoformat(),
            "capacidad": capacidad
        }, status=200)
    
    except ValueError as e:
        return JsonResponse({"error": f"Error de valor: {str(e)}"}, status=400)
    except Exception as e:
        import traceback
        error_msg = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Error en reporte_capacidad: {error_msg}")
        return JsonResponse({"error": f"Error del servidor: {str(e)}"}, status=500)


@csrf_exempt
def generar_pdf_reporte_disponibilidad(request):
    """Genera un PDF del reporte de disponibilidad general con estilo similar al UI."""
    if request.method != 'POST':
        return JsonResponse({"error": "Solo se permite POST"}, status=405)

    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_CENTER
        from datetime import timedelta
        from io import BytesIO
        from django.http import FileResponse

        data = json.loads(request.body) if request.body else {}
        semana_offset = int(data.get('semana_offset', 0))

        hoy = timezone.now().date()
        dias_hasta_lunes = (hoy.weekday() - 0) % 7
        lunes = hoy - timedelta(days=dias_hasta_lunes)
        lunes += timedelta(weeks=semana_offset)
        sabado = lunes + timedelta(days=5)

        dias_nombre = {
            'Monday': 'Lunes',
            'Tuesday': 'Martes',
            'Wednesday': 'Miércoles',
            'Thursday': 'Jueves',
            'Friday': 'Viernes',
            'Saturday': 'Sábado',
            'Sunday': 'Domingo'
        }

        espacios = EspacioFisico.objects.all().select_related('tipo', 'sede')
        disponibilidad, resumen = _calcular_disponibilidad_reporte(espacios, lunes, sabado, dias_nombre)

        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=inch * 0.6,
            leftMargin=inch * 0.6,
            topMargin=inch * 0.8,
            bottomMargin=inch * 0.8
        )
        elements = []
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'RptTitle',
            parent=styles['Heading1'],
            fontSize=20,
            textColor=colors.HexColor('#0f172a'),
            alignment=TA_CENTER,
            spaceAfter=10
        )
        subtitle_style = ParagraphStyle(
            'RptSubtitle',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#475569'),
            alignment=TA_CENTER
        )
        stat_title_style = ParagraphStyle(
            'RptStatTitle',
            parent=styles['Normal'],
            fontSize=7,
            textColor=colors.HexColor('#64748b')
        )
        stat_value_style = ParagraphStyle(
            'RptStatValue',
            parent=styles['Heading3'],
            fontSize=14,
            textColor=colors.HexColor('#0f172a')
        )

        elements.append(Paragraph('Reporte: Disponibilidad General de Espacios', title_style))
        elements.append(
            Paragraph(
                f'<b>Semana:</b> {lunes.strftime("%d/%m/%Y")} - {sabado.strftime("%d/%m/%Y")}',
                subtitle_style
            )
        )
        elements.append(Spacer(1, 0.25 * inch))

        stats_data = [
            [
                Paragraph('Total disponible', stat_title_style),
                Paragraph('Total ocupado', stat_title_style),
                Paragraph('Promedio ocupación', stat_title_style)
            ],
            [
                Paragraph(f"{resumen.get('total_disponible', 0)}h", stat_value_style),
                Paragraph(f"{resumen.get('total_ocupado', 0)}h", stat_value_style),
                Paragraph(f"{resumen.get('promedio_ocupacion', 0)}%", stat_value_style)
            ]
        ]
        stats_table = Table(stats_data, colWidths=[(doc.width) / 3] * 3)
        stats_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#dcfce7')),
            ('BACKGROUND', (0, 1), (-1, 1), colors.white),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#bbf7d0')),
            ('LINEBEFORE', (1, 0), (1, -1), 0.5, colors.HexColor('#bbf7d0')),
            ('LINEBEFORE', (2, 0), (2, -1), 0.5, colors.HexColor('#bbf7d0')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ]))
        elements.append(stats_table)
        elements.append(Spacer(1, 0.25 * inch))

        header = ['Espacio', 'Tipo', 'Disponible', 'Ocupado', 'Ocupación']
        table_data = [header]
        for item in (disponibilidad or []):
            table_data.append([
                item.get('nombre', ''),
                item.get('tipo', ''),
                f"{item.get('horasDisponibles', 0)}h",
                f"{item.get('horasOcupadas', 0)}h",
                f"{item.get('porcentajeOcupacion', 0)}%"
            ])

        detail_table = Table(table_data, colWidths=[2.3 * inch, 1.0 * inch, 1.0 * inch, 1.0 * inch, 0.9 * inch])
        detail_style = [
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('FONTSIZE', (0, 1), (-1, -1), 7),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5f5')),
            ('ALIGN', (2, 1), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
        ]
        # Color estilo badge para ocupación (verde / amarillo / rojo)
        for i in range(1, len(table_data)):
            try:
                pct = int(table_data[i][4].replace('%', ''))
            except Exception:
                pct = 0
            if pct >= 70:
                color = colors.HexColor('#dc2626')  # red-600
            elif pct >= 50:
                color = colors.HexColor('#ca8a04')  # yellow
            else:
                color = colors.HexColor('#16a34a')  # green-600
            detail_style.append(('TEXTCOLOR', (4, i), (4, i), color))

        detail_table.setStyle(TableStyle(detail_style))
        elements.append(detail_table)

        doc.build(elements)
        buffer.seek(0)
        response = FileResponse(
            buffer,
            as_attachment=True,
            filename=f'reporte-disponibilidad-{lunes.isoformat()}.pdf'
        )
        response['Content-Type'] = 'application/pdf'
        return response
    except ImportError:
        return JsonResponse({"error": "ReportLab no está instalado"}, status=500)
    except Exception as e:
        import traceback
        error_msg = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Error en generar_pdf_reporte_disponibilidad: {error_msg}")
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def generar_pdf_reporte_capacidad(request):
    """Genera un PDF del reporte de capacidad utilizada con estilo similar al UI."""
    if request.method != 'POST':
        return JsonResponse({"error": "Solo se permite POST"}, status=405)

    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_CENTER
        from datetime import timedelta
        from io import BytesIO
        from django.http import FileResponse

        data = json.loads(request.body) if request.body else {}
        semana_offset = int(data.get('semana_offset', 0))

        hoy = timezone.now().date()
        dias_hasta_lunes = (hoy.weekday() - 0) % 7
        lunes = hoy - timedelta(days=dias_hasta_lunes)
        lunes += timedelta(weeks=semana_offset)
        sabado = lunes + timedelta(days=5)

        dias_nombre = {
            'Monday': 'Lunes',
            'Tuesday': 'Martes',
            'Wednesday': 'Miércoles',
            'Thursday': 'Jueves',
            'Friday': 'Viernes',
            'Saturday': 'Sábado',
            'Sunday': 'Domingo'
        }

        espacios = EspacioFisico.objects.all().select_related('tipo', 'sede')
        capacidad = _calcular_capacidad_reporte(espacios, lunes, sabado, dias_nombre)

        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=inch * 0.6,
            leftMargin=inch * 0.6,
            topMargin=inch * 0.8,
            bottomMargin=inch * 0.8
        )
        elements = []
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'RptTitle',
            parent=styles['Heading1'],
            fontSize=20,
            textColor=colors.HexColor('#0f172a'),
            alignment=TA_CENTER,
            spaceAfter=10
        )
        subtitle_style = ParagraphStyle(
            'RptSubtitle',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#475569'),
            alignment=TA_CENTER
        )

        elements.append(Paragraph('Reporte: Capacidad Utilizada', title_style))
        elements.append(
            Paragraph(
                f'<b>Semana:</b> {lunes.strftime("%d/%m/%Y")} - {sabado.strftime("%d/%m/%Y")}',
                subtitle_style
            )
        )
        elements.append(Spacer(1, 0.25 * inch))

        # Vertical bar chart with legend
        elements.append(Spacer(1, 0.2 * inch))
        
        # Prepare data for vertical bars
        chart_data = []
        max_capacity = max([item.get('capacidadTotal', 0) for item in (capacidad or [])] + [1])
        
        for item in (capacidad or []):
            tipo_nombre = item.get('tipo', '')
            capacidad_total = item.get('capacidadTotal', 0)
            capacidad_usada = item.get('capacidadUsada', 0)
            porcentaje = min(item.get('porcentaje', 0), 100)
            
            chart_data.append({
                'tipo': tipo_nombre,
                'total': capacidad_total,
                'usada': capacidad_usada,
                'porcentaje': porcentaje
            })
        
        # Create vertical bar chart
        if chart_data:
            # Title for chart
            chart_title_style = ParagraphStyle(
                'ChartTitle',
                parent=styles['Normal'],
                fontSize=12,
                textColor=colors.HexColor('#0f172a'),
                alignment=TA_CENTER,
                spaceAfter=10
            )
            elements.append(Paragraph("Capacidad Utilizada por Tipo de Espacio", chart_title_style))
            
            # Calculate bar dimensions
            bar_width = 0.8 * inch
            max_bar_height = 3.0 * inch
            chart_width = len(chart_data) * (bar_width + 0.3 * inch) + 0.5 * inch
            
            # Create bar chart using tables
            for i, item in enumerate(chart_data):
                # Bar height based on percentage (not total capacity)
                bar_height = (item['porcentaje'] / 100) * max_bar_height
                # The entire bar should be colored based on percentage
                used_height = bar_height
                
                # Bar color based on percentage
                bar_color = colors.HexColor('#9333ea')  # Purple
                if item['porcentaje'] > 75:
                    bar_color = colors.HexColor('#16a34a')  # Green
                elif item['porcentaje'] > 40:
                    bar_color = colors.HexColor('#ca8a04')  # Yellow
                
                # Create vertical bar (only the used portion, since we're showing percentage)
                bar_table_data = [
                    [''],  # Empty space above bar
                    [''],  # Colored bar (percentage)
                    ['']   # Empty space below bar
                ]
                
                bar_heights = [
                    max_bar_height - bar_height,  # Space above
                    used_height,                 # Colored portion (percentage)
                    0                           # No space below, bar sits on baseline
                ]
                
                bar_table = Table(bar_table_data, colWidths=[bar_width], rowHeights=bar_heights)
                bar_style = [
                    ('LEFTPADDING', (0, 0), (-1, -1), 0),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                    ('TOPPADDING', (0, 0), (-1, -1), 0),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
                ]
                
                # Add colors for used portion only
                if used_height > 0:
                    bar_style.append(('BACKGROUND', (0, 1), (0, 1), bar_color))  # Colored portion (percentage)
                # No empty portion needed since we're showing percentage directly
                
                bar_table.setStyle(TableStyle(bar_style))
                
                # Create container for bar + label
                container_data = [
                    [bar_table],
                    [item['tipo']],
                    [f"{item['porcentaje']}%"]
                ]
                
                container_table = Table(container_data, colWidths=[bar_width])
                container_style = [
                    ('ALIGN', (0, 1), (0, 2), 'CENTER'),
                    ('VALIGN', (0, 0), (-1, -1), 'BOTTOM'),
                    ('FONTSIZE', (0, 1), (0, 1), 8),
                    ('FONTSIZE', (0, 2), (0, 2), 9),
                    ('TEXTCOLOR', (0, 1), (0, 1), colors.HexColor('#0f172a')),
                    ('TEXTCOLOR', (0, 2), (0, 2), bar_color),
                    ('LEFTPADDING', (0, 0), (-1, -1), 2),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 2),
                    ('TOPPADDING', (0, 0), (-1, -1), 2),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
                ]
                
                container_table.setStyle(TableStyle(container_style))
                
                # Add to elements (positioned horizontally)
                if i == 0:
                    # First bar - create row container
                    row_data = [[container_table]]
                else:
                    # Add to existing row
                    row_data[0].append(container_table)
            
            # Create final chart table with all bars
            if chart_data:
                chart_table = Table(row_data, colWidths=[bar_width + 0.3 * inch] * len(chart_data))
                chart_style = [
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('VALIGN', (0, 0), (-1, -1), 'BOTTOM'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 0),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                    ('TOPPADDING', (0, 0), (-1, -1), 0),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
                ]
                chart_table.setStyle(TableStyle(chart_style))
                elements.append(chart_table)
            
            # Add legend
            elements.append(Spacer(1, 0.2 * inch))
            
            legend_title_style = ParagraphStyle(
                'LegendTitle',
                parent=styles['Normal'],
                fontSize=10,
                textColor=colors.HexColor('#0f172a'),
                spaceAfter=5
            )
            elements.append(Paragraph("Leyenda de Porcentajes:", legend_title_style))
            
            # Legend items
            legend_data = [
                ['Capacidad Utilizada', 'Porcentaje'],
                ['Alta (>75%)', '■ Media (40-75%)', 'Baja (<40%)']
            ]
            
            legend_table = Table(legend_data, colWidths=[2.0 * inch, 2.0 * inch, 2.0 * inch])
            legend_style = [
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f8fafc')),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 9),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5f5')),
                ('LEFTPADDING', (0, 0), (-1, -1), 5),
                ('RIGHTPADDING', (0, 0), (-1, -1), 5),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ]
            
            # Add color indicators for legend
            legend_style.append(('TEXTCOLOR', (0, 1), (0, 1), colors.HexColor('#16a34a')))  # Green
            legend_style.append(('TEXTCOLOR', (1, 1), (1, 1), colors.HexColor('#ca8a04')))  # Yellow  
            legend_style.append(('TEXTCOLOR', (2, 1), (2, 1), colors.HexColor('#9333ea')))  # Purple
            
            legend_table.setStyle(TableStyle(legend_style))
            elements.append(legend_table)

        doc.build(elements)
        buffer.seek(0)
        response = FileResponse(
            buffer,
            as_attachment=True,
            filename=f'reporte-capacidad-{lunes.isoformat()}.pdf'
        )
        response['Content-Type'] = 'application/pdf'
        return response
    except ImportError:
        return JsonResponse({"error": "ReportLab no está instalado"}, status=500)
    except Exception as e:
        import traceback
        error_msg = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Error en generar_pdf_reporte_capacidad: {error_msg}")
        return JsonResponse({"error": str(e)}, status=500)


def _calcular_capacidad_reporte(espacios, lunes, sabado, dias_nombre):
    """
    Calcula la capacidad utilizada agrupada por tipo de espacio.
    Usa el promedio de estudiantes simultáneos en cada franja horaria.
    Retorna: lista con capacidad por tipo de espacio
    """
    try:
        capacidad_por_tipo = {}
        
        for espacio in espacios:
            tipo_nombre = espacio.tipo.nombre
            
            # Inicializar si es la primera vez que vemos este tipo
            if tipo_nombre not in capacidad_por_tipo:
                capacidad_por_tipo[tipo_nombre] = {
                    "capacidad_total": 0,
                    "ocupaciones": [],  # Lista de ocupaciones por espacio
                    "cantidad_espacios": 0
                }
            
            # Sumar la capacidad total de este espacio
            capacidad_por_tipo[tipo_nombre]["capacidad_total"] += espacio.capacidad
            capacidad_por_tipo[tipo_nombre]["cantidad_espacios"] += 1
            
            # Rastrear estudiantes únicos que usan este espacio
            estudiantes_por_dia = {}
            
            # Recorrer cada día de la semana
            fecha_actual = lunes
            while fecha_actual <= sabado:
                dia_nombre_en = fecha_actual.strftime('%A')
                dia_nombre_es = dias_nombre.get(dia_nombre_en, dia_nombre_en)
                
                estudiantes_este_dia = set()
                
                # Obtener horarios (clases) para este día
                horarios_dia = Horario.objects.filter(
                    espacio=espacio,
                    dia_semana__iexact=dia_nombre_es,
                    estado='aprobado'
                )
                
                if not horarios_dia.exists():
                    horarios_dia = Horario.objects.filter(
                        espacio=espacio,
                        dia_semana__iexact=dia_nombre_en,
                        estado='aprobado'
                    )
                
                # Contar estudiantes en horarios
                for horario in horarios_dia:
                    if horario.grupo:
                        try:
                            from grupos.models import Grupo
                            grupo = Grupo.objects.get(id=horario.grupo.id)
                            grupo_size = grupo.estudiantes.count()
                            if grupo_size > 0:
                                estudiantes_este_dia.add(f"horario_{horario.id}")
                                estudiantes_por_dia[fecha_actual] = grupo_size
                        except:
                            estudiantes_por_dia[fecha_actual] = 30  # Default
                
                # Obtener préstamos aprobados para este día
                prestamos_dia = PrestamoEspacio.objects.filter(
                    espacio=espacio,
                    fecha=fecha_actual,
                    estado='Aprobado'
                )
                
                # Contar préstamos (cada préstamo = ocupación)
                for prestamo in prestamos_dia:
                    estudiantes_este_dia.add(f"prestamo_{prestamo.id}")
                    if fecha_actual not in estudiantes_por_dia:
                        estudiantes_por_dia[fecha_actual] = int(espacio.capacidad * 0.3)  # 30% de ocupación
                
                fecha_actual += timedelta(days=1)
            
            # Calcular ocupación promedio para este espacio
            if estudiantes_por_dia:
                ocupacion_promedio = sum(estudiantes_por_dia.values()) / len(estudiantes_por_dia)
            else:
                ocupacion_promedio = 0
            
            capacidad_por_tipo[tipo_nombre]["ocupaciones"].append(ocupacion_promedio)
        
        # Convertir a lista y calcular porcentajes
        capacidad = []
        for tipo_nombre, datos in capacidad_por_tipo.items():
            # Calcular capacidad usada como el promedio de ocupaciones
            capacidad_usada_promedio = sum(datos["ocupaciones"]) if datos["ocupaciones"] else 0
            capacidad_usada_promedio = int(capacidad_usada_promedio)
            
            # Asegurar que no supere la capacidad total
            capacidad_usada_promedio = min(capacidad_usada_promedio, datos["capacidad_total"])
            
            porcentaje = int((capacidad_usada_promedio / datos["capacidad_total"] * 100)) if datos["capacidad_total"] > 0 else 0
            
            # Limitar porcentaje al 100%
            porcentaje = min(porcentaje, 100)
            
            capacidad.append({
                "tipo": tipo_nombre,
                "capacidadTotal": datos["capacidad_total"],
                "capacidadUsada": capacidad_usada_promedio,
                "porcentaje": porcentaje
            })
        
        # Ordenar por tipo alfabéticamente
        capacidad.sort(key=lambda x: x["tipo"])
        
        return capacidad
    except Exception as e:
        print(f"Error en _calcular_capacidad_reporte: {str(e)}")
        return []

