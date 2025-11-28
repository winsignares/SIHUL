from django.shortcuts import render
from .models import Componente, ComponenteRol, ComponenteUsuario
from usuarios.models import Rol, Usuario
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt

# ---------- Componente CRUD ----------

@csrf_exempt
def create_componente(request):
    """Crear un nuevo componente"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            nombre = data.get('nombre')
            descripcion = data.get('descripcion')
            
            if not nombre:
                return JsonResponse({"error": "El nombre es requerido"}, status=400)
            
            componente = Componente(nombre=nombre, descripcion=descripcion)
            componente.save()
            return JsonResponse({
                "message": "Componente creado exitosamente",
                "id": componente.id,
                "nombre": componente.nombre,
                "descripcion": componente.descripcion
            }, status=201)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Solo se permite POST"}, status=405)


@csrf_exempt
def list_componentes(request):
    """Listar todos los componentes"""
    if request.method == 'GET':
        try:
            componentes = Componente.objects.all()
            lista = [
                {
                    "id": c.id,
                    "nombre": c.nombre,
                    "descripcion": c.descripcion
                }
                for c in componentes
            ]
            return JsonResponse({"componentes": lista}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Solo se permite GET"}, status=405)


@csrf_exempt
def retrieve_componente(request, id):
    """Obtener un componente por ID"""
    if request.method == 'GET':
        try:
            componente = Componente.objects.get(id=id)
            return JsonResponse({
                "id": componente.id,
                "nombre": componente.nombre,
                "descripcion": componente.descripcion
            }, status=200)
        except Componente.DoesNotExist:
            return JsonResponse({"error": "Componente no encontrado"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Solo se permite GET"}, status=405)


@csrf_exempt
def update_componente(request):
    """Actualizar un componente"""
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            
            if not id:
                return JsonResponse({"error": "El ID es requerido"}, status=400)
            
            componente = Componente.objects.get(id=id)
            
            if 'nombre' in data:
                componente.nombre = data.get('nombre')
            if 'descripcion' in data:
                componente.descripcion = data.get('descripcion')
            
            componente.save()
            return JsonResponse({
                "message": "Componente actualizado exitosamente",
                "id": componente.id,
                "nombre": componente.nombre,
                "descripcion": componente.descripcion
            }, status=200)
        except Componente.DoesNotExist:
            return JsonResponse({"error": "Componente no encontrado"}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Solo se permite PUT"}, status=405)


@csrf_exempt
def delete_componente(request):
    """Eliminar un componente"""
    if request.method == 'DELETE':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            
            if not id:
                return JsonResponse({"error": "El ID es requerido"}, status=400)
            
            componente = Componente.objects.get(id=id)
            componente.delete()
            return JsonResponse({
                "message": "Componente eliminado exitosamente"
            }, status=200)
        except Componente.DoesNotExist:
            return JsonResponse({"error": "Componente no encontrado"}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Solo se permite DELETE"}, status=405)


# ---------- ComponenteRol CRUD ----------

@csrf_exempt
def create_componente_rol(request):
    """Crear un nuevo ComponenteRol"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            componente_id = data.get('componente_id')
            rol_id = data.get('rol_id')
            permiso = data.get('permiso', ComponenteRol.Permiso.VER)
            
            if not componente_id or not rol_id:
                return JsonResponse({"error": "componente_id y rol_id son requeridos"}, status=400)
            
            # Validar que permiso sea válido
            valid_permisos = [choice[0] for choice in ComponenteRol.Permiso.choices]
            if permiso not in valid_permisos:
                return JsonResponse({"error": f"Permiso inválido. Valores válidos: {valid_permisos}"}, status=400)
            
            componente = Componente.objects.get(id=componente_id)
            rol = Rol.objects.get(id=rol_id)
            
            componente_rol = ComponenteRol(componente=componente, rol=rol, permiso=permiso)
            componente_rol.save()
            
            return JsonResponse({
                "message": "ComponenteRol creado exitosamente",
                "id": componente_rol.id,
                "componente_id": componente_rol.componente.id,
                "rol_id": componente_rol.rol.id,
                "permiso": componente_rol.permiso
            }, status=201)
        except Componente.DoesNotExist:
            return JsonResponse({"error": "Componente no encontrado"}, status=404)
        except Rol.DoesNotExist:
            return JsonResponse({"error": "Rol no encontrado"}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Solo se permite POST"}, status=405)


@csrf_exempt
def list_componente_roles(request):
    """Listar todos los ComponenteRol"""
    if request.method == 'GET':
        try:
            componente_roles = ComponenteRol.objects.all()
            lista = [
                {
                    "id": cr.id,
                    "componente_id": cr.componente.id,
                    "componente_nombre": cr.componente.nombre,
                    "rol_id": cr.rol.id,
                    "rol_nombre": cr.rol.nombre,
                    "permiso": cr.permiso,
                    "permiso_display": cr.get_permiso_display()
                }
                for cr in componente_roles
            ]
            return JsonResponse({"componente_roles": lista}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Solo se permite GET"}, status=405)


@csrf_exempt
def retrieve_componente_rol(request, id):
    """Obtener un ComponenteRol por ID"""
    if request.method == 'GET':
        try:
            componente_rol = ComponenteRol.objects.get(id=id)
            return JsonResponse({
                "id": componente_rol.id,
                "componente_id": componente_rol.componente.id,
                "componente_nombre": componente_rol.componente.nombre,
                "rol_id": componente_rol.rol.id,
                "rol_nombre": componente_rol.rol.nombre,
                "permiso": componente_rol.permiso,
                "permiso_display": componente_rol.get_permiso_display()
            }, status=200)
        except ComponenteRol.DoesNotExist:
            return JsonResponse({"error": "ComponenteRol no encontrado"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Solo se permite GET"}, status=405)


@csrf_exempt
def update_componente_rol(request):
    """Actualizar un ComponenteRol"""
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            
            if not id:
                return JsonResponse({"error": "El ID es requerido"}, status=400)
            
            componente_rol = ComponenteRol.objects.get(id=id)
            
            if 'permiso' in data:
                valid_permisos = [choice[0] for choice in ComponenteRol.Permiso.choices]
                if data.get('permiso') not in valid_permisos:
                    return JsonResponse({"error": f"Permiso inválido. Valores válidos: {valid_permisos}"}, status=400)
                componente_rol.permiso = data.get('permiso')
            
            componente_rol.save()
            
            return JsonResponse({
                "message": "ComponenteRol actualizado exitosamente",
                "id": componente_rol.id,
                "componente_id": componente_rol.componente.id,
                "rol_id": componente_rol.rol.id,
                "permiso": componente_rol.permiso
            }, status=200)
        except ComponenteRol.DoesNotExist:
            return JsonResponse({"error": "ComponenteRol no encontrado"}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Solo se permite PUT"}, status=405)


@csrf_exempt
def delete_componente_rol(request):
    """Eliminar un ComponenteRol"""
    if request.method == 'DELETE':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            
            if not id:
                return JsonResponse({"error": "El ID es requerido"}, status=400)
            
            componente_rol = ComponenteRol.objects.get(id=id)
            componente_rol.delete()
            
            return JsonResponse({
                "message": "ComponenteRol eliminado exitosamente"
            }, status=200)
        except ComponenteRol.DoesNotExist:
            return JsonResponse({"error": "ComponenteRol no encontrado"}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Solo se permite DELETE"}, status=405)


# ---------- ComponenteUsuario CRUD ----------

@csrf_exempt
def create_componente_usuario(request):
    """Crear un nuevo ComponenteUsuario"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            componente_id = data.get('componente_id')
            usuario_id = data.get('usuario_id')
            permiso = data.get('permiso', ComponenteUsuario.Permiso.VER)
            
            if not componente_id or not usuario_id:
                return JsonResponse({"error": "componente_id y usuario_id son requeridos"}, status=400)
            
            # Validar que permiso sea válido
            valid_permisos = [choice[0] for choice in ComponenteUsuario.Permiso.choices]
            if permiso not in valid_permisos:
                return JsonResponse({"error": f"Permiso inválido. Valores válidos: {valid_permisos}"}, status=400)
            
            componente = Componente.objects.get(id=componente_id)
            usuario = Usuario.objects.get(id=usuario_id)
            
            componente_usuario = ComponenteUsuario(componente=componente, usuario=usuario, permiso=permiso)
            componente_usuario.save()
            
            return JsonResponse({
                "message": "ComponenteUsuario creado exitosamente",
                "id": componente_usuario.id,
                "componente_id": componente_usuario.componente.id,
                "usuario_id": componente_usuario.usuario.id,
                "permiso": componente_usuario.permiso
            }, status=201)
        except Componente.DoesNotExist:
            return JsonResponse({"error": "Componente no encontrado"}, status=404)
        except Usuario.DoesNotExist:
            return JsonResponse({"error": "Usuario no encontrado"}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Solo se permite POST"}, status=405)


@csrf_exempt
def list_componente_usuarios(request):
    """Listar todos los ComponenteUsuario"""
    if request.method == 'GET':
        try:
            componente_usuarios = ComponenteUsuario.objects.all()
            lista = [
                {
                    "id": cu.id,
                    "componente_id": cu.componente.id,
                    "componente_nombre": cu.componente.nombre,
                    "usuario_id": cu.usuario.id,
                    "usuario_nombre": cu.usuario.nombre,
                    "permiso": cu.permiso,
                    "permiso_display": cu.get_permiso_display()
                }
                for cu in componente_usuarios
            ]
            return JsonResponse({"componente_usuarios": lista}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Solo se permite GET"}, status=405)


@csrf_exempt
def retrieve_componente_usuario(request, id):
    """Obtener un ComponenteUsuario por ID"""
    if request.method == 'GET':
        try:
            componente_usuario = ComponenteUsuario.objects.get(id=id)
            return JsonResponse({
                "id": componente_usuario.id,
                "componente_id": componente_usuario.componente.id,
                "componente_nombre": componente_usuario.componente.nombre,
                "usuario_id": componente_usuario.usuario.id,
                "usuario_nombre": componente_usuario.usuario.nombre,
                "permiso": componente_usuario.permiso,
                "permiso_display": componente_usuario.get_permiso_display()
            }, status=200)
        except ComponenteUsuario.DoesNotExist:
            return JsonResponse({"error": "ComponenteUsuario no encontrado"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Solo se permite GET"}, status=405)


@csrf_exempt
def update_componente_usuario(request):
    """Actualizar un ComponenteUsuario"""
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            
            if not id:
                return JsonResponse({"error": "El ID es requerido"}, status=400)
            
            componente_usuario = ComponenteUsuario.objects.get(id=id)
            
            if 'permiso' in data:
                valid_permisos = [choice[0] for choice in ComponenteUsuario.Permiso.choices]
                if data.get('permiso') not in valid_permisos:
                    return JsonResponse({"error": f"Permiso inválido. Valores válidos: {valid_permisos}"}, status=400)
                componente_usuario.permiso = data.get('permiso')
            
            componente_usuario.save()
            
            return JsonResponse({
                "message": "ComponenteUsuario actualizado exitosamente",
                "id": componente_usuario.id,
                "componente_id": componente_usuario.componente.id,
                "usuario_id": componente_usuario.usuario.id,
                "permiso": componente_usuario.permiso
            }, status=200)
        except ComponenteUsuario.DoesNotExist:
            return JsonResponse({"error": "ComponenteUsuario no encontrado"}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Solo se permite PUT"}, status=405)


@csrf_exempt
def delete_componente_usuario(request):
    """Eliminar un ComponenteUsuario"""
    if request.method == 'DELETE':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            
            if not id:
                return JsonResponse({"error": "El ID es requerido"}, status=400)
            
            componente_usuario = ComponenteUsuario.objects.get(id=id)
            componente_usuario.delete()
            
            return JsonResponse({
                "message": "ComponenteUsuario eliminado exitosamente"
            }, status=200)
        except ComponenteUsuario.DoesNotExist:
            return JsonResponse({"error": "ComponenteUsuario no encontrado"}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Solo se permite DELETE"}, status=405)
