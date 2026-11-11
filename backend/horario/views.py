from .models import Horario
from django.http import JsonResponse, HttpResponse
import json
from django.views.decorators.csrf import csrf_exempt
import sys

from . import exportaciones


def _estados_exportables_horario(data):
    estado = str(data.get('estado_horario') or data.get('estadoHorario') or '').strip().lower()
    include_pending = bool(data.get('include_pending') or data.get('includePending'))

    if estado == 'pendiente':
        return {'pendiente'}
    if estado in {'todos', 'all'} or include_pending:
        return {'aprobado', 'pendiente'}
    return {'aprobado'}


def _horarios_exportables(request):
    """Lee la lista de horarios del cuerpo y deja los exportables. Devuelve (horarios, respuesta_de_error)."""
    data = json.loads(request.body)
    horarios_data = data.get('horarios', [])

    if not horarios_data:
        return None, JsonResponse({"error": "No se proporcionaron horarios"}, status=400)

    estados_exportables = _estados_exportables_horario(data)
    horarios_data = [h for h in horarios_data if h.get('estado', '').lower() in estados_exportables]

    if not horarios_data:
        return None, JsonResponse({"error": "No hay horarios para exportar"}, status=400)
    return horarios_data, None


def _descarga(contenido, content_type, nombre):
    response = HttpResponse(contenido, content_type=content_type)
    response['Content-Disposition'] = f'attachment; filename="{nombre}"'
    return response


def _exportar_post(request, generar, content_type, nombre, etiqueta_error):
    if request.method != 'POST':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        horarios_data, error = _horarios_exportables(request)
        if error:
            return error
        return _descarga(generar(horarios_data), content_type, nombre)
    except Exception as e:
        import traceback
        print(f"{etiqueta_error}: {str(e)}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        return JsonResponse({"error": str(e)}, status=500)


# -------- Exportaciones del Centro de Horarios (POST con la lista de horarios) --------
@csrf_exempt
def exportar_horarios_pdf_post(request):
    """PDF con una página por grupo."""
    return _exportar_post(request, exportaciones.pdf_por_grupo, 'application/pdf',
                          'horarios_centro.pdf', 'ERROR en PDF')


@csrf_exempt
def exportar_horarios_excel_post(request):
    """Excel con una hoja por grupo."""
    return _exportar_post(request, exportaciones.excel_por_grupo, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                          'horarios_centro.xlsx', 'ERROR en Excel')


@csrf_exempt
def exportar_horarios_pdf_docente(request):
    """PDF con una página por docente."""
    return _exportar_post(request, exportaciones.pdf_por_docente, 'application/pdf',
                          'horarios_docentes.pdf', 'ERROR en exportar_horarios_pdf_docente')


@csrf_exempt
def exportar_horarios_excel_docente(request):
    """Excel con una hoja por docente."""
    return _exportar_post(request, exportaciones.excel_por_docente, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                          'horarios_docentes.xlsx', 'ERROR en exportar_horarios_excel_docente')


# -------- Endpoints para descargar horario individual (docente/estudiante) --------
@csrf_exempt
def exportar_pdf_usuario(request):
    """Descarga el horario en PDF para un usuario específico (docente o estudiante)"""
    if request.method != 'GET':
        return JsonResponse({"error": "Método no permitido"}, status=405)

    try:
        usuario_id = request.GET.get('usuario_id')
        if not usuario_id:
            return JsonResponse({"error": "usuario_id requerido"}, status=400)

        try:
            # Obtener horarios del usuario
            horarios_data = list_horarios_extendidos_usuario(usuario_id)

            if not horarios_data:
                return JsonResponse({"error": "No hay horarios registrados"}, status=400)

            # Generar PDF directamente
            return generar_pdf_horarios(horarios_data)
        except Exception as inner_e:
            import traceback
            print(f"ERROR en exportar_pdf_usuario (inner): {str(inner_e)}", file=sys.stderr)
            print(traceback.format_exc(), file=sys.stderr)
            return JsonResponse({"error": "No hay horarios registrados"}, status=400)

    except Exception as e:
        import traceback
        print(f"ERROR en exportar_pdf_usuario: {str(e)}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def exportar_excel_usuario(request):
    """Descarga el horario en Excel para un usuario específico (docente o estudiante)"""
    if request.method != 'GET':
        return JsonResponse({"error": "Método no permitido"}, status=405)

    try:
        usuario_id = request.GET.get('usuario_id')
        if not usuario_id:
            return JsonResponse({"error": "usuario_id requerido"}, status=400)

        try:
            # Obtener horarios del usuario
            horarios_data = list_horarios_extendidos_usuario(usuario_id)

            if not horarios_data:
                return JsonResponse({"error": "No hay horarios registrados"}, status=400)

            # Generar Excel directamente
            return generar_excel_horarios(horarios_data)
        except Exception as inner_e:
            import traceback
            print(f"ERROR en exportar_excel_usuario (inner): {str(inner_e)}", file=sys.stderr)
            print(traceback.format_exc(), file=sys.stderr)
            return JsonResponse({"error": "No hay horarios registrados"}, status=400)

    except Exception as e:
        import traceback
        print(f"ERROR en exportar_excel_usuario: {str(e)}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        return JsonResponse({"error": str(e)}, status=500)


def generar_pdf_horarios(horarios_data):
    """Genera un PDF con los horarios proporcionados"""
    try:
        return _descarga(exportaciones.pdf_por_grupo(horarios_data), 'application/pdf', 'horarios.pdf')
    except Exception as e:
        import traceback
        print(f"ERROR en generar_pdf_horarios: {str(e)}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        return JsonResponse({"error": str(e)}, status=500)


def generar_excel_horarios(horarios_data):
    """Genera un Excel con los horarios proporcionados"""
    try:
        return _descarga(exportaciones.excel_horario_individual(horarios_data), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'horarios.xlsx')
    except Exception as e:
        import traceback
        print(f"ERROR en generar_excel_horarios: {str(e)}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        return JsonResponse({"error": str(e)}, status=500)


def list_horarios_extendidos_usuario(usuario_id):
    """Obtiene los horarios extendidos para un usuario específico (docente o estudiante)"""
    try:
        from django.contrib.auth.models import User
        import traceback

        usuario = User.objects.get(id=usuario_id)

        # Obtener el perfil del usuario para determinar si es docente o estudiante
        from usuarios.models import Perfil
        perfil = Perfil.objects.get(usuario=usuario)

        horarios = []

        if perfil.rol.nombre == 'docente':
            # Si es docente, obtener sus horarios
            from docentes.models import Docente
            try:
                docente = Docente.objects.get(usuario=usuario)
                items = Horario.objects.filter(docente=docente).select_related(
                    'grupo', 'asignatura', 'docente', 'espacio', 'grupo__programa'
                )
            except Docente.DoesNotExist:
                print(f"ADVERTENCIA: No se encontró Docente para usuario {usuario_id}", file=sys.stderr)
                items = []
        else:
            # Si es estudiante, obtener horarios de su grupo
            from estudiantes.models import Estudiante
            try:
                estudiante = Estudiante.objects.get(usuario=usuario)
                items = Horario.objects.filter(grupo=estudiante.grupo).select_related(
                    'grupo', 'asignatura', 'docente', 'espacio', 'grupo__programa'
                )
            except Estudiante.DoesNotExist:
                print(f"ADVERTENCIA: No se encontró Estudiante para usuario {usuario_id}", file=sys.stderr)
                items = []

        for i in items:
            horarios.append({
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

        return horarios

    except Exception as e:
        import traceback
        print(f"ERROR en list_horarios_extendidos_usuario: {str(e)}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        return []
