"""Esquemas de validación del módulo Notificaciones."""



NOTIFICACION_SCHEMA = {
    'mensaje': {
        'type': 'string',
        'field_type': 'descripcion',
        'max_length': 1000,
        'required': True,
    },
    'tipo_notificacion': {
        'type': 'string',
        'field_type': 'nombre',
        'max_length': 100,
        'required': True,
    },
    'prioridad': {
        'type': 'string',
        'field_type': 'nombre',
        'max_length': 20,
        'required': False,
    },
}
