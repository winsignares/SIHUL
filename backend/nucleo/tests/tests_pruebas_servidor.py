import json
from io import StringIO

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase

from academico.sedes.models import Seccional, Sede
from identidad.componentes.models import Componente, ComponenteUsuario
from identidad.usuarios.models import Rol, Usuario


def _ejecutar(nombre, *args):
    salida = StringIO()
    call_command(nombre, *args, stdout=salida)
    return salida.getvalue()


class UsuarioDePruebasTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        Rol.objects.get_or_create(nombre='admin')
        Seccional.objects.get_or_create(ciudad='Barranquilla')
        for i in range(3):
            Componente.objects.get_or_create(nombre=f'Componente prueba {i}', defaults={'descripcion': 'x'})

    def test_crea_el_usuario_con_todos_los_modulos_y_muestra_la_clave_una_vez(self):
        texto = _ejecutar('crear_usuario_pruebas')
        usuario = Usuario.objects.get(correo='prueba.sistema@unilibre.edu.co')
        self.assertTrue(usuario.es_superusuario and usuario.activo)
        self.assertEqual(ComponenteUsuario.objects.filter(usuario=usuario).count(), Componente.objects.count())
        clave = [l for l in texto.splitlines() if 'clave:' in l][0].split('clave:')[1].strip()
        respuesta = self.client.post(
            '/api/usuarios/login/', json.dumps({'correo': usuario.correo, 'contrasena': clave}), content_type='application/json',
        )
        self.assertEqual(respuesta.status_code, 200)

    def test_restablecer_cambia_la_clave_y_no_duplica_permisos(self):
        _ejecutar('crear_usuario_pruebas')
        antes = ComponenteUsuario.objects.count()
        texto = _ejecutar('crear_usuario_pruebas')
        self.assertIn('restablecido', texto)
        self.assertEqual(ComponenteUsuario.objects.count(), antes)

    def test_el_correo_debe_empezar_por_prueba(self):
        with self.assertRaises(CommandError):
            call_command('crear_usuario_pruebas', '--correo', 'otra.persona@unilibre.edu.co', stdout=StringIO())

    def test_eliminar_borra_el_usuario(self):
        _ejecutar('crear_usuario_pruebas')
        _ejecutar('crear_usuario_pruebas', '--eliminar')
        self.assertFalse(Usuario.objects.filter(correo='prueba.sistema@unilibre.edu.co').exists())


class LimpiarPruebasTests(TestCase):
    def test_sin_confirmar_solo_cuenta(self):
        Sede.objects.create(nombre='PRUEBA-sede uno')
        texto = _ejecutar('limpiar_pruebas')
        self.assertIn('Sede: 1', texto)
        self.assertTrue(Sede.objects.filter(nombre='PRUEBA-sede uno').exists())

    def test_confirmar_borra_solo_lo_que_empieza_por_el_prefijo(self):
        Sede.objects.create(nombre='PRUEBA-sede dos')
        Sede.objects.create(nombre='prueba minuscula')
        real = Sede.objects.create(nombre='Sede real del sistema')
        parecida = Sede.objects.create(nombre='PRUEBAS PENALES')  # dato real que empieza por «PRUEBA» pero sin guion
        _ejecutar('limpiar_pruebas', '--confirmar')
        self.assertTrue(Sede.objects.filter(id=real.id).exists())
        self.assertTrue(Sede.objects.filter(id=parecida.id).exists())
        self.assertFalse(Sede.objects.filter(nombre__istartswith='PRUEBA-').exists())

    def test_tambien_borra_el_usuario_de_pruebas_y_sus_notificaciones(self):
        from notificaciones.models import Notificacion

        Rol.objects.get_or_create(nombre='admin')
        Seccional.objects.get_or_create(ciudad='Barranquilla')
        _ejecutar('crear_usuario_pruebas')
        usuario = Usuario.objects.get(correo='prueba.sistema@unilibre.edu.co')
        Notificacion.objects.create(id_usuario=usuario.id, tipo_notificacion='alerta', mensaje='x')
        _ejecutar('limpiar_pruebas', '--confirmar')
        self.assertFalse(Usuario.objects.filter(id=usuario.id).exists())
        self.assertFalse(Notificacion.objects.filter(id_usuario=usuario.id).exists())

    def test_rechaza_un_prefijo_corto(self):
        with self.assertRaises(CommandError):
            _ejecutar('limpiar_pruebas', '--prefijo', 'PRU', '--confirmar')

    def test_con_otro_prefijo_no_toca_lo_demas(self):
        Sede.objects.create(nombre='PRUEBA-aparte')
        Sede.objects.create(nombre='LOTE2 sede')
        _ejecutar('limpiar_pruebas', '--prefijo', 'LOTE2', '--confirmar')
        self.assertTrue(Sede.objects.filter(nombre='PRUEBA-aparte').exists())
        self.assertFalse(Sede.objects.filter(nombre='LOTE2 sede').exists())
