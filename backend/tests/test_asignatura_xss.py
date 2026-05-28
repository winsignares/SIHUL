"""
Tests específicos para validar protecciones XSS en Asignaturas
"""

from django.test import TestCase
from django.core.exceptions import ValidationError
from mysite.xss_protection import sanitize_dict, ASIGNATURA_SCHEMA


class AsignaturaXSSTestCase(TestCase):
    """Tests para validar protecciones XSS en endpoints de Asignatura"""

    def test_create_asignatura_valid_input(self):
        """Verifica que create_asignatura acepta inputs válidos"""
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
        self.assertEqual(result['creditos'], 4)

    def test_create_asignatura_script_injection_nombre(self):
        """Verifica que create_asignatura rechaza script injection en nombre"""
        data = {
            'nombre': '<script>alert("XSS")</script>',
            'codigo': 'MAT-101',
            'creditos': 4,
        }
        with self.assertRaises(ValidationError):
            sanitize_dict(data, ASIGNATURA_SCHEMA)

    def test_create_asignatura_img_onerror_nombre(self):
        """Verifica que create_asignatura rechaza img onerror en nombre"""
        data = {
            'nombre': '<img src=x onerror="alert(1)">',
            'codigo': 'MAT-101',
            'creditos': 4,
        }
        with self.assertRaises(ValidationError):
            sanitize_dict(data, ASIGNATURA_SCHEMA)

    def test_create_asignatura_svg_onload_nombre(self):
        """Verifica que create_asignatura rechaza svg onload en nombre"""
        data = {
            'nombre': '<svg onload="alert(1)">Matemáticas</svg>',
            'codigo': 'MAT-101',
            'creditos': 4,
        }
        with self.assertRaises(ValidationError):
            sanitize_dict(data, ASIGNATURA_SCHEMA)

    def test_create_asignatura_javascript_protocol_nombre(self):
        """Verifica que create_asignatura rechaza javascript: protocol en nombre"""
        data = {
            'nombre': 'javascript:alert(1)',
            'codigo': 'MAT-101',
            'creditos': 4,
        }
        with self.assertRaises(ValidationError):
            sanitize_dict(data, ASIGNATURA_SCHEMA)

    def test_create_asignatura_iframe_nombre(self):
        """Verifica que create_asignatura rechaza iframe en nombre"""
        data = {
            'nombre': '<iframe src="evil.com"></iframe>',
            'codigo': 'MAT-101',
            'creditos': 4,
        }
        with self.assertRaises(ValidationError):
            sanitize_dict(data, ASIGNATURA_SCHEMA)

    def test_create_asignatura_script_injection_codigo(self):
        """Verifica que create_asignatura rechaza script injection en código"""
        data = {
            'nombre': 'Matemáticas I',
            'codigo': 'MAT-101<script>',
            'creditos': 4,
        }
        with self.assertRaises(ValidationError):
            sanitize_dict(data, ASIGNATURA_SCHEMA)

    def test_create_asignatura_event_handler_codigo(self):
        """Verifica que create_asignatura rechaza event handlers en código"""
        data = {
            'nombre': 'Matemáticas I',
            'codigo': 'MAT-101" onclick="alert(1)',
            'creditos': 4,
        }
        with self.assertRaises(ValidationError):
            sanitize_dict(data, ASIGNATURA_SCHEMA)

    def test_create_asignatura_eval_injection(self):
        """Verifica que create_asignatura rechaza eval() injection"""
        data = {
            'nombre': 'eval("alert(1)")',
            'codigo': 'MAT-101',
            'creditos': 4,
        }
        with self.assertRaises(ValidationError):
            sanitize_dict(data, ASIGNATURA_SCHEMA)

    def test_create_asignatura_expression_injection(self):
        """Verifica que create_asignatura rechaza expression() injection"""
        data = {
            'nombre': 'expression(alert(1))',
            'codigo': 'MAT-101',
            'creditos': 4,
        }
        with self.assertRaises(ValidationError):
            sanitize_dict(data, ASIGNATURA_SCHEMA)

    def test_create_asignatura_vbscript_injection(self):
        """Verifica que create_asignatura rechaza vbscript: injection"""
        data = {
            'nombre': 'vbscript:alert(1)',
            'codigo': 'MAT-101',
            'creditos': 4,
        }
        with self.assertRaises(ValidationError):
            sanitize_dict(data, ASIGNATURA_SCHEMA)

    def test_create_asignatura_data_uri_injection(self):
        """Verifica que create_asignatura rechaza data: URI injection"""
        data = {
            'nombre': 'data:text/html,<script>alert(1)</script>',
            'codigo': 'MAT-101',
            'creditos': 4,
        }
        with self.assertRaises(ValidationError):
            sanitize_dict(data, ASIGNATURA_SCHEMA)

    def test_create_asignatura_body_onload(self):
        """Verifica que create_asignatura rechaza body onload"""
        data = {
            'nombre': '<body onload="alert(1)">',
            'codigo': 'MAT-101',
            'creditos': 4,
        }
        with self.assertRaises(ValidationError):
            sanitize_dict(data, ASIGNATURA_SCHEMA)

    def test_create_asignatura_input_onfocus(self):
        """Verifica que create_asignatura rechaza input onfocus"""
        data = {
            'nombre': '<input onfocus="alert(1)">',
            'codigo': 'MAT-101',
            'creditos': 4,
        }
        with self.assertRaises(ValidationError):
            sanitize_dict(data, ASIGNATURA_SCHEMA)

    def test_create_asignatura_form_onsubmit(self):
        """Verifica que create_asignatura rechaza form onsubmit"""
        data = {
            'nombre': '<form onsubmit="alert(1)">',
            'codigo': 'MAT-101',
            'creditos': 4,
        }
        with self.assertRaises(ValidationError):
            sanitize_dict(data, ASIGNATURA_SCHEMA)

    def test_update_asignatura_valid_input(self):
        """Verifica que update_asignatura acepta inputs válidos"""
        data = {
            'nombre': 'Matemáticas II',
            'codigo': 'MAT-102',
            'creditos': 4,
        }
        result = sanitize_dict(data, ASIGNATURA_SCHEMA)
        self.assertEqual(result['nombre'], 'Matemáticas II')

    def test_update_asignatura_script_injection(self):
        """Verifica que update_asignatura rechaza script injection"""
        data = {
            'nombre': '<script>alert("XSS")</script>',
        }
        with self.assertRaises(ValidationError):
            sanitize_dict(data, ASIGNATURA_SCHEMA)

    def test_update_asignatura_invalid_creditos(self):
        """Verifica que update_asignatura rechaza créditos inválidos"""
        data = {
            'creditos': 'not a number',
        }
        with self.assertRaises(ValidationError):
            sanitize_dict(data, ASIGNATURA_SCHEMA)

    def test_update_asignatura_creditos_out_of_range(self):
        """Verifica que update_asignatura rechaza créditos fuera de rango"""
        data = {
            'creditos': 100,  # Máximo es 10
        }
        with self.assertRaises(ValidationError):
            sanitize_dict(data, ASIGNATURA_SCHEMA)

    def test_asignatura_nombre_max_length(self):
        """Verifica que update_asignatura respeta max_length en nombre"""
        data = {
            'nombre': 'A' * 200,  # Máximo es 150
        }
        with self.assertRaises(ValidationError):
            sanitize_dict(data, ASIGNATURA_SCHEMA)

    def test_asignatura_codigo_max_length(self):
        """Verifica que update_asignatura respeta max_length en código"""
        data = {
            'codigo': 'A' * 50,  # Máximo es 20
        }
        with self.assertRaises(ValidationError):
            sanitize_dict(data, ASIGNATURA_SCHEMA)

    def test_asignatura_special_characters_in_nombre(self):
        """Verifica que nombre permite caracteres especiales válidos"""
        data = {
            'nombre': 'Matemáticas I - Álgebra',
            'codigo': 'MAT-101',
            'creditos': 4,
        }
        result = sanitize_dict(data, ASIGNATURA_SCHEMA)
        self.assertIn('Matemáticas', result['nombre'])
        self.assertIn('Álgebra', result['nombre'])

    def test_asignatura_html_entities_escaped(self):
        """Verifica que HTML entities son escapadas correctamente"""
        data = {
            'nombre': 'Test & <test>',
            'codigo': 'TST-101',
            'creditos': 3,
        }
        result = sanitize_dict(data, ASIGNATURA_SCHEMA)
        # El nombre debe tener entidades escapadas
        self.assertIn('&amp;', result['nombre'])
        self.assertIn('&lt;', result['nombre'])
