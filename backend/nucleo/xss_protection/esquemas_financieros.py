"""Esquemas de validación del módulo Financiero."""



PROVEEDOR_SCHEMA = {
    'nit': {
        'type': 'string',
        'field_type': 'codigo',
        'max_length': 50,
        'required': True,
    },
    'razon_social': {
        'type': 'string',
        'field_type': 'nombre',
        'max_length': 255,
        'required': True,
    },
    'nombre_comercial': {
        'type': 'string',
        'field_type': 'nombre',
        'max_length': 255,
        'required': False,
    },
    'tipo_persona': {
        'type': 'string',
        'field_type': 'nombre',
        'max_length': 20,
        'required': False,
    },
    'tipo_proveedor': {
        'type': 'string',
        'field_type': 'nombre',
        'max_length': 50,
        'required': False,
    },
    'direccion': {
        'type': 'string',
        'field_type': 'direccion',
        'max_length': 255,
        'required': False,
    },
    'ciudad': {
        'type': 'string',
        'field_type': 'nombre',
        'max_length': 100,
        'required': False,
    },
    'departamento': {
        'type': 'string',
        'field_type': 'nombre',
        'max_length': 100,
        'required': False,
    },
    'pais': {
        'type': 'string',
        'field_type': 'nombre',
        'max_length': 100,
        'required': False,
    },
    'telefono': {
        'type': 'string',
        'field_type': 'codigo',
        'max_length': 50,
        'required': False,
    },
    'email': {
        'type': 'string',
        'field_type': 'email',
        'max_length': 255,
        'required': False,
    },
    'contacto_principal': {
        'type': 'string',
        'field_type': 'nombre',
        'max_length': 255,
        'required': False,
    },
    'telefono_contacto': {
        'type': 'string',
        'field_type': 'codigo',
        'max_length': 50,
        'required': False,
    },
    'banco': {
        'type': 'string',
        'field_type': 'nombre',
        'max_length': 100,
        'required': False,
    },
    'numero_cuenta': {
        'type': 'string',
        'field_type': 'codigo',
        'max_length': 50,
        'required': False,
    },
    'observaciones': {
        'type': 'string',
        'field_type': 'texto_libre',
        'max_length': None,
        'required': False,
    },
}

FACTURA_SCHEMA = {
    'numero_factura': {
        'type': 'string',
        'field_type': 'codigo',
        'max_length': 50,
        'required': False,
    },
    'tipo_documento': {
        'type': 'string',
        'field_type': 'nombre',
        'max_length': 50,
        'required': False,
    },
    'observaciones': {
        'type': 'string',
        'field_type': 'texto_libre',
        'max_length': None,
        'required': False,
    },
    'proveedor_id': {
        'type': 'integer',
        'required': False,
        'min_value': 1,
    },
    'departamento_id': {
        'type': 'integer',
        'required': False,
        'min_value': 1,
    },
    'cuenta_contable_id': {
        'type': 'integer',
        'required': False,
        'min_value': 1,
    },
    'centro_costo_id': {
        'type': 'integer',
        'required': False,
        'min_value': 1,
    },
    'usuario_responsable_id': {
        'type': 'integer',
        'required': False,
        'min_value': 1,
    },
    'valor_subtotal': {
        'type': 'integer',
        'required': False,
        'min_value': 0,
    },
    'valor_iva': {
        'type': 'integer',
        'required': False,
        'min_value': 0,
    },
    'valor_total': {
        'type': 'integer',
        'required': False,
        'min_value': 0,
    },
    'cuenta_bancaria_proveedor': {
        'type': 'string',
        'field_type': 'nombre',
        'max_length': 255,
        'required': False,
    },
}

DEPARTAMENTO_SCHEMA = {
    'nombre': {
        'type': 'string',
        'field_type': 'nombre',
        'max_length': 150,
        'required': True,
    },
    'descripcion': {
        'type': 'string',
        'field_type': 'descripcion',
        'max_length': 500,
        'required': False,
    },
    'responsable_id': {
        'type': 'integer',
        'required': False,
        'min_value': 1,
    },
}

CUENTA_CONTABLE_SCHEMA = {
    'codigo': {
        'type': 'string',
        'field_type': 'codigo',
        'max_length': 50,
        'required': True,
    },
    'nombre': {
        'type': 'string',
        'field_type': 'nombre',
        'max_length': 150,
        'required': True,
    },
    'descripcion': {
        'type': 'string',
        'field_type': 'descripcion',
        'max_length': 500,
        'required': False,
    },
}

CENTRO_COSTO_SCHEMA = {
    'codigo': {
        'type': 'string',
        'field_type': 'codigo',
        'max_length': 50,
        'required': True,
    },
    'nombre': {
        'type': 'string',
        'field_type': 'nombre',
        'max_length': 150,
        'required': True,
    },
    'descripcion': {
        'type': 'string',
        'field_type': 'descripcion',
        'max_length': 500,
        'required': False,
    },
}
