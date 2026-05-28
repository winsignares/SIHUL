"""
XSS Protection Module for SIHUL
Provides sanitization and validation functions to prevent XSS attacks
"""

import re
import html
from typing import Any, Dict, List, Optional, Union
from django.utils.html import escape
from django.core.exceptions import ValidationError


# Whitelist de caracteres permitidos en diferentes tipos de campos
ALLOWED_CHARS_PATTERNS = {
    'nombre': r'^[a-zA-Z0-9\s\-áéíóúñÁÉÍÓÚÑ\.]+$',
    'codigo': r'^[a-zA-Z0-9\-_]+$',
    'email': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    'url': r'^https?://[a-zA-Z0-9\-._~:/?#\[\]@!$&\'()*+,;=]+$',
    'descripcion': r'^[a-zA-Z0-9\s\-áéíóúñÁÉÍÓÚÑ\.,;:()]+$',
    'direccion': r'^[a-zA-Z0-9\s\-áéíóúñÁÉÍÓÚÑ\.,#()]+$',
}

# Caracteres peligrosos que nunca deben permitirse
DANGEROUS_CHARS = ['<', '>', '"', "'", '&', ';', '(', ')', '{', '}', '[', ']']

# Patrones de ataque XSS comunes
XSS_PATTERNS = [
    r'<script[^>]*>.*?</script>',
    r'javascript:',
    r'on\w+\s*=',  # onclick, onload, etc.
    r'<iframe[^>]*>',
    r'<object[^>]*>',
    r'<embed[^>]*>',
    r'<img[^>]*on\w+',
    r'<svg[^>]*on\w+',
    r'<body[^>]*on\w+',
    r'<input[^>]*on\w+',
    r'<form[^>]*on\w+',
    r'eval\(',
    r'expression\(',
    r'vbscript:',
    r'data:text/html',
]


def sanitize_string(value: str, field_type: str = 'nombre', max_length: int = 255) -> str:
    """
    Sanitiza una cadena de texto eliminando caracteres peligrosos y validando contra XSS.
    
    Args:
        value: Cadena a sanitizar
        field_type: Tipo de campo (nombre, codigo, email, url, descripcion, direccion)
        max_length: Longitud máxima permitida
        
    Returns:
        Cadena sanitizada
        
    Raises:
        ValidationError: Si la cadena contiene patrones peligrosos
    """
    if not isinstance(value, str):
        raise ValidationError(f"Se esperaba una cadena de texto, se recibió {type(value).__name__}")
    
    # Limitar longitud
    if len(value) > max_length:
        raise ValidationError(f"La cadena excede la longitud máxima de {max_length} caracteres")
    
    # Eliminar espacios en blanco al inicio y final
    value = value.strip()
    
    # Verificar patrones XSS peligrosos
    for pattern in XSS_PATTERNS:
        if re.search(pattern, value, re.IGNORECASE):
            raise ValidationError(f"La cadena contiene patrones peligrosos: {pattern}")
    
    # Escapar caracteres HTML
    value = escape(value)
    
    # Validar contra whitelist de caracteres según el tipo de campo
    if field_type in ALLOWED_CHARS_PATTERNS:
        pattern = ALLOWED_CHARS_PATTERNS[field_type]
        # Desescapar temporalmente para validar
        unescaped = html.unescape(value)
        if not re.match(pattern, unescaped):
            raise ValidationError(f"La cadena contiene caracteres no permitidos para el tipo '{field_type}'")
    
    return value


def sanitize_integer(value: Any, min_value: int = 0, max_value: int = 2147483647) -> int:
    """
    Valida y convierte un valor a entero de forma segura.
    
    Args:
        value: Valor a convertir
        min_value: Valor mínimo permitido
        max_value: Valor máximo permitido
        
    Returns:
        Entero validado
        
    Raises:
        ValidationError: Si el valor no es válido
    """
    try:
        int_value = int(value)
    except (ValueError, TypeError):
        raise ValidationError(f"Se esperaba un entero, se recibió '{value}'")
    
    if int_value < min_value or int_value > max_value:
        raise ValidationError(f"El valor debe estar entre {min_value} y {max_value}")
    
    return int_value


def sanitize_boolean(value: Any) -> bool:
    """
    Valida y convierte un valor a booleano de forma segura.
    
    Args:
        value: Valor a convertir
        
    Returns:
        Booleano validado
        
    Raises:
        ValidationError: Si el valor no es válido
    """
    if isinstance(value, bool):
        return value
    
    if isinstance(value, str):
        if value.lower() in ['true', '1', 'yes', 'on']:
            return True
        elif value.lower() in ['false', '0', 'no', 'off']:
            return False
    
    if isinstance(value, int):
        return bool(value)
    
    raise ValidationError(f"No se puede convertir '{value}' a booleano")


def sanitize_dict(data: Dict[str, Any], schema: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    """
    Sanitiza un diccionario completo basado en un esquema de validación.
    
    Args:
        data: Diccionario a sanitizar
        schema: Esquema de validación con formato:
                {
                    'campo': {
                        'type': 'string|integer|boolean',
                        'field_type': 'nombre|codigo|email|etc',
                        'max_length': 255,
                        'required': True,
                        'min_value': 0,
                        'max_value': 100
                    }
                }
        
    Returns:
        Diccionario sanitizado
        
    Raises:
        ValidationError: Si algún campo no cumple con el esquema
    """
    if not isinstance(data, dict):
        raise ValidationError("Se esperaba un diccionario")
    
    sanitized = {}
    
    for field_name, field_schema in schema.items():
        field_type = field_schema.get('type', 'string')
        is_required = field_schema.get('required', False)
        value = data.get(field_name)
        
        # Validar campos requeridos
        if is_required and value is None:
            raise ValidationError(f"El campo '{field_name}' es requerido")
        
        # Saltar campos opcionales no proporcionados
        if value is None:
            continue
        
        # Sanitizar según el tipo
        if field_type == 'string':
            field_subtype = field_schema.get('field_type', 'nombre')
            max_length = field_schema.get('max_length', 255)
            sanitized[field_name] = sanitize_string(value, field_subtype, max_length)
        
        elif field_type == 'integer':
            min_value = field_schema.get('min_value', 0)
            max_value = field_schema.get('max_value', 2147483647)
            sanitized[field_name] = sanitize_integer(value, min_value, max_value)
        
        elif field_type == 'boolean':
            sanitized[field_name] = sanitize_boolean(value)
        
        else:
            raise ValidationError(f"Tipo de campo desconocido: {field_type}")
    
    return sanitized


def validate_json_input(json_data: Dict[str, Any], allowed_fields: List[str]) -> Dict[str, Any]:
    """
    Valida que un JSON solo contenga campos permitidos.
    
    Args:
        json_data: Datos JSON a validar
        allowed_fields: Lista de campos permitidos
        
    Returns:
        Diccionario filtrado con solo campos permitidos
        
    Raises:
        ValidationError: Si hay campos no permitidos
    """
    if not isinstance(json_data, dict):
        raise ValidationError("Se esperaba un diccionario JSON")
    
    # Verificar campos no permitidos
    extra_fields = set(json_data.keys()) - set(allowed_fields)
    if extra_fields:
        raise ValidationError(f"Campos no permitidos: {', '.join(extra_fields)}")
    
    return {k: v for k, v in json_data.items() if k in allowed_fields}


def escape_html_output(value: str) -> str:
    """
    Escapa una cadena para salida HTML segura.
    
    Args:
        value: Cadena a escapar
        
    Returns:
        Cadena escapada
    """
    if not isinstance(value, str):
        return str(value)
    
    return escape(value)


def remove_null_bytes(value: str) -> str:
    """
    Elimina bytes nulos de una cadena.
    
    Args:
        value: Cadena a limpiar
        
    Returns:
        Cadena sin bytes nulos
    """
    if not isinstance(value, str):
        return str(value)
    
    return value.replace('\x00', '')


def sanitize_filename(filename: str) -> str:
    """
    Sanitiza un nombre de archivo para prevenir path traversal y XSS.
    
    Args:
        filename: Nombre de archivo a sanitizar
        
    Returns:
        Nombre de archivo sanitizado
        
    Raises:
        ValidationError: Si el nombre contiene patrones peligrosos
    """
    if not isinstance(filename, str):
        raise ValidationError("El nombre de archivo debe ser una cadena")
    
    # Eliminar path traversal
    if '..' in filename or '/' in filename or '\\' in filename:
        raise ValidationError("El nombre de archivo contiene caracteres peligrosos")
    
    # Eliminar caracteres especiales peligrosos
    filename = re.sub(r'[<>:"|?*\x00-\x1f]', '', filename)
    
    if not filename:
        raise ValidationError("El nombre de archivo no puede estar vacío después de sanitizar")
    
    return filename


# Esquemas de validación predefinidos para módulos académicos
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

# Esquemas de validación para módulo Financiero
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
        'field_type': 'descripcion',
        'max_length': 1000,
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
    'descripcion': {
        'type': 'string',
        'field_type': 'descripcion',
        'max_length': 500,
        'required': False,
    },
    'observaciones': {
        'type': 'string',
        'field_type': 'descripcion',
        'max_length': 1000,
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
        'field_type': 'codigo',
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

# Esquemas de validación para módulo Usuarios
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

# Esquemas de validación para módulo Préstamos
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

# Esquemas de validación para módulo Componentes
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

# Esquemas de validación para módulo Notificaciones
NOTIFICACION_SCHEMA = {
    'mensaje': {
        'type': 'string',
        'field_type': 'descripcion',
        'max_length': 1000,
        'required': True,
    },
    'tipo': {
        'type': 'string',
        'field_type': 'nombre',
        'max_length': 100,
        'required': False,
    },
}
