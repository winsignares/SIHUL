"""Sanitización de valores simples: cadenas, enteros y booleanos."""
import re
import html
from typing import Any, Optional
from django.utils.html import escape
from django.core.exceptions import ValidationError
from .patrones import ALLOWED_CHARS_PATTERNS, XSS_PATTERNS


def sanitize_string(value: str, field_type: str = 'nombre', max_length: Optional[int] = 255) -> str:
    """
    Sanitiza una cadena de texto eliminando caracteres peligrosos y validando contra XSS.
    
    Args:
        value: Cadena a sanitizar
        field_type: Tipo de campo (nombre, codigo, email, url, descripcion, direccion)
        max_length: Longitud máxima permitida; use None para no imponer límite.
        
    Returns:
        Cadena sanitizada
        
    Raises:
        ValidationError: Si la cadena contiene patrones peligrosos
    """
    if not isinstance(value, str):
        raise ValidationError(f"Se esperaba una cadena de texto, se recibió {type(value).__name__}")
    
    # Limitar longitud
    if max_length is not None and len(value) > max_length:
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
