import datetime
import json
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from nucleo.vistas import VistaJson
from notificaciones.signals import crear_notificacion
from identidad.usuarios.models import Usuario
from instalaciones.espacios.models import EspacioFisico
from ..models import Horario, SolicitudEspacio
from nucleo.auth_helpers import respuesta_sin_seccional as _missing_seccional_response
from .acceso import _get_authenticated_seccional_scope


class AsignarEspacioHorarioView(VistaJson):
    def post(self, request):

        try:
            data = json.loads(request.body)
            horario_id = data.get('horario_id')
            espacio_id = data.get('espacio_id')

            if not horario_id or not espacio_id:
                return JsonResponse({'error': 'horario_id y espacio_id son requeridos'}, status=400)

            horario = Horario.objects.select_related(
                'grupo',
                'grupo__programa',
                'grupo__programa__facultad',
                'grupo__programa__facultad__sede',
                'espacio',
                'espacio__sede',
            ).get(id=horario_id)
            espacio = EspacioFisico.objects.select_related('sede').get(id=espacio_id)

            espacio_seccional_id = espacio.sede.seccional_id if espacio.sede else None

            horario_sede = None
            if horario.espacio and horario.espacio.sede:
                horario_sede = horario.espacio.sede
            else:
                grupo = horario.grupo
                programa = grupo.programa if grupo else None
                facultad = programa.facultad if programa else None
                horario_sede = facultad.sede if facultad else None

            horario_seccional_id = horario_sede.seccional_id if horario_sede else None

            if horario_seccional_id and espacio_seccional_id and horario_seccional_id != espacio_seccional_id:
                return JsonResponse({'error': 'El espacio no pertenece a la misma seccional del horario.'}, status=400)

            seccional_scope_id, is_superuser = _get_authenticated_seccional_scope(request)
            if not is_superuser:
                if not seccional_scope_id:
                    return _missing_seccional_response()
                if espacio_seccional_id and seccional_scope_id != espacio_seccional_id:
                    return JsonResponse({'error': 'El espacio no pertenece a la seccional del usuario.'}, status=403)
                if horario_seccional_id and seccional_scope_id != horario_seccional_id:
                    return JsonResponse({'error': 'El horario no pertenece a la seccional del usuario.'}, status=403)

            horario.espacio = espacio
            horario.save()

            return JsonResponse(
                {
                    'message': 'Espacio asignado correctamente',
                    'horario_id': horario.id,
                    'espacio_id': espacio.id,
                    'espacio_nombre': espacio.nombre,
                },
                status=200,
            )
        except ValidationError as e:
            return JsonResponse({'error': str(e.message)}, status=400)
        except Horario.DoesNotExist:
            return JsonResponse({'error': 'Horario no encontrado'}, status=404)
        except EspacioFisico.DoesNotExist:
            return JsonResponse({'error': 'Espacio no encontrado'}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'JSON inválido'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)


class AprobarSolicitudEspacioView(VistaJson):
    def post(self, request):

        try:
            data = json.loads(request.body)
            solicitud_id = data.get('solicitud_id')
            admin_id = data.get('admin_id')
            comentario = data.get('comentario', '')

            if not solicitud_id or not admin_id:
                return JsonResponse({'error': 'solicitud_id y admin_id son requeridos'}, status=400)

            solicitud = SolicitudEspacio.objects.get(id=solicitud_id)
            admin = Usuario.objects.get(id=admin_id)

            if solicitud.horario_generado:
                solicitud.horario_generado.delete()
                solicitud.horario_generado = None

            horario = Horario(
                grupo=solicitud.grupo,
                asignatura=solicitud.asignatura,
                docente=solicitud.docente,
                espacio=solicitud.espacio_solicitado,
                dia_semana=solicitud.dia_semana,
                hora_inicio=solicitud.hora_inicio,
                hora_fin=solicitud.hora_fin,
                cantidad_estudiantes=solicitud.cantidad_estudiantes,
                estado='aprobado',
            )
            horario.save()

            solicitud.estado = 'aprobada'
            solicitud.horario_generado = horario
            solicitud.aprobado_por = admin
            solicitud.fecha_aprobacion = datetime.datetime.now()
            solicitud.comentario = comentario
            solicitud.save()

            if solicitud.planificador:
                crear_notificacion(
                    id_usuario=solicitud.planificador.id,
                    tipo='solicitud_aprobada',
                    mensaje=f'✅ Tu solicitud de espacio para {solicitud.asignatura.nombre} - Grupo {solicitud.grupo.nombre} ha sido aprobada',
                    prioridad='alta',
                )

            return JsonResponse({'message': 'Solicitud aprobada y horario creado', 'solicitud_id': solicitud.id, 'horario_id': horario.id}, status=200)
        except ValidationError as e:
            return JsonResponse({'error': str(e.message)}, status=400)
        except SolicitudEspacio.DoesNotExist:
            return JsonResponse({'error': 'Solicitud no encontrada'}, status=404)
        except Usuario.DoesNotExist:
            return JsonResponse({'error': 'Admin no encontrado'}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'JSON inválido'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)


class RechazarSolicitudEspacioView(VistaJson):
    def post(self, request):

        try:
            data = json.loads(request.body)
            solicitud_id = data.get('solicitud_id')
            admin_id = data.get('admin_id')
            comentario = data.get('comentario', '')

            if not solicitud_id or not admin_id:
                return JsonResponse({'error': 'solicitud_id y admin_id son requeridos'}, status=400)

            solicitud = SolicitudEspacio.objects.get(id=solicitud_id)
            admin = Usuario.objects.get(id=admin_id)

            if solicitud.horario_generado:
                solicitud.horario_generado.delete()
                solicitud.horario_generado = None

            solicitud.estado = 'rechazada'
            solicitud.aprobado_por = admin
            solicitud.fecha_aprobacion = datetime.datetime.now()
            solicitud.comentario = comentario
            solicitud.save()

            if solicitud.planificador:
                mensaje_rechazo = (
                    f'❌ Tu solicitud de espacio para {solicitud.asignatura.nombre} - Grupo {solicitud.grupo.nombre} ha sido rechazada'
                )
                if comentario:
                    mensaje_rechazo += f'\n\n📋 Motivo:\n{comentario}'

                crear_notificacion(
                    id_usuario=solicitud.planificador.id,
                    tipo='solicitud_rechazada',
                    mensaje=mensaje_rechazo,
                    prioridad='alta',
                )

            return JsonResponse({'message': 'Solicitud rechazada', 'solicitud_id': solicitud.id}, status=200)
        except SolicitudEspacio.DoesNotExist:
            return JsonResponse({'error': 'Solicitud no encontrada'}, status=404)
        except Usuario.DoesNotExist:
            return JsonResponse({'error': 'Admin no encontrado'}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'JSON inválido'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
