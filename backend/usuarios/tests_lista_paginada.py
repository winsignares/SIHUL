"""Lista de usuarios por bloques (Gestión de Usuarios): `?page=` pagina y filtra en el servidor; sin `page` no cambia."""
from django.test import TestCase

from sedes.models import Seccional

from .models import Rol, Usuario


class ListaPaginadaUsuariosTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.bq, _ = Seccional.objects.get_or_create(ciudad='Barranquilla')
        rol_admin = Rol.objects.get_or_create(nombre='admin')[0]
        cls.rol_docente = Rol.objects.get_or_create(nombre='docente')[0]
        cls.rol_adm = Rol.objects.get_or_create(nombre='personal_administrativo')[0]
        cls.admin = Usuario.objects.create(
            nombre='Admin Global', correo='global@unilibre.edu.co', contrasena_hash='x', rol=rol_admin,
            es_superusuario=True)
        Usuario.objects.bulk_create([
            Usuario(nombre=f'Docente {i:03d}', correo=f'docente{i:03d}@unilibre.edu.co', contrasena_hash='x',
                    rol=cls.rol_docente) for i in range(130)
        ])
        Usuario.objects.create(
            nombre='Rubén Torres', correo='ruben.torres@unilibre.edu.co', contrasena_hash='x', rol=cls.rol_adm)

    def setUp(self):
        sesion = self.client.session
        sesion['user_id'] = self.admin.id
        sesion.save()

    def _get(self, **params):
        r = self.client.get('/api/usuarios/', params)
        self.assertEqual(r.status_code, 200, r.content)
        return r.json()

    def test_sin_page_devuelve_la_lista_completa_como_siempre(self):
        datos = self._get()
        self.assertIsInstance(datos, list)
        self.assertEqual(len(datos), 132)

    def test_trae_bloques_de_100_con_el_total(self):
        p1 = self._get(page=1)
        self.assertEqual((p1['count'], p1['page'], p1['page_size']), (132, 1, 100))
        self.assertEqual(len(p1['results']), 100)
        self.assertEqual(len(self._get(page=2)['results']), 32)
        self.assertEqual(self._get(page=3)['results'], [])

    def test_los_bloques_no_repiten_usuarios(self):
        ids = [u['id'] for p in (1, 2) for u in self._get(page=p)['results']]
        self.assertEqual(len(ids), len(set(ids)))

    def test_el_tamano_no_pasa_de_100(self):
        self.assertEqual(len(self._get(page=1, page_size=500)['results']), 100)

    def test_busca_por_nombre_o_correo_en_todos_los_usuarios(self):
        self.assertEqual(self._get(page=1, search='docente129')['count'], 1)
        self.assertEqual(self._get(page=1, search='ruben.torres')['count'], 1)
        self.assertEqual(self._get(page=1, search='torres')['results'][0]['correo'], 'ruben.torres@unilibre.edu.co')

    def test_varias_palabras_deben_estar_todas(self):
        self.assertEqual(self._get(page=1, search='docente 007')['count'], 1)
        self.assertEqual(self._get(page=1, search='docente zzz')['count'], 0)

    def test_filtra_por_rol_y_busca_a_la_vez(self):
        self.assertEqual(self._get(page=1, rol='personal_administrativo')['count'], 1)
        self.assertEqual(self._get(page=1, rol='docente', search='docente')['count'], 130)
        self.assertEqual(self._get(page=1, rol='todos')['count'], 132)

    def test_page_invalido_responde_400(self):
        r = self.client.get('/api/usuarios/', {'page': 'x'})
        self.assertEqual(r.status_code, 400)

    def test_un_usuario_no_administrador_solo_se_ve_a_si_mismo(self):
        docente = Usuario.objects.get(correo='docente001@unilibre.edu.co')
        sesion = self.client.session
        sesion['user_id'] = docente.id
        sesion.save()
        datos = self._get(page=1)
        self.assertEqual([u['id'] for u in datos['results']], [docente.id])
