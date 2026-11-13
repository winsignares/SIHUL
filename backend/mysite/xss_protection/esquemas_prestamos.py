"""Esquemas de validación del módulo Préstamos."""



TIPO_ACTIVIDAD_SCHEMA = {
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

PRESTAMO_SCHEMA = {
    'motivo': {
        'type': 'string',
        'field_type': 'descripcion',
        'max_length': 500,
        'required': False,
    },
    'telefono': {
        'type': 'string',
        'field_type': 'codigo',
        'max_length': 50,
        'required': False,
    },
}

PRESTAMO_PUBLICO_SCHEMA = {
    'nombre_completo': {
        'type': 'string',
        'field_type': 'nombre',
        'max_length': 255,
        'required': True,
    },
    'correo_institucional': {
        'type': 'string',
        'field_type': 'email',
        'max_length': 255,
        'required': True,
    },
    'telefono': {
        'type': 'string',
        'field_type': 'codigo',
        'max_length': 50,
        'required': True,
    },
    'identificacion': {
        'type': 'string',
        'field_type': 'codigo',
        'max_length': 50,
        'required': True,
    },
    'motivo': {
        'type': 'string',
        'field_type': 'descripcion',
        'max_length': 500,
        'required': True,
    },
}
