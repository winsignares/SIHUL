from datetime import datetime
from django.db.models import Q
from ..models import EspacioFisico
from nucleo.auth_helpers import (
    get_user_seccional_id, ve_todas_las_seccionales,
)



def _filtrar_horarios_por_rango_fecha(request, queryset):
    """Filtra un queryset de Horario por fecha_inicio dentro del rango
    ?fecha_inicio=YYYY-MM-DD&fecha_fin=YYYY-MM-DD si ambos vienen en la
    request. Los horarios sin fecha_inicio (manuales o aun no sincronizados
    con Oracle) siempre se incluyen, igual que en el filtro equivalente del
    frontend (ver useConsultaEspacios.ts). Sin ambos parametros, no filtra
    (comportamiento previo, usado por otras pantallas que listan horarios
    completos)."""
    fecha_inicio = request.GET.get('fecha_inicio')
    fecha_fin = request.GET.get('fecha_fin')
    if not fecha_inicio or not fecha_fin:
        return queryset
    return queryset.filter(
        Q(fecha_inicio__isnull=True) | Q(fecha_inicio__gte=fecha_inicio, fecha_inicio__lte=fecha_fin)
    )


def _filtrar_espacios_por_sede_usuario(request, queryset):
    user = getattr(request, 'user_obj', None)
    if not user:
        return queryset

    if ve_todas_las_seccionales(user):
        return queryset

    seccional_id = get_user_seccional_id(user)
    if seccional_id:
        return queryset.filter(sede__seccional_id=seccional_id)

    return queryset.none()


def _usuario_sin_seccional(request):
    user = getattr(request, 'user_obj', None)
    return bool(user and not ve_todas_las_seccionales(user) and not get_user_seccional_id(user))


def _usuario_puede_acceder_espacio(request, espacio_id):
    user = getattr(request, 'user_obj', None)
    if not user or ve_todas_las_seccionales(user):
        return True

    seccional_id = get_user_seccional_id(user)
    if not seccional_id:
        return False

    return EspacioFisico.objects.filter(id=espacio_id, sede__seccional_id=seccional_id).exists()


def get_dia_semana_actual():
    dias = {
        0: 'Lunes',
        1: 'Martes',
        2: 'Miércoles',
        3: 'Jueves',
        4: 'Viernes',
        5: 'Sábado',
        6: 'Domingo',
    }
    return dias[datetime.now().weekday()]
