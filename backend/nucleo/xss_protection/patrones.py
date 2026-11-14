"""Listas de caracteres permitidos y patrones de ataque XSS."""


# Whitelist de caracteres permitidos en diferentes tipos de campos
ALLOWED_CHARS_PATTERNS = {
    'nombre': r'^[a-zA-Z0-9\s\-áéíóúñÁÉÍÓÚÑ\.]+$',
    'codigo': r'^[a-zA-Z0-9\-_]+$',
    'email': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    'url': r'^https?://[a-zA-Z0-9\-._~:/?#\[\]@!$&\'()*+,;=]+$',
    'descripcion': r'^[a-zA-Z0-9\s\-áéíóúñÁÉÍÓÚÑ\.,;:()$%|/\n\r!¿?*#@\']+$',
    'texto_libre': r'^[\w\W]+$',
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
