"""Reporte de disponibilidad y su PDF."""
import json
from ... import reportes
from ... import reportes_pdf
from ...models import EspacioFisico
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from ..filtros import _filtrar_espacios_por_sede_usuario
from ._comun import _descarga_pdf, _estado_horario_param


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
