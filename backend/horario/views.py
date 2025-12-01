from django.shortcuts import render
from .models import Horario, HorarioFusionado, HorarioEstudiante
from grupos.models import Grupo
from asignaturas.models import Asignatura
from usuarios.models import Usuario
from espacios.models import EspacioFisico
from django.http import JsonResponse, HttpResponse
import json
from django.views.decorators.csrf import csrf_exempt
import datetime
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from io import BytesIO

# ---------- Endpoint para Mi Horario (Docente) ----------
@csrf_exempt
def mi_horario_docente(request):
    """Retorna el horario del docente logueado"""
    if request.method != 'GET':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    
    try:
        # Obtener usuario_id de headers o query params
        usuario_id = request.GET.get('usuario_id') or request.headers.get('X-Usuario-Id')
        
        if not usuario_id:
            return JsonResponse({"error": "usuario_id es requerido"}, status=400)
        
        # Verificar que el usuario existe
        try:
            docente = Usuario.objects.get(id=usuario_id)
        except Usuario.DoesNotExist:
            return JsonResponse({"error": "Usuario no encontrado"}, status=404)
        
        # Obtener horarios del docente con información extendida
        horarios = Horario.objects.filter(
            docente=docente
        ).select_related('grupo', 'asignatura', 'espacio', 'grupo__programa').all()
        
        lst = []
        for h in horarios:
            lst.append({
                "id": h.id,
                "diaSemana": h.dia_semana,
                "horaInicio": str(h.hora_inicio),
                "horaFin": str(h.hora_fin),
                "asignaturaId": h.asignatura.id,
                "asignatura": h.asignatura.nombre,
                "grupoId": h.grupo.id,
                "grupo": h.grupo.nombre,
                "espacioId": h.espacio.id,
                "espacio": h.espacio.nombre,
                "docenteId": h.docente.id if h.docente else None,
                "docente": h.docente.nombre if h.docente else "Sin asignar",
                "cantidadEstudiantes": h.cantidad_estudiantes,
                "programa": h.grupo.programa.nombre if h.grupo.programa else None,
                "semestre": h.grupo.semestre
            })
        
        return JsonResponse({"horarios": lst}, status=200)
        
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

# ---------- Endpoint para Mi Horario (Estudiante) ----------
@csrf_exempt
def mi_horario_estudiante(request):
    """Retorna el horario del estudiante logueado"""
    if request.method != 'GET':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    
    try:
        # Obtener usuario_id de headers o query params
        usuario_id = request.GET.get('usuario_id') or request.headers.get('X-Usuario-Id')
        
        if not usuario_id:
            return JsonResponse({"error": "usuario_id es requerido"}, status=400)
        
        # Verificar que el usuario existe
        try:
            estudiante = Usuario.objects.get(id=usuario_id)
        except Usuario.DoesNotExist:
            return JsonResponse({"error": "Usuario no encontrado"}, status=404)
        
        # Obtener horarios del estudiante
        inscripciones = HorarioEstudiante.objects.filter(estudiante=estudiante).select_related('horario', 'horario__grupo', 'horario__asignatura', 'horario__espacio', 'horario__docente', 'horario__grupo__programa')
        
        lst = []
        for insc in inscripciones:
            h = insc.horario
            lst.append({
                "id": h.id,
                "diaSemana": h.dia_semana,
                "horaInicio": str(h.hora_inicio),
                "horaFin": str(h.hora_fin),
                "asignaturaId": h.asignatura.id,
                "asignatura": h.asignatura.nombre,
                "grupoId": h.grupo.id,
                "grupo": h.grupo.nombre,
                "espacioId": h.espacio.id,
                "espacio": h.espacio.nombre,
                "docenteId": h.docente.id if h.docente else None,
                "docente": h.docente.nombre if h.docente else "Sin asignar",
                "cantidadEstudiantes": h.cantidad_estudiantes,
                "programa": h.grupo.programa.nombre if h.grupo.programa else None,
                "semestre": h.grupo.semestre
            })
        
        return JsonResponse({"horarios": lst}, status=200)
        
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def inscribir_estudiante(request):
    """Inscribe un estudiante a un horario"""
    if request.method != 'POST':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    
    try:
        data = json.loads(request.body)
        usuario_id = data.get('usuario_id')
        horario_id = data.get('horario_id')
        
        if not usuario_id or not horario_id:
            return JsonResponse({"error": "usuario_id y horario_id son requeridos"}, status=400)
            
        estudiante = Usuario.objects.get(id=usuario_id)
        horario = Horario.objects.get(id=horario_id)
        
        # Crear inscripcion
        inscripcion, created = HorarioEstudiante.objects.get_or_create(estudiante=estudiante, horario=horario)
        
        if created:
            return JsonResponse({"message": "Estudiante inscrito correctamente"}, status=201)
        else:
            return JsonResponse({"message": "El estudiante ya estaba inscrito"}, status=200)
            
    except Usuario.DoesNotExist:
        return JsonResponse({"error": "Estudiante no encontrado"}, status=404)
    except Horario.DoesNotExist:
        return JsonResponse({"error": "Horario no encontrado"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

# ---------- Horario CRUD ----------
@csrf_exempt
def create_horario(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        grupo_id = data.get('grupo_id')
        asignatura_id = data.get('asignatura_id')
        espacio_id = data.get('espacio_id')
        dia_semana = data.get('dia_semana')
        hora_inicio = data.get('hora_inicio')
        hora_fin = data.get('hora_fin')
        docente_id = data.get('docente_id')
        cantidad = data.get('cantidad_estudiantes')
        if not grupo_id or not asignatura_id or not espacio_id or not dia_semana or not hora_inicio or not hora_fin:
            return JsonResponse({"error": "Faltan campos requeridos"}, status=400)
        grupo = Grupo.objects.get(id=grupo_id)
        asignatura = Asignatura.objects.get(id=asignatura_id)
        espacio = EspacioFisico.objects.get(id=espacio_id)
        docente = Usuario.objects.get(id=docente_id) if docente_id else None
        hi = datetime.time.fromisoformat(hora_inicio)
        hf = datetime.time.fromisoformat(hora_fin)
        h = Horario(grupo=grupo, asignatura=asignatura, docente=docente, espacio=espacio, dia_semana=dia_semana, hora_inicio=hi, hora_fin=hf, cantidad_estudiantes=(int(cantidad) if cantidad is not None else None))
        h.save()
        return JsonResponse({"message": "Horario creado", "id": h.id}, status=201)
    except (Grupo.DoesNotExist, Asignatura.DoesNotExist, EspacioFisico.DoesNotExist, Usuario.DoesNotExist):
        return JsonResponse({"error": "Relacionada no encontrada."}, status=404)
    except ValueError:
        return JsonResponse({"error": "Formato de hora inválido o valor numérico incorrecto."}, status=400)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def update_horario(request):
    if request.method != 'PUT':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        id = data.get('id')
        if not id:
            return JsonResponse({"error": "ID es requerido"}, status=400)
        h = Horario.objects.get(id=id)
        if 'grupo_id' in data:
            h.grupo = Grupo.objects.get(id=data.get('grupo_id'))
        if 'asignatura_id' in data:
            h.asignatura = Asignatura.objects.get(id=data.get('asignatura_id'))
        if 'docente_id' in data:
            h.docente = Usuario.objects.get(id=data.get('docente_id')) if data.get('docente_id') else None
        if 'espacio_id' in data:
            h.espacio = EspacioFisico.objects.get(id=data.get('espacio_id'))
        if 'dia_semana' in data:
            h.dia_semana = data.get('dia_semana')
        if 'hora_inicio' in data:
            h.hora_inicio = datetime.time.fromisoformat(data.get('hora_inicio'))
        if 'hora_fin' in data:
            h.hora_fin = datetime.time.fromisoformat(data.get('hora_fin'))
        if 'cantidad_estudiantes' in data:
            h.cantidad_estudiantes = int(data.get('cantidad_estudiantes')) if data.get('cantidad_estudiantes') is not None else None
        h.save()
        return JsonResponse({"message": "Horario actualizado", "id": h.id}, status=200)
    except Horario.DoesNotExist:
        return JsonResponse({"error": "Horario no encontrado."}, status=404)
    except (Grupo.DoesNotExist, Asignatura.DoesNotExist, EspacioFisico.DoesNotExist, Usuario.DoesNotExist):
        return JsonResponse({"error": "Relacionada no encontrada."}, status=404)
    except ValueError:
        return JsonResponse({"error": "Formato de hora inválido o valor numérico incorrecto."}, status=400)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def delete_horario(request):
    if request.method != 'DELETE':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        id = data.get('id')
        if not id:
            return JsonResponse({"error": "ID es requerido"}, status=400)
        h = Horario.objects.get(id=id)
        h.delete()
        return JsonResponse({"message": "Horario eliminado"}, status=200)
    except Horario.DoesNotExist:
        return JsonResponse({"error": "Horario no encontrado."}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
 
@csrf_exempt
def get_horario(request, id=None):
    if id is None:
        return JsonResponse({"error": "El ID es requerido en la URL"}, status=400)
    try:
        h = Horario.objects.get(id=id)
        return JsonResponse({
            "id": h.id,
            "grupo_id": h.grupo.id,
            "asignatura_id": h.asignatura.id,
            "docente_id": (h.docente.id if h.docente else None),
            "espacio_id": h.espacio.id,
            "dia_semana": h.dia_semana,
            "hora_inicio": str(h.hora_inicio),
            "hora_fin": str(h.hora_fin),
            "cantidad_estudiantes": h.cantidad_estudiantes
        }, status=200)
    except Horario.DoesNotExist:
        return JsonResponse({"error": "Horario no encontrado."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def list_horarios(request):
    if request.method == 'GET':
        items = Horario.objects.all()
        lst = [{
            "id": i.id,
            "grupo_id": i.grupo.id,
            "asignatura_id": i.asignatura.id,
            "docente_id": (i.docente.id if i.docente else None),
            "espacio_id": i.espacio.id,
            "dia_semana": i.dia_semana,
            "hora_inicio": str(i.hora_inicio),
            "hora_fin": str(i.hora_fin),
            "cantidad_estudiantes": i.cantidad_estudiantes
        } for i in items]
        return JsonResponse({"horarios": lst}, status=200)

@csrf_exempt
def list_horarios_extendidos(request):
    """Lista horarios con información extendida (nombres de relaciones)"""
    if request.method == 'GET':
        items = Horario.objects.select_related('grupo', 'asignatura', 'docente', 'espacio', 'grupo__programa').all()
        lst = []
        for i in items:
            lst.append({
                "id": i.id,
                "grupo_id": i.grupo.id,
                "grupo_nombre": i.grupo.nombre,
                "programa_id": i.grupo.programa.id,
                "programa_nombre": i.grupo.programa.nombre,
                "semestre": i.grupo.semestre,
                "asignatura_id": i.asignatura.id,
                "asignatura_nombre": i.asignatura.nombre,
                "docente_id": (i.docente.id if i.docente else None),
                "docente_nombre": i.docente.nombre if i.docente else "Sin asignar",
                "espacio_id": i.espacio.id,
                "espacio_nombre": i.espacio.nombre,
                "dia_semana": i.dia_semana,
                "hora_inicio": str(i.hora_inicio),
                "hora_fin": str(i.hora_fin),
                "cantidad_estudiantes": i.cantidad_estudiantes
            })
        return JsonResponse({"horarios": lst}, status=200)

# ---------- HorarioFusionado CRUD ----------
# ---------- Horario_Fusionado CRUD ----------
@csrf_exempt
def create_horario_fusionado(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        grupo1_id = data.get('grupo1_id')
        grupo2_id = data.get('grupo2_id')
        grupo3_id = data.get('grupo3_id')
        asignatura_id = data.get('asignatura_id')
        espacio_id = data.get('espacio_id')
        dia_semana = data.get('dia_semana')
        hora_inicio = data.get('hora_inicio')
        hora_fin = data.get('hora_fin')
        docente_id = data.get('docente_id')
        cantidad = data.get('cantidad_estudiantes')
        comentario = data.get('comentario')
        if not grupo1_id or not grupo2_id or not asignatura_id or not espacio_id or not dia_semana or not hora_inicio or not hora_fin:
            return JsonResponse({"error": "Faltan campos requeridos"}, status=400)
        grupo1 = Grupo.objects.get(id=grupo1_id)
        grupo2 = Grupo.objects.get(id=grupo2_id)
        grupo3 = Grupo.objects.get(id=grupo3_id) if grupo3_id else None
        asignatura = Asignatura.objects.get(id=asignatura_id)
        espacio = EspacioFisico.objects.get(id=espacio_id)
        docente = Usuario.objects.get(id=docente_id) if docente_id else None
        hi = datetime.time.fromisoformat(hora_inicio)
        hf = datetime.time.fromisoformat(hora_fin)
        hfus = HorarioFusionado(grupo1=grupo1, grupo2=grupo2, grupo3=grupo3, asignatura=asignatura, docente=docente, espacio=espacio, dia_semana=dia_semana, hora_inicio=hi, hora_fin=hf, cantidad_estudiantes=(int(cantidad) if cantidad is not None else None), comentario=comentario)
        hfus.save()
        return JsonResponse({"message": "Horario fusionado creado", "id": hfus.id}, status=201)
    except (Grupo.DoesNotExist, Asignatura.DoesNotExist, EspacioFisico.DoesNotExist, Usuario.DoesNotExist):
        return JsonResponse({"error": "Relacionada no encontrada."}, status=404)
    except ValueError:
        return JsonResponse({"error": "Formato de hora inválido o valor numérico incorrecto."}, status=400)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def update_horario_fusionado(request):
    if request.method != 'PUT':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        id = data.get('id')
        if not id:
            return JsonResponse({"error": "ID es requerido"}, status=400)
        h = HorarioFusionado.objects.get(id=id)
        if 'grupo1_id' in data:
            h.grupo1 = Grupo.objects.get(id=data.get('grupo1_id'))
        if 'grupo2_id' in data:
            h.grupo2 = Grupo.objects.get(id=data.get('grupo2_id'))
        if 'grupo3_id' in data:
            h.grupo3 = Grupo.objects.get(id=data.get('grupo3_id')) if data.get('grupo3_id') else None
        if 'asignatura_id' in data:
            h.asignatura = Asignatura.objects.get(id=data.get('asignatura_id'))
        if 'docente_id' in data:
            h.docente = Usuario.objects.get(id=data.get('docente_id')) if data.get('docente_id') else None
        if 'espacio_id' in data:
            h.espacio = EspacioFisico.objects.get(id=data.get('espacio_id'))
        if 'dia_semana' in data:
            h.dia_semana = data.get('dia_semana')
        if 'hora_inicio' in data:
            h.hora_inicio = datetime.time.fromisoformat(data.get('hora_inicio'))
        if 'hora_fin' in data:
            h.hora_fin = datetime.time.fromisoformat(data.get('hora_fin'))
        if 'cantidad_estudiantes' in data:
            h.cantidad_estudiantes = int(data.get('cantidad_estudiantes')) if data.get('cantidad_estudiantes') is not None else None
        if 'comentario' in data:
            h.comentario = data.get('comentario')
        h.save()
        return JsonResponse({"message": "Horario fusionado actualizado", "id": h.id}, status=200)
    except HorarioFusionado.DoesNotExist:
        return JsonResponse({"error": "Horario fusionado no encontrado."}, status=404)
    except (Grupo.DoesNotExist, Asignatura.DoesNotExist, EspacioFisico.DoesNotExist, Usuario.DoesNotExist):
        return JsonResponse({"error": "Relacionada no encontrada."}, status=404)
    except ValueError:
        return JsonResponse({"error": "Formato de hora inválido o valor numérico incorrecto."}, status=400)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def delete_horario_fusionado(request):
    if request.method != 'DELETE':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        id = data.get('id')
        if not id:
            return JsonResponse({"error": "ID es requerido"}, status=400)
        h = HorarioFusionado.objects.get(id=id)
        h.delete()
        return JsonResponse({"message": "Horario fusionado eliminado"}, status=200)
    except HorarioFusionado.DoesNotExist:
        return JsonResponse({"error": "Horario fusionado no encontrado."}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
@csrf_exempt
def get_horario_fusionado(request, id=None):
    if id is None:
        return JsonResponse({"error": "El ID es requerido en la URL"}, status=400)
    try:
        h = HorarioFusionado.objects.get(id=id)
        return JsonResponse({
            "id": h.id,
            "grupo1_id": h.grupo1.id,
            "grupo2_id": h.grupo2.id,
            "grupo3_id": (h.grupo3.id if h.grupo3 else None),
            "asignatura_id": h.asignatura.id,
            "docente_id": (h.docente.id if h.docente else None),
            "espacio_id": h.espacio.id,
            "dia_semana": h.dia_semana,
            "hora_inicio": str(h.hora_inicio),
            "hora_fin": str(h.hora_fin),
            "cantidad_estudiantes": h.cantidad_estudiantes,
            "comentario": h.comentario
        }, status=200)
    except HorarioFusionado.DoesNotExist:
        return JsonResponse({"error": "Horario fusionado no encontrado."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

def list_horarios_fusionados(request):
    if request.method == 'GET':
        items = HorarioFusionado.objects.all()
        lst = [{
            "id": i.id,
            "grupo1_id": i.grupo1.id,
            "grupo2_id": i.grupo2.id,
            "grupo3_id": (i.grupo3.id if i.grupo3 else None),
            "asignatura_id": i.asignatura.id,
            "docente_id": (i.docente.id if i.docente else None),
            "espacio_id": i.espacio.id,
            "dia_semana": i.dia_semana,
            "hora_inicio": str(i.hora_inicio),
            "hora_fin": str(i.hora_fin),
            "cantidad_estudiantes": i.cantidad_estudiantes,
            "comentario": i.comentario
        } for i in items]
        return JsonResponse({"horarios_fusionados": lst}, status=200)

# -------- Funciones auxiliares para exportación --------
def obtener_horarios_usuario(usuario_id):
    """
    Obtiene los horarios de un usuario, ya sea docente o estudiante
    """
    try:
        usuario = Usuario.objects.get(id=usuario_id)
        rol_nombre = usuario.rol.nombre if usuario.rol else None
        
        if rol_nombre == 'estudiante':
            # Obtener horarios del estudiante a través de HorarioEstudiante
            inscripciones = HorarioEstudiante.objects.filter(
                estudiante=usuario
            ).select_related(
                'horario__grupo',
                'horario__asignatura', 
                'horario__espacio',
                'horario__docente'
            )
            horarios = [insc.horario for insc in inscripciones]
            return horarios, rol_nombre
        else:
            # Asumir que es docente
            horarios = Horario.objects.filter(docente=usuario).select_related(
                'grupo', 'asignatura', 'espacio', 'docente'
            )
            return list(horarios), rol_nombre
    except Usuario.DoesNotExist:
        return [], None



def generar_tabla_horario(horarios, rol_nombre):
    """
    Organiza los horarios en una estructura de tabla (días x horas)
    """
    # Días de la semana
    dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    
    # Obtener rango de horas (de 7:00 a 20:00 por defecto)
    horas_inicio = set()
    horas_fin = set()
    
    for h in horarios:
        horas_inicio.add(h.hora_inicio.hour)
        horas_fin.add(h.hora_fin.hour)
    
    hora_min = min(horas_inicio) if horas_inicio else 7
    hora_max = max(horas_fin) if horas_fin else 20
    
    # Crear franjas horarias cada 1 hora
    franjas = []
    for h in range(hora_min, hora_max):
        franjas.append(f"{h:02d}:00 - {h+1:02d}:00")
    
    # Crear diccionario de celdas (dia, franja) -> info
    tabla = {}
    dia_map = {
        'Lunes': 0, 'Martes': 1, 'Miércoles': 2,
        'Jueves': 3, 'Viernes': 4, 'Sábado': 5
    }
    
    for h in horarios:
        dia_idx = dia_map.get(h.dia_semana)
        if dia_idx is None:
            continue
        
        # Encontrar la franja correspondiente
        hora_clase = h.hora_inicio.hour
        franja_idx = hora_clase - hora_min
        
        if 0 <= franja_idx < len(franjas):
            key = (dia_idx, franja_idx)
            info = f"{h.asignatura.nombre}\n{h.grupo.nombre}\n{h.espacio.nombre}"
            if rol_nombre == 'estudiante' and h.docente:
                info += f"\n{h.docente.nombre}"
            tabla[key] = info
    
    return dias, franjas, tabla


# -------- Endpoint para exportar PDF --------
@csrf_exempt
def exportar_horario_pdf(request):
    """Genera y descarga el horario en formato PDF"""
    if request.method != 'GET':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    
    usuario_id = request.GET.get('usuario_id')
    if not usuario_id:
        return JsonResponse({"error": "usuario_id es requerido"}, status=400)
    
    horarios, rol_nombre = obtener_horarios_usuario(usuario_id)
    
    if not horarios:
        return JsonResponse({"error": "No se encontraron horarios"}, status=404)
    
    # Generar tabla
    dias, franjas, tabla = generar_tabla_horario(horarios, rol_nombre)
    
    # Crear PDF en memoria
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), 
                           rightMargin=30, leftMargin=30,
                           topMargin=30, bottomMargin=30)
    
    # Preparar datos para la tabla
    data = [['Hora'] + dias]  # Header
    
    for franja_idx, franja in enumerate(franjas):
        row = [franja]
        for dia_idx in range(len(dias)):
            key = (dia_idx, franja_idx)
            cell_text = tabla.get(key, '')
            row.append(cell_text)
        data.append(row)
    
    # Crear tabla con anchos uniformes
    # Calcular ancho disponible (landscape A4 = 11.69 inches - margins)
    available_width = 11.69*inch - 60  # 60 points total margins
    col_width = available_width / 7  # 7 columnas (1 hora + 6 días)
    
    table = Table(data, colWidths=[col_width]*7, rowHeights=[0.7*inch]*(len(data)))
    
    # Estilo de tabla
    style = TableStyle([
        # Header
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#991B1B')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 0), (-1, 0), 12),
        
        # Columna de horas
        ('BACKGROUND', (0, 1), (0, -1), colors.HexColor('#F3F4F6')),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (0, -1), 9),
        
        # Celdas de datos
        ('FONTSIZE', (1, 1), (-1, -1), 7),
        ('TOPPADDING', (1, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (1, 1), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BOX', (0, 0), (-1, -1), 2, colors.black),
    ])

    
    # Color para celdas con clases
    for (dia_idx, franja_idx), info in tabla.items():
        if info:
            col = dia_idx + 1  # +1 porque la primera columna es de horas
            row = franja_idx + 1  # +1 porque la primera fila es header
            style.add('BACKGROUND', (col, row), (col, row), colors.HexColor('#DBEAFE'))
    
    table.setStyle(style)
    
    # Generar PDF
    elements = [table]
    doc.build(elements)
    
    # Preparar respuesta
    buffer.seek(0)
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="horario_{usuario_id}.pdf"'
    
    return response


# -------- Endpoint para exportar Excel --------
@csrf_exempt
def exportar_horario_excel(request):
    """Genera y descarga el horario en formato Excel"""
    if request.method != 'GET':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    
    usuario_id = request.GET.get('usuario_id')
    if not usuario_id:
        return JsonResponse({"error": "usuario_id es requerido"}, status=400)
    
    horarios, rol_nombre = obtener_horarios_usuario(usuario_id)
    
    if not horarios:
        return JsonResponse({"error": "No se encontraron horarios"}, status=404)
    
    # Generar tabla
    dias, franjas, tabla = generar_tabla_horario(horarios, rol_nombre)
    
    # Crear workbook
    wb = Workbook()
    ws = wb.active
    ws.title = "Mi Horario"
    
    # Estilos
    header_fill = PatternFill(start_color="991B1B", end_color="991B1B", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True, size=11)
    hour_fill = PatternFill(start_color="F3F4F6", end_color="F3F4F6", fill_type="solid")
    hour_font = Font(bold=True, size=9)
    class_fill = PatternFill(start_color="DBEAFE", end_color="DBEAFE", fill_type="solid")
    border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )
    center_alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    
    # Escribir header
    ws['A1'] = 'Hora'
    ws['A1'].fill = header_fill
    ws['A1'].font = header_font
    ws['A1'].alignment = center_alignment
    ws['A1'].border = border
    
    for idx, dia in enumerate(dias, start=2):
        cell = ws.cell(row=1, column=idx)
        cell.value = dia
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = center_alignment
        cell.border = border
    
    # Escribir datos
    for franja_idx, franja in enumerate(franjas, start=2):
        # Columna de horas
        cell = ws.cell(row=franja_idx, column=1)
        cell.value = franja
        cell.fill = hour_fill
        cell.font = hour_font
        cell.alignment = center_alignment
        cell.border = border
        
        # Celdas de cada día
        for dia_idx in range(len(dias)):
            col = dia_idx + 2
            cell = ws.cell(row=franja_idx, column=col)
            key = (dia_idx, franja_idx - 2)
            cell_text = tabla.get(key, '')
            cell.value = cell_text
            
            if cell_text:
                cell.fill = class_fill
            
            cell.alignment = center_alignment
            cell.border = border
    
    # Ajustar ancho de columnas
    ws.column_dimensions['A'].width = 18
    for col in 'BCDEFG':
        ws.column_dimensions[col].width = 22
    
    # Ajustar alto de filas
    for row in range(2, len(franjas) + 2):
        ws.row_dimensions[row].height = 60
    
    # Guardar en buffer
    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    
    # Preparar respuesta
    response = HttpResponse(
        buffer,
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename="horario_{usuario_id}.xlsx"'
    
    return response
