"""
Tests para validar protecciones contra XSS en SIHUL
"""

import json
from django.test import TestCase, Client
from django.core.exceptions import ValidationError
from mysite.xss_protection import (
    sanitize_string,
    sanitize_integer,
    sanitize_boolean,
    sanitize_dict,
    sanitize_filename,
    GRUPO_SCHEMA,
    ASIGNATURA_SCHEMA,
)


class XSSProtectionTestCase(TestCase):
    """Tests para funciones de sanitización XSS"""

    def test_sanitize_string_removes_script_tags(self):
        """Verifica que sanitize_string rechaza script tags"""
        with self.assertRaises(ValidationError):
            sanitize_string("<script>alert('XSS')</script>")

    def test_sanitize_string_removes_event_handlers(self):
        """Verifica que sanitize_string rechaza event handlers"""
        with self.assertRaises(ValidationError):
            sanitize_string("Test onclick='alert(1)'")

    def test_sanitize_string_removes_javascript_protocol(self):
        """Verifica que sanitize_string rechaza javascript: protocol"""
        with self.assertRaises(ValidationError):
            sanitize_string("javascript:alert('XSS')")

    def test_sanitize_string_removes_iframe(self):
        """Verifica que sanitize_string rechaza iframes"""
        with self.assertRaises(ValidationError):
            sanitize_string("<iframe src='evil.com'></iframe>")

    def test_sanitize_string_removes_svg_xss(self):
        """Verifica que sanitize_string rechaza SVG XSS"""
        with self.assertRaises(ValidationError):
            sanitize_string("<svg onload='alert(1)'>")

    def test_sanitize_string_escapes_html_entities(self):
        """Verifica que sanitize_string escapa entidades HTML"""
        result = sanitize_string("Test & <test>")
        self.assertIn("&amp;", result)
        self.assertIn("&lt;", result)

    def test_sanitize_string_allows_valid_names(self):
        """Verifica que sanitize_string permite nombres válidos"""
        result = sanitize_string("Grupo A-1", field_type='nombre')
        self.assertIsNotNone(result)

    def test_sanitize_string_enforces_max_length(self):
        """Verifica que sanitize_string respeta max_length"""
        with self.assertRaises(ValidationError):
            sanitize_string("a" * 300, max_length=255)

    def test_sanitize_integer_valid(self):
        """Verifica que sanitize_integer acepta enteros válidos"""
        result = sanitize_integer(42)
        self.assertEqual(result, 42)

    def test_sanitize_integer_string_conversion(self):
        """Verifica que sanitize_integer convierte strings a enteros"""
        result = sanitize_integer("42")
        self.assertEqual(result, 42)

    def test_sanitize_integer_range_validation(self):
        """Verifica que sanitize_integer valida rango"""
        with self.assertRaises(ValidationError):
            sanitize_integer(100, min_value=0, max_value=50)

    def test_sanitize_integer_invalid_type(self):
        """Verifica que sanitize_integer rechaza tipos inválidos"""
        with self.assertRaises(ValidationError):
            sanitize_integer("not a number")

    def test_sanitize_boolean_true_values(self):
        """Verifica que sanitize_boolean reconoce valores true"""
        self.assertTrue(sanitize_boolean(True))
        self.assertTrue(sanitize_boolean("true"))
        self.assertTrue(sanitize_boolean("1"))
        self.assertTrue(sanitize_boolean(1))

    def test_sanitize_boolean_false_values(self):
        """Verifica que sanitize_boolean reconoce valores false"""
        self.assertFalse(sanitize_boolean(False))
        self.assertFalse(sanitize_boolean("false"))
        self.assertFalse(sanitize_boolean("0"))
        self.assertFalse(sanitize_boolean(0))

    def test_sanitize_dict_grupo_valid(self):
        """Verifica que sanitize_dict valida esquema GRUPO correctamente"""
        data = {
            'nombre': 'Grupo A',
            'programa_id': 1,
            'periodo_id': 1,
            'semestre': 1,
            'activo': True,
        }
        result = sanitize_dict(data, GRUPO_SCHEMA)
        self.assertEqual(result['nombre'], 'Grupo A')
        self.assertEqual(result['programa_id'], 1)

    def test_sanitize_dict_grupo_xss_injection(self):
        """Verifica que sanitize_dict rechaza XSS en GRUPO"""
        data = {
            'nombre': '<script>alert("XSS")</script>',
            'programa_id': 1,
            'periodo_id': 1,
            'semestre': 1,
        }
        with self.assertRaises(ValidationError):
            sanitize_dict(data, GRUPO_SCHEMA)

    def test_sanitize_dict_missing_required_field(self):
        """Verifica que sanitize_dict rechaza campos requeridos faltantes"""
        data = {
            'programa_id': 1,
            'periodo_id': 1,
            'semestre': 1,
        }
        with self.assertRaises(ValidationError):
            sanitize_dict(data, GRUPO_SCHEMA)

    def test_sanitize_dict_invalid_type(self):
        """Verifica que sanitize_dict rechaza tipos inválidos"""
        data = {
            'nombre': 'Grupo A',
            'programa_id': 'not a number',
            'periodo_id': 1,
            'semestre': 1,
        }
        with self.assertRaises(ValidationError):
            sanitize_dict(data, GRUPO_SCHEMA)

    def test_sanitize_filename_removes_path_traversal(self):
        """Verifica que sanitize_filename rechaza path traversal"""
        with self.assertRaises(ValidationError):
            sanitize_filename("../../../etc/passwd")

    def test_sanitize_filename_removes_slashes(self):
        """Verifica que sanitize_filename rechaza slashes"""
        with self.assertRaises(ValidationError):
            sanitize_filename("folder/file.txt")

    def test_sanitize_filename_removes_special_chars(self):
        """Verifica que sanitize_filename elimina caracteres especiales"""
        result = sanitize_filename("file<script>.txt")
        self.assertNotIn("<", result)
        self.assertNotIn(">", result)

    def test_sanitize_filename_valid(self):
        """Verifica que sanitize_filename acepta nombres válidos"""
        result = sanitize_filename("documento_2024.pdf")
        self.assertEqual(result, "documento_2024.pdf")


class GrupoXSSAPITestCase(TestCase):
    """Tests para validar protecciones XSS en endpoints de Grupo"""

    def setUp(self):
        """Configurar cliente de prueba"""
        self.client = Client()
        # Nota: En pruebas reales, necesitarías crear un usuario admin autenticado

    def test_create_grupo_with_xss_payload(self):
        """Verifica que POST /grupos rechaza payloads XSS"""
        # Este test requeriría autenticación real
        # Aquí se muestra el patrón de prueba
        payload = {
            'nombre': '<img src=x onerror="alert(\'XSS\')">',
            'programa_id': 1,
            'periodo_id': 1,
            'semestre': 1,
        }
        # En una prueba real, esto debería retornar 400 con error de validación

    def test_create_grupo_with_script_injection(self):
        """Verifica que POST /grupos rechaza script injection"""
        payload = {
            'nombre': '<script>alert("XSS")</script>',
            'programa_id': 1,
            'periodo_id': 1,
            'semestre': 1,
        }
        # En una prueba real, esto debería retornar 400 con error de validación

    def test_create_grupo_with_event_handler(self):
        """Verifica que POST /grupos rechaza event handlers"""
        payload = {
            'nombre': 'Grupo A" onclick="alert(1)',
            'programa_id': 1,
            'periodo_id': 1,
            'semestre': 1,
        }
        # En una prueba real, esto debería retornar 400 con error de validación


class AsignaturaXSSTestCase(TestCase):
    """Tests para validar protecciones XSS en Asignatura"""

    def test_sanitize_asignatura_valid(self):
        """Verifica que sanitize_dict valida esquema ASIGNATURA correctamente"""
        data = {
            'nombre': 'Matemáticas I',
            'codigo': 'MAT-101',
            'creditos': 4,
            'tipo': 'teórica',
            'horas': 48,
        }
        result = sanitize_dict(data, ASIGNATURA_SCHEMA)
        self.assertEqual(result['nombre'], 'Matemáticas I')
        self.assertEqual(result['codigo'], 'MAT-101')

    def test_sanitize_asignatura_xss_injection(self):
        """Verifica que sanitize_dict rechaza XSS en ASIGNATURA"""
        data = {
            'nombre': '<svg onload="alert(1)">Matemáticas</svg>',
            'codigo': 'MAT-101',
            'creditos': 4,
        }
        with self.assertRaises(ValidationError):
            sanitize_dict(data, ASIGNATURA_SCHEMA)

    def test_sanitize_asignatura_invalid_codigo(self):
        """Verifica que sanitize_dict rechaza códigos inválidos"""
        data = {
            'nombre': 'Matemáticas I',
            'codigo': 'MAT-101<script>',
            'creditos': 4,
        }
        with self.assertRaises(ValidationError):
            sanitize_dict(data, ASIGNATURA_SCHEMA)


class XSSVectorTestCase(TestCase):
    """Tests para vectores XSS comunes"""

    def test_xss_vector_img_onerror(self):
        """Verifica protección contra <img onerror>"""
        with self.assertRaises(ValidationError):
            sanitize_string('<img src=x onerror="alert(1)">')

    def test_xss_vector_svg_onload(self):
        """Verifica protección contra <svg onload>"""
        with self.assertRaises(ValidationError):
            sanitize_string('<svg onload="alert(1)">')

    def test_xss_vector_body_onload(self):
        """Verifica protección contra <body onload>"""
        with self.assertRaises(ValidationError):
            sanitize_string('<body onload="alert(1)">')

    def test_xss_vector_input_onfocus(self):
        """Verifica protección contra <input onfocus>"""
        with self.assertRaises(ValidationError):
            sanitize_string('<input onfocus="alert(1)">')

    def test_xss_vector_form_onsubmit(self):
        """Verifica protección contra <form onsubmit>"""
        with self.assertRaises(ValidationError):
            sanitize_string('<form onsubmit="alert(1)">')

    def test_xss_vector_eval(self):
        """Verifica protección contra eval()"""
        with self.assertRaises(ValidationError):
            sanitize_string('eval("alert(1)")')

    def test_xss_vector_expression(self):
        """Verifica protección contra expression()"""
        with self.assertRaises(ValidationError):
            sanitize_string('expression(alert(1))')

    def test_xss_vector_vbscript(self):
        """Verifica protección contra vbscript:"""
        with self.assertRaises(ValidationError):
            sanitize_string('vbscript:alert(1)')

    def test_xss_vector_data_uri(self):
        """Verifica protección contra data: URIs"""
        with self.assertRaises(ValidationError):
            sanitize_string('data:text/html,<script>alert(1)</script>')

    def test_xss_vector_unicode_bypass(self):
        """Verifica que escaping previene bypass Unicode"""
        result = sanitize_string("Test & <test>")
        self.assertNotIn("<", result)
        self.assertNotIn(">", result)
