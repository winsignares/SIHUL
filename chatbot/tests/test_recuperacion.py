"""Reglas de recuperación y de armado del contexto (sin base de datos ni OpenAI)."""
import unittest
from datetime import datetime
from types import SimpleNamespace as Fila

from app.core.sedes import Sede
from app.services import chat_service as chat
from app.services import qa_service as qa


def fila(id, documento, similitud, texto="t", pagina=None, nombre=None, prioridad=None, n_docs=1):
    return Fila(id=id, document_id=documento, similarity=similitud, text=texto, page=pagina,
                filename=nombre or f"doc{documento}.pdf", created_at=None, prioridad=prioridad, n_docs=n_docs)


class ClaveDeCacheTests(unittest.TestCase):
    def test_la_pregunta_se_normaliza(self):
        a = chat._answer_cache_key(1, Sede.CALI, "  ¿Cuántas   FALTAS hay? ", "abc")
        b = chat._answer_cache_key(1, Sede.CALI, "¿cuántas faltas hay?", "abc")
        self.assertEqual(a, b)
        self.assertTrue(a.startswith("chatbot:1:cali:answer:abc:"))

    def test_cambia_con_el_chatbot_la_sede_y_la_variante(self):
        base = chat._answer_cache_key(1, Sede.CALI, "hola", "abc")
        self.assertNotEqual(base, chat._answer_cache_key(2, Sede.CALI, "hola", "abc"))
        self.assertNotEqual(base, chat._answer_cache_key(1, Sede.BOGOTA, "hola", "abc"))
        self.assertNotEqual(base, chat._answer_cache_key(1, Sede.CALI, "hola", "xyz"))


class ModeloPorPreguntaTests(unittest.TestCase):
    def test_preguntas_de_listas_usan_el_modelo_de_listas(self):
        for pregunta in ("¿Cuáles son los requisitos de grado?", "¿Cuántas faltas graves hay?",
                         "Enumera las faltas", "dame la lista de requisitos", "¿Cuántos son en total?",
                         "todas las sedes"):
            self.assertEqual(chat._model_for(pregunta), chat._settings.CHAT_MODEL_LISTS, pregunta)

    def test_el_resto_usa_el_modelo_economico(self):
        for pregunta in ("¿Cuántas horas dura la inducción?", "¿Cuándo empiezan las clases?", "hola"):
            self.assertEqual(chat._model_for(pregunta), chat._settings.CHAT_MODEL, pregunta)


class AyudantesDeFragmentosTests(unittest.TestCase):
    def test_normalizado(self):
        self.assertEqual(chat._normalized("  Hola \n  MUNDO "), "hola mundo")

    def test_ruta_de_seccion(self):
        self.assertEqual(chat._section("[TÍTULO I > ARTÍCULO 1.]\ntexto"), "[TÍTULO I > ARTÍCULO 1.]")
        self.assertIsNone(chat._section("[x.csv]\n- a: b"))
        self.assertIsNone(chat._section("sin ruta"))


class PrioridadTests(unittest.TestCase):
    def test_bono_por_prioridad(self):
        self.assertEqual(chat._priority_bonus(Fila(n_docs=5, prioridad=1)), chat.PRIORITY_BOOST)
        self.assertEqual(chat._priority_bonus(Fila(n_docs=5, prioridad=5)), 0.0)
        self.assertAlmostEqual(chat._priority_bonus(Fila(n_docs=5, prioridad=3)), chat.PRIORITY_BOOST / 2)

    def test_sin_bono_con_un_solo_documento_o_sin_prioridad(self):
        self.assertEqual(chat._priority_bonus(Fila(n_docs=1, prioridad=1)), 0.0)
        self.assertEqual(chat._priority_bonus(Fila(n_docs=None, prioridad=1)), 0.0)
        self.assertEqual(chat._priority_bonus(Fila(n_docs=4, prioridad=None)), 0.0)


class FuentesCitadasTests(unittest.TestCase):
    def test_sin_fragmentos_no_hay_fuentes(self):
        self.assertEqual(chat._cited_sources([]), [])

    def test_fuente_principal_y_otra_casi_igual_de_relevante(self):
        relevantes = [fila(1, 1, 0.80, pagina=3), fila(2, 1, 0.79, pagina=4), fila(3, 2, 0.75, pagina=9)]
        self.assertEqual(chat._cited_sources(relevantes), [("doc1.pdf", 3), ("doc2.pdf", 9)])

    def test_otro_documento_poco_relevante_no_se_cita(self):
        relevantes = [fila(1, 1, 0.80, pagina=3), fila(2, 2, 0.50, pagina=9)]
        self.assertEqual(chat._cited_sources(relevantes), [("doc1.pdf", 3)])

    def test_el_resultado_lexico_no_cuenta_como_segunda_fuente(self):
        lexico = chat._KeywordHit(fila(2, 2, 0.0, pagina=9), 0.80)
        self.assertEqual(chat._cited_sources([fila(1, 1, 0.80, pagina=3), lexico]), [("doc1.pdf", 3)])

    def test_maximo_dos_documentos(self):
        relevantes = [fila(1, 1, 0.80), fila(2, 2, 0.80), fila(3, 3, 0.80)]
        self.assertEqual(len(chat._cited_sources(relevantes)), chat.MAX_CITED_DOCUMENTS)

    def test_la_prioridad_puede_desempatar(self):
        relevantes = [fila(1, 1, 0.80, prioridad=1, n_docs=3), fila(2, 2, 0.74, prioridad=3, n_docs=3)]
        self.assertEqual(chat._cited_sources(relevantes), [("doc1.pdf", None)])
        relevantes = [fila(1, 1, 0.80, prioridad=3, n_docs=3), fila(2, 2, 0.74, prioridad=1, n_docs=3)]
        self.assertEqual(len(chat._cited_sources(relevantes)), 2)


class ReservaPorDocumentoTests(unittest.TestCase):
    def test_un_documento_no_ocupa_todos_los_puestos(self):
        relevantes = [fila(i, 1, 0.90 - i * 0.01, texto=f"a{i}") for i in range(1, 9)]
        vistos = {chat._normalized(r.text) for r in relevantes}
        otras = [fila(20, 2, 0.85, texto="b1"), fila(21, 3, 0.80, texto="c1")]
        chat._reserve_per_document(relevantes, relevantes + otras, vistos, min_sim=0.40, k=8)
        documentos = [r.document_id for r in relevantes]
        self.assertEqual(len(relevantes), 8)
        self.assertEqual(documentos[:5], [1] * 5)  # las semillas no se tocan
        self.assertIn(2, documentos)
        self.assertIn(3, documentos)

    def test_no_reserva_para_fragmentos_poco_relevantes(self):
        relevantes = [fila(1, 1, 0.90, texto="a1")]
        vistos = {"a1"}
        chat._reserve_per_document(relevantes, relevantes + [fila(2, 2, 0.50, texto="b1")], vistos, min_sim=0.40, k=8)
        self.assertEqual([r.document_id for r in relevantes], [1])

    def test_sin_relevantes_no_hace_nada(self):
        relevantes = []
        chat._reserve_per_document(relevantes, [fila(1, 1, 0.9)], set(), min_sim=0.4, k=8)
        self.assertEqual(relevantes, [])


class PreguntasFrecuentesTests(unittest.TestCase):
    def hit(self, id, pregunta, respuesta, anexos=()):
        return qa.QAHit(id=id, pregunta=pregunta, respuesta=respuesta, actualizado=datetime(2026, 11, 3),
                        similarity=0.9, best_similarity=0.9, anexos=list(anexos))

    def test_hash_normaliza_la_pregunta(self):
        self.assertEqual(qa._hash("  ¿Cómo   pago? "), qa._hash("¿cómo pago?"))
        self.assertNotEqual(qa._hash("¿cómo pago?"), qa._hash("¿cómo cancelo?"))
        self.assertEqual(len(qa._hash("x")), 64)

    def test_la_pareja_elegida_va_primero_y_es_la_unica_con_anexos(self):
        a = self.hit(1, "¿Cómo pago?", "En caja.", [{"nombre": "formato.pdf"}])
        b = self.hit(2, "¿Cómo cancelo?", "En registro.", [{"nombre": "otro.pdf"}])
        bloques = qa.context_blocks([a, b], chosen=b)
        self.assertEqual(len(bloques), 2)
        self.assertIn("Pregunta: ¿Cómo cancelo?", bloques[0])
        self.assertIn("otro.pdf", bloques[0])
        self.assertIn("actualizada: 2026-11-03", bloques[0])
        self.assertNotIn("formato.pdf", bloques[1])
        self.assertNotIn("Documentos de soporte", bloques[1])

    def test_sin_elegida_ninguna_menciona_anexos(self):
        a = self.hit(1, "¿Cómo pago?", "En caja.", [{"nombre": "formato.pdf"}])
        self.assertNotIn("formato.pdf", qa.context_blocks([a])[0])


if __name__ == "__main__":
    unittest.main()
