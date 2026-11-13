"""Esquemas de validación de los módulos académicos."""



GRUPO_SCHEMA = {
    'nombre': {
        'type': 'string',
        'field_type': 'nombre',
        'max_length': 100,
        'required': True,
    },
    'programa_id': {
        'type': 'integer',
        'required': True,
        'min_value': 1,
    },
    'periodo_id': {
        'type': 'integer',
        'required': True,
        'min_value': 1,
    },
    'semestre': {
        'type': 'integer',
        'required': True,
        'min_value': 1,
        'max_value': 20,
    },
    'activo': {
        'type': 'boolean',
        'required': False,
    },
}

ASIGNATURA_SCHEMA = {
    'nombre': {
        'type': 'string',
        'field_type': 'nombre',
        'max_length': 150,
        'required': True,
    },
    'codigo': {
        'type': 'string',
        'field_type': 'codigo',
        'max_length': 20,
        'required': True,
    },
    'creditos': {
        'type': 'integer',
        'required': True,
        'min_value': 0,
        'max_value': 10,
    },
    'tipo': {
        'type': 'string',
        'field_type': 'nombre',
        'max_length': 50,
        'required': False,
    },
    'horas': {
        'type': 'integer',
        'required': False,
        'min_value': 0,
        'max_value': 100,
    },
}

PROGRAMA_SCHEMA = {
    'nombre': {
        'type': 'string',
        'field_type': 'nombre',
        'max_length': 150,
        'required': True,
    },
    'facultad_id': {
        'type': 'integer',
        'required': True,
        'min_value': 1,
    },
    'semestres': {
        'type': 'integer',
        'required': False,
        'min_value': 1,
        'max_value': 20,
    },
    'activo': {
        'type': 'boolean',
        'required': False,
    },
}

FACULTAD_SCHEMA = {
    'nombre': {
        'type': 'string',
        'field_type': 'nombre',
        'max_length': 150,
        'required': True,
    },
    'activa': {
        'type': 'boolean',
        'required': False,
    },
}

SEDE_SCHEMA = {
    'nombre': {
        'type': 'string',
        'field_type': 'nombre',
        'max_length': 150,
        'required': True,
    },
    'direccion': {
        'type': 'string',
        'field_type': 'direccion',
        'max_length': 255,
        'required': False,
    },
    'seccional_id': {
        'type': 'integer',
        'required': False,
        'min_value': 1,
    },
    'activa': {
        'type': 'boolean',
        'required': False,
    },
}

RECURSO_SCHEMA = {
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

HORARIO_SCHEMA = {
    'grupo_id': {
        'type': 'integer',
        'required': True,
        'min_value': 1,
    },
    'asignatura_id': {
        'type': 'integer',
        'required': True,
        'min_value': 1,
    },
    'espacio_id': {
        'type': 'integer',
        'required': True,
        'min_value': 1,
    },
    'dia_semana': {
        'type': 'string',
        'field_type': 'nombre',
        'max_length': 20,
        'required': True,
    },
    'hora_inicio': {
        'type': 'string',
        'field_type': 'codigo',
        'max_length': 8,
        'required': True,
    },
    'hora_fin': {
        'type': 'string',
        'field_type': 'codigo',
        'max_length': 8,
        'required': True,
    },
    'docente_id': {
        'type': 'integer',
        'required': False,
        'min_value': 1,
    },
    'cantidad_estudiantes': {
        'type': 'integer',
        'required': False,
        'min_value': 0,
        'max_value': 500,
    },
    'usuario_id': {
        'type': 'integer',
        'required': False,
        'min_value': 1,
    },
}
