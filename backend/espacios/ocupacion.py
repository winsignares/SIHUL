"""
Carga de la ocupación de una semana: horarios y préstamos de varios espacios en dos consultas.

Reemplaza las consultas que se hacían por cada espacio y cada día, con las mismas reglas:
- horarios con estado 'aprobado' cuyo día coincide sin importar mayúsculas (`iexact`) con el nombre
  principal del día; si ese día no tiene ninguno, los que coincidan con el nombre alterno;
- préstamos con estado 'Aprobado' cuya fecha es la del día.

La coincidencia del día se resuelve en la base con el mismo `iexact` de antes, así no cambia cómo se
comparan mayúsculas y tildes.
"""
from collections import defaultdict

from django.db.models import BooleanField, Case, Q, Value, When

from horario.models import Horario
from prestamos.models import PrestamoEspacio


def cargar_semana(espacios_ids, dias):
    """
    `dias`: lista de (fecha, nombre_principal, nombre_alterno) en el orden en que se recorren.

    Devuelve `{espacio_id: [(fecha, horarios, prestamos), ...]}` con una entrada por cada día de `dias`.
    """
    espacios_ids = list(espacios_ids)
    if not espacios_ids or not dias:
        return {}

    nombres = list(dict.fromkeys(nombre for _, principal, alterno in dias for nombre in (principal, alterno)))
    # Una marca por nombre: un horario cuenta para cada nombre con el que coincide, igual que con una
    # consulta por día.
    marcas = {
        f'coincide_{i}': Case(When(dia_semana__iexact=nombre, then=Value(True)), default=Value(False), output_field=BooleanField())
        for i, nombre in enumerate(nombres)
    }
    algun_dia = Q()
    for nombre in nombres:
        algun_dia |= Q(dia_semana__iexact=nombre)
    horarios = (
        Horario.objects
        .filter(algun_dia, espacio_id__in=espacios_ids, estado='aprobado')
        .annotate(**marcas)
        .only('id', 'espacio', 'hora_inicio', 'hora_fin')
        .order_by('id')
    )
    horarios_por_espacio_nombre = defaultdict(list)
    for horario in horarios:
        for i, nombre in enumerate(nombres):
            if getattr(horario, f'coincide_{i}'):
                horarios_por_espacio_nombre[(horario.espacio_id, nombre)].append(horario)

    fechas = [fecha for fecha, _, _ in dias]
    prestamos = (
        PrestamoEspacio.objects
        .filter(espacio_id__in=espacios_ids, fecha__in=fechas, estado='Aprobado')
        .only('id', 'espacio', 'fecha', 'hora_inicio', 'hora_fin')
        .order_by('id')
    )
    prestamos_por_espacio_fecha = defaultdict(list)
    for prestamo in prestamos:
        prestamos_por_espacio_fecha[(prestamo.espacio_id, prestamo.fecha)].append(prestamo)

    semana = {}
    for espacio_id in espacios_ids:
        semana[espacio_id] = [
            (
                fecha,
                horarios_por_espacio_nombre.get((espacio_id, principal))
                or horarios_por_espacio_nombre.get((espacio_id, alterno), []),
                prestamos_por_espacio_fecha.get((espacio_id, fecha), []),
            )
            for fecha, principal, alterno in dias
        ]
    return semana
