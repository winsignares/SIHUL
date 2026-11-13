"""Esquemas de validación del módulo Usuarios."""



ROL_SCHEMA = {
    'nombre': {
        'type': 'string',
        'field_type': 'nombre',
        'max_length': 100,
        'required': True,
    },
    'descripcion': {
        'type': 'string',
        'field_type': 'descripcion',
        'max_length': 500,
        'required': True,
    },
}

USUARIO_SCHEMA = {
    'nombre': {
        'type': 'string',
        'field_type': 'nombre',
        'max_length': 255,
        'required': True,
    },
    'correo': {
        'type': 'string',
        'field_type': 'email',
        'max_length': 255,
        'required': True,
    },
    'sede': {
        'type': 'string',
        'field_type': 'nombre',
        'max_length': 255,
        'required': False,
    },
}
