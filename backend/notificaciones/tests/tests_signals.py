"""Señales de notificaciones: caracterización del comportamiento actual.

Cada alta, cambio o baja de los catálogos del sistema deja una notificación al usuario que actúa (o al administrador,
id 1, si no hay usuario en la petición). Las señales se registran al arrancar la aplicación: la primera prueba fija
cuáles son, para que reorganizar el módulo no pierda ni duplique ninguna.
"""
import logging
import weakref
from unittest import mock

from django.apps import apps
from django.contrib.auth.models import AnonymousUser
from django.db.models.signals import post_delete, post_save
from django.test import RequestFactory, SimpleTestCase, TestCase

from identidad.componentes.models import Componente
from academico.facultades.models import Facultad
from notificaciones import signals
from notificaciones.models import Notificacion
from academico.sedes.models import Sede
from identidad.usuarios.models import Rol, Usuario

RECEPTORES = [
        ('post_save', 'Usuario', 'usuario_post_save'),
        ('post_delete', 'Usuario', 'usuario_post_delete'),
        ('post_save', 'Rol', 'rol_post_save'),
        ('post_delete', 'Rol', 'rol_post_delete'),
        ('post_save', 'Sede', 'sede_post_save'),
        ('post_delete', 'Sede', 'sede_post_delete'),
        ('post_save', 'Facultad', 'facultad_post_save'),
        ('post_delete', 'Facultad', 'facultad_post_delete'),
        ('post_save', 'Programa', 'programa_post_save'),
        ('post_delete', 'Programa', 'programa_post_delete'),
        ('post_save', 'Asignatura', 'asignatura_post_save'),
        ('post_delete', 'Asignatura', 'asignatura_post_delete'),
        ('post_save', 'AsignaturaPrograma', 'asignatura_programa_post_save'),
        ('post_delete', 'AsignaturaPrograma', 'asignatura_programa_post_delete'),
        ('post_save', 'PeriodoAcademico', 'periodo_post_save'),
        ('post_delete', 'PeriodoAcademico', 'periodo_post_delete'),
        ('post_save', 'Grupo', 'grupo_post_save'),
        ('post_delete', 'Grupo', 'grupo_post_delete'),
        ('post_save', 'TipoEspacio', 'tipo_espacio_post_save'),
        ('post_delete', 'TipoEspacio', 'tipo_espacio_post_delete'),
        ('post_save', 'EspacioFisico', 'espacio_post_save'),
        ('post_delete', 'EspacioFisico', 'espacio_post_delete'),
        ('post_save', 'EspacioPermitido', 'espacio_permitido_post_save'),
        ('post_delete', 'EspacioPermitido', 'espacio_permitido_post_delete'),
        ('post_save', 'Horario', 'horario_post_save'),
        ('post_delete', 'Horario', 'horario_post_delete'),
        ('post_save', 'HorarioFusionado', 'horario_fusionado_post_save'),
        ('post_delete', 'HorarioFusionado', 'horario_fusionado_post_delete'),
        ('post_save', 'HorarioEstudiante', 'horario_estudiante_post_save'),
        ('post_delete', 'HorarioEstudiante', 'horario_estudiante_post_delete'),
        ('post_save', 'TipoActividad', 'tipo_actividad_post_save'),
        ('post_save', 'PrestamoEspacio', 'prestamo_post_save'),
        ('post_delete', 'PrestamoEspacio', 'prestamo_post_delete'),
        ('post_save', 'PrestamoRecurso', 'prestamo_recurso_post_save'),
        ('post_save', 'Componente', 'componente_post_save'),
        ('post_delete', 'Componente', 'componente_post_delete'),
        ('post_save', 'ComponenteRol', 'componente_rol_post_save'),
        ('post_delete', 'ComponenteRol', 'componente_rol_post_delete'),
        ('post_save', 'Agente', 'agente_post_save'),
        ('post_delete', 'Agente', 'agente_post_delete'),
        ('post_save', 'PreguntaSugerida', 'pregunta_sugerida_post_save'),
        ('post_delete', 'PreguntaSugerida', 'pregunta_sugerida_post_delete'),
]


def _receptores_vivos(senal, modelo):
    vivos = senal._live_receivers(modelo)
    if isinstance(vivos, tuple):
        vivos = [r for grupo in vivos for r in grupo]
    return vivos


class RegistroDeSenalesTests(SimpleTestCase):
    def test_cada_senal_esta_registrada_una_sola_vez(self):
        senales = {'post_save': post_save, 'post_delete': post_delete}
        modelos = {}
        for modelo in apps.get_models():
            modelos.setdefault(modelo.__name__, []).append(modelo)
        faltan, repetidas = [], []
        for senal, nombre_modelo, funcion in RECEPTORES:
            encontrados = [
                r for modelo in modelos[nombre_modelo] for r in _receptores_vivos(senales[senal], modelo)
                if r.__name__ == funcion and r.__module__.startswith('notificaciones.')
            ]
            if not encontrados:
                faltan.append((senal, nombre_modelo, funcion))
            elif len(encontrados) > 1:
                repetidas.append((senal, nombre_modelo, funcion))
        self.assertEqual(faltan, [])
        self.assertEqual(repetidas, [])

    def test_no_hay_otras_senales_de_notificaciones(self):
        esperadas = {funcion for _, _, funcion in RECEPTORES}
        registradas = set()
        for senal in (post_save, post_delete):
            for entrada in senal.receivers:
                receptor = entrada[1]
                if isinstance(receptor, weakref.ReferenceType):
                    receptor = receptor()
                if receptor is None:
                    continue
                if (getattr(receptor, '__module__', '') or '').startswith('notificaciones.'):
                    registradas.add(receptor.__name__)
        self.assertEqual(registradas, esperadas)


class ApoyoTests(TestCase):
    def tearDown(self):
        signals.set_current_user(None)

    def test_el_usuario_actual_es_por_hilo(self):
        self.assertIsNone(signals.get_current_user())
        self.assertEqual(signals.obtener_id_usuario(), 1)
        usuario = mock.Mock(id=42)
        signals.set_current_user(usuario)
        self.assertIs(signals.get_current_user(), usuario)
        self.assertEqual(signals.obtener_id_usuario(), 42)

    def test_el_middleware_fija_y_limpia_el_usuario(self):
        visto = []

        def respuesta(request):
            visto.append(signals.get_current_user())
            return 'ok'

        solicitud = RequestFactory().get('/')
        solicitud.user = mock.Mock(id=7)
        self.assertEqual(signals.CurrentUserMiddleware(respuesta)(solicitud), 'ok')
        self.assertEqual([u.id for u in visto], [7])
        self.assertIsNone(signals.get_current_user())

        solicitud.user = AnonymousUser()
        signals.CurrentUserMiddleware(respuesta)(solicitud)
        self.assertEqual(visto[1], None)

    def test_crear_notificacion_ignora_destinatario_vacio_y_registra_fallos(self):
        signals.crear_notificacion(None, 'X', 'sin destino')
        self.assertEqual(Notificacion.objects.count(), 0)
        signals.crear_notificacion(5, 'X', 'con destino', 'alta')
        n = Notificacion.objects.get()
        self.assertEqual((n.id_usuario, n.tipo_notificacion, n.mensaje, n.prioridad), (5, 'X', 'con destino', 'alta'))
        with mock.patch('notificaciones.models.Notificacion.objects.create', side_effect=RuntimeError('caída')):
            with self.assertLogs('notificaciones.signals', level=logging.ERROR) as registro:
                signals.crear_notificacion(5, 'Y', 'falla')
        self.assertIn('Error creando notificación: caída', registro.output[0])

    def test_origen_siul(self):
        self.assertTrue(signals.es_origen_siul(mock.Mock(origen='SIUL')))
        self.assertFalse(signals.es_origen_siul(mock.Mock(origen='SIHUL')))
        self.assertFalse(signals.es_origen_siul(object()))


class NotificacionesPorCatalogoTests(TestCase):
    def tearDown(self):
        signals.set_current_user(None)

    def notificaciones(self, desde=0):
        return list(Notificacion.objects.filter(id__gt=desde).order_by('id').values_list(
            'id_usuario', 'tipo_notificacion', 'mensaje', 'prioridad'))

    def marca(self):
        return Notificacion.objects.order_by('-id').values_list('id', flat=True).first() or 0

    def test_rol(self):
        rol = Rol.objects.create(nombre='Rol Prueba')
        marca = self.marca()
        self.assertEqual(Notificacion.objects.get().tipo_notificacion, 'ROL_CREADO')
        rol.descripcion = 'cambio'
        rol.save()
        rol.delete()
        self.assertEqual(self.notificaciones(marca), [
            (1, 'ROL_ACTUALIZADO', 'Se ha actualizado el rol: Rol Prueba', 'baja'),
            (1, 'ROL_ELIMINADO', 'Se ha eliminado el rol: Rol Prueba', 'alta'),
        ])

    def test_sede_con_y_sin_seccional_a_nombre_del_usuario_actual(self):
        signals.set_current_user(mock.Mock(id=9))
        sede = Sede.objects.create(nombre='Sede Prueba')
        self.assertEqual(self.notificaciones(), [
            (9, 'SEDE_CREADA', 'Se ha creado la sede: Sede Prueba en la seccional Sin seccional', 'alta')])
        marca = self.marca()
        sede.nombre = 'Sede Renombrada'
        sede.save()
        sede.delete()
        self.assertEqual(self.notificaciones(marca), [
            (9, 'SEDE_ACTUALIZADA', 'Se ha actualizado la sede: Sede Renombrada', 'media'),
            (9, 'SEDE_ELIMINADA', 'Se ha eliminado la sede: Sede Renombrada', 'alta'),
        ])

    def test_facultad(self):
        facultad = Facultad.objects.create(nombre='Facultad Prueba')
        marca = self.marca()
        facultad.save()
        facultad.delete()
        self.assertEqual(self.notificaciones(), [
            (1, 'FACULTAD_CREADA', 'Se ha creado la facultad: Facultad Prueba', 'alta'),
            (1, 'FACULTAD_ACTUALIZADA', 'Se ha actualizado la facultad: Facultad Prueba', 'media'),
            (1, 'FACULTAD_ELIMINADA', 'Se ha eliminado la facultad: Facultad Prueba', 'alta'),
        ])
        self.assertEqual(len(self.notificaciones(marca)), 2)

    def test_componente_solo_avisa_el_alta_y_la_baja(self):
        componente = Componente.objects.create(nombre='Componente Prueba')
        componente.descripcion = 'cambio'
        componente.save()
        componente.delete()
        self.assertEqual(self.notificaciones(), [
            (1, 'COMPONENTE_CREADO', 'Se ha creado el componente: Componente Prueba', 'media'),
            (1, 'COMPONENTE_ELIMINADO', 'Se ha eliminado el componente: Componente Prueba', 'media'),
        ])

    def test_usuario_avisa_al_actor_y_al_creado_y_omite_el_origen_siul(self):
        signals.set_current_user(mock.Mock(id=9))
        usuario = Usuario.objects.create_user(correo='nuevo@senales.test', nombre='Nuevo')
        self.assertEqual(self.notificaciones(), [
            (9, 'USUARIO_CREADO', 'Se ha creado el usuario: Nuevo (nuevo@senales.test)', 'alta'),
            (usuario.id, 'CUENTA_CREADA', 'Tu cuenta ha sido creada exitosamente. Bienvenido/a Nuevo', 'alta'),
        ])
        marca = self.marca()
        usuario.nombre = 'Nuevo Nombre'
        usuario.save()
        usuario.delete()
        self.assertEqual(self.notificaciones(marca), [
            (9, 'USUARIO_ACTUALIZADO', 'Se ha actualizado el usuario: Nuevo Nombre', 'media'),
            (9, 'USUARIO_ELIMINADO', 'Se ha eliminado el usuario: Nuevo Nombre (nuevo@senales.test)', 'alta'),
        ])
        marca = self.marca()
        siul = Usuario.objects.create_user(correo='etl@senales.test', nombre='Etl', origen='SIUL')
        siul.save()
        siul.delete()
        self.assertEqual(self.notificaciones(marca), [])


class ImportacionDesdeElPaqueteTests(SimpleTestCase):
    def test_las_senales_siguen_importables_desde_notificaciones_signals(self):
        # Así lo documenta el README del módulo para desconectar y reconectar una señal.
        self.assertTrue(callable(signals.usuario_post_save))
        self.assertTrue(callable(signals.pregunta_sugerida_post_delete))
