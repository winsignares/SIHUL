"""Sanitización de diccionarios completos según un esquema y validación de campos permitidos."""
from typing import Any, Dict, List
from django.core.exceptions import ValidationError
from .valores import sanitize_boolean, sanitize_integer, sanitize_string


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
