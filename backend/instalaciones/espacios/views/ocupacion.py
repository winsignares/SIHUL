"""Reporte de ocupación y su PDF semanal."""
import json
from .. import reportes, reportes_pdf
from ..models import EspacioFisico
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from ..api.filtros import _filtrar_espacios_por_sede_usuario
from ._comun import _descarga_pdf, _estado_horario_param


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
