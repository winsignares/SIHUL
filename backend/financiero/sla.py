from __future__ import annotations

from datetime import date, timedelta
from typing import Dict, Iterable, Optional

from .models import Factura, ParametroSLA


_ALIAS_MAP = {
    'autorizacion rectoria': ['autorizacion de pago'],
    'pago aplicado': ['aplicacion de pago'],
    'comprobante de egreso': ['comprobante de egreso', 'generacion comprobante'],
    'envio a direccion financiera': ['envio a direccion financiera', 'direccion financiera', 'cargue formal'],
    'direccion financiera': ['direccion financiera', 'cargue formal', 'envio a direccion financiera'],
    'control de pago confirmado': ['aplicacion de pago', 'autorizacion de pago'],
    'tesoreria - ajustes internos': ['alistamiento'],
    'correccion direccion financiera': ['direccion financiera', 'cargue formal'],
    'devolucion': ['recepcion y registro', 'registro y recepcion'],
    'correccion funcionario': ['recepcion y registro', 'registro y recepcion'],
}


def normalize_text(value: str) -> str:
    return (
        str(value or '')
        .lower()
        .strip()
        .replace('á', 'a')
        .replace('é', 'e')
        .replace('í', 'i')
        .replace('ó', 'o')
        .replace('ú', 'u')
        .replace('ü', 'u')
        .replace('ñ', 'n')
    )


def build_parametros_sla_map() -> Dict[str, ParametroSLA]:
    parametros = ParametroSLA.objects.all()
    return {normalize_text(param.etapa): param for param in parametros}


def _resolve_parametro(etapa_actual: Optional[str], parametros_map: Dict[str, ParametroSLA]) -> Optional[ParametroSLA]:
    if not etapa_actual:
        return None
    etapa_key = normalize_text(etapa_actual)
    if etapa_key in parametros_map:
        return parametros_map[etapa_key]

    for alias in _ALIAS_MAP.get(etapa_key, []):
        alias_key = normalize_text(alias)
        if alias_key in parametros_map:
            return parametros_map[alias_key]

    for key, parametro in parametros_map.items():
        if etapa_key in key or key in etapa_key:
            return parametro

    return None


def obtener_parametro_por_etapa(
    etapa_actual: Optional[str],
    parametros_map: Optional[Dict[str, ParametroSLA]] = None,
) -> Optional[ParametroSLA]:
    parametros_map = parametros_map or build_parametros_sla_map()
    return _resolve_parametro(etapa_actual, parametros_map)


def _calcular_dias_transcurridos(
    fecha_inicio: Optional[date],
    fecha_actual: Optional[date] = None,
    aplica_dias_habiles: bool = True,
) -> int:
    if not fecha_inicio:
        return 0

    fecha_actual = fecha_actual or date.today()
    if fecha_actual < fecha_inicio:
        return 0

    delta_days = (fecha_actual - fecha_inicio).days
    if not aplica_dias_habiles:
        return delta_days

    dias = 0
    for offset in range(1, delta_days + 1):
        dia = fecha_inicio + timedelta(days=offset)
        if dia.weekday() < 5:
            dias += 1

    return dias


def aplicar_sla_factura(
    factura: Factura,
    parametros_map: Optional[Dict[str, ParametroSLA]] = None,
    fecha_actual: Optional[date] = None,
) -> bool:
    parametros_map = parametros_map or build_parametros_sla_map()
    parametro = _resolve_parametro(factura.etapa_actual, parametros_map)

    indicador_anterior = factura.indicador_riesgo
    sla_anterior = factura.sla_cumplido

    if not parametro or not parametro.activo:
        factura.indicador_riesgo = 'ok'
        factura.sla_cumplido = True
        return indicador_anterior != factura.indicador_riesgo or sla_anterior != factura.sla_cumplido

    fecha_inicio = factura.fecha_inicio_etapa or factura.fecha_recepcion
    dias_transcurridos = _calcular_dias_transcurridos(
        fecha_inicio,
        fecha_actual=fecha_actual,
        aplica_dias_habiles=parametro.aplica_dias_habiles,
    )

    dias_maximos = max(1, int(parametro.dias_maximos or 1))
    alerta_amarillo = max(1, int(round(dias_maximos * (parametro.alerta_amarillo_porcentaje or 0) / 100)))
    alerta_roja = max(1, int(round(dias_maximos * (parametro.alerta_roja_porcentaje or 0) / 100)))

    if dias_transcurridos > dias_maximos:
        indicador = 'vencida'
    elif dias_transcurridos >= alerta_roja:
        indicador = 'atrasada'
    elif dias_transcurridos >= alerta_amarillo:
        indicador = 'atencion'
    else:
        indicador = 'ok'

    factura.indicador_riesgo = indicador
    factura.sla_cumplido = dias_transcurridos <= dias_maximos

    return indicador_anterior != factura.indicador_riesgo or sla_anterior != factura.sla_cumplido


def actualizar_sla_factura(
    factura: Factura,
    parametros_map: Optional[Dict[str, ParametroSLA]] = None,
    fecha_actual: Optional[date] = None,
) -> bool:
    indicador_anterior = factura.indicador_riesgo
    changed = aplicar_sla_factura(factura, parametros_map=parametros_map, fecha_actual=fecha_actual)
    if changed:
        factura.save(update_fields=['indicador_riesgo', 'sla_cumplido', 'fecha_modificacion'])

        if factura.indicador_riesgo != indicador_anterior and factura.indicador_riesgo in {'atencion', 'atrasada', 'vencida'}:
            parametro = obtener_parametro_por_etapa(factura.etapa_actual, parametros_map)
            fecha_inicio = factura.fecha_inicio_etapa or factura.fecha_recepcion
            dias_transcurridos = _calcular_dias_transcurridos(
                fecha_inicio,
                fecha_actual=fecha_actual,
                aplica_dias_habiles=parametro.aplica_dias_habiles if parametro else True,
            )
            estado_label = {
                'atencion': 'En riesgo',
                'atrasada': 'Atrasada',
                'vencida': 'Vencida',
            }.get(factura.indicador_riesgo, 'En riesgo')
            mensaje = (
                f"Factura {factura.numero_factura} en etapa {factura.etapa_actual or 'Sin etapa'}: "
                f"{estado_label}. {dias_transcurridos} días de {parametro.dias_maximos if parametro else 'N/A'}."
            )

            from notificaciones.signals import crear_notificacion

            destinatarios = {factura.usuario_responsable_id, factura.creado_por_id}
            for user_id in destinatarios:
                crear_notificacion(
                    id_usuario=user_id,
                    tipo='SLA_ALERTA',
                    mensaje=mensaje,
                    prioridad='alta' if factura.indicador_riesgo in {'atrasada', 'vencida'} else 'media',
                )
    return changed


def sincronizar_sla_facturas(
    facturas: Iterable[Factura],
    parametros_map: Optional[Dict[str, ParametroSLA]] = None,
    fecha_actual: Optional[date] = None,
) -> int:
    parametros_map = parametros_map or build_parametros_sla_map()
    total = 0
    for factura in facturas:
        if actualizar_sla_factura(factura, parametros_map=parametros_map, fecha_actual=fecha_actual):
            total += 1
    return total
