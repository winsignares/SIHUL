from . import reportes, reportes_pdf
from .models import EspacioFisico
from horario.models import Horario
from django.http import FileResponse, JsonResponse
from io import BytesIO
import json
from django.views.decorators.csrf import csrf_exempt
from datetime import time

from .api_views import _filtrar_espacios_por_sede_usuario


def _descarga_pdf(contenido, nombre):
    response = FileResponse(BytesIO(contenido), as_attachment=True, filename=nombre)
    response['Content-Type'] = 'application/pdf'
    return response


def _env_bool_param(value):
    return str(value).strip().lower() in {'1', 'true', 'yes', 'on', 'si', 'sí'}


def _estado_horario_param(request, data=None):
    if data is not None:
        estado = data.get('estado_horario') or data.get('estadoHorario')
        include_pending = bool(data.get('include_pending') or data.get('includePending'))
    else:
        estado = request.GET.get('estado_horario') or request.GET.get('estadoHorario')
        include_pending = _env_bool_param(request.GET.get('include_pending') or request.GET.get('includePending'))

    if estado:
        return str(estado).strip().lower()
    return 'todos' if include_pending else 'aprobado'


@csrf_exempt
def list_espacios_disponibles_por_horario(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Solo se permite GET"}, status=405)

    dia_semana = request.GET.get('dia_semana')
    hora_inicio_raw = request.GET.get('hora_inicio')
    hora_fin_raw = request.GET.get('hora_fin')
    horario_id = request.GET.get('horario_id')

    if not dia_semana or not hora_inicio_raw or not hora_fin_raw:
        return JsonResponse({"error": "dia_semana, hora_inicio y hora_fin son requeridos"}, status=400)

    try:
        hora_inicio = time.fromisoformat(hora_inicio_raw)
        hora_fin = time.fromisoformat(hora_fin_raw)
    except ValueError:
        return JsonResponse({"error": "Formato de hora inválido"}, status=400)

    espacios_qs = EspacioFisico.objects.select_related('sede', 'tipo').filter(estado='Disponible')

    espacios_qs = _filtrar_espacios_por_sede_usuario(request, espacios_qs)

    horarios_conflicto = Horario.objects.filter(
        estado='aprobado',
        dia_semana__iexact=dia_semana,
        hora_inicio__lt=hora_fin,
        hora_fin__gt=hora_inicio,
    )

    if horario_id:
        try:
            horarios_conflicto = horarios_conflicto.exclude(id=int(horario_id))
        except (TypeError, ValueError):
            return JsonResponse({"error": "horario_id inválido"}, status=400)

    espacios_ocupados = horarios_conflicto.values_list('espacio_id', flat=True)
    espacios_disponibles = espacios_qs.exclude(id__in=espacios_ocupados)

    lst = []
    for espacio in espacios_disponibles:
        sede = espacio.sede
        seccional = sede.seccional if sede else None
        lst.append({
            "id": espacio.id,
            "nombre": espacio.nombre,
            "tipo": espacio.tipo.nombre if espacio.tipo else "Sin tipo",
            "capacidad": espacio.capacidad,
            "sede_id": sede.id if sede else None,
            "sede_nombre": sede.nombre if sede else "Sin sede",
            "sede_seccional_id": seccional.id if seccional else None,
            "sede_seccional_ciudad": seccional.ciudad if seccional else None,
            "ubicacion": espacio.ubicacion,
            "estado": espacio.estado,
            "esta_abierto": espacio.esta_abierto,
        })

    return JsonResponse({"espacios": lst}, status=200)


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
        data = json.loads(request.body) if request.body else {}
        tipo_espacio_id = data.get('tipo_espacio_id')
        semana_offset = int(data.get('semana_offset', 0))
        lunes, sabado = reportes.semana(semana_offset)

        # Obtener espacios filtrados
        espacios_query = EspacioFisico.objects.all().select_related('tipo', 'sede')
        espacios_query = _filtrar_espacios_por_sede_usuario(request, espacios_query)
        if tipo_espacio_id:
            espacios_query = espacios_query.filter(tipo_id=tipo_espacio_id)

        detalles_espacios = reportes.detalle_ocupacion_semanal(espacios_query, lunes, sabado)

        contenido = reportes_pdf.ocupacion_semanal(detalles_espacios, lunes, sabado, semana_offset)
        return _descarga_pdf(contenido, f'ocupacion-semanal-{lunes.isoformat()}.pdf')
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


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
        estado_horario = _estado_horario_param(request)
        
        lunes, sabado = reportes.semana(semana_offset)
        
        # Obtener todos los espacios
        espacios = EspacioFisico.objects.all().select_related('tipo', 'sede')
        espacios = _filtrar_espacios_por_sede_usuario(request, espacios)
        
        if not espacios.exists():
            return JsonResponse({
                "periodo": "2025-1",
                "semana_inicio": lunes.isoformat(),
                "semana_fin": sabado.isoformat(),
                "ocupacion_por_jornada": [],
                "espacios_mas_usados": []
            }, status=200)
        
        datos_reporte = reportes.preparar_datos(espacios, lunes, sabado, estado_horario)

        # ======== OCUPACIÓN POR JORNADA ========
        ocupacion_por_jornada = reportes.ocupacion_por_jornada(
            espacios, lunes, sabado, estado_horario, datos_reporte
        )
        
        # ======== ESPACIOS MÁS USADOS ========
        espacios_mas_usados = reportes.espacios_mas_usados(
            espacios, lunes, sabado, estado_horario, datos_reporte
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
        data = json.loads(request.body) if request.body else {}
        semana_offset = int(data.get('semana_offset', 0))
        estado_horario = _estado_horario_param(request, data)
        tipo_espacio_id = data.get('tipo_espacio_id')
        espacios_nombres = data.get('espacios')
        lunes, sabado = reportes.semana(semana_offset)

        espacios_qs = EspacioFisico.objects.all().select_related('tipo', 'sede')
        espacios_qs = _filtrar_espacios_por_sede_usuario(request, espacios_qs)

        if isinstance(espacios_nombres, list) and len(espacios_nombres) > 0:
            espacios_qs = espacios_qs.filter(nombre__in=espacios_nombres)
        elif tipo_espacio_id:
            espacios_qs = espacios_qs.filter(tipo_id=tipo_espacio_id)

        datos_reporte = reportes.preparar_datos(espacios_qs, lunes, sabado, estado_horario)
        ocupacion_por_jornada = reportes.ocupacion_por_jornada(
            espacios_qs, lunes, sabado, estado_horario, datos_reporte
        )
        espacios_mas_usados = reportes.espacios_mas_usados(
            espacios_qs, lunes, sabado, estado_horario, datos_reporte
        )

        contenido = reportes_pdf.ocupacion(ocupacion_por_jornada, espacios_mas_usados, lunes, sabado)
        return _descarga_pdf(contenido, f'reporte-ocupacion-{lunes.isoformat()}.pdf')
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
        estado_horario = _estado_horario_param(request)
        
        lunes, sabado = reportes.semana(semana_offset)
        
        # Obtener todos los espacios
        espacios = EspacioFisico.objects.all().select_related('tipo', 'sede')
        espacios = _filtrar_espacios_por_sede_usuario(request, espacios)
        
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
        disponibilidad, resumen = reportes.disponibilidad(
            espacios, lunes, sabado, estado_horario
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
        estado_horario = _estado_horario_param(request)
        
        lunes, sabado = reportes.semana(semana_offset)
        
        # Obtener todos los espacios
        espacios = EspacioFisico.objects.all().select_related('tipo', 'sede')
        espacios = _filtrar_espacios_por_sede_usuario(request, espacios)
        
        if not espacios.exists():
            return JsonResponse({
                "periodo": "2025-1",
                "semana_inicio": lunes.isoformat(),
                "semana_fin": sabado.isoformat(),
                "capacidad": []
            }, status=200)
        
        # ======== CÁLCULO DE CAPACIDAD ========
        capacidad = reportes.capacidad(
            espacios, lunes, sabado, estado_horario
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
        data = json.loads(request.body) if request.body else {}
        semana_offset = int(data.get('semana_offset', 0))
        estado_horario = _estado_horario_param(request, data)
        lunes, sabado = reportes.semana(semana_offset)

        espacios = EspacioFisico.objects.all().select_related('tipo', 'sede')
        espacios = _filtrar_espacios_por_sede_usuario(request, espacios)
        disponibilidad, resumen = reportes.disponibilidad(espacios, lunes, sabado, estado_horario)

        contenido = reportes_pdf.disponibilidad(disponibilidad, resumen, lunes, sabado)
        return _descarga_pdf(contenido, f'reporte-disponibilidad-{lunes.isoformat()}.pdf')
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
        data = json.loads(request.body) if request.body else {}
        semana_offset = int(data.get('semana_offset', 0))
        estado_horario = _estado_horario_param(request, data)
        lunes, sabado = reportes.semana(semana_offset)

        espacios = EspacioFisico.objects.all().select_related('tipo', 'sede')
        espacios = _filtrar_espacios_por_sede_usuario(request, espacios)
        capacidad = reportes.capacidad(espacios, lunes, sabado, estado_horario)

        contenido = reportes_pdf.capacidad(capacidad, lunes, sabado)
        return _descarga_pdf(contenido, f'reporte-capacidad-{lunes.isoformat()}.pdf')
    except Exception as e:
        import traceback
        error_msg = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Error en generar_pdf_reporte_capacidad: {error_msg}")
        return JsonResponse({"error": str(e)}, status=500)


