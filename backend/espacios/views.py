from django.shortcuts import render
from .models import EspacioFisico, EspacioPermitido, TipoEspacio
from sedes.models import Sede
from usuarios.models import Usuario
from recursos.models import Recurso, EspacioRecurso
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt

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
