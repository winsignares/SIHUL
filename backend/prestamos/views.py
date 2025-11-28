from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import PrestamoEspacio
from espacios.models import EspacioFisico
from usuarios.models import Usuario
import json
import datetime

# Create your views here.
@csrf_exempt
def create_prestamo(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        espacio_id = data.get('espacio_id')
        usuario_id = data.get('usuario_id')
        administrador_id = data.get('administrador_id')
        fecha = data.get('fecha')
        hora_inicio = data.get('hora_inicio')
        hora_fin = data.get('hora_fin')
        motivo = data.get('motivo')
        estado = data.get('estado', 'Pendiente')
        if not espacio_id or not fecha or not hora_inicio or not hora_fin:
            return JsonResponse({"error": "espacio_id, fecha, hora_inicio y hora_fin son requeridos"}, status=400)
        espacio = EspacioFisico.objects.get(id=espacio_id)
        usuario = Usuario.objects.get(id=usuario_id) if usuario_id else None
        administrador = Usuario.objects.get(id=administrador_id) if administrador_id else None
        f = datetime.date.fromisoformat(fecha)
        hi = datetime.time.fromisoformat(hora_inicio)
        hf = datetime.time.fromisoformat(hora_fin)
        p = PrestamoEspacio(espacio=espacio, usuario=usuario, administrador=administrador, fecha=f, hora_inicio=hi, hora_fin=hf, motivo=motivo, estado=estado)
        p.save()
        return JsonResponse({"message": "Prestamo creado", "id": p.id}, status=201)
    except EspacioFisico.DoesNotExist:
        return JsonResponse({"error": "Espacio no encontrado."}, status=404)
    except Usuario.DoesNotExist:
        return JsonResponse({"error": "Usuario no encontrado."}, status=404)
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
        if 'espacio_id' in data:
            p.espacio = EspacioFisico.objects.get(id=data.get('espacio_id'))
        if 'usuario_id' in data:
            p.usuario = Usuario.objects.get(id=data.get('usuario_id')) if data.get('usuario_id') else None
        if 'administrador_id' in data:
            p.administrador = Usuario.objects.get(id=data.get('administrador_id')) if data.get('administrador_id') else None
        if 'fecha' in data:
            p.fecha = datetime.date.fromisoformat(data.get('fecha'))
        if 'hora_inicio' in data:
            p.hora_inicio = datetime.time.fromisoformat(data.get('hora_inicio'))
        if 'hora_fin' in data:
            p.hora_fin = datetime.time.fromisoformat(data.get('hora_fin'))
        if 'motivo' in data:
            p.motivo = data.get('motivo')
        if 'estado' in data:
            p.estado = data.get('estado')
        p.save()
        return JsonResponse({"message": "Prestamo actualizado", "id": p.id}, status=200)
    except PrestamoEspacio.DoesNotExist:
        return JsonResponse({"error": "Prestamo no encontrado."}, status=404)
    except (EspacioFisico.DoesNotExist, Usuario.DoesNotExist):
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
        p = PrestamoEspacio.objects.get(id=id)
        return JsonResponse({
            "id": p.id,
            "espacio_id": p.espacio.id,
            "usuario_id": (p.usuario.id if p.usuario else None),
            "administrador_id": (p.administrador.id if p.administrador else None),
            "fecha": str(p.fecha),
            "hora_inicio": str(p.hora_inicio),
            "hora_fin": str(p.hora_fin),
            "motivo": p.motivo,
            "estado": p.estado
        }, status=200)
    except PrestamoEspacio.DoesNotExist:
        return JsonResponse({"error": "Prestamo no encontrado."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
def list_prestamos(request):
    if request.method == 'GET':
        items = PrestamoEspacio.objects.all()
        lst = [{
            "id": i.id,
            "espacio_id": i.espacio.id,
            "usuario_id": (i.usuario.id if i.usuario else None),
            "administrador_id": (i.administrador.id if i.administrador else None),
            "fecha": str(i.fecha),
            "hora_inicio": str(i.hora_inicio),
            "hora_fin": str(i.hora_fin),
            "motivo": i.motivo,
            "estado": i.estado
        } for i in items]
        return JsonResponse({"prestamos": lst}, status=200)