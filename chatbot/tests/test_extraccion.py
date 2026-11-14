import codecs
import unittest

import fitz

from app.services import text_extraction as te


def _pdf(paginas):
    doc = fitz.open()
    for texto in paginas:
        pagina = doc.new_page()
        if texto:
            pagina.insert_text((72, 100), texto)
    contenido = doc.tobytes()
    doc.close()
    return contenido


class ExtraerTextoTests(unittest.TestCase):
    def test_utf8_con_y_sin_bom(self):
        self.assertEqual(te.extract_text("Año nuevo".encode("utf-8"), "a.txt"), "Año nuevo")
        self.assertEqual(te.extract_text(b"\xef\xbb\xbfhola", "a.txt"), "hola")

    def test_windows_1252_y_utf16(self):
        self.assertEqual(te.extract_text("año".encode("cp1252"), "a.txt"), "año")
        self.assertEqual(te.extract_text("hola".encode("utf-16"), "a.txt"), "hola")
        self.assertEqual(te.extract_text(codecs.BOM_UTF16_BE + "hola".encode("utf-16-be"), "a.txt"), "hola")

    def test_archivo_vacio_o_binario_se_rechaza(self):
        for crudo, mensaje in ((b"", "vacío"), (b"  \n ", "vacío"), (b"a\x00b", "no parece ser de texto")):
            with self.assertRaises(te.IngestionError) as ctx:
                te.extract_text(crudo, "a.txt")
            self.assertEqual(ctx.exception.status_code, 422)
            self.assertIn(mensaje, str(ctx.exception))

    def test_csv_una_linea_por_fila_con_sus_encabezados(self):
        texto = te.extract_text(b"zona;horario\nNorte;8-12\nSur;14-18\n", "horarios.csv")
        self.assertEqual(texto, "- zona: Norte | horario: 8-12\n- zona: Sur | horario: 14-18")

    def test_csv_con_columnas_sin_nombre_y_filas_vacias(self):
        texto = te.extract_text(b"zona,\nNorte,8-12\n,\n", "x.csv")
        self.assertEqual(texto, "- zona: Norte | columna 2: 8-12")

    def test_csv_de_una_sola_fila(self):
        self.assertEqual(te.extract_text(b"solo,una,fila", "x.csv"), "solo | una | fila")

    def test_pdf_con_texto_lleva_marcas_de_pagina(self):
        texto = te.extract_text(_pdf(["ARTICULO uno", "ARTICULO dos"]), "a.pdf")
        self.assertIn("ARTICULO uno", texto)
        self.assertIn("ARTICULO dos", texto)
        self.assertIn("⟦p1⟧", texto)
        self.assertIn("⟦p2⟧", texto)
        self.assertNotIn("⟦p", te.strip_page_markers(texto))

    def test_pdf_sin_texto_se_rechaza(self):
        with self.assertRaises(te.IngestionError) as ctx:
            te.extract_text(_pdf([""]), "escaneado.pdf")
        self.assertEqual(ctx.exception.status_code, 422)
        self.assertIn("OCR", str(ctx.exception))

    def test_quitar_marcas_de_pagina(self):
        self.assertEqual(te.strip_page_markers("a\n⟦p2⟧\nb"), "a\nb")


REGLAMENTO = (
    "CAPÍTULO I\nDISPOSICIONES GENERALES\n"
    "ARTÍCULO 1. Objeto\nEste reglamento regula la convivencia.\n"
    "ARTÍCULO 2. Ámbito\nAplica a todos los estudiantes.\n"
    "CAPÍTULO II\nFALTAS\n"
    "ARTÍCULO 3. Faltas graves\nSon faltas graves:\n- Frecuentar billares.\n- Agredir a un compañero.\n"
    "Expedido en Bogotá\nFirman el rector."
)


class TroceoTests(unittest.TestCase):
    def test_cada_fragmento_lleva_la_ruta_de_su_seccion(self):
        self.assertEqual(
            te.chunk_text(REGLAMENTO, "reglamento.txt"),
            [
                "[CAPÍTULO I DISPOSICIONES GENERALES > ARTÍCULO 1.]\nObjeto\nEste reglamento regula la convivencia.",
                "[CAPÍTULO I DISPOSICIONES GENERALES > ARTÍCULO 2.]\nÁmbito\nAplica a todos los estudiantes.",
                "[CAPÍTULO II FALTAS > ARTÍCULO 3.]\nFaltas graves\nSon faltas graves:\n"
                "- Frecuentar billares.\n- Agredir a un compañero.",
                "[FIRMAS Y EXPEDICIÓN]\nExpedido en Bogotá\nFirman el rector.",
            ],
        )

    def test_texto_sin_encabezados_se_trocea_sin_prefijo(self):
        self.assertEqual(te.chunk_text("Solo un párrafo.\nOtra línea.", "nota.txt"), ["Solo un párrafo.\nOtra línea."])

    def test_texto_vacio_no_da_fragmentos(self):
        self.assertEqual(te.chunk_text("", "x.txt"), [])
        self.assertEqual(te.chunk_text("\n  \n", "x.txt"), [])

    def test_csv_agrupa_filas_completas_con_el_nombre_del_archivo(self):
        contenido = te.extract_text(b"zona;horario\nNorte;8-12\nSur;14-18\n", "x.csv")
        self.assertEqual(te.chunk_text(contenido, "x.csv"), ["[x.csv]\n- zona: Norte | horario: 8-12\n- zona: Sur | horario: 14-18"])

    def test_csv_largo_no_parte_ninguna_fila(self):
        filas = [f"- zona: Z{i:03d} | horario: " + "h" * 80 for i in range(40)]
        fragmentos = te.chunk_text("\n".join(filas), "grande.csv")
        self.assertGreater(len(fragmentos), 1)
        for fragmento in fragmentos:
            self.assertTrue(fragmento.startswith("[grande.csv]\n"))
            self.assertLessEqual(len(fragmento), te._settings.CHUNK_SIZE + len("[grande.csv]\n") + 1)
        recompuesto = "\n".join(f.split("\n", 1)[1] for f in fragmentos)
        self.assertEqual(recompuesto.split("\n"), filas)

    def test_la_pagina_es_la_del_inicio_del_fragmento(self):
        contenido = "⟦p1⟧\nARTÍCULO 1. A\nuno\n⟦p2⟧\nARTÍCULO 2. B\ndos"
        self.assertEqual(
            te.chunk_text_with_pages(contenido, "x.pdf"),
            [("[ARTÍCULO 1. A]\nuno", 1), ("[ARTÍCULO 2. B]\ndos", 2)],
        )

    def test_sin_marcas_la_pagina_es_none(self):
        self.assertEqual(te.chunk_text_with_pages("ARTÍCULO 1. A\nuno", "x.txt"), [("[ARTÍCULO 1. A]\nuno", None)])

    def test_encabezado_de_articulo_partido_en_varias_lineas(self):
        self.assertEqual(
            te._join_split_headings(["ARTÍCULO", "17.", "DEL TÍTULO", "texto"]),
            ["ARTÍCULO 17. DEL TÍTULO", "texto"],
        )

    def test_articulo_con_texto_en_la_misma_linea(self):
        fragmentos = te.chunk_text("ARTÍCULO 88. Los costos educativos se pagan en cuotas.", "x.txt")
        self.assertEqual(fragmentos, ["[ARTÍCULO 88.]\nLos costos educativos se pagan en cuotas."])

    def test_la_ingesta_completa_de_un_pdf(self):
        crudo = _pdf(["ARTICULO 1. Objeto", "ARTICULO 2. Ambito"])
        fragmentos = te.chunk_text_with_pages(te.extract_text(crudo, "r.pdf"), "r.pdf")
        self.assertEqual([pagina for _, pagina in fragmentos], [1, 2])
        for fragmento, _ in fragmentos:
            self.assertNotIn("⟦p", fragmento)


if __name__ == "__main__":
    unittest.main()
