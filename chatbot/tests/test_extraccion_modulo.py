"""Extracción y troceado del texto: interfaz pública (caracterización).

Los servicios y routers importan estos nombres de `app.services.text_extraction`; el comportamiento de la extracción
y del troceado ya se prueba en `test_extraccion.py`.
"""
import unittest

from app.services import text_extraction as te


class InterfazPublicaTest(unittest.TestCase):
    def test_los_nombres_que_usan_los_servicios_siguen_disponibles(self):
        for nombre in ('IngestionError', 'extract_text', 'strip_page_markers', 'chunk_text', 'chunk_text_with_pages'):
            with self.subTest(nombre):
                self.assertTrue(hasattr(te, nombre))

    def test_el_error_de_ingesta_lleva_su_codigo_http(self):
        self.assertEqual(te.IngestionError('x').status_code, 422)
        self.assertEqual(te.IngestionError('x', 413).status_code, 413)
        self.assertIsInstance(te.IngestionError('x'), Exception)

    def test_las_marcas_de_pagina_se_quitan(self):
        self.assertEqual(te.strip_page_markers('⟦p1⟧\nhola\n⟦p2⟧\nmundo'), 'hola\nmundo')

    def test_un_texto_plano_se_extrae_y_se_trocea_con_su_archivo(self):
        texto = te.extract_text('Primera línea\nSegunda línea'.encode('utf-8'), 'nota.txt')
        self.assertEqual(texto, 'Primera línea\nSegunda línea')
        self.assertEqual(te.chunk_text(texto, 'nota.txt'), ['Primera línea\nSegunda línea'])

    def test_un_csv_se_convierte_en_una_linea_por_fila(self):
        texto = te.extract_text('zona;horario\nNorte;8-12\nSur;2-6'.encode('utf-8'), 'datos.csv')
        self.assertEqual(texto, '- zona: Norte | horario: 8-12\n- zona: Sur | horario: 2-6')
        self.assertEqual(te.chunk_text(texto, 'datos.csv'), ['[datos.csv]\n' + texto])

    def test_un_archivo_vacio_o_binario_se_rechaza(self):
        with self.assertRaises(te.IngestionError):
            te.extract_text(b'   ', 'vacio.txt')
        with self.assertRaises(te.IngestionError):
            te.extract_text(b'abc\x00def', 'raro.txt')
