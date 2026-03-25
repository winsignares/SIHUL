from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from django.db import transaction
from .models import PrestamoEspacio, PrestamoEspacioPublico, TipoActividad, PrestamoRecurso
from espacios.models import EspacioFisico
from usuarios.models import Usuario
from recursos.models import Recurso
from horario.models import Horario
import json
import datetime
import uuid
import calendar

# ========== Helper Functions ==========

def check_espacio_disponible(espacio_id, fecha, hora_inicio, hora_fin, prestamo_id=None, es_publico=False):
    """
    Verifica si un espacio está disponible en la fecha y horas especificadas
    Valida contra préstamos autenticados, públicos y horarios académicos
    Returns: (bool, str) - (is_available, error_message)
    """
    try:
        # Convertir strings a objetos date y time si es necesario
        if isinstance(fecha, str):
            fecha = datetime.date.fromisoformat(fecha)
        if isinstance(hora_inicio, str):
            hora_inicio = datetime.time.fromisoformat(hora_inicio)
        if isinstance(hora_fin, str):
            hora_fin = datetime.time.fromisoformat(hora_fin)
        
        # 1. Validar contra Préstamos de usuarios autenticados
        prestamos_conflicto = PrestamoEspacio.objects.filter(
            espacio_id=espacio_id,
            fecha=fecha,
            estado__in=['Pendiente', 'Aprobado']  # Solo préstamos activos
        )
        
        # Si estamos actualizando un préstamo autenticado, excluirlo
        if not es_publico and prestamo_id:
            prestamos_conflicto = prestamos_conflicto.exclude(id=prestamo_id)
        
        prestamos_conflicto = prestamos_conflicto.filter(
            # Verificar solapamiento de horarios
            Q(hora_inicio__lt=hora_fin, hora_fin__gt=hora_inicio)
        )
        
        if prestamos_conflicto.exists():
            conflicto = prestamos_conflicto.first()
            return False, f"El espacio ya está reservado de {conflicto.hora_inicio} a {conflicto.hora_fin} para el mismo día (Préstamo Usuario)"
        
        # 2. Validar contra Préstamos públicos
        prestamos_publicos_conflicto = PrestamoEspacioPublico.objects.filter(
            espacio_id=espacio_id,
            fecha=fecha,
            estado__in=['Pendiente', 'Aprobado']
        )
        
        # Si estamos actualizando un préstamo público, excluirlo
        if es_publico and prestamo_id:
            prestamos_publicos_conflicto = prestamos_publicos_conflicto.exclude(id=prestamo_id)
        
        prestamos_publicos_conflicto = prestamos_publicos_conflicto.filter(
            Q(hora_inicio__lt=hora_fin, hora_fin__gt=hora_inicio)
        )
        
        if prestamos_publicos_conflicto.exists():
            conflicto = prestamos_publicos_conflicto.first()
            return False, f"El espacio ya está reservado de {conflicto.hora_inicio} a {conflicto.hora_fin} para el mismo día (Préstamo Público)"

        # 3. Validar contra Horarios Académicos
        dias_semana = {
            0: 'Lunes', 1: 'Martes', 2: 'Miércoles', 3: 'Jueves', 
            4: 'Viernes', 5: 'Sábado', 6: 'Domingo'
        }
        dia_nombre = dias_semana[fecha.weekday()]
        
        horarios_conflicto = Horario.objects.filter(
            espacio_id=espacio_id,
            dia_semana__iexact=dia_nombre, # Case insensitive por seguridad
            hora_inicio__lt=hora_fin,
            hora_fin__gt=hora_inicio,
            estado='aprobado'
        )
        
        if horarios_conflicto.exists():
            conflicto = horarios_conflicto.first()
            return False, f"El espacio está ocupado por clase de {conflicto.asignatura.nombre} ({conflicto.hora_inicio} - {conflicto.hora_fin})"
        
        return True, ""
    except Exception as e:
        return False, f"Error al validar disponibilidad: {str(e)}"


def _parse_recurrencia(data, fecha_base):
    es_recurrente = bool(data.get('es_recurrente', False))
    frecuencia = (data.get('frecuencia') or 'none').lower().strip()

    if not es_recurrente:
        return {
            'es_recurrente': False,
            'frecuencia': 'none',
            'intervalo': 1,
            'dias_semana': [],
            'fin_repeticion_tipo': 'never',
            'fin_repeticion_fecha': None,
            'fin_repeticion_ocurrencias': None,
        }

    if frecuencia not in ['daily', 'weekly', 'monthly', 'yearly', 'weekdays']:
        raise ValueError('frecuencia inválida para préstamo recurrente')

    intervalo = data.get('intervalo', 1)
    try:
        intervalo = int(intervalo)
    except (TypeError, ValueError):
        raise ValueError('intervalo debe ser un entero >= 1')
    if intervalo < 1:
        raise ValueError('intervalo debe ser >= 1')

    dias_semana = data.get('dias_semana', [])
    if frecuencia == 'weekly':
        if not dias_semana or not isinstance(dias_semana, list):
            raise ValueError('dias_semana es obligatorio para frecuencia weekly')
        dias_semana = sorted(set(int(d) for d in dias_semana))
        if any(d < 0 or d > 6 for d in dias_semana):
            raise ValueError('dias_semana debe contener valores entre 0 y 6')
    else:
        dias_semana = []

    fin_tipo = (data.get('fin_repeticion_tipo') or 'never').lower().strip()
    if fin_tipo not in ['never', 'until_date', 'count']:
        raise ValueError('fin_repeticion_tipo inválido')

    fin_fecha = None
    fin_ocurrencias = None

    if fin_tipo == 'until_date':
        fin_repeticion_fecha = data.get('fin_repeticion_fecha')
        if not fin_repeticion_fecha:
            raise ValueError('fin_repeticion_fecha es obligatoria cuando fin_repeticion_tipo=until_date')
        fin_fecha = datetime.date.fromisoformat(fin_repeticion_fecha)
        if fin_fecha < fecha_base:
            raise ValueError('fin_repeticion_fecha no puede ser menor a la fecha inicial')

    if fin_tipo == 'count':
        fin_repeticion_ocurrencias = data.get('fin_repeticion_ocurrencias')
        if fin_repeticion_ocurrencias is None:
            raise ValueError('fin_repeticion_ocurrencias es obligatoria cuando fin_repeticion_tipo=count')
        try:
            fin_ocurrencias = int(fin_repeticion_ocurrencias)
        except (TypeError, ValueError):
            raise ValueError('fin_repeticion_ocurrencias debe ser un entero >= 1')
        if fin_ocurrencias < 1:
            raise ValueError('fin_repeticion_ocurrencias debe ser >= 1')

    return {
        'es_recurrente': True,
        'frecuencia': frecuencia,
        'intervalo': intervalo,
        'dias_semana': dias_semana,
        'fin_repeticion_tipo': fin_tipo,
        'fin_repeticion_fecha': fin_fecha,
        'fin_repeticion_ocurrencias': fin_ocurrencias,
    }


def _add_months(base_date, months):
    month_idx = base_date.month - 1 + months
    year = base_date.year + month_idx // 12
    month = month_idx % 12 + 1
    last_day = calendar.monthrange(year, month)[1]
    return datetime.date(year, month, min(base_date.day, last_day))


def _add_years(base_date, years):
    try:
        return datetime.date(base_date.year + years, base_date.month, base_date.day)
    except ValueError:
        return datetime.date(base_date.year + years, 2, 28)


def _generar_fechas_ocurrencias(fecha_base, recurrencia):
    if not recurrencia['es_recurrente']:
        return [fecha_base]

    frecuencia = recurrencia['frecuencia']
    intervalo = recurrencia['intervalo']
    fin_tipo = recurrencia['fin_repeticion_tipo']
    fin_fecha = recurrencia['fin_repeticion_fecha']
    fin_ocurrencias = recurrencia['fin_repeticion_ocurrencias']
    dias_semana = recurrencia['dias_semana']

    if fin_tipo == 'count':
        max_items = min(fin_ocurrencias, 365)
    elif fin_tipo == 'until_date':
        max_items = 365
    else:
        max_items = 90

    fechas = []

    if frecuencia == 'daily':
        cursor = fecha_base
        while len(fechas) < max_items:
            if fin_tipo == 'until_date' and cursor > fin_fecha:
                break
            fechas.append(cursor)
            cursor += datetime.timedelta(days=intervalo)

    elif frecuencia == 'weekly':
        cursor = fecha_base
        lunes_base = fecha_base - datetime.timedelta(days=fecha_base.weekday())
        while len(fechas) < max_items:
            if fin_tipo == 'until_date' and cursor > fin_fecha:
                break
            lunes_actual = cursor - datetime.timedelta(days=cursor.weekday())
            delta_semanas = (lunes_actual - lunes_base).days // 7
            if delta_semanas % intervalo == 0 and cursor.weekday() in dias_semana:
                fechas.append(cursor)
            cursor += datetime.timedelta(days=1)

    elif frecuencia == 'monthly':
        cursor = fecha_base
        while len(fechas) < max_items:
            if fin_tipo == 'until_date' and cursor > fin_fecha:
                break
            fechas.append(cursor)
            cursor = _add_months(cursor, intervalo)

    elif frecuencia == 'yearly':
        cursor = fecha_base
        while len(fechas) < max_items:
            if fin_tipo == 'until_date' and cursor > fin_fecha:
                break
            fechas.append(cursor)
            cursor = _add_years(cursor, intervalo)

    elif frecuencia == 'weekdays':
        cursor = fecha_base
        while len(fechas) < max_items:
            if fin_tipo == 'until_date' and cursor > fin_fecha:
                break
            if cursor.weekday() < 5:
                fechas.append(cursor)
            cursor += datetime.timedelta(days=1)

    return sorted(set(fechas))


def _recurrencia_payload(prestamo):
    return {
        'es_recurrente': prestamo.es_recurrente,
        'frecuencia': prestamo.frecuencia,
        'intervalo': prestamo.intervalo,
        'dias_semana': prestamo.dias_semana or [],
        'fin_repeticion_tipo': prestamo.fin_repeticion_tipo,
        'fin_repeticion_fecha': str(prestamo.fin_repeticion_fecha) if prestamo.fin_repeticion_fecha else None,
        'fin_repeticion_ocurrencias': prestamo.fin_repeticion_ocurrencias,
        'serie_id': prestamo.serie_id,
        'es_ocurrencia_generada': prestamo.es_ocurrencia_generada,
        'prestamo_padre_id': prestamo.prestamo_padre_id,
    }

# ========== TipoActividad Views ==========

@csrf_exempt
def list_tipos_actividad(request):
    """Lista todos los tipos de actividad"""
    if request.method == 'GET':
        tipos = TipoActividad.objects.all()
        lst = [{
            "id": t.id,
            "nombre": t.nombre,
            "descripcion": t.descripcion
        } for t in tipos]
        return JsonResponse({"tipos_actividad": lst}, status=200)
    return JsonResponse({"error": "Método no permitido"}, status=405)

@csrf_exempt
def create_tipo_actividad(request):
    """Crea un nuevo tipo de actividad"""
    if request.method != 'POST':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        nombre = data.get('nombre')
        descripcion = data.get('descripcion', '')
        
        if not nombre:
            return JsonResponse({"error": "El nombre es requerido"}, status=400)
        
        tipo = TipoActividad(nombre=nombre, descripcion=descripcion)
        tipo.save()
        return JsonResponse({"message": "Tipo de actividad creado", "id": tipo.id}, status=201)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

# ========== PrestamoEspacio Views ==========

@csrf_exempt
def create_prestamo(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        espacio_id = data.get('espacio_id')
        usuario_id = data.get('usuario_id')
        administrador_id = data.get('administrador_id')
        tipo_actividad_id = data.get('tipo_actividad_id')
        fecha = data.get('fecha')
        hora_inicio = data.get('hora_inicio')
        hora_fin = data.get('hora_fin')
        motivo = data.get('motivo')
        asistentes = data.get('asistentes', 0)
        telefono = data.get('telefono', '')
        estado = data.get('estado', 'Pendiente')
        recursos = data.get('recursos', [])  # Array de {recurso_id, cantidad}
        
        # Validar campos requeridos
        if not all([espacio_id, tipo_actividad_id, fecha, hora_inicio, hora_fin]):
            return JsonResponse({
                "error": "espacio_id, tipo_actividad_id, fecha, hora_inicio y hora_fin son requeridos"
            }, status=400)
        
        # Obtener objetos relacionados
        espacio = EspacioFisico.objects.get(id=espacio_id)
        
        # Validar capacidad del espacio
        if asistentes > espacio.capacidad:
            return JsonResponse({
                "error": f"El número de asistentes ({asistentes}) excede la capacidad del espacio ({espacio.capacidad})"
            }, status=400)
        
        tipo_actividad = TipoActividad.objects.get(id=tipo_actividad_id)
        usuario = Usuario.objects.get(id=usuario_id) if usuario_id else None
        administrador = Usuario.objects.get(id=administrador_id) if administrador_id else None
        
        # Crear préstamo
        f = datetime.date.fromisoformat(fecha)
        hi = datetime.time.fromisoformat(hora_inicio)
        hf = datetime.time.fromisoformat(hora_fin)

        if hf <= hi:
            return JsonResponse({"error": "hora_fin debe ser mayor que hora_inicio"}, status=400)

        recurrencia = _parse_recurrencia(data, f)
        fechas_ocurrencias = _generar_fechas_ocurrencias(f, recurrencia)
        if not fechas_ocurrencias:
            return JsonResponse({"error": "No se generaron ocurrencias con la configuración enviada"}, status=400)

        # Validar disponibilidad para todas las ocurrencias antes de guardar
        for fecha_ocurrencia in fechas_ocurrencias:
            is_available, error_msg = check_espacio_disponible(espacio_id, fecha_ocurrencia, hi, hf)
            if not is_available:
                return JsonResponse({
                    "error": f"Conflicto en fecha {fecha_ocurrencia}: {error_msg}"
                }, status=409)

        serie_id = str(uuid.uuid4()) if recurrencia['es_recurrente'] else None

        with transaction.atomic():
            p = PrestamoEspacio(
                espacio=espacio,
                usuario=usuario,
                administrador=administrador,
                tipo_actividad=tipo_actividad,
                prestamo_padre=None,
                serie_id=serie_id,
                es_ocurrencia_generada=False,
                es_recurrente=recurrencia['es_recurrente'],
                frecuencia=recurrencia['frecuencia'],
                intervalo=recurrencia['intervalo'],
                dias_semana=recurrencia['dias_semana'],
                fin_repeticion_tipo=recurrencia['fin_repeticion_tipo'],
                fin_repeticion_fecha=recurrencia['fin_repeticion_fecha'],
                fin_repeticion_ocurrencias=recurrencia['fin_repeticion_ocurrencias'],
                fecha=f,
                hora_inicio=hi,
                hora_fin=hf,
                motivo=motivo,
                asistentes=asistentes,
                telefono=telefono,
                estado=estado
            )
            p.save()

            # Crear relaciones con recursos del préstamo base
            for recurso_data in recursos:
                recurso_id = recurso_data.get('recurso_id')
                cantidad = recurso_data.get('cantidad', 1)
                if recurso_id:
                    recurso = Recurso.objects.get(id=recurso_id)
                    PrestamoRecurso.objects.create(
                        prestamo=p,
                        recurso=recurso,
                        cantidad=cantidad
                    )

            # Crear ocurrencias hijas para fechas distintas a la fecha base
            ocurrencias_creadas = 1
            for fecha_ocurrencia in fechas_ocurrencias:
                if fecha_ocurrencia == f:
                    continue

                hijo = PrestamoEspacio.objects.create(
                    espacio=espacio,
                    usuario=usuario,
                    administrador=administrador,
                    tipo_actividad=tipo_actividad,
                    prestamo_padre=p,
                    serie_id=serie_id,
                    es_ocurrencia_generada=True,
                    es_recurrente=recurrencia['es_recurrente'],
                    frecuencia=recurrencia['frecuencia'],
                    intervalo=recurrencia['intervalo'],
                    dias_semana=recurrencia['dias_semana'],
                    fin_repeticion_tipo=recurrencia['fin_repeticion_tipo'],
                    fin_repeticion_fecha=recurrencia['fin_repeticion_fecha'],
                    fin_repeticion_ocurrencias=recurrencia['fin_repeticion_ocurrencias'],
                    fecha=fecha_ocurrencia,
                    hora_inicio=hi,
                    hora_fin=hf,
                    motivo=motivo,
                    asistentes=asistentes,
                    telefono=telefono,
                    estado=estado
                )
                for recurso_data in recursos:
                    recurso_id = recurso_data.get('recurso_id')
                    cantidad = recurso_data.get('cantidad', 1)
                    if recurso_id:
                        recurso = Recurso.objects.get(id=recurso_id)
                        PrestamoRecurso.objects.create(
                            prestamo=hijo,
                            recurso=recurso,
                            cantidad=cantidad
                        )
                ocurrencias_creadas += 1

        return JsonResponse({
            "message": "Prestamo creado",
            "id": p.id,
            "serie_id": p.serie_id,
            "es_recurrente": p.es_recurrente,
            "ocurrencias_creadas": ocurrencias_creadas
        }, status=201)
        
    except EspacioFisico.DoesNotExist:
        return JsonResponse({"error": "Espacio no encontrado."}, status=404)
    except TipoActividad.DoesNotExist:
        return JsonResponse({"error": "Tipo de actividad no encontrado."}, status=404)
    except Usuario.DoesNotExist:
        return JsonResponse({"error": "Usuario no encontrado."}, status=404)
    except Recurso.DoesNotExist:
        return JsonResponse({"error": "Recurso no encontrado."}, status=404)
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
        actualizar_serie = bool(data.get('actualizar_serie', False))

        # Actualización de toda la serie solo desde el préstamo base
        if actualizar_serie and p.es_recurrente and p.prestamo_padre is None:
            with transaction.atomic():
                if 'espacio_id' in data:
                    p.espacio = EspacioFisico.objects.get(id=data.get('espacio_id'))
                if 'usuario_id' in data:
                    p.usuario = Usuario.objects.get(id=data.get('usuario_id')) if data.get('usuario_id') else None
                if 'administrador_id' in data:
                    p.administrador = Usuario.objects.get(id=data.get('administrador_id')) if data.get('administrador_id') else None
                if 'tipo_actividad_id' in data:
                    p.tipo_actividad = TipoActividad.objects.get(id=data.get('tipo_actividad_id'))
                if 'fecha' in data:
                    p.fecha = datetime.date.fromisoformat(data.get('fecha'))
                if 'hora_inicio' in data:
                    p.hora_inicio = datetime.time.fromisoformat(data.get('hora_inicio'))
                if 'hora_fin' in data:
                    p.hora_fin = datetime.time.fromisoformat(data.get('hora_fin'))
                if p.hora_fin <= p.hora_inicio:
                    return JsonResponse({"error": "hora_fin debe ser mayor que hora_inicio"}, status=400)
                if 'motivo' in data:
                    p.motivo = data.get('motivo')
                if 'asistentes' in data:
                    p.asistentes = data.get('asistentes')
                if 'telefono' in data:
                    p.telefono = data.get('telefono')
                if 'estado' in data:
                    p.estado = data.get('estado')

                recurrencia_input = {
                    'es_recurrente': data.get('es_recurrente', p.es_recurrente),
                    'frecuencia': data.get('frecuencia', p.frecuencia),
                    'intervalo': data.get('intervalo', p.intervalo),
                    'dias_semana': data.get('dias_semana', p.dias_semana),
                    'fin_repeticion_tipo': data.get('fin_repeticion_tipo', p.fin_repeticion_tipo),
                    'fin_repeticion_fecha': data.get('fin_repeticion_fecha', str(p.fin_repeticion_fecha) if p.fin_repeticion_fecha else None),
                    'fin_repeticion_ocurrencias': data.get('fin_repeticion_ocurrencias', p.fin_repeticion_ocurrencias),
                }
                recurrencia = _parse_recurrencia(recurrencia_input, p.fecha)

                p.es_recurrente = recurrencia['es_recurrente']
                p.frecuencia = recurrencia['frecuencia']
                p.intervalo = recurrencia['intervalo']
                p.dias_semana = recurrencia['dias_semana']
                p.fin_repeticion_tipo = recurrencia['fin_repeticion_tipo']
                p.fin_repeticion_fecha = recurrencia['fin_repeticion_fecha']
                p.fin_repeticion_ocurrencias = recurrencia['fin_repeticion_ocurrencias']

                if p.asistentes > p.espacio.capacidad:
                    return JsonResponse({
                        "error": f"El número de asistentes ({p.asistentes}) excede la capacidad del espacio ({p.espacio.capacidad})"
                    }, status=400)

                fechas_ocurrencias = _generar_fechas_ocurrencias(p.fecha, recurrencia)

                # Borrar ocurrencias hijas actuales para regenerar serie
                p.ocurrencias_generadas.all().delete()

                # Validar disponibilidad del padre
                ok, err = check_espacio_disponible(p.espacio.id, p.fecha, p.hora_inicio, p.hora_fin, prestamo_id=p.id)
                if not ok:
                    return JsonResponse({"error": f"Conflicto en fecha {p.fecha}: {err}"}, status=409)

                # Validar disponibilidad de nuevas ocurrencias
                for fecha_ocurrencia in fechas_ocurrencias:
                    if fecha_ocurrencia == p.fecha:
                        continue
                    ok, err = check_espacio_disponible(p.espacio.id, fecha_ocurrencia, p.hora_inicio, p.hora_fin)
                    if not ok:
                        return JsonResponse({"error": f"Conflicto en fecha {fecha_ocurrencia}: {err}"}, status=409)

                p.save()

                recursos_payload = data.get('recursos')
                if recursos_payload is not None:
                    p.prestamo_recursos.all().delete()
                    for recurso_data in recursos_payload:
                        recurso_id = recurso_data.get('recurso_id')
                        cantidad = recurso_data.get('cantidad', 1)
                        if recurso_id:
                            recurso = Recurso.objects.get(id=recurso_id)
                            PrestamoRecurso.objects.create(prestamo=p, recurso=recurso, cantidad=cantidad)
                else:
                    recursos_payload = [{
                        'recurso_id': rr.recurso_id,
                        'cantidad': rr.cantidad
                    } for rr in p.prestamo_recursos.all()]

                for fecha_ocurrencia in fechas_ocurrencias:
                    if fecha_ocurrencia == p.fecha:
                        continue
                    hijo = PrestamoEspacio.objects.create(
                        espacio=p.espacio,
                        usuario=p.usuario,
                        administrador=p.administrador,
                        tipo_actividad=p.tipo_actividad,
                        prestamo_padre=p,
                        serie_id=p.serie_id,
                        es_ocurrencia_generada=True,
                        es_recurrente=p.es_recurrente,
                        frecuencia=p.frecuencia,
                        intervalo=p.intervalo,
                        dias_semana=p.dias_semana,
                        fin_repeticion_tipo=p.fin_repeticion_tipo,
                        fin_repeticion_fecha=p.fin_repeticion_fecha,
                        fin_repeticion_ocurrencias=p.fin_repeticion_ocurrencias,
                        fecha=fecha_ocurrencia,
                        hora_inicio=p.hora_inicio,
                        hora_fin=p.hora_fin,
                        motivo=p.motivo,
                        asistentes=p.asistentes,
                        telefono=p.telefono,
                        estado=p.estado,
                    )
                    for recurso_data in recursos_payload:
                        recurso_id = recurso_data.get('recurso_id')
                        cantidad = recurso_data.get('cantidad', 1)
                        if recurso_id:
                            recurso = Recurso.objects.get(id=recurso_id)
                            PrestamoRecurso.objects.create(prestamo=hijo, recurso=recurso, cantidad=cantidad)

            return JsonResponse({"message": "Prestamo actualizado", "id": p.id, "actualizacion": "serie"}, status=200)

        # Actualización individual (comportamiento actual)
        espacio_id = data.get('espacio_id', p.espacio.id)
        fecha = data.get('fecha', str(p.fecha))
        hora_inicio = data.get('hora_inicio', str(p.hora_inicio))
        hora_fin = data.get('hora_fin', str(p.hora_fin))

        if datetime.time.fromisoformat(hora_fin) <= datetime.time.fromisoformat(hora_inicio):
            return JsonResponse({"error": "hora_fin debe ser mayor que hora_inicio"}, status=400)

        is_available, error_msg = check_espacio_disponible(
            espacio_id, fecha, hora_inicio, hora_fin, prestamo_id=id
        )
        if not is_available:
            return JsonResponse({"error": error_msg}, status=409)

        if 'espacio_id' in data:
            p.espacio = EspacioFisico.objects.get(id=data.get('espacio_id'))
        if 'usuario_id' in data:
            p.usuario = Usuario.objects.get(id=data.get('usuario_id')) if data.get('usuario_id') else None
        if 'administrador_id' in data:
            p.administrador = Usuario.objects.get(id=data.get('administrador_id')) if data.get('administrador_id') else None
        if 'tipo_actividad_id' in data:
            p.tipo_actividad = TipoActividad.objects.get(id=data.get('tipo_actividad_id'))
        if 'fecha' in data:
            p.fecha = datetime.date.fromisoformat(data.get('fecha'))
        if 'hora_inicio' in data:
            p.hora_inicio = datetime.time.fromisoformat(data.get('hora_inicio'))
        if 'hora_fin' in data:
            p.hora_fin = datetime.time.fromisoformat(data.get('hora_fin'))
        if 'motivo' in data:
            p.motivo = data.get('motivo')
        if 'asistentes' in data:
            p.asistentes = data.get('asistentes')
        if 'telefono' in data:
            p.telefono = data.get('telefono')
        if 'estado' in data:
            p.estado = data.get('estado')

        if p.asistentes > p.espacio.capacidad:
            return JsonResponse({
                "error": f"El número de asistentes ({p.asistentes}) excede la capacidad del espacio ({p.espacio.capacidad})"
            }, status=400)

        if 'es_recurrente' in data:
            p.es_recurrente = bool(data.get('es_recurrente'))
        if 'frecuencia' in data:
            p.frecuencia = data.get('frecuencia')
        if 'intervalo' in data:
            p.intervalo = int(data.get('intervalo'))
        if 'dias_semana' in data:
            p.dias_semana = data.get('dias_semana') or []
        if 'fin_repeticion_tipo' in data:
            p.fin_repeticion_tipo = data.get('fin_repeticion_tipo')
        if 'fin_repeticion_fecha' in data:
            p.fin_repeticion_fecha = datetime.date.fromisoformat(data.get('fin_repeticion_fecha')) if data.get('fin_repeticion_fecha') else None
        if 'fin_repeticion_ocurrencias' in data:
            p.fin_repeticion_ocurrencias = int(data.get('fin_repeticion_ocurrencias')) if data.get('fin_repeticion_ocurrencias') else None

        if 'recursos' in data:
            p.prestamo_recursos.all().delete()
            for recurso_data in data.get('recursos', []):
                recurso_id = recurso_data.get('recurso_id')
                cantidad = recurso_data.get('cantidad', 1)
                if recurso_id:
                    recurso = Recurso.objects.get(id=recurso_id)
                    PrestamoRecurso.objects.create(prestamo=p, recurso=recurso, cantidad=cantidad)

        p.save()
        return JsonResponse({"message": "Prestamo actualizado", "id": p.id}, status=200)
    except PrestamoEspacio.DoesNotExist:
        return JsonResponse({"error": "Prestamo no encontrado."}, status=404)
    except (EspacioFisico.DoesNotExist, Usuario.DoesNotExist, TipoActividad.DoesNotExist):
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
        eliminar_serie = bool(data.get('eliminar_serie', True))

        if p.prestamo_padre_id:
            p.delete()
            return JsonResponse({"message": "Prestamo eliminado", "eliminacion": "ocurrencia"}, status=200)

        if p.es_recurrente and p.ocurrencias_generadas.exists():
            if eliminar_serie:
                with transaction.atomic():
                    p.ocurrencias_generadas.all().delete()
                    p.delete()
                return JsonResponse({"message": "Prestamo eliminado", "eliminacion": "serie"}, status=200)
            return JsonResponse({"error": "Este préstamo es base de una serie. Envíe eliminar_serie=true para eliminar toda la serie."}, status=400)

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
        user_sede = getattr(request, 'sede', None)
        if user_sede:
            p = PrestamoEspacio.objects.select_related(
                'espacio', 'usuario', 'administrador', 'tipo_actividad', 'prestamo_padre'
            ).prefetch_related('prestamo_recursos__recurso', 'ocurrencias_generadas').get(
                id=id,
                espacio__sede__ciudad=user_sede.ciudad
            )
        else:
            p = PrestamoEspacio.objects.select_related(
                'espacio', 'usuario', 'administrador', 'tipo_actividad', 'prestamo_padre'
            ).prefetch_related('prestamo_recursos__recurso', 'ocurrencias_generadas').get(id=id)
        
        
        # Obtener recursos asociados
        recursos = [{
            "recurso_id": pr.recurso.id,
            "recurso_nombre": pr.recurso.nombre,
            "cantidad": pr.cantidad
        } for pr in p.prestamo_recursos.all()]
        
        response = {
            "id": p.id,
            "espacio_id": p.espacio.id,
            "espacio_nombre": p.espacio.nombre,
            "espacio_tipo": p.espacio.tipo.nombre,
            "usuario_id": (p.usuario.id if p.usuario else None),
            "usuario_nombre": (p.usuario.nombre if p.usuario else None),
            "usuario_correo": (p.usuario.correo if p.usuario else None),
            "administrador_id": (p.administrador.id if p.administrador else None),
            "administrador_nombre": (p.administrador.nombre if p.administrador else None),
            "tipo_actividad_id": p.tipo_actividad.id,
            "tipo_actividad_nombre": p.tipo_actividad.nombre,
            "fecha": str(p.fecha),
            "hora_inicio": str(p.hora_inicio),
            "hora_fin": str(p.hora_fin),
            "motivo": p.motivo,
            "asistentes": p.asistentes,
            "telefono": p.telefono,
            "estado": p.estado,
            "recursos": recursos
        }
        response.update(_recurrencia_payload(p))

        if p.prestamo_padre is None and p.es_recurrente:
            response["ocurrencias"] = [{
                "id": o.id,
                "fecha": str(o.fecha),
                "hora_inicio": str(o.hora_inicio),
                "hora_fin": str(o.hora_fin),
                "estado": o.estado,
                "es_ocurrencia_generada": o.es_ocurrencia_generada
            } for o in p.ocurrencias_generadas.all().order_by('fecha', 'hora_inicio')]

        return JsonResponse(response, status=200)
    except PrestamoEspacio.DoesNotExist:
        return JsonResponse({"error": "Prestamo no encontrado."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
def list_prestamos(request):
    """
    Lista préstamos de usuarios AUTENTICADOS solamente
    """
    if request.method == 'GET':
        # Obtener sede del usuario desde middleware
        user_sede = getattr(request, 'sede', None)
        
        include_ocurrencias = (request.GET.get('include_ocurrencias', 'false').lower() == 'true')

        # Filtrar prestamos por la misma ciudad de la sede del usuario (a través de espacio -> sede)
        if user_sede and user_sede.ciudad:
            items = PrestamoEspacio.objects.select_related(
                'espacio__sede', 'espacio', 'usuario', 'administrador', 'tipo_actividad', 'prestamo_padre'
            ).prefetch_related('prestamo_recursos__recurso').filter(
                espacio__sede__ciudad=user_sede.ciudad
            )
        else:
            items = PrestamoEspacio.objects.select_related(
                'espacio', 'usuario', 'administrador', 'tipo_actividad', 'prestamo_padre'
            ).prefetch_related('prestamo_recursos__recurso').all()

        if not include_ocurrencias:
            items = items.filter(prestamo_padre__isnull=True)
        
        lst = []
        for i in items:
            recursos = [{
                "recurso_id": pr.recurso.id,
                "recurso_nombre": pr.recurso.nombre,
                "cantidad": pr.cantidad
            } for pr in i.prestamo_recursos.all()]
            
            item = {
                "id": i.id,
                "espacio_id": i.espacio.id,
                "espacio_nombre": i.espacio.nombre,
                "espacio_tipo": i.espacio.tipo.nombre,
                "usuario_id": (i.usuario.id if i.usuario else None),
                "usuario_nombre": (i.usuario.nombre if i.usuario else None),
                "usuario_correo": (i.usuario.correo if i.usuario else None),
                "administrador_id": (i.administrador.id if i.administrador else None),
                "administrador_nombre": (i.administrador.nombre if i.administrador else None),
                "tipo_actividad_id": i.tipo_actividad.id,
                "tipo_actividad_nombre": i.tipo_actividad.nombre,
                "fecha": str(i.fecha),
                "hora_inicio": str(i.hora_inicio),
                "hora_fin": str(i.hora_fin),
                "motivo": i.motivo,
                "asistentes": i.asistentes,
                "telefono": i.telefono,
                "estado": i.estado,
                "recursos": recursos
            }
            item.update(_recurrencia_payload(i))
            lst.append(item)
        
        return JsonResponse({"prestamos": lst}, status=200)

def list_prestamos_todos_admin(request):
    """
    Lista TODOS los préstamos (autenticados y públicos) para el panel de administración
    Combina ambas tablas en una sola respuesta
    """
    if request.method == 'GET':
        user_sede = getattr(request, 'sede', None)
        lst = []
        
        # 1. Obtener préstamos de usuarios autenticados
        include_ocurrencias = (request.GET.get('include_ocurrencias', 'false').lower() == 'true')

        if user_sede and user_sede.ciudad:
            items_auth = PrestamoEspacio.objects.select_related(
                'espacio__sede', 'espacio', 'usuario', 'administrador', 'tipo_actividad', 'prestamo_padre'
            ).prefetch_related('prestamo_recursos__recurso').filter(
                espacio__sede__ciudad=user_sede.ciudad
            )
        else:
            items_auth = PrestamoEspacio.objects.select_related(
                'espacio', 'usuario', 'administrador', 'tipo_actividad', 'prestamo_padre'
            ).prefetch_related('prestamo_recursos__recurso').all()

        if not include_ocurrencias:
            items_auth = items_auth.filter(prestamo_padre__isnull=True)
        
        for i in items_auth:
            recursos = [{
                "recurso_id": pr.recurso.id,
                "recurso_nombre": pr.recurso.nombre,
                "cantidad": pr.cantidad
            } for pr in i.prestamo_recursos.all()]
            
            item = {
                "id": f"auth-{i.id}",  # ID único para evitar colisiones
                "id_real": i.id,  # ID original de la base de datos
                "tipo_prestamo": "autenticado",  # Para distinguir en frontend
                "espacio_id": i.espacio.id,
                "espacio_nombre": i.espacio.nombre,
                "espacio_tipo": i.espacio.tipo.nombre,
                "espacio_capacidad": i.espacio.capacidad,
                "usuario_id": i.usuario.id if i.usuario else None,
                "usuario_nombre": i.usuario.nombre if i.usuario else None,
                "usuario_correo": i.usuario.correo if i.usuario else None,
                "administrador_id": i.administrador.id if i.administrador else None,
                "administrador_nombre": i.administrador.nombre if i.administrador else None,
                "tipo_actividad_id": i.tipo_actividad.id,
                "tipo_actividad_nombre": i.tipo_actividad.nombre,
                "fecha": str(i.fecha),
                "hora_inicio": str(i.hora_inicio),
                "hora_fin": str(i.hora_fin),
                "motivo": i.motivo,
                "asistentes": i.asistentes,
                "telefono": i.telefono,
                "estado": i.estado,
                "recursos": recursos
            }
            item.update(_recurrencia_payload(i))
            lst.append(item)
        
        # 2. Obtener préstamos públicos
        if user_sede and user_sede.ciudad:
            items_public = PrestamoEspacioPublico.objects.select_related(
                'espacio__sede', 'espacio', 'administrador', 'tipo_actividad', 'prestamo_padre'
            ).filter(
                espacio__sede__ciudad=user_sede.ciudad
            )
        else:
            items_public = PrestamoEspacioPublico.objects.select_related(
                'espacio', 'administrador', 'tipo_actividad', 'prestamo_padre'
            ).all()

        if not include_ocurrencias:
            items_public = items_public.filter(prestamo_padre__isnull=True)
        
        for i in items_public:
            # PrestamoEspacioPublico no tiene recursos por ahora (simplificado)
            recursos = []
            
            item = {
                "id": f"public-{i.id}",  # ID único para evitar colisiones
                "id_real": i.id,  # ID original de la base de datos
                "tipo_prestamo": "publico",  # Para distinguir en frontend
                "espacio_id": i.espacio.id,
                "espacio_nombre": i.espacio.nombre,
                "espacio_tipo": i.espacio.tipo.nombre,
                "espacio_capacidad": i.espacio.capacidad,
                "usuario_id": None,  # No hay usuario autenticado
                "usuario_nombre": i.nombre_solicitante,
                "usuario_correo": i.correo_solicitante,
                "solicitante_publico_nombre": i.nombre_solicitante,
                "solicitante_publico_correo": i.correo_solicitante,
                "solicitante_publico_telefono": i.telefono_solicitante,
                "solicitante_publico_identificacion": i.identificacion_solicitante,
                "administrador_id": i.administrador.id if i.administrador else None,
                "administrador_nombre": i.administrador.nombre if i.administrador else None,
                "tipo_actividad_id": i.tipo_actividad.id,
                "tipo_actividad_nombre": i.tipo_actividad.nombre,
                "fecha": str(i.fecha),
                "hora_inicio": str(i.hora_inicio),
                "hora_fin": str(i.hora_fin),
                "motivo": i.motivo,
                "asistentes": i.asistentes,
                "telefono": i.telefono_solicitante,
                "estado": i.estado,
                "recursos": recursos
            }
            item.update(_recurrencia_payload(i))
            lst.append(item)
        
        # Ordenar por ID descendente (proxy de fecha de creación para mostrar los más recientes arriba)
        lst.sort(key=lambda x: x['id_real'], reverse=True)
        
        return JsonResponse({"prestamos": lst}, status=200)

def list_prestamos_by_user(request, usuario_id):
    """
    Lista todos los préstamos de un usuario específico
    """
    if request.method == 'GET':
        try:
            # Verificar que el usuario existe
            usuario = Usuario.objects.get(id=usuario_id)
            
            include_ocurrencias = (request.GET.get('include_ocurrencias', 'false').lower() == 'true')

            # Filtrar préstamos por usuario
            items = PrestamoEspacio.objects.select_related(
                'espacio', 'usuario', 'administrador', 'tipo_actividad', 'prestamo_padre'
            ).prefetch_related('prestamo_recursos__recurso').filter(
                usuario=usuario
            ).order_by('-fecha', '-hora_inicio')

            if not include_ocurrencias:
                items = items.filter(prestamo_padre__isnull=True)
            
            lst = []
            for i in items:
                recursos = [{
                    "recurso_id": pr.recurso.id,
                    "recurso_nombre": pr.recurso.nombre,
                    "cantidad": pr.cantidad
                } for pr in i.prestamo_recursos.all()]
                
                item = {
                    "id": i.id,
                    "espacio_id": i.espacio.id,
                    "espacio_nombre": i.espacio.nombre,
                    "espacio_tipo": i.espacio.tipo.nombre,
                    "usuario_id": i.usuario.id,
                    "usuario_nombre": i.usuario.nombre,
                    "usuario_correo": i.usuario.correo,
                    "administrador_id": (i.administrador.id if i.administrador else None),
                    "administrador_nombre": (i.administrador.nombre if i.administrador else None),
                    "tipo_actividad_id": i.tipo_actividad.id,
                    "tipo_actividad_nombre": i.tipo_actividad.nombre,
                    "fecha": str(i.fecha),
                    "hora_inicio": str(i.hora_inicio),
                    "hora_fin": str(i.hora_fin),
                    "motivo": i.motivo,
                    "asistentes": i.asistentes,
                    "telefono": i.telefono,
                    "estado": i.estado,
                    "recursos": recursos
                }
                item.update(_recurrencia_payload(i))
                lst.append(item)
            
            return JsonResponse({"prestamos": lst}, status=200)
        except Usuario.DoesNotExist:
            return JsonResponse({"error": "Usuario no encontrado."}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


# ========== ENDPOINTS PARA USUARIOS PÚBLICOS ==========

@csrf_exempt
def create_prestamo_publico(request):
    """
    Crea un préstamo para usuarios públicos (sin autenticación)
    Requiere datos personales en lugar de usuario_id
    """
    if request.method != 'POST':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        
        # Datos personales (en lugar de usuario_id)
        nombre_completo = data.get('nombre_completo')
        correo_institucional = data.get('correo_institucional')
        telefono = data.get('telefono')
        identificacion = data.get('identificacion')
        
        # Datos del préstamo
        espacio_id = data.get('espacio_id')
        tipo_actividad_id = data.get('tipo_actividad_id')
        fecha = data.get('fecha')
        hora_inicio = data.get('hora_inicio')
        hora_fin = data.get('hora_fin')
        motivo = data.get('motivo')
        asistentes = data.get('asistentes', 0)
        
        # Validar campos requeridos
        if not all([nombre_completo, correo_institucional, telefono, identificacion, 
                   espacio_id, tipo_actividad_id, fecha, hora_inicio, hora_fin, motivo]):
            return JsonResponse({
                "error": "Todos los campos son requeridos"
            }, status=400)
        
        # Validar correo institucional (debe terminar en el dominio de la universidad)
        dominios_validos = ['@unilibre.edu.co', '@unilibrepereira.edu.co']
        if not any(correo_institucional.endswith(dominio) for dominio in dominios_validos):
            return JsonResponse({
                "error": "El correo debe ser institucional (@unilibre.edu.co o @unilibrepereira.edu.co)"
            }, status=400)
        
        # Validar teléfono (solo números, 7-10 dígitos)
        telefono_limpio = telefono.replace(' ', '').replace('-', '')
        if not telefono_limpio.isdigit() or len(telefono_limpio) < 7 or len(telefono_limpio) > 10:
            return JsonResponse({
                "error": "El teléfono debe tener entre 7 y 10 dígitos"
            }, status=400)
        
        # Validar asistentes
        if asistentes < 1:
            return JsonResponse({
                "error": "El número de asistentes debe ser al menos 1"
            }, status=400)
        
        # Obtener objetos relacionados
        espacio = EspacioFisico.objects.get(id=espacio_id)
        
        # Validar capacidad del espacio
        if asistentes > espacio.capacidad:
            return JsonResponse({
                "error": f"El número de asistentes ({asistentes}) excede la capacidad del espacio ({espacio.capacidad})"
            }, status=400)
        
        tipo_actividad = TipoActividad.objects.get(id=tipo_actividad_id)
        
        # Convertir fecha y horas
        f = datetime.date.fromisoformat(fecha)
        hi = datetime.time.fromisoformat(hora_inicio)
        hf = datetime.time.fromisoformat(hora_fin)

        if hf <= hi:
            return JsonResponse({"error": "hora_fin debe ser mayor que hora_inicio"}, status=400)

        recurrencia = _parse_recurrencia(data, f)
        fechas_ocurrencias = _generar_fechas_ocurrencias(f, recurrencia)
        if not fechas_ocurrencias:
            return JsonResponse({"error": "No se generaron ocurrencias con la configuración enviada"}, status=400)

        for fecha_ocurrencia in fechas_ocurrencias:
            is_available, error_msg = check_espacio_disponible(espacio_id, fecha_ocurrencia, hi, hf, es_publico=True)
            if not is_available:
                return JsonResponse({
                    "error": f"Conflicto en fecha {fecha_ocurrencia}: {error_msg}"
                }, status=409)

        serie_id = str(uuid.uuid4()) if recurrencia['es_recurrente'] else None
        
        with transaction.atomic():
            # Crear préstamo base
            p = PrestamoEspacioPublico(
                espacio=espacio,
                nombre_solicitante=nombre_completo,
                correo_solicitante=correo_institucional,
                telefono_solicitante=telefono,
                identificacion_solicitante=identificacion,
                administrador=None,
                tipo_actividad=tipo_actividad,
                prestamo_padre=None,
                serie_id=serie_id,
                es_ocurrencia_generada=False,
                es_recurrente=recurrencia['es_recurrente'],
                frecuencia=recurrencia['frecuencia'],
                intervalo=recurrencia['intervalo'],
                dias_semana=recurrencia['dias_semana'],
                fin_repeticion_tipo=recurrencia['fin_repeticion_tipo'],
                fin_repeticion_fecha=recurrencia['fin_repeticion_fecha'],
                fin_repeticion_ocurrencias=recurrencia['fin_repeticion_ocurrencias'],
                fecha=f,
                hora_inicio=hi,
                hora_fin=hf,
                motivo=motivo,
                asistentes=asistentes,
                estado='Pendiente'
            )
            p.save()

            ocurrencias_creadas = 1
            for fecha_ocurrencia in fechas_ocurrencias:
                if fecha_ocurrencia == f:
                    continue
                PrestamoEspacioPublico.objects.create(
                    espacio=espacio,
                    nombre_solicitante=nombre_completo,
                    correo_solicitante=correo_institucional,
                    telefono_solicitante=telefono,
                    identificacion_solicitante=identificacion,
                    administrador=None,
                    tipo_actividad=tipo_actividad,
                    prestamo_padre=p,
                    serie_id=serie_id,
                    es_ocurrencia_generada=True,
                    es_recurrente=recurrencia['es_recurrente'],
                    frecuencia=recurrencia['frecuencia'],
                    intervalo=recurrencia['intervalo'],
                    dias_semana=recurrencia['dias_semana'],
                    fin_repeticion_tipo=recurrencia['fin_repeticion_tipo'],
                    fin_repeticion_fecha=recurrencia['fin_repeticion_fecha'],
                    fin_repeticion_ocurrencias=recurrencia['fin_repeticion_ocurrencias'],
                    fecha=fecha_ocurrencia,
                    hora_inicio=hi,
                    hora_fin=hf,
                    motivo=motivo,
                    asistentes=asistentes,
                    estado='Pendiente'
                )
                ocurrencias_creadas += 1
        
        return JsonResponse({
            "message": "Solicitud de préstamo enviada exitosamente. Recibirás una notificación al correo proporcionado.",
            "id": p.id,
            "serie_id": p.serie_id,
            "es_recurrente": p.es_recurrente,
            "ocurrencias_creadas": ocurrencias_creadas
        }, status=201)
        
    except EspacioFisico.DoesNotExist:
        return JsonResponse({"error": "Espacio no encontrado."}, status=404)
    except TipoActividad.DoesNotExist:
        return JsonResponse({"error": "Tipo de actividad no encontrado."}, status=404)
    except ValueError as e:
        return JsonResponse({"error": f"Formato de datos inválido: {str(e)}"}, status=400)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def list_espacios_disponibles_publico(request):
    """
    Lista espacios disponibles para una fecha y hora específica
    Filtrado por sede (opcional)
    """
    if request.method == 'GET':
        try:
            fecha = request.GET.get('fecha')
            hora_inicio = request.GET.get('hora_inicio')
            hora_fin = request.GET.get('hora_fin')
            sede_id = request.GET.get('sede_id')
            
            if not all([fecha, hora_inicio, hora_fin]):
                return JsonResponse({
                    "error": "fecha, hora_inicio y hora_fin son requeridos"
                }, status=400)
            
            # Obtener todos los espacios (opcionalmente filtrados por sede)
            espacios_query = EspacioFisico.objects.select_related('tipo', 'sede')
            if sede_id:
                espacios_query = espacios_query.filter(sede_id=sede_id)
            
            espacios_disponibles = []
            
            for espacio in espacios_query:
                is_available, _ = check_espacio_disponible(
                    espacio.id, fecha, hora_inicio, hora_fin
                )
                
                if is_available:
                    espacios_disponibles.append({
                        "id": espacio.id,
                        "nombre": espacio.nombre,
                        "capacidad": espacio.capacidad,
                        "tipo": espacio.tipo.nombre,
                        "sede": espacio.sede.nombre,
                        "sede_id": espacio.sede.id,
                        "ubicacion": espacio.ubicacion
                    })
            
            return JsonResponse({
                "espacios": espacios_disponibles,
                "total": len(espacios_disponibles)
            }, status=200)
            
        except ValueError as e:
            return JsonResponse({"error": f"Formato inválido: {str(e)}"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)


@csrf_exempt
def list_prestamos_publicos(request):
    """
    Lista todos los préstamos públicos.
    Respeta el alcance de sede/ciudad del usuario cuando aplica middleware de sede.
    """
    if request.method != 'GET':
        return JsonResponse({"error": "Método no permitido"}, status=405)

    try:
        user_sede = getattr(request, 'sede', None)
        include_ocurrencias = (request.GET.get('include_ocurrencias', 'false').lower() == 'true')

        if user_sede and user_sede.ciudad:
            items = PrestamoEspacioPublico.objects.select_related(
                'espacio__sede', 'espacio', 'administrador', 'tipo_actividad', 'prestamo_padre'
            ).filter(
                espacio__sede__ciudad=user_sede.ciudad
            )
        else:
            items = PrestamoEspacioPublico.objects.select_related(
                'espacio', 'administrador', 'tipo_actividad', 'prestamo_padre'
            ).all()

        if not include_ocurrencias:
            items = items.filter(prestamo_padre__isnull=True)

        lst = []
        for i in items:
            item = {
                "id": i.id,
                "espacio_id": i.espacio.id,
                "espacio_nombre": i.espacio.nombre,
                "espacio_tipo": i.espacio.tipo.nombre,
                "usuario_id": None,
                "usuario_nombre": i.nombre_solicitante,
                "usuario_correo": i.correo_solicitante,
                "solicitante_publico_nombre": i.nombre_solicitante,
                "solicitante_publico_correo": i.correo_solicitante,
                "solicitante_publico_telefono": i.telefono_solicitante,
                "solicitante_publico_identificacion": i.identificacion_solicitante,
                "administrador_id": i.administrador.id if i.administrador else None,
                "administrador_nombre": i.administrador.nombre if i.administrador else None,
                "tipo_actividad_id": i.tipo_actividad.id,
                "tipo_actividad_nombre": i.tipo_actividad.nombre,
                "fecha": str(i.fecha),
                "hora_inicio": str(i.hora_inicio),
                "hora_fin": str(i.hora_fin),
                "motivo": i.motivo,
                "asistentes": i.asistentes,
                "telefono": i.telefono_solicitante,
                "estado": i.estado,
                "recursos": []
            }
            item.update(_recurrencia_payload(i))
            lst.append(item)

        return JsonResponse({"prestamos": lst}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def get_prestamo_publico(request, id=None):
    """
    Obtiene un préstamo público por ID
    """
    if id is None:
        return JsonResponse({"error": "El ID es requerido en la URL"}, status=400)
    try:
        p = PrestamoEspacioPublico.objects.select_related(
            'espacio', 'administrador', 'tipo_actividad', 'prestamo_padre'
        ).prefetch_related('ocurrencias_generadas_publicas').get(id=id)

        response = {
            "id": p.id,
            "espacio_id": p.espacio.id,
            "espacio_nombre": p.espacio.nombre,
            "espacio_tipo": p.espacio.tipo.nombre,
            "usuario_id": None,  # Público no tiene usuario
            "usuario_nombre": p.nombre_solicitante,
            "usuario_correo": p.correo_solicitante,
            "administrador_id": (p.administrador.id if p.administrador else None),
            "administrador_nombre": (p.administrador.nombre if p.administrador else None),
            "tipo_actividad_id": p.tipo_actividad.id,
            "tipo_actividad_nombre": p.tipo_actividad.nombre,
            "fecha": str(p.fecha),
            "hora_inicio": str(p.hora_inicio),
            "hora_fin": str(p.hora_fin),
            "motivo": p.motivo,
            "asistentes": p.asistentes,
            "telefono": p.telefono_solicitante,
            "estado": p.estado,
            "recursos": []  # Préstamos públicos no tienen recursos por ahora
        }
        response.update(_recurrencia_payload(p))

        if p.prestamo_padre is None and p.es_recurrente:
            response["ocurrencias"] = [{
                "id": o.id,
                "fecha": str(o.fecha),
                "hora_inicio": str(o.hora_inicio),
                "hora_fin": str(o.hora_fin),
                "estado": o.estado,
                "es_ocurrencia_generada": o.es_ocurrencia_generada
            } for o in p.ocurrencias_generadas_publicas.all().order_by('fecha', 'hora_inicio')]

        return JsonResponse(response, status=200)
    except PrestamoEspacioPublico.DoesNotExist:
        return JsonResponse({"error": "Prestamo público no encontrado."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def update_prestamo_publico(request):
    """
    Actualiza un préstamo público
    """
    if request.method != 'PUT':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        id = data.get('id')
        if not id:
            return JsonResponse({"error": "ID es requerido"}, status=400)
        
        p = PrestamoEspacioPublico.objects.get(id=id)
        actualizar_serie = bool(data.get('actualizar_serie', False))

        if actualizar_serie and p.es_recurrente and p.prestamo_padre is None:
            with transaction.atomic():
                if 'espacio_id' in data:
                    p.espacio = EspacioFisico.objects.get(id=data.get('espacio_id'))
                if 'nombre_solicitante' in data:
                    p.nombre_solicitante = data.get('nombre_solicitante')
                if 'correo_solicitante' in data:
                    p.correo_solicitante = data.get('correo_solicitante')
                if 'telefono_solicitante' in data or 'telefono' in data:
                    p.telefono_solicitante = data.get('telefono_solicitante') or data.get('telefono')
                if 'identificacion_solicitante' in data:
                    p.identificacion_solicitante = data.get('identificacion_solicitante')
                if 'administrador_id' in data:
                    p.administrador = Usuario.objects.get(id=data.get('administrador_id')) if data.get('administrador_id') else None
                if 'tipo_actividad_id' in data:
                    p.tipo_actividad = TipoActividad.objects.get(id=data.get('tipo_actividad_id'))
                if 'fecha' in data:
                    p.fecha = datetime.date.fromisoformat(data.get('fecha'))
                if 'hora_inicio' in data:
                    p.hora_inicio = datetime.time.fromisoformat(data.get('hora_inicio'))
                if 'hora_fin' in data:
                    p.hora_fin = datetime.time.fromisoformat(data.get('hora_fin'))
                if p.hora_fin <= p.hora_inicio:
                    return JsonResponse({"error": "hora_fin debe ser mayor que hora_inicio"}, status=400)
                if 'motivo' in data:
                    p.motivo = data.get('motivo')
                if 'asistentes' in data:
                    p.asistentes = data.get('asistentes')
                if 'estado' in data:
                    p.estado = data.get('estado')

                recurrencia_input = {
                    'es_recurrente': data.get('es_recurrente', p.es_recurrente),
                    'frecuencia': data.get('frecuencia', p.frecuencia),
                    'intervalo': data.get('intervalo', p.intervalo),
                    'dias_semana': data.get('dias_semana', p.dias_semana),
                    'fin_repeticion_tipo': data.get('fin_repeticion_tipo', p.fin_repeticion_tipo),
                    'fin_repeticion_fecha': data.get('fin_repeticion_fecha', str(p.fin_repeticion_fecha) if p.fin_repeticion_fecha else None),
                    'fin_repeticion_ocurrencias': data.get('fin_repeticion_ocurrencias', p.fin_repeticion_ocurrencias),
                }
                recurrencia = _parse_recurrencia(recurrencia_input, p.fecha)

                p.es_recurrente = recurrencia['es_recurrente']
                p.frecuencia = recurrencia['frecuencia']
                p.intervalo = recurrencia['intervalo']
                p.dias_semana = recurrencia['dias_semana']
                p.fin_repeticion_tipo = recurrencia['fin_repeticion_tipo']
                p.fin_repeticion_fecha = recurrencia['fin_repeticion_fecha']
                p.fin_repeticion_ocurrencias = recurrencia['fin_repeticion_ocurrencias']

                if p.asistentes > p.espacio.capacidad:
                    return JsonResponse({
                        "error": f"El número de asistentes ({p.asistentes}) excede la capacidad del espacio ({p.espacio.capacidad})"
                    }, status=400)

                fechas_ocurrencias = _generar_fechas_ocurrencias(p.fecha, recurrencia)

                p.ocurrencias_generadas_publicas.all().delete()

                ok, err = check_espacio_disponible(
                    p.espacio.id,
                    p.fecha,
                    p.hora_inicio,
                    p.hora_fin,
                    prestamo_id=p.id,
                    es_publico=True
                )
                if not ok:
                    return JsonResponse({"error": f"Conflicto en fecha {p.fecha}: {err}"}, status=409)

                for fecha_ocurrencia in fechas_ocurrencias:
                    if fecha_ocurrencia == p.fecha:
                        continue
                    ok, err = check_espacio_disponible(p.espacio.id, fecha_ocurrencia, p.hora_inicio, p.hora_fin, es_publico=True)
                    if not ok:
                        return JsonResponse({"error": f"Conflicto en fecha {fecha_ocurrencia}: {err}"}, status=409)

                p.save()

                for fecha_ocurrencia in fechas_ocurrencias:
                    if fecha_ocurrencia == p.fecha:
                        continue
                    PrestamoEspacioPublico.objects.create(
                        espacio=p.espacio,
                        nombre_solicitante=p.nombre_solicitante,
                        correo_solicitante=p.correo_solicitante,
                        telefono_solicitante=p.telefono_solicitante,
                        identificacion_solicitante=p.identificacion_solicitante,
                        administrador=p.administrador,
                        tipo_actividad=p.tipo_actividad,
                        prestamo_padre=p,
                        serie_id=p.serie_id,
                        es_ocurrencia_generada=True,
                        es_recurrente=p.es_recurrente,
                        frecuencia=p.frecuencia,
                        intervalo=p.intervalo,
                        dias_semana=p.dias_semana,
                        fin_repeticion_tipo=p.fin_repeticion_tipo,
                        fin_repeticion_fecha=p.fin_repeticion_fecha,
                        fin_repeticion_ocurrencias=p.fin_repeticion_ocurrencias,
                        fecha=fecha_ocurrencia,
                        hora_inicio=p.hora_inicio,
                        hora_fin=p.hora_fin,
                        motivo=p.motivo,
                        asistentes=p.asistentes,
                        estado=p.estado,
                    )

            return JsonResponse({"message": "Prestamo público actualizado exitosamente", "id": p.id, "actualizacion": "serie"}, status=200)

        espacio_id = data.get('espacio_id', p.espacio.id)
        fecha = data.get('fecha', str(p.fecha))
        hora_inicio = data.get('hora_inicio', str(p.hora_inicio))
        hora_fin = data.get('hora_fin', str(p.hora_fin))

        if datetime.time.fromisoformat(hora_fin) <= datetime.time.fromisoformat(hora_inicio):
            return JsonResponse({"error": "hora_fin debe ser mayor que hora_inicio"}, status=400)

        is_available, error_msg = check_espacio_disponible(
            espacio_id, fecha, hora_inicio, hora_fin, prestamo_id=id, es_publico=True
        )
        if not is_available:
            return JsonResponse({"error": error_msg}, status=409)

        if 'espacio_id' in data:
            p.espacio = EspacioFisico.objects.get(id=data.get('espacio_id'))
        if 'nombre_solicitante' in data:
            p.nombre_solicitante = data.get('nombre_solicitante')
        if 'correo_solicitante' in data:
            p.correo_solicitante = data.get('correo_solicitante')
        if 'telefono_solicitante' in data or 'telefono' in data:
            p.telefono_solicitante = data.get('telefono_solicitante') or data.get('telefono')
        if 'identificacion_solicitante' in data:
            p.identificacion_solicitante = data.get('identificacion_solicitante')
        if 'administrador_id' in data:
            p.administrador = Usuario.objects.get(id=data.get('administrador_id')) if data.get('administrador_id') else None
        if 'tipo_actividad_id' in data:
            p.tipo_actividad = TipoActividad.objects.get(id=data.get('tipo_actividad_id'))
        if 'fecha' in data:
            p.fecha = datetime.date.fromisoformat(data.get('fecha'))
        if 'hora_inicio' in data:
            p.hora_inicio = datetime.time.fromisoformat(data.get('hora_inicio'))
        if 'hora_fin' in data:
            p.hora_fin = datetime.time.fromisoformat(data.get('hora_fin'))
        if 'motivo' in data:
            p.motivo = data.get('motivo')
        if 'asistentes' in data:
            p.asistentes = data.get('asistentes')
        if 'estado' in data:
            p.estado = data.get('estado')

        if p.asistentes > p.espacio.capacidad:
            return JsonResponse({
                "error": f"El número de asistentes ({p.asistentes}) excede la capacidad del espacio ({p.espacio.capacidad})"
            }, status=400)

        if 'es_recurrente' in data:
            p.es_recurrente = bool(data.get('es_recurrente'))
        if 'frecuencia' in data:
            p.frecuencia = data.get('frecuencia')
        if 'intervalo' in data:
            p.intervalo = int(data.get('intervalo'))
        if 'dias_semana' in data:
            p.dias_semana = data.get('dias_semana') or []
        if 'fin_repeticion_tipo' in data:
            p.fin_repeticion_tipo = data.get('fin_repeticion_tipo')
        if 'fin_repeticion_fecha' in data:
            p.fin_repeticion_fecha = datetime.date.fromisoformat(data.get('fin_repeticion_fecha')) if data.get('fin_repeticion_fecha') else None
        if 'fin_repeticion_ocurrencias' in data:
            p.fin_repeticion_ocurrencias = int(data.get('fin_repeticion_ocurrencias')) if data.get('fin_repeticion_ocurrencias') else None

        p.save()

        return JsonResponse({
            "message": "Prestamo público actualizado exitosamente",
            "id": p.id
        }, status=200)
    except PrestamoEspacioPublico.DoesNotExist:
        return JsonResponse({"error": "Prestamo público no encontrado."}, status=404)
    except EspacioFisico.DoesNotExist:
        return JsonResponse({"error": "Espacio no encontrado."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def list_prestamos_publicos_by_identificacion(request):
    """
    Lista préstamos públicos por identificación y correo institucional.
    Permite que el solicitante público consulte sus solicitudes.
    """
    if request.method != 'GET':
        return JsonResponse({"error": "Método no permitido"}, status=405)

    try:
        identificacion = (request.GET.get('identificacion') or '').strip()
        correo = (request.GET.get('correo') or '').strip().lower()
        include_ocurrencias = (request.GET.get('include_ocurrencias', 'false').lower() == 'true')

        if not identificacion or not correo:
            return JsonResponse({
                "error": "identificacion y correo son requeridos"
            }, status=400)

        items = PrestamoEspacioPublico.objects.select_related(
            'espacio', 'administrador', 'tipo_actividad', 'prestamo_padre'
        ).filter(
            identificacion_solicitante=identificacion,
            correo_solicitante__iexact=correo
        ).order_by('-fecha', '-hora_inicio')

        if not include_ocurrencias:
            items = items.filter(prestamo_padre__isnull=True)

        lst = []
        for i in items:
            item = {
                "id": i.id,
                "espacio_id": i.espacio.id,
                "espacio_nombre": i.espacio.nombre,
                "espacio_tipo": i.espacio.tipo.nombre,
                "usuario_id": None,
                "usuario_nombre": i.nombre_solicitante,
                "usuario_correo": i.correo_solicitante,
                "administrador_id": i.administrador.id if i.administrador else None,
                "administrador_nombre": i.administrador.nombre if i.administrador else None,
                "tipo_actividad_id": i.tipo_actividad.id,
                "tipo_actividad_nombre": i.tipo_actividad.nombre,
                "fecha": str(i.fecha),
                "hora_inicio": str(i.hora_inicio),
                "hora_fin": str(i.hora_fin),
                "motivo": i.motivo,
                "asistentes": i.asistentes,
                "telefono": i.telefono_solicitante,
                "identificacion": i.identificacion_solicitante,
                "estado": i.estado,
                "recursos": []
            }
            item.update(_recurrencia_payload(i))
            lst.append(item)

        return JsonResponse({"prestamos": lst}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def delete_prestamo_publico(request):
    """
    Elimina un préstamo público. Si se envían identificación y correo,
    valida pertenencia del préstamo al solicitante.
    """
    if request.method != 'DELETE':
        return JsonResponse({"error": "Método no permitido"}, status=405)

    try:
        data = json.loads(request.body)
        prestamo_id = data.get('id')
        identificacion = (data.get('identificacion') or '').strip()
        correo = (data.get('correo') or '').strip().lower()

        if not prestamo_id:
            return JsonResponse({"error": "ID es requerido"}, status=400)

        p = PrestamoEspacioPublico.objects.get(id=prestamo_id)

        if identificacion and correo:
            if p.identificacion_solicitante != identificacion or p.correo_solicitante.lower() != correo:
                return JsonResponse({"error": "No autorizado para eliminar esta solicitud"}, status=403)

        eliminar_serie = bool(data.get('eliminar_serie', True))

        if p.prestamo_padre_id:
            p.delete()
            return JsonResponse({"message": "Prestamo público eliminado", "eliminacion": "ocurrencia"}, status=200)

        if p.es_recurrente and p.ocurrencias_generadas_publicas.exists():
            if eliminar_serie:
                with transaction.atomic():
                    p.ocurrencias_generadas_publicas.all().delete()
                    p.delete()
                return JsonResponse({"message": "Prestamo público eliminado", "eliminacion": "serie"}, status=200)
            return JsonResponse({"error": "Este préstamo es base de una serie. Envíe eliminar_serie=true para eliminar toda la serie."}, status=400)

        p.delete()
        return JsonResponse({"message": "Prestamo público eliminado"}, status=200)
    except PrestamoEspacioPublico.DoesNotExist:
        return JsonResponse({"error": "Prestamo público no encontrado."}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
