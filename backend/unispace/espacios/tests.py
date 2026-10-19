"""
Alcance de los supervisores de espacios (espacios/alcance.py): asignación por tipo (puede crear
espacios de esos tipos en su sede) y asignación individual (solo gestiona esos espacios).
"""
import datetime
from unittest import mock

from django.test import TestCase
from rest_framework.test import APIClient

from unispace.prestamos.models import PrestamoEspacio, TipoActividad
from unispace.sedes.models import Seccional, Sede
from unispace.usuarios.models import Rol, Usuario
from unispace.usuarios.serializers import UsuarioSerializer

from . import alcance
from .models import EspacioFisico, EspacioPermitido, TipoEspacio, TipoEspacioPermitido


def tipos_de(usuario):
    return set(TipoEspacioPermitido.objects.filter(usuario=usuario).values_list('tipo_id', flat=True))


class AlcanceSupervisorTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        seccional = Seccional.objects.create(ciudad='Prueba')
        cls.sede = Sede.objects.create(nombre='Sede A', seccional=seccional)
        cls.otra_sede = Sede.objects.create(nombre='Sede B', seccional=seccional)
        cls.aula = TipoEspacio.objects.get_or_create(nombre='Aula')[0]
        cls.lab = TipoEspacio.objects.get_or_create(nombre='Laboratorio')[0]
        cls.aula1 = EspacioFisico.objects.create(nombre='Aula 1', sede=cls.sede, tipo=cls.aula, capacidad=30)
        cls.aula2 = EspacioFisico.objects.create(nombre='Aula 2', sede=cls.sede, tipo=cls.aula, capacidad=30)
        cls.lab1 = EspacioFisico.objects.create(nombre='Lab 1', sede=cls.sede, tipo=cls.lab, capacidad=20)
        cls.aula_b = EspacioFisico.objects.create(nombre='Aula B', sede=cls.otra_sede, tipo=cls.aula, capacidad=30)

        cls.rol_supervisor = Rol.objects.create(nombre='supervisor_prueba', supervisa_espacios=True)
        cls.rol_admin = Rol.objects.get_or_create(nombre='admin')[0]
        cls.rol_docente = Rol.objects.get_or_create(nombre='docente')[0]

        def usuario(nombre, rol, sede=None):
            return Usuario.objects.create(
                nombre=nombre, correo=f'{nombre}@prueba.co', rol=rol, sede=sede, seccional=seccional,
            )

        cls.sup_tipo = usuario('sup_tipo', cls.rol_supervisor, cls.sede)
        cls.sup_individual = usuario('sup_individual', cls.rol_supervisor, cls.sede)
        cls.admin = usuario('admin', cls.rol_admin, cls.sede)
        cls.docente = usuario('docente', cls.rol_docente, cls.sede)
        cls.rol_general = Rol.objects.get_or_create(nombre='supervisor_general', defaults={'supervisa_espacios': True})[0]
        cls.sup_general = usuario('sup_general', cls.rol_general, cls.sede)

        alcance.asignar_tipos(cls.sup_tipo, [cls.aula.id])
        EspacioPermitido.objects.create(usuario=cls.sup_individual, espacio=cls.aula1)

    def cliente(self, usuario):
        client = APIClient(HTTP_HOST='localhost')
        client.force_authenticate(user=usuario)
        return client

    def payload_espacio(self, tipo, sede, nombre='Nuevo'):
        return {'nombre': nombre, 'tipo': tipo.id, 'sede': sede.id, 'capacidad': 10, 'estado': 'Disponible'}

    # ---------------------------------------------------------------- asignación por tipo
    def test_asignar_tipo_asigna_los_espacios_de_ese_tipo_en_su_sede(self):
        ids = set(EspacioPermitido.objects.filter(usuario=self.sup_tipo).values_list('espacio_id', flat=True))
        self.assertEqual(ids, {self.aula1.id, self.aula2.id})  # ni el laboratorio ni el aula de otra sede

    def test_espacio_nuevo_del_tipo_asignado_entra_al_alcance(self):
        nuevo = EspacioFisico.objects.create(nombre='Aula 3', sede=self.sede, tipo=self.aula, capacidad=10)
        self.assertTrue(EspacioPermitido.objects.filter(usuario=self.sup_tipo, espacio=nuevo).exists())
        # y no entra a quien tiene espacios individuales
        self.assertFalse(EspacioPermitido.objects.filter(usuario=self.sup_individual, espacio=nuevo).exists())

    def test_espacio_de_otro_tipo_o_sede_no_entra_al_alcance(self):
        lab2 = EspacioFisico.objects.create(nombre='Lab 2', sede=self.sede, tipo=self.lab, capacidad=10)
        aula_b2 = EspacioFisico.objects.create(nombre='Aula B2', sede=self.otra_sede, tipo=self.aula, capacidad=10)
        self.assertFalse(EspacioPermitido.objects.filter(usuario=self.sup_tipo, espacio=lab2).exists())
        self.assertFalse(EspacioPermitido.objects.filter(usuario=self.sup_tipo, espacio=aula_b2).exists())

    def test_cambiar_el_tipo_de_un_espacio_lo_saca_del_alcance_por_tipo(self):
        self.aula2.tipo = self.lab
        self.aula2.save()
        self.assertFalse(EspacioPermitido.objects.filter(usuario=self.sup_tipo, espacio=self.aula2).exists())

    def test_serializador_guarda_tipos_y_los_devuelve(self):
        serializer = UsuarioSerializer(
            self.sup_individual,
            data={'tipos_espacio_permitidos': [self.lab.id], 'espacios_permitidos': [self.aula1.id]},
            partial=True,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        usuario = serializer.save()
        self.assertEqual(UsuarioSerializer(usuario).data['tipos_espacio_permitidos'], [self.lab.id])
        # el espacio suelto (individual) y los del tipo (derivados) conviven
        filas = {ep.espacio_id: ep.individual for ep in EspacioPermitido.objects.filter(usuario=usuario)}
        self.assertEqual(filas, {self.aula1.id: True, self.lab1.id: False})

    def test_enviar_solo_espacios_conserva_los_tipos(self):
        serializer = UsuarioSerializer(self.sup_tipo, data={'espacios_permitidos': [self.lab1.id]}, partial=True)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        usuario = serializer.save()
        self.assertEqual(tipos_de(usuario), {self.aula.id})
        filas = {ep.espacio_id: ep.individual for ep in EspacioPermitido.objects.filter(usuario=usuario)}
        self.assertEqual(filas, {self.aula1.id: False, self.aula2.id: False, self.lab1.id: True})

    def test_tipo_inexistente_se_rechaza(self):
        serializer = UsuarioSerializer(self.sup_tipo, data={'tipos_espacio_permitidos': [99999]}, partial=True)
        self.assertTrue(serializer.is_valid())
        with self.assertRaises(Exception):
            serializer.save()

    # ---------------------------------------------------------------- crear espacios
    @mock.patch('config.permissions.user_can_edit_componente', return_value=True)
    def test_supervisor_por_tipo_crea_solo_su_tipo_en_su_sede(self, _):
        client = self.cliente(self.sup_tipo)
        r = client.post('/api/espacios/', self.payload_espacio(self.aula, self.sede), format='json')
        self.assertEqual(r.status_code, 201, r.content)
        nuevo = EspacioFisico.objects.get(id=r.json()['id'])
        self.assertTrue(EspacioPermitido.objects.filter(usuario=self.sup_tipo, espacio=nuevo).exists())  # lo gestiona
        r = client.post('/api/espacios/', self.payload_espacio(self.lab, self.sede), format='json')
        self.assertEqual(r.status_code, 403)
        self.assertIn('tipos que tienes asignados', r.json()['detail'])
        r = client.post('/api/espacios/', self.payload_espacio(self.aula, self.otra_sede), format='json')
        self.assertEqual(r.status_code, 403)

    @mock.patch('config.permissions.user_can_edit_componente', return_value=True)
    def test_supervisor_individual_no_puede_crear(self, _):
        r = self.cliente(self.sup_individual).post('/api/espacios/', self.payload_espacio(self.aula, self.sede), format='json')
        self.assertEqual(r.status_code, 403)
        self.assertIn('espacios individuales', r.json()['detail'])
        self.assertFalse(EspacioFisico.objects.filter(nombre='Nuevo').exists())

    def test_admin_crea_cualquier_espacio(self):
        r = self.cliente(self.admin).post('/api/espacios/', self.payload_espacio(self.lab, self.otra_sede), format='json')
        self.assertEqual(r.status_code, 201, r.content)

    # ---------------------------------------------------------------- editar espacios
    @mock.patch('config.permissions.user_can_edit_componente', return_value=True)
    def test_supervisor_individual_edita_solo_su_espacio(self, _):
        client = self.cliente(self.sup_individual)
        r = client.patch(f'/api/espacios/{self.aula1.id}/', {'capacidad': 55}, format='json')
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(EspacioFisico.objects.get(id=self.aula1.id).capacidad, 55)
        r = client.patch(f'/api/espacios/{self.aula2.id}/', {'capacidad': 55}, format='json')
        self.assertEqual(r.status_code, 404)  # para él no existe
        self.assertEqual(EspacioFisico.objects.get(id=self.aula2.id).capacidad, 30)
        r = client.delete(f'/api/espacios/{self.aula2.id}/')
        self.assertEqual(r.status_code, 404)
        self.assertTrue(EspacioFisico.objects.filter(id=self.aula2.id).exists())

    @mock.patch('config.permissions.user_can_edit_componente', return_value=True)
    def test_supervisor_no_mueve_su_espacio_a_otra_sede(self, _):
        r = self.cliente(self.sup_individual).patch(
            f'/api/espacios/{self.aula1.id}/', {'sede': self.otra_sede.id}, format='json')
        self.assertEqual(r.status_code, 403)
        self.assertEqual(EspacioFisico.objects.get(id=self.aula1.id).sede_id, self.sede.id)

    @mock.patch('config.permissions.user_can_edit_componente', return_value=True)
    def test_supervisor_por_tipo_no_cambia_un_espacio_a_un_tipo_no_asignado(self, _):
        client = self.cliente(self.sup_tipo)
        r = client.patch(f'/api/espacios/{self.aula1.id}/', {'tipo': self.lab.id}, format='json')
        self.assertEqual(r.status_code, 403)
        self.assertEqual(EspacioFisico.objects.get(id=self.aula1.id).tipo_id, self.aula.id)
        r = client.patch(f'/api/espacios/{self.aula1.id}/', {'nombre': 'Aula Uno'}, format='json')
        self.assertEqual(r.status_code, 200, r.content)

    @mock.patch('config.permissions.user_can_edit_componente', return_value=True)
    def test_supervisor_no_modifica_asignaciones(self, _):
        r = self.cliente(self.sup_individual).post(
            '/api/espacios-permitidos/', {'espacio': self.aula2.id, 'usuario': self.sup_individual.id}, format='json')
        self.assertEqual(r.status_code, 403)
        self.assertFalse(EspacioPermitido.objects.filter(usuario=self.sup_individual, espacio=self.aula2).exists())

    # ---------------------------------------------------------------- vistas antiguas (sin sesión DRF)
    def cliente_sesion(self, usuario):
        client = APIClient(HTTP_HOST='localhost')
        session = client.session
        session['user_id'] = usuario.id
        session.save()
        return client

    def test_vistas_antiguas_aplican_el_mismo_alcance(self):
        client = self.cliente_sesion(self.sup_individual)
        r = client.post('/espacios/', {'sede_id': self.sede.id, 'nombre': 'X', 'tipo_id': self.aula.id, 'capacidad': 5}, format='json')
        self.assertEqual(r.status_code, 403)
        r = client.put('/espacios/update/', {'id': self.aula2.id, 'capacidad': 9}, format='json')
        self.assertEqual(r.status_code, 403)
        r = client.delete('/espacios/delete/', {'id': self.aula2.id}, format='json')
        self.assertEqual(r.status_code, 403)
        self.assertTrue(EspacioFisico.objects.filter(id=self.aula2.id, capacidad=30).exists())
        r = client.put('/espacios/update/', {'id': self.aula1.id, 'capacidad': 9}, format='json')
        self.assertEqual(r.status_code, 200)
        r = self.cliente_sesion(self.sup_tipo).post(
            '/espacios/', {'sede_id': self.sede.id, 'nombre': 'Y', 'tipo_id': self.aula.id, 'capacidad': 5}, format='json')
        self.assertEqual(r.status_code, 201)

    # ---------------------------------------------------------------- préstamos
    def crear_prestamo(self, espacio):
        tipo = TipoActividad.objects.get_or_create(nombre='Evento')[0]
        # bulk_create: se omite la validación de periodo activo, que no es lo que se prueba
        return PrestamoEspacio.objects.bulk_create([PrestamoEspacio(
            espacio=espacio, tipo_actividad=tipo, usuario=self.docente, fecha=datetime.date(2026, 11, 3),
            hora_inicio=datetime.time(8), hora_fin=datetime.time(10), motivo='Prueba', estado='Pendiente',
        )])[0]

    def test_supervisor_gestiona_solo_los_prestamos_de_sus_espacios(self):
        propio = self.crear_prestamo(self.aula1)
        ajeno = self.crear_prestamo(self.aula2)
        client = self.cliente(self.sup_individual)
        self.assertEqual(client.get(f'/api/prestamos/espacios/{propio.id}/').status_code, 200)
        self.assertEqual(client.get(f'/api/prestamos/espacios/{ajeno.id}/').status_code, 404)
        self.assertEqual(client.delete(f'/api/prestamos/espacios/{ajeno.id}/').status_code, 404)
        self.assertTrue(PrestamoEspacio.objects.filter(id=ajeno.id).exists())

    def test_supervisor_no_crea_ni_mueve_prestamos_a_espacios_ajenos(self):
        tipo = TipoActividad.objects.get_or_create(nombre='Evento')[0]
        client = self.cliente(self.sup_individual)
        datos = {'espacio': self.aula2.id, 'tipo_actividad': tipo.id, 'fecha': '2026-11-03',
                 'hora_inicio': '08:00', 'hora_fin': '10:00', 'motivo': 'x', 'estado': 'Aprobado'}
        r = client.post('/api/prestamos/espacios/', datos, format='json')
        self.assertEqual(r.status_code, 403)
        propio = self.crear_prestamo(self.aula1)
        r = client.patch(f'/api/prestamos/espacios/{propio.id}/', {'espacio': self.aula2.id}, format='json')
        self.assertEqual(r.status_code, 403)
        self.assertEqual(PrestamoEspacio.objects.get(id=propio.id).espacio_id, self.aula1.id)

    def test_usuarios_no_supervisores_no_se_ven_afectados_en_prestamos(self):
        prestamo = self.crear_prestamo(self.aula2)
        self.assertEqual(self.cliente(self.admin).get(f'/api/prestamos/espacios/{prestamo.id}/').status_code, 200)

    # ---------------------------------------------------------------- sesión
    def test_resumen_de_sesion(self):
        self.assertEqual(alcance.resumen_sesion(self.sup_tipo),
                         {'tipos_espacio_permitidos': [self.aula.id], 'puede_crear_espacios': True})
        self.assertEqual(alcance.resumen_sesion(self.sup_individual),
                         {'tipos_espacio_permitidos': [], 'puede_crear_espacios': False})
        self.assertEqual(alcance.resumen_sesion(self.admin),
                         {'tipos_espacio_permitidos': [], 'puede_crear_espacios': True})

    def test_la_sesion_informa_el_alcance_al_frontend(self):
        client = APIClient(HTTP_HOST='localhost')
        client.force_login(self.sup_tipo)
        r = client.get('/api/auth/user/')
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(r.json()['tipos_espacio_permitidos'], [self.aula.id])
        self.assertTrue(r.json()['puede_crear_espacios'])
        client.force_login(self.sup_individual)
        r = client.get('/api/auth/user/')
        self.assertEqual(r.json()['tipos_espacio_permitidos'], [])
        self.assertFalse(r.json()['puede_crear_espacios'])

    # ---------------------------------------------------------------- la casilla del rol decide, no su nombre
    def test_el_supervisor_general_con_casilla_tambien_esta_restringido(self):
        self.assertTrue(self.rol_general.supervisa_espacios)
        self.assertTrue(alcance.esta_restringido(self.sup_general))
        self.assertEqual(alcance.resumen_sesion(self.sup_general),
                         {'tipos_espacio_permitidos': [], 'puede_crear_espacios': False})

    @mock.patch('config.permissions.user_can_edit_componente', return_value=True)
    def test_supervisor_general_sin_asignacion_por_tipo_no_crea_espacios(self, _):
        r = self.cliente(self.sup_general).post('/api/espacios/', self.payload_espacio(self.aula, self.sede), format='json')
        self.assertEqual(r.status_code, 403)

    def test_un_rol_llamado_supervisor_sin_casilla_no_es_supervisor_de_espacios(self):
        rol = Rol.objects.create(nombre='supervisor_sin_casilla', supervisa_espacios=False)
        usuario = Usuario.objects.create(nombre='x', correo='x@prueba.co', rol=rol, sede=self.sede)
        self.assertFalse(alcance.esta_restringido(usuario))
        # y el rol cuyo nombre es «supervisor_general» sin la casilla tampoco
        Rol.objects.filter(id=self.rol_general.id).update(supervisa_espacios=False)
        self.sup_general.rol.refresh_from_db()
        self.assertFalse(alcance.esta_restringido(self.sup_general))

    # ---------------------------------------------------------------- tipos + espacios individuales a la vez
    def asignar_mixto(self):
        """sup_tipo (tipo Aula) con, además, el laboratorio 1 asignado a mano."""
        serializer = UsuarioSerializer(
            self.sup_tipo,
            data={'tipos_espacio_permitidos': [self.aula.id], 'espacios_permitidos': [self.lab1.id]},
            partial=True,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        return serializer.save()

    def ids_de(self, usuario):
        return set(EspacioPermitido.objects.filter(usuario=usuario).values_list('espacio_id', flat=True))

    def test_mixto_gestiona_los_del_tipo_y_los_sueltos(self):
        usuario = self.asignar_mixto()
        self.assertEqual(self.ids_de(usuario), {self.aula1.id, self.aula2.id, self.lab1.id})

    def test_mixto_la_sincronizacion_por_tipo_no_borra_los_individuales(self):
        usuario = self.asignar_mixto()
        EspacioFisico.objects.create(nombre='Aula 3', sede=self.sede, tipo=self.aula, capacidad=10)  # dispara la sincronización
        alcance.sincronizar_por_tipos(usuario)
        ids = self.ids_de(usuario)
        self.assertIn(self.lab1.id, ids)
        self.assertEqual(len(ids), 4)
        # quitar los tipos borra solo las derivadas
        alcance.asignar_tipos(usuario, [])
        self.assertEqual(self.ids_de(usuario), {self.lab1.id})

    def test_mixto_quitar_el_espacio_suelto_conserva_los_del_tipo(self):
        usuario = self.asignar_mixto()
        serializer = UsuarioSerializer(usuario, data={'espacios_permitidos': []}, partial=True)
        self.assertTrue(serializer.is_valid())
        serializer.save()
        self.assertEqual(self.ids_de(usuario), {self.aula1.id, self.aula2.id})

    def test_espacio_suelto_que_tambien_es_del_tipo_no_se_duplica(self):
        serializer = UsuarioSerializer(self.sup_tipo, data={'espacios_permitidos': [self.aula1.id]}, partial=True)
        self.assertTrue(serializer.is_valid())
        usuario = serializer.save()
        self.assertEqual(EspacioPermitido.objects.filter(usuario=usuario, espacio=self.aula1).count(), 1)
        self.assertTrue(EspacioPermitido.objects.get(usuario=usuario, espacio=self.aula1).individual)

    @mock.patch('config.permissions.user_can_edit_componente', return_value=True)
    def test_mixto_reglas_de_creacion_y_edicion(self, _):
        usuario = self.asignar_mixto()
        client = self.cliente(usuario)
        # crear: solo del tipo asignado (aunque tenga un laboratorio suelto)
        self.assertEqual(client.post('/api/espacios/', self.payload_espacio(self.aula, self.sede), format='json').status_code, 201)
        self.assertEqual(client.post('/api/espacios/', self.payload_espacio(self.lab, self.sede), format='json').status_code, 403)
        # editar el laboratorio suelto: sí, incluso cambiarle el tipo
        self.assertEqual(client.patch(f'/api/espacios/{self.lab1.id}/', {'capacidad': 21}, format='json').status_code, 200)
        self.assertEqual(client.patch(f'/api/espacios/{self.lab1.id}/', {'tipo': self.aula.id}, format='json').status_code, 200)
        # un espacio del tipo (derivado) no puede pasar a un tipo no asignado
        self.assertEqual(client.patch(f'/api/espacios/{self.aula2.id}/', {'tipo': self.lab.id}, format='json').status_code, 403)
        # y no toca espacios ajenos
        self.assertEqual(client.patch(f'/api/espacios/{self.aula_b.id}/', {'capacidad': 1}, format='json').status_code, 404)

    def test_la_migracion_de_datos_marca_las_derivadas(self):
        # los espacios de quien tiene tipos son derivados; los de quien no, individuales
        self.assertFalse(EspacioPermitido.objects.get(usuario=self.sup_tipo, espacio=self.aula1).individual)
        self.assertTrue(EspacioPermitido.objects.get(usuario=self.sup_individual, espacio=self.aula1).individual)

    # ---------------------------------------------------------------- varios tipos a la vez
    @mock.patch('config.permissions.user_can_edit_componente', return_value=True)
    def test_varios_tipos_asignados(self, _):
        auditorio = TipoEspacio.objects.get_or_create(nombre='Auditorio')[0]
        serializer = UsuarioSerializer(self.sup_individual, data={'tipos_espacio_permitidos': [self.aula.id, self.lab.id]}, partial=True)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        usuario = serializer.save()
        self.assertEqual(tipos_de(usuario), {self.aula.id, self.lab.id})
        self.assertEqual(UsuarioSerializer(usuario).data['tipos_espacio_permitidos'], sorted([self.aula.id, self.lab.id]))
        self.assertEqual(self.ids_de(usuario), {self.aula1.id, self.aula2.id, self.lab1.id})  # ambos tipos; ninguna de otra sede
        client = self.cliente(usuario)
        for tipo in (self.aula, self.lab):  # puede crear de cualquiera de sus tipos
            r = client.post('/api/espacios/', self.payload_espacio(tipo, self.sede, nombre=f'N-{tipo.nombre}'), format='json')
            self.assertEqual(r.status_code, 201, r.content)
        r = client.post('/api/espacios/', self.payload_espacio(auditorio, self.sede), format='json')
        self.assertEqual(r.status_code, 403)  # pero no de uno que no tiene
        # y un espacio de cualquiera de sus tipos puede pasar al otro tipo asignado, no a uno ajeno
        self.assertEqual(client.patch(f'/api/espacios/{self.aula1.id}/', {'tipo': self.lab.id}, format='json').status_code, 200)
        self.assertEqual(client.patch(f'/api/espacios/{self.lab1.id}/', {'tipo': auditorio.id}, format='json').status_code, 403)
        # quitar un tipo retira solo sus espacios
        alcance.asignar_tipos(usuario, [self.lab.id])
        self.assertEqual(tipos_de(usuario), {self.lab.id})
        self.assertNotIn(self.aula2.id, self.ids_de(usuario))
        self.assertIn(self.lab1.id, self.ids_de(usuario))

    # ---------------------------------------------------------------- por la API de usuarios (lo que usa el formulario)
    def test_formulario_guarda_y_devuelve_los_tipos_por_la_api_de_usuarios(self):
        client = self.cliente(self.admin)
        # asignar un tipo y un espacio suelto, como lo envía el formulario de edición
        r = client.patch(f'/api/usuarios/{self.docente.id}/', {
            'espacios_permitidos': [self.lab1.id], 'tipos_espacio_permitidos': [self.aula.id],
        }, format='json')
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(r.json()['tipos_espacio_permitidos'], [self.aula.id])
        # al volver a abrir la edición: el detalle y el listado lo devuelven
        detalle = client.get(f'/api/usuarios/{self.docente.id}/').json()
        self.assertEqual(detalle['tipos_espacio_permitidos'], [self.aula.id])
        listado = client.get('/api/usuarios/').json()
        fila = next(u for u in (listado if isinstance(listado, list) else listado.get('results', [])) if u['id'] == self.docente.id)
        self.assertEqual(fila['tipos_espacio_permitidos'], [self.aula.id])
        # y el listado de espacios del usuario marca cuáles son individuales
        espacios = client.get(f'/api/espacios-permitidos/usuario/{self.docente.id}/').json()['espacios']
        individual = {e['id']: e['individual'] for e in espacios}
        self.assertEqual(individual, {self.aula1.id: False, self.aula2.id: False, self.lab1.id: True})
        # editar sin tocar los tipos (el formulario siempre los reenvía) los conserva
        r = client.patch(f'/api/usuarios/{self.docente.id}/', {
            'nombre': 'Docente 2', 'espacios_permitidos': [self.lab1.id], 'tipos_espacio_permitidos': [self.aula.id],
        }, format='json')
        self.assertEqual(r.json()['tipos_espacio_permitidos'], [self.aula.id])
