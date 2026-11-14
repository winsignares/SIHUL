"""Acceso directo del navegador al chat: token firmado, límite por usuario y flujo de la pregunta.

Sin base de datos, Redis ni OpenAI: la base y el RAG se reemplazan por dobles.
"""
import asyncio
import time
import unittest
from types import SimpleNamespace
from unittest import mock

import openai
from fastapi import HTTPException

from app.core import limites
from app.core.config import get_settings
from app.core.sedes import normalizar_sede
from app.core.token import TokenInvalido, firmar_token, verificar_token
from app.routers import directo

SECRETO = "secreto-de-prueba-con-largo-suficiente-123456"
AUDIENCIA = "sihul-chatbot"


def _datos(**cambios):
    datos = {"sub": "42", "nombre": "Ana Pérez", "sede": "barranquilla", "aud": AUDIENCIA, "exp": time.time() + 300}
    datos.update(cambios)
    return datos


class TokenTests(unittest.TestCase):
    def test_un_token_valido_entrega_usuario_nombre_y_sede(self):
        token = firmar_token(_datos(), SECRETO)
        self.assertEqual(verificar_token(token, SECRETO, AUDIENCIA),
                         {"id_usuario": 42, "nombre": "Ana Pérez", "sede": "barranquilla"})

    def test_acepta_el_token_de_referencia_que_emite_django(self):
        # El mismo valor que fija backend/chatbot/tests_acceso_directo.py: los dos servicios comparten el formato
        token = (
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MiIsIm5vbWJyZSI6IkFuYSBQXHUwMGU5cmV6Iiwic2VkZSI6ImJhcnJhbnF1a'
            'WxsYSIsImF1ZCI6InNpaHVsLWNoYXRib3QiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDAwMDYwMH0.SRThj-JCIBuiabxoQc3EIvXiUAwywBbDsdDjbzTQs_c'
        )
        self.assertEqual(verificar_token(token, SECRETO, AUDIENCIA, ahora=1700000100),
                         {'id_usuario': 42, 'nombre': 'Ana Pérez', 'sede': 'barranquilla'})
        with self.assertRaises(TokenInvalido):
            verificar_token(token, SECRETO, AUDIENCIA, ahora=1700000600)

    def test_rechaza_firma_ajena_y_cuerpo_alterado(self):
        token = firmar_token(_datos(), SECRETO)
        with self.assertRaises(TokenInvalido):
            verificar_token(token, "otro-secreto-distinto-del-servidor-000000", AUDIENCIA)
        cabecera, cuerpo, firma = token.split(".")
        manipulado = firmar_token(_datos(sub="1"), SECRETO).split(".")[1]
        with self.assertRaises(TokenInvalido):
            verificar_token(f"{cabecera}.{manipulado}.{firma}", SECRETO, AUDIENCIA)

    def test_rechaza_token_vencido_con_mensaje_para_el_usuario(self):
        token = firmar_token(_datos(exp=time.time() - 1), SECRETO)
        with self.assertRaises(TokenInvalido) as ctx:
            verificar_token(token, SECRETO, AUDIENCIA)
        self.assertEqual(ctx.exception.codigo, 401)
        self.assertIn("venció", ctx.exception.mensaje)

    def test_rechaza_audiencia_equivocada_y_datos_incompletos(self):
        for cambios in ({"aud": "otro"}, {"exp": None}, {"exp": "mañana"}, {"sub": "abc"}, {"sub": None},
                        {"sede": "marte"}, {"nombre": " "}):
            with self.subTest(cambios):
                with self.assertRaises(TokenInvalido):
                    verificar_token(firmar_token(_datos(**cambios), SECRETO), SECRETO, AUDIENCIA)

    def test_no_acepta_el_algoritmo_none_ni_basura(self):
        import base64
        import json

        def b64(d):
            return base64.urlsafe_b64encode(json.dumps(d).encode()).rstrip(b"=").decode()

        sin_firma = f"{b64({'alg': 'none', 'typ': 'JWT'})}.{b64(_datos())}."
        for token in (sin_firma, "", "a.b", "a.b.c.d", "no es un token", None):
            with self.subTest(token):
                with self.assertRaises(TokenInvalido):
                    verificar_token(token, SECRETO, AUDIENCIA)


class LimitadorTests(unittest.TestCase):
    def setUp(self):
        self.redis = mock.patch.object(limites, "get_redis", return_value=None)
        self.redis.start()
        self.addCleanup(self.redis.stop)

    def test_permite_hasta_el_maximo_y_luego_pide_esperar(self):
        limitador = limites.LimitadorPorClave(maximo=2, ventana_segundos=60)
        self.assertEqual(asyncio.run(limitador.permitir("1")), (True, 0))
        self.assertEqual(asyncio.run(limitador.permitir("1")), (True, 0))
        permitido, espera = asyncio.run(limitador.permitir("1"))
        self.assertFalse(permitido)
        self.assertTrue(1 <= espera <= 61)

    def test_cada_usuario_tiene_su_propia_cuenta(self):
        limitador = limites.LimitadorPorClave(maximo=1, ventana_segundos=60)
        self.assertTrue(asyncio.run(limitador.permitir("1"))[0])
        self.assertTrue(asyncio.run(limitador.permitir("2"))[0])
        self.assertFalse(asyncio.run(limitador.permitir("1"))[0])

    def test_vuelve_a_permitir_al_pasar_la_ventana(self):
        limitador = limites.LimitadorPorClave(maximo=1, ventana_segundos=60)
        with mock.patch.object(limites.time, "monotonic", return_value=1000.0):
            self.assertTrue(asyncio.run(limitador.permitir("1"))[0])
        with mock.patch.object(limites.time, "monotonic", return_value=1030.0):
            self.assertFalse(asyncio.run(limitador.permitir("1"))[0])
        with mock.patch.object(limites.time, "monotonic", return_value=1061.0):
            self.assertTrue(asyncio.run(limitador.permitir("1"))[0])

    def test_un_fallo_de_redis_no_impide_preguntar(self):
        class RedisCaido:
            async def incr(self, *_):
                raise ConnectionError("sin Redis")

        limitador = limites.LimitadorPorClave(maximo=1, ventana_segundos=60)
        with mock.patch.object(limites, "get_redis", return_value=RedisCaido()):
            self.assertTrue(asyncio.run(limitador.permitir("1"))[0])
            self.assertFalse(asyncio.run(limitador.permitir("1"))[0])


class NormalizarSedeTests(unittest.TestCase):
    def test_misma_regla_que_django(self):
        self.assertEqual(normalizar_sede("El Socorro"), "el_socorro")
        self.assertEqual(normalizar_sede(" Bogotá "), "bogota")
        self.assertEqual(normalizar_sede("Cúcuta"), "cucuta")
        self.assertIsNone(normalizar_sede("Marte"))
        self.assertIsNone(normalizar_sede(None))


class AutenticacionTests(unittest.TestCase):
    def _con_clave(self, clave=SECRETO):
        ajustes = SimpleNamespace(CHATBOT_TOKEN_SECRET=clave, CHATBOT_TOKEN_AUDIENCE=AUDIENCIA)
        return mock.patch.object(directo, "get_settings", return_value=ajustes)

    def test_sin_clave_configurada_responde_503(self):
        with self._con_clave(None):
            with self.assertRaises(HTTPException) as ctx:
                asyncio.run(directo.usuario_autenticado("Bearer x"))
        self.assertEqual(ctx.exception.status_code, 503)

    def test_exige_el_encabezado_bearer(self):
        with self._con_clave():
            for encabezado in (None, "", "Bearer", "Basic abc", "Bearer   "):
                with self.subTest(encabezado):
                    with self.assertRaises(HTTPException) as ctx:
                        asyncio.run(directo.usuario_autenticado(encabezado))
                    self.assertEqual(ctx.exception.status_code, 401)

    def test_un_token_valido_entrega_al_usuario_y_uno_malo_responde_401(self):
        with self._con_clave():
            usuario = asyncio.run(directo.usuario_autenticado(f"Bearer {firmar_token(_datos(), SECRETO)}"))
            self.assertEqual((usuario.id_usuario, usuario.nombre, usuario.sede), (42, "Ana Pérez", "barranquilla"))
            with self.assertRaises(HTTPException) as ctx:
                asyncio.run(directo.usuario_autenticado("Bearer abc.def.ghi"))
            self.assertEqual(ctx.exception.status_code, 401)


class FalsaBase:
    def __init__(self):
        self.confirmaciones = 0

    async def commit(self):
        self.confirmaciones += 1


class PreguntaDirectaTests(unittest.TestCase):
    USUARIO = directo.UsuarioDelToken(id_usuario=42, nombre="Ana Pérez", sede="barranquilla")

    def setUp(self):
        self.db = FalsaBase()
        self.guardadas = []
        self.usos = []
        mensaje = SimpleNamespace(answer="Respuesta del RAG")
        self.ask = mock.AsyncMock(return_value=(mensaje, [{"id": 7}, {"id": "x"}]))

        async def guardar(db, **datos):
            self.guardadas.append(datos)
            return 99, __import__("datetime").datetime(2026, 11, 11, 15, 30, tzinfo=__import__("datetime").timezone.utc)

        async def usos(db, sugerida, agente):
            self.usos.append((sugerida, agente))

        parches = [
            mock.patch.object(directo, "ask", self.ask),
            mock.patch.object(directo, "get_chatbot", mock.AsyncMock(
                return_value={"id": 3, "activo": True, "tipo": "normativo", "instrucciones_adicionales": "Sé breve"})),
            mock.patch.object(directo.directo_service, "seccionales_del_chatbot", mock.AsyncMock(return_value=set())),
            mock.patch.object(directo.directo_service, "registrar_uso_pregunta_sugerida", usos),
            mock.patch.object(directo.directo_service, "anexos_validos", mock.AsyncMock(
                return_value=[{"id": 7, "nombre": "guia.pdf", "tipo_mime": "application/pdf", "tamano": 1234}])),
            mock.patch.object(directo.directo_service, "guardar_conversacion", guardar),
            mock.patch.object(directo, "_limitador", limites.LimitadorPorClave(maximo=100)),
            mock.patch.object(limites, "get_redis", return_value=None),
        ]
        for parche in parches:
            parche.start()
            self.addCleanup(parche.stop)

    def preguntar(self, **cuerpo):
        datos = {"agente_id": 3, "pregunta": "  ¿Cuándo es la matrícula?  "}
        datos.update(cuerpo)
        return asyncio.run(directo.preguntar(directo.PreguntaDirecta(**datos), usuario=self.USUARIO, db=self.db))

    def test_responde_guarda_la_conversacion_y_devuelve_los_anexos_validados(self):
        r = self.preguntar(pregunta_sugerida_id=5)
        self.assertEqual((r.id, r.respuesta, r.mensaje, r.usuario, r.error), (99, "Respuesta del RAG", "¿Cuándo es la matrícula?", "Ana Pérez", None))
        self.assertEqual([(a.id, a.nombre, a.tipo, a.tamano) for a in r.anexos], [(7, "guia.pdf", "application/pdf", 1234)])
        self.assertEqual(self.usos, [(5, 3)])
        llamada = self.ask.await_args.kwargs
        self.assertEqual((llamada["nombre"], llamada["chatbot_id"], llamada["id_usuario"], llamada["question"]),
                         ("Ana Pérez", 3, 42, "¿Cuándo es la matrícula?"))
        self.assertEqual(llamada["sede"].value, "barranquilla")
        self.assertEqual(llamada["instrucciones"], "Sé breve")
        guardado = self.guardadas[0]
        self.assertEqual((guardado["chatbot_id"], guardado["id_usuario"], guardado["usuario"], guardado["respuesta"]),
                         (3, 42, "Ana Pérez", "Respuesta del RAG"))
        self.assertEqual(self.db.confirmaciones, 2)  # el contador de la sugerida y la conversación

    def test_el_hilo_se_conserva_si_es_valido_y_se_crea_si_no(self):
        hilo = "8b6f1a6e-1d4e-4a43-9a0a-6f6c5a1f2a11"
        self.assertEqual(self.preguntar(chat_id=hilo).chat_id, hilo)
        nuevo = self.preguntar(chat_id="no-es-un-uuid").chat_id
        self.assertNotEqual(nuevo, "no-es-un-uuid")
        self.assertEqual(len(nuevo), 36)

    def test_pregunta_vacia_o_demasiado_larga(self):
        with self.assertRaises(HTTPException) as ctx:
            self.preguntar(pregunta="   ")
        self.assertEqual(ctx.exception.status_code, 400)
        with self.assertRaises(HTTPException) as ctx:
            self.preguntar(pregunta="a" * (get_settings().DIRECTO_PREGUNTA_MAX_CARACTERES + 1))
        self.assertEqual(ctx.exception.status_code, 413)

    def test_un_chatbot_inexistente_inactivo_o_de_otra_seccional(self):
        with mock.patch.object(directo, "get_chatbot", mock.AsyncMock(return_value=None)):
            with self.assertRaises(HTTPException) as ctx:
                self.preguntar()
        self.assertEqual(ctx.exception.status_code, 404)
        with mock.patch.object(directo, "get_chatbot", mock.AsyncMock(return_value={"id": 3, "activo": False})):
            with self.assertRaises(HTTPException) as ctx:
                self.preguntar()
        self.assertEqual(ctx.exception.status_code, 404)
        with mock.patch.object(directo.directo_service, "seccionales_del_chatbot", mock.AsyncMock(return_value={"cali"})):
            with self.assertRaises(HTTPException) as ctx:
                self.preguntar()
        self.assertEqual(ctx.exception.status_code, 403)
        self.ask.assert_not_awaited()

    def test_un_chatbot_de_la_seccional_del_usuario_responde(self):
        with mock.patch.object(directo.directo_service, "seccionales_del_chatbot",
                               mock.AsyncMock(return_value={"barranquilla", "cali"})):
            self.assertEqual(self.preguntar().respuesta, "Respuesta del RAG")

    def test_el_limite_por_usuario_responde_429_con_reintento(self):
        with mock.patch.object(directo, "_limitador", limites.LimitadorPorClave(maximo=1)):
            self.preguntar()
            with self.assertRaises(HTTPException) as ctx:
                self.preguntar()
        self.assertEqual(ctx.exception.status_code, 429)
        self.assertIn("Retry-After", ctx.exception.headers)
        self.assertEqual(self.ask.await_count, 1)

    def test_un_fallo_de_la_ia_se_muestra_pero_no_se_guarda(self):
        for error in (openai.APIConnectionError(request=mock.Mock()), RuntimeError("falló")):
            with self.subTest(type(error).__name__):
                self.ask.side_effect = error
                with self.assertLogs("uvicorn.error", level="WARNING"):
                    r = self.preguntar()
                self.assertEqual(r.error, "servicio_no_disponible")
                self.assertEqual(r.respuesta, directo.MENSAJE_ERROR_RAG)
                self.assertTrue(str(r.id).startswith("error-"))
                self.assertEqual(self.guardadas, [])

    def test_una_respuesta_vacia_se_muestra_como_error_y_no_se_guarda(self):
        self.ask.return_value = (SimpleNamespace(answer="  "), [])
        with self.assertLogs("uvicorn.error", level="WARNING"):
            r = self.preguntar()
        self.assertEqual(r.error, "respuesta_vacia")
        self.assertEqual(self.guardadas, [])


if __name__ == "__main__":
    unittest.main()
