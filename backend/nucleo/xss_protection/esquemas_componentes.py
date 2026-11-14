"""Esquemas de validación del módulo Componentes."""



COMPONENTE_SCHEMA = {
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
