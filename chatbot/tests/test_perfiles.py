import unittest

from app.core import profiles
from app.core.sedes import Sede


class PerfilesTests(unittest.TestCase):
    def test_tipo_desconocido_o_vacio_usa_el_normativo(self):
        for tipo in (None, "", "  ", "raro"):
            self.assertEqual(profiles.get_profile(tipo).tipo, "normativo")

    def test_el_tipo_se_normaliza(self):
        self.assertEqual(profiles.get_profile(" INVESTIGATIVO ").tipo, "investigativo")

    def test_limite_de_documentos(self):
        self.assertEqual(profiles.max_documents({}), 10)
        self.assertEqual(profiles.max_documents({"tipo": "investigativo"}), 5)
        self.assertEqual(profiles.max_documents({"max_documentos": 3}), 3)
        self.assertEqual(profiles.max_documents({"max_documentos": 0}), 10)  # sin valor: el del perfil
        self.assertEqual(profiles.max_documents({"max_documentos": 50}), profiles.MAX_DOCUMENTS)
        self.assertEqual(profiles.max_documents({"max_documentos": 1}), profiles.MIN_DOCUMENTS)

    def test_solo_el_normativo_cita_la_fuente_principal(self):
        self.assertTrue(profiles.get_profile("normativo").cite_main_source)
        self.assertFalse(profiles.get_profile("investigativo").cite_main_source)

    def test_instrucciones_adicionales(self):
        perfil = profiles.get_profile("normativo")
        self.assertEqual(perfil.system_prompt(), perfil.prompt)
        self.assertEqual(perfil.system_prompt("   "), perfil.prompt)
        con_extra = perfil.system_prompt("responde corto")
        self.assertTrue(con_extra.startswith(perfil.prompt))
        self.assertIn("<<<\nresponde corto\n>>>", con_extra)
        self.assertIn("prevalecen las reglas", con_extra)

    def test_las_instrucciones_adicionales_se_recortan(self):
        perfil = profiles.get_profile("normativo")
        self.assertEqual(perfil.system_prompt("x" * 5000), perfil.system_prompt("x" * profiles.MAX_EXTRA_INSTRUCTIONS))

    def test_variante_para_la_cache_de_respuestas(self):
        normativo, investigativo = profiles.get_profile("normativo"), profiles.get_profile("investigativo")
        self.assertEqual(len(normativo.variant()), 8)
        self.assertEqual(normativo.variant(), normativo.variant(None))
        self.assertEqual(normativo.variant("a"), normativo.variant(" a "))
        self.assertNotEqual(normativo.variant(), normativo.variant("a"))
        self.assertNotEqual(normativo.variant(), investigativo.variant())


class SedesTests(unittest.TestCase):
    def test_sedes_disponibles(self):
        self.assertEqual(
            Sede.list(),
            ["nacional", "virtual", "el_socorro", "cali", "barranquilla", "bogota", "cucuta", "cartagena", "pereira"],
        )
