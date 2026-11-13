"""Escape de salida, bytes nulos y nombres de archivo."""
import re
from django.utils.html import escape
from django.core.exceptions import ValidationError


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
