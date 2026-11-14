"""Flujo de la factura: reglas de cada paso, historial y notificaciones, sin depender de la petición HTTP.

Cada paso recibe la factura, el usuario que actúa y los datos enviados. Si la factura no está en el estado que el
paso exige, o faltan datos, lanza `PasoRechazado` con el mensaje y el código HTTP que se responden. Si no, cambia el
estado y la etapa, fija las fechas, asigna el responsable, agrega las observaciones con su etiqueta, actualiza el
SLA, deja la entrada del historial y notifica (salvo el control de pago, que no notifica).

En los pasos que suben archivos (causar, registrar pago aplicado) la vista entrega las funciones que guardan el
archivo en la carpeta compartida y regeneran el PDF unificado. En los que pasan por el serializador (crear, corregir,
completar registro) la vista valida y guarda el formulario, y el servicio aplica el resto del paso.

Se divide por quién actúa; todo lo público sigue importándose desde `financiero.flujo_factura`.
"""
from ._base import (  # noqa: F401
    ESTADO_AUTORIZADA, ESTADO_CARGADA, ESTADO_DEVUELTA, ESTADO_ENVIADA_RECTORIA, ESTADO_RECHAZADA_POR_RECTORIA,
    ESTADO_REVISADA_DIRECCION_FINANCIERA, QUIEN_ACTUA, SIGUIENTES_ROLES, SOPORTES_RADICACION, PasoRechazado,
    ciclo_documental_actual, estado_es, notificar_transicion, registrar_historial,
)
from .archivos import causar, registrar_pago_aplicado  # noqa: F401
from .auditoria import aprobar_auditoria, rechazar_auditoria  # noqa: F401
from .contabilidad import faltantes_radicacion, radicar  # noqa: F401
from .devolucion import destino_del_rechazo, rechazar  # noqa: F401
from .direccion_rectoria import (  # noqa: F401
    asignar_numero_confirmacion, autorizar_rectoria, cargar_direccion_financiera, confirmar_control_pago,
    enviar_rectoria, generar_numero_confirmacion, rechazar_rectoria,
)
from .registro import (  # noqa: F401
    completar_registro, registrar_creacion, reenviar_correccion, validar_completar_registro, validar_correccion,
)
from .tesoreria import alistar, detener_en_tesoreria, enviar_direccion_financiera, generar_comprobante  # noqa: F401
