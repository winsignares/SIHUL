"""Eventos en tiempo real del módulo financiero.

Quién recibe cada evento replica quién ve esos datos en la API (`FacturaViewSet.get_queryset`):
- una factura la ven quien la creó, su responsable, el proveedor dueño y quienes intervinieron en ella (historial);
  además, los roles que revisan todas las facturas (contabilidad, tesorería, auditoría, dirección financiera,
  rectoría y administración financiera) y, mientras está recién recibida y sin responsable, los funcionarios;
- los proveedores y los catálogos, quienes tienen un rol financiero.
Los administradores reciben todo. El navegador solo recibe `recurso`, `accion` e `id`.
"""
from nucleo.eventos.registro import registrar_recurso
from nucleo.roles_financieros import normalizar

ROLES_QUE_VEN_TODAS_LAS_FACTURAS = frozenset({
    normalizar(nombre)
    for nombre in ('Contabilidad', 'Tesorería', 'Auditoría', 'Dirección Financiera', 'Rectoría', 'Admin Financiero')
})
ROLES_FINANCIEROS = ROLES_QUE_VEN_TODAS_LAS_FACTURAS | {'funcionario', 'proveedor'}


def audiencia_de_factura(factura):
    usuarios = {factura.creado_por_id, factura.usuario_responsable_id}
    proveedor = getattr(factura, 'proveedor', None)
    if proveedor is not None:
        usuarios.add(proveedor.usuario_id)
    usuarios.update(factura.historial.values_list('usuario_id', flat=True))
    roles = set(ROLES_QUE_VEN_TODAS_LAS_FACTURAS)
    if factura.estado == 'Recibida' and factura.usuario_responsable_id is None:
        roles.add('funcionario')
    return {'usuarios': usuarios, 'roles': roles}


def audiencia_de_proveedor(proveedor):
    return {'usuarios': {proveedor.usuario_id}, 'roles': ROLES_FINANCIEROS - {'proveedor'}}


def audiencia_financiera(_registro):
    return {'usuarios': set(), 'roles': ROLES_FINANCIEROS}


def audiencia_interna(_registro):
    return {'usuarios': set(), 'roles': ROLES_FINANCIEROS - {'proveedor'}}


def _de_la_factura(hijo):
    return hijo.factura


def registrar_eventos_financieros():
    registrar_recurso('financiero', 'Factura', 'facturas', audiencia=audiencia_de_factura)
    for hijo in ('DocumentoAdjunto', 'HistorialFactura', 'ComentarioFactura', 'RechazoDevolucion', 'ItemFactura'):
        registrar_recurso('financiero', hijo, 'facturas', audiencia=audiencia_de_factura, referencia=_de_la_factura)
    registrar_recurso('financiero', 'Proveedor', 'proveedores', audiencia=audiencia_de_proveedor)
    for catalogo in ('Departamento', 'CuentaContable', 'CentroCosto', 'Banco', 'TipoCuenta'):
        registrar_recurso('financiero', catalogo, 'catalogos-financieros', audiencia=audiencia_financiera)
    for parametros in ('ParametroSLA', 'ParametrosFinanciero'):
        registrar_recurso('financiero', parametros, 'parametros-financieros', audiencia=audiencia_interna)
