from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views.decorators.http import require_http_methods
import json
from .models import Asignatura, AsignaturaPrograma
from programas.models import Programa

# ---------- Asignatura CRUD ----------
@csrf_exempt
@require_http_methods(["POST"])
def create_asignatura(request):
    try:
        data = json.loads(request.body)
        nombre = data.get('nombre')
        codigo = data.get('codigo')
        creditos = data.get('creditos')
        tipo = data.get('tipo', 'teórica')
        horas = data.get('horas', 0)

        if not all([nombre, codigo, creditos]):
            return JsonResponse({'error': 'Faltan campos obligatorios'}, status=400)

        asignatura = Asignatura(
            nombre=nombre,
            codigo=codigo,
            creditos=int(creditos),
            tipo=tipo,
            horas=int(horas)
        )
        asignatura.save()

        return JsonResponse({'message': 'Asignatura creada exitosamente', 'id': asignatura.id}, status=201)
    except ValueError:
         return JsonResponse({'error': 'Créditos y horas deben ser números enteros'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["PUT"])
def update_asignatura(request, id=None):
    # Nota: El ID puede venir en la URL o en el body, dependiendo de la implementación del router.
    # Aquí asumimos que si no está en URL, buscamos en body, o adaptamos según el estilo anterior.
    # El código anterior del usuario usaba `def update_asignatura(request):` y leía ID del body.
    # Voy a mantener consistencia con el estilo de recibir request y extraer ID del body si id es None.
    
    try:
        data = json.loads(request.body)
        if id is None:
            id = data.get('id')
        
        if not id:
             return JsonResponse({'error': 'ID es requerido'}, status=400)

        asignatura = Asignatura.objects.get(id=id)

        asignatura.nombre = data.get('nombre', asignatura.nombre)
        asignatura.codigo = data.get('codigo', asignatura.codigo)
        
        if 'creditos' in data:
            asignatura.creditos = int(data.get('creditos'))
            
        asignatura.tipo = data.get('tipo', asignatura.tipo)
        
        if 'horas' in data:
            asignatura.horas = int(data.get('horas'))

        asignatura.save()

        return JsonResponse({'message': 'Asignatura actualizada exitosamente', 'id': asignatura.id})
    except Asignatura.DoesNotExist:
        return JsonResponse({'error': 'Asignatura no encontrada'}, status=404)
    except ValueError:
         return JsonResponse({'error': 'Créditos y horas deben ser números enteros'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["DELETE"])
def delete_asignatura(request, id=None):
    try:
        if id is None:
            data = json.loads(request.body)
            id = data.get('id')
            
        if not id:
            return JsonResponse({'error': 'ID es requerido'}, status=400)

        asignatura = Asignatura.objects.get(id=id)
        asignatura.delete()
        return JsonResponse({'message': 'Asignatura eliminada exitosamente'})
    except Asignatura.DoesNotExist:
        return JsonResponse({'error': 'Asignatura no encontrada'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_asignatura(request, id):
    try:
        asignatura = Asignatura.objects.get(id=id)
        data = {
            'id': asignatura.id,
            'nombre': asignatura.nombre,
            'codigo': asignatura.codigo,
            'creditos': asignatura.creditos,
            'tipo': asignatura.tipo,
            'horas': asignatura.horas
        }
        return JsonResponse(data)
    except Asignatura.DoesNotExist:
        return JsonResponse({'error': 'Asignatura no encontrada'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def list_asignaturas(request):
    try:
        asignaturas = Asignatura.objects.all()
        data = []
        for asignatura in asignaturas:
            data.append({
                'id': asignatura.id,
                'nombre': asignatura.nombre,
                'codigo': asignatura.codigo,
                'creditos': asignatura.creditos,
                'tipo': asignatura.tipo,
                'horas': asignatura.horas
            })
        return JsonResponse({'asignaturas': data}, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ---------- AsignaturaPrograma CRUD ----------
@csrf_exempt
@require_http_methods(["POST"])
def create_asignatura_programa(request):
    try:
        data = json.loads(request.body)
        programa_id = data.get('programa_id')
        asignatura_id = data.get('asignatura_id')
        semestre = data.get('semestre')
        componente_formativo = data.get('componente_formativo', 'profesional')

        if not all([programa_id, asignatura_id, semestre]):
            return JsonResponse({'error': 'Faltan campos obligatorios: programa_id, asignatura_id, semestre'}, status=400)
        
        try:
            programa = Programa.objects.get(id=programa_id)
        except Programa.DoesNotExist:
            return JsonResponse({'error': 'El programa especificado no existe'}, status=404)
        
        try:
            asignatura = Asignatura.objects.get(id=asignatura_id)
        except Asignatura.DoesNotExist:
            return JsonResponse({'error': 'La asignatura especificada no existe'}, status=404)

        # Verificar si ya existe
        if AsignaturaPrograma.objects.filter(programa=programa, asignatura=asignatura, semestre=semestre).exists():
            return JsonResponse({'error': 'Esta asignatura ya está registrada para este programa y semestre'}, status=400)

        asignatura_programa = AsignaturaPrograma(
            programa=programa,
            asignatura=asignatura,
            semestre=int(semestre),
            componente_formativo=componente_formativo
        )
        asignatura_programa.save()

        return JsonResponse({
            'message': 'Asignatura asignada al programa exitosamente',
            'id': asignatura_programa.id
        }, status=201)
    except ValueError:
        return JsonResponse({'error': 'El semestre debe ser un número entero'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["PUT"])
def update_asignatura_programa(request, id=None):
    try:
        data = json.loads(request.body)
        if id is None:
            id = data.get('id')
        
        if not id:
            return JsonResponse({'error': 'ID es requerido'}, status=400)

        asignatura_programa = AsignaturaPrograma.objects.get(id=id)

        if 'semestre' in data:
            asignatura_programa.semestre = int(data.get('semestre'))
        
        if 'componente_formativo' in data:
            asignatura_programa.componente_formativo = data.get('componente_formativo')

        asignatura_programa.save()

        return JsonResponse({
            'message': 'Relación asignatura-programa actualizada exitosamente',
            'id': asignatura_programa.id
        })
    except AsignaturaPrograma.DoesNotExist:
        return JsonResponse({'error': 'Relación asignatura-programa no encontrada'}, status=404)
    except ValueError:
        return JsonResponse({'error': 'El semestre debe ser un número entero'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["DELETE"])
def delete_asignatura_programa(request, id=None):
    try:
        if id is None:
            data = json.loads(request.body)
            id = data.get('id')
            
        if not id:
            return JsonResponse({'error': 'ID es requerido'}, status=400)

        asignatura_programa = AsignaturaPrograma.objects.get(id=id)
        asignatura_programa.delete()
        return JsonResponse({'message': 'Relación asignatura-programa eliminada exitosamente'})
    except AsignaturaPrograma.DoesNotExist:
        return JsonResponse({'error': 'Relación asignatura-programa no encontrada'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def get_asignatura_programa(request, id):
    try:
        asignatura_programa = AsignaturaPrograma.objects.select_related('programa', 'asignatura').get(id=id)
        data = {
            'id': asignatura_programa.id,
            'programa_id': asignatura_programa.programa.id,
            'programa_nombre': asignatura_programa.programa.nombre,
            'asignatura_id': asignatura_programa.asignatura.id,
            'asignatura_nombre': asignatura_programa.asignatura.nombre,
            'asignatura_codigo': asignatura_programa.asignatura.codigo,
            'creditos': asignatura_programa.asignatura.creditos,
            'semestre': asignatura_programa.semestre,
            'componente_formativo': asignatura_programa.componente_formativo,
            'horas': asignatura_programa.asignatura.horas
        }
        return JsonResponse(data)
    except AsignaturaPrograma.DoesNotExist:
        return JsonResponse({'error': 'Relación asignatura-programa no encontrada'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def list_asignaturas_programa(request):
    """
    Lista todas las relaciones asignatura-programa.
    Puede filtrar por programa_id si se pasa como query parameter.
    """
    try:
        programa_id = request.GET.get('programa_id')
        
        if programa_id:
            asignaturas_programa = AsignaturaPrograma.objects.filter(
                programa_id=programa_id
            ).select_related('programa', 'asignatura')
        else:
            asignaturas_programa = AsignaturaPrograma.objects.all().select_related('programa', 'asignatura')
        
        data = []
        for ap in asignaturas_programa:
            data.append({
                'id': ap.id,
                'programa_id': ap.programa.id,
                'programa_nombre': ap.programa.nombre,
                'asignatura_id': ap.asignatura.id,
                'asignatura_nombre': ap.asignatura.nombre,
                'asignatura_codigo': ap.asignatura.codigo,
                'creditos': ap.asignatura.creditos,
                'semestre': ap.semestre,
                'componente_formativo': ap.componente_formativo,
                'horas': ap.asignatura.horas
            })
        
        return JsonResponse({'asignaturas_programa': data}, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
