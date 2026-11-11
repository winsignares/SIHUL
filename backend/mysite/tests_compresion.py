"""Compresión de las respuestas JSON.

Las respuestas JSON grandes se comprimen con gzip cuando el cliente lo acepta (los navegadores lo hacen siempre); el
contenido es el mismo. Sin `Accept-Encoding: gzip`, los archivos (PDF, Excel) y las respuestas pequeñas no cambian.
"""
import gzip
import json

from django.test import TestCase
from rest_framework.test import APIClient

from espacios.models import EspacioFisico, TipoEspacio
from sedes.models import Seccional, Sede
from usuarios.models import Rol, Usuario


class CompresionTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        seccional = Seccional.objects.create(ciudad='Barranquilla')
        sede = Sede.objects.create(nombre='Sede BQ', seccional=seccional)
        tipo = TipoEspacio.objects.create(nombre='Aula')
        EspacioFisico.objects.bulk_create([
            EspacioFisico(sede=sede, tipo=tipo, nombre=f'Aula {i:03d}', capacidad=30, ubicacion='Bloque A, piso 2')
            for i in range(60)
        ])
        cls.super = Usuario.objects.create_user(
            correo='super@prueba.test', nombre='Super', rol=Rol.objects.create(nombre='admin'), sede=sede,
            es_superusuario=True)

    def cliente(self, **cabeceras):
        client = APIClient(HTTP_HOST='localhost', **cabeceras)
        session = client.session
        session['user_id'] = self.super.id
        session.save()
        return client

    def test_sin_aceptar_gzip_la_respuesta_no_cambia(self):
        r = self.cliente().get('/api/espacios/')
        self.assertEqual(r.status_code, 200)
        self.assertNotIn('Content-Encoding', r)
        self.assertEqual(len(r.json()), 60)

    def test_los_archivos_no_se_comprimen(self):
        r = self.cliente(HTTP_ACCEPT_ENCODING='gzip, deflate, br').post(
            '/api/espacios/reporte/capacidad/pdf/', {}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r['Content-Type'].startswith('application/pdf'))
        self.assertTrue(b''.join(r.streaming_content).startswith(b'%PDF'))
        self.assertNotIn('Content-Encoding', r)

    def test_las_respuestas_pequenas_no_se_comprimen(self):
        r = self.cliente(HTTP_ACCEPT_ENCODING='gzip').get('/api/seccionales/')
        self.assertEqual(r.status_code, 200)
        self.assertLess(len(r.content), 200)
        self.assertNotIn('Content-Encoding', r)

    def test_el_json_grande_se_comprime_con_el_mismo_contenido(self):
        plano = self.cliente().get('/api/espacios/')
        r = self.cliente(HTTP_ACCEPT_ENCODING='gzip, deflate, br').get('/api/espacios/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r['Content-Encoding'], 'gzip')
        self.assertIn('Accept-Encoding', r['Vary'])
        self.assertLess(len(r.content), len(plano.content))
        self.assertEqual(json.loads(gzip.decompress(r.content)), plano.json())
