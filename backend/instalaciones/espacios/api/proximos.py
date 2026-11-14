from datetime import datetime
from django.http import JsonResponse
from nucleo.vistas import VistaJson
from ..models import EspacioFisico, EspacioPermitido
from academico.horario.models import Horario
from instalaciones.prestamos.models import PrestamoEspacio
from identidad.usuarios.models import Usuario
from nucleo.auth_helpers import (
    get_user_seccional_id, ve_todas_las_seccionales,
    user_supervisa_espacios,
)
from nucleo.auth_helpers import respuesta_sin_seccional as _missing_seccional_response
from .filtros import _filtrar_espacios_por_sede_usuario, get_dia_semana_actual


class ProximosAperturaCierreView(VistaJson):
    def get(self, request):

        try:
            usuario_id = request.session.get('user_id') or request.COOKIES.get('user_id') or request.GET.get('user_id')

            if not usuario_id:
                return JsonResponse(
                    {
                        'error': 'Usuario no autenticado. Por favor inicia sesión.',
                        'espacios': [],
                        'horaActual': datetime.now().strftime('%H:%M'),
                        'diaActual': get_dia_semana_actual(),
                        'fechaActual': datetime.now().date().strftime('%Y-%m-%d'),
                    },
                    status=200,
                )

            ahora = datetime.now()
            hora_actual = ahora.time()
            fecha_actual = ahora.date()
            dia_actual = get_dia_semana_actual()

            try:
                usuario = Usuario.objects.select_related('rol', 'sede', 'sede__seccional').get(id=usuario_id)
            except Usuario.DoesNotExist:
                return JsonResponse({'error': 'Usuario no encontrado'}, status=404)

            if not ve_todas_las_seccionales(usuario) and not get_user_seccional_id(usuario):
                return _missing_seccional_response()

            if user_supervisa_espacios(usuario):
                espacios_permitidos = EspacioPermitido.objects.filter(usuario_id=usuario_id).select_related(
                    'espacio', 'espacio__sede', 'espacio__tipo'
                )

                espacios_permitidos = espacios_permitidos.filter(espacio__estado='Disponible')
                if getattr(usuario, 'sede_id', None):
                    espacios_permitidos = espacios_permitidos.filter(espacio__sede_id=usuario.sede_id)

                if not espacios_permitidos.exists():
                    return JsonResponse(
                        {
                            'espacios': [],
                            'horaActual': hora_actual.strftime('%H:%M'),
                            'diaActual': dia_actual,
                            'fechaActual': fecha_actual.strftime('%Y-%m-%d'),
                        },
                        status=200,
                    )

                espacios_ids = [ep.espacio.id for ep in espacios_permitidos]
                espacios_map = {ep.espacio.id: ep.espacio for ep in espacios_permitidos}
            else:
                espacios_qs = _filtrar_espacios_por_sede_usuario(
                    request,
                    EspacioFisico.objects.select_related('sede', 'tipo')
                )
                espacios_qs = espacios_qs.filter(estado='Disponible')
                espacios = list(espacios_qs)
                if not espacios:
                    return JsonResponse(
                        {
                            'espacios': [],
                            'horaActual': hora_actual.strftime('%H:%M'),
                            'diaActual': dia_actual,
                            'fechaActual': fecha_actual.strftime('%Y-%m-%d'),
                        },
                        status=200,
                    )

                espacios_ids = [espacio.id for espacio in espacios]
                espacios_map = {espacio.id: espacio for espacio in espacios}
            espacios_data = {
                espacio.id: {
                    'idEspacio': espacio.id,
                    'nombreEspacio': espacio.nombre,
                    'sede': espacio.sede.nombre if espacio.sede else 'Sin sede',
                    'piso': espacio.ubicacion or 'No especificado',
                    'esta_abierto': espacio.esta_abierto,
                    'estadoActual': espacio.estado,
                    'horarios': [],
                }
                for espacio in espacios_map.values()
            }

            horarios = Horario.objects.filter(
                espacio_id__in=espacios_ids,
                dia_semana=dia_actual,
                estado='aprobado',
            ).select_related('espacio', 'espacio__sede', 'espacio__tipo', 'asignatura', 'docente')

            for horario in horarios:
                espacio = espacios_map.get(horario.espacio.id)
                if not espacio:
                    continue

                datetime_inicio = datetime.combine(fecha_actual, horario.hora_inicio)
                segundos_hasta_inicio = int((datetime_inicio - ahora).total_seconds())
                datetime_fin = datetime.combine(fecha_actual, horario.hora_fin)
                segundos_hasta_fin = int((datetime_fin - ahora).total_seconds())

                proxima_accion = None
                tiempo_restante_segundos = None
                minutos_restantes = 0
                segundos_restantes = 0

                if segundos_hasta_inicio > 0:
                    proxima_accion = 'apertura'
                    tiempo_restante_segundos = segundos_hasta_inicio
                    minutos_restantes = segundos_hasta_inicio // 60
                    segundos_restantes = segundos_hasta_inicio % 60
                elif segundos_hasta_fin > 0:
                    proxima_accion = 'cierre'
                    tiempo_restante_segundos = segundos_hasta_fin
                    minutos_restantes = segundos_hasta_fin // 60
                    segundos_restantes = segundos_hasta_fin % 60
                else:
                    # Mantener bloques ya terminados para que frontend calcule
                    # ventana de cierre (+10 min desde la clase/prestamo anterior).
                    proxima_accion = 'cierre'
                    tiempo_restante_segundos = 0
                    minutos_restantes = 0
                    segundos_restantes = 0

                if proxima_accion is not None:
                    espacios_data[espacio.id]['horarios'].append(
                        {
                            'tipoUso': 'Clase',
                            'asignatura': horario.asignatura.nombre if horario.asignatura else 'Sin asignatura',
                            'docente': horario.docente.nombre if horario.docente else 'Sin docente',
                            'horaInicio': horario.hora_inicio.strftime('%H:%M'),
                            'horaFin': horario.hora_fin.strftime('%H:%M'),
                            'diaSemana': dia_actual,
                            'proximaAccion': proxima_accion,
                            'minutosRestantes': minutos_restantes,
                            'segundosRestantes': segundos_restantes,
                            'tiempoRestanteTotal': tiempo_restante_segundos,
                        }
                    )

            prestamos = PrestamoEspacio.objects.filter(
                espacio_id__in=espacios_ids,
                fecha=fecha_actual,
                estado='Aprobado',
            ).select_related('espacio', 'espacio__sede', 'espacio__tipo', 'usuario', 'tipo_actividad')

            for prestamo in prestamos:
                espacio = espacios_map.get(prestamo.espacio.id)
                if not espacio:
                    continue

                datetime_inicio = datetime.combine(fecha_actual, prestamo.hora_inicio)
                segundos_hasta_inicio = int((datetime_inicio - ahora).total_seconds())
                datetime_fin = datetime.combine(fecha_actual, prestamo.hora_fin)
                segundos_hasta_fin = int((datetime_fin - ahora).total_seconds())

                proxima_accion = None
                tiempo_restante_segundos = None
                minutos_restantes = 0
                segundos_restantes = 0

                if segundos_hasta_inicio > 0:
                    proxima_accion = 'apertura'
                    tiempo_restante_segundos = segundos_hasta_inicio
                    minutos_restantes = segundos_hasta_inicio // 60
                    segundos_restantes = segundos_hasta_inicio % 60
                elif segundos_hasta_fin > 0:
                    proxima_accion = 'cierre'
                    tiempo_restante_segundos = segundos_hasta_fin
                    minutos_restantes = segundos_hasta_fin // 60
                    segundos_restantes = segundos_hasta_fin % 60
                else:
                    # Mantener bloques ya terminados para que frontend calcule
                    # ventana de cierre (+10 min desde la clase/prestamo anterior).
                    proxima_accion = 'cierre'
                    tiempo_restante_segundos = 0
                    minutos_restantes = 0
                    segundos_restantes = 0

                if proxima_accion is not None:
                    espacios_data[espacio.id]['horarios'].append(
                        {
                            'tipoUso': 'Préstamo',
                            'tipoActividad': prestamo.tipo_actividad.nombre if prestamo.tipo_actividad else 'Sin especificar',
                            'solicitante': prestamo.usuario.nombre if prestamo.usuario else 'Sin solicitante',
                            'horaInicio': prestamo.hora_inicio.strftime('%H:%M'),
                            'horaFin': prestamo.hora_fin.strftime('%H:%M'),
                            'fecha': prestamo.fecha.strftime('%Y-%m-%d'),
                            'proximaAccion': proxima_accion,
                            'minutosRestantes': minutos_restantes,
                            'segundosRestantes': segundos_restantes,
                            'tiempoRestanteTotal': tiempo_restante_segundos,
                        }
                    )

            espacios_list = list(espacios_data.values())
            for espacio in espacios_list:
                espacio['horarios'].sort(key=lambda x: x['tiempoRestanteTotal'])
            espacios_list.sort(key=lambda x: x['horarios'][0]['tiempoRestanteTotal'] if x['horarios'] else float('inf'))

            return JsonResponse(
                {
                    'espacios': espacios_list,
                    'horaActual': hora_actual.strftime('%H:%M'),
                    'diaActual': dia_actual,
                    'fechaActual': fecha_actual.strftime('%Y-%m-%d'),
                },
                status=200,
            )
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
