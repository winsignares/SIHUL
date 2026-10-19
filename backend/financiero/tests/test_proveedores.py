from django.test import TestCase
from django.contrib.sessions.middleware import SessionMiddleware
from rest_framework.test import APIClient, APIRequestFactory, force_authenticate
from financiero.contabilidad.models import Banco, TipoCuenta
from financiero.proveedores.models import Ciudad, DepartamentoGeografico, Pais, Proveedor
from unispace.usuarios.models import Usuario, Rol
from financiero.proveedores import views


class ProveedorLifecycleTestCase(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.rol_proveedor = Rol.objects.create(nombre='Proveedor')
        self.rol_admin = Rol.objects.create(nombre='Admin Financiero')
        self.admin = Usuario.objects.create_user(
            correo='admin.financiero@test.com',
            password='Admin123!',
            nombre='Admin Financiero',
            rol=self.rol_admin,
        )
        self.pais = Pais.objects.create(nombre='Colombia', codigo_iso='COL')
        self.departamento = DepartamentoGeografico.objects.create(
            pais=self.pais,
            nombre='Atlántico',
        )
        self.ciudad = Ciudad.objects.create(
            departamento=self.departamento,
            nombre='Barranquilla',
        )
        self.banco = Banco.objects.create(nombre='Banco de prueba')
        self.tipo_cuenta = TipoCuenta.objects.create(nombre='Ahorros')

    @staticmethod
    def _con_sesion(request):
        middleware = SessionMiddleware(lambda _request: None)
        middleware.process_request(request)
        request.session.save()
        return request

    def _crear_proveedor_publico(self):
        return APIClient().post(
            '/api/financiero/proveedores/crear_con_usuario/',
            {
                'nombre': 'Contacto Proveedor',
                'correo': 'acceso@proveedor.com',
                'contrasena': 'Clave123!',
                'nit': '901940009-7',
                'razon_social': 'GRAFICENTER ULTRA S.A.S.',
                'nombre_comercial': 'Graficenter Ultra',
                'tipo_proveedor': 'Servicios',
                'tipo_persona': 'Jurídica',
                'direccion': 'CL 43 No 43 - 107',
                'pais_id': self.pais.id,
                'departamento_geo_id': self.departamento.id,
                'ciudad_id': self.ciudad.id,
                'telefono': '3003434022',
                'email': 'facturacion@graficenterultra.com',
                'banco_id': self.banco.id,
                'tipo_cuenta_id': self.tipo_cuenta.id,
                'numero_cuenta': '123456789',
                'regimen_tributario': 'Responsable IVA',
            },
            format='json',
        )

    def test_registro_publico_conserva_catalogos_y_datos_de_acceso(self):
        response = self._crear_proveedor_publico()

        self.assertEqual(response.status_code, 201)
        proveedor = Proveedor.objects.select_related('usuario').get(nit='901940009-7')
        self.assertEqual(proveedor.pais, 'Colombia')
        self.assertEqual(proveedor.departamento, 'Atlántico')
        self.assertEqual(proveedor.ciudad, 'Barranquilla')
        self.assertEqual(proveedor.banco, 'Banco de prueba')
        self.assertEqual(proveedor.tipo_cuenta, 'Ahorros')
        self.assertEqual(proveedor.email, 'facturacion@graficenterultra.com')
        self.assertEqual(response.data['proveedor']['usuario_nombre'], 'Contacto Proveedor')
        self.assertEqual(response.data['proveedor']['usuario_correo'], 'acceso@proveedor.com')

    def test_actualizacion_modifica_proveedor_y_usuario_en_una_transaccion(self):
        self._crear_proveedor_publico()
        proveedor = Proveedor.objects.get(nit='901940009-7')
        request = self.factory.patch(
            f'/api/financiero/proveedores/{proveedor.id}/',
            {
                'telefono': '3000000000',
                'usuario_nombre': 'Nuevo Contacto',
                'usuario_correo': 'nuevo.acceso@proveedor.com',
                'usuario_contrasena': 'NuevaClave123!',
                'estado': 'Inactivo',
            },
            format='json',
        )
        self._con_sesion(request)
        force_authenticate(request, user=self.admin)

        response = views.ProveedorViewSet.as_view({'patch': 'partial_update'})(request, pk=proveedor.id)

        self.assertEqual(response.status_code, 200)
        proveedor.refresh_from_db()
        proveedor.usuario.refresh_from_db()
        self.assertEqual(proveedor.telefono, '3000000000')
        self.assertEqual(proveedor.usuario.nombre, 'Nuevo Contacto')
        self.assertEqual(proveedor.usuario.correo, 'nuevo.acceso@proveedor.com')
        self.assertFalse(proveedor.usuario.activo)
        self.assertTrue(proveedor.usuario.check_password('NuevaClave123!'))

    def test_eliminar_proveedor_elimina_tambien_usuario_vinculado(self):
        self._crear_proveedor_publico()
        proveedor = Proveedor.objects.get(nit='901940009-7')
        usuario_id = proveedor.usuario_id
        request = self.factory.delete(f'/api/financiero/proveedores/{proveedor.id}/')
        self._con_sesion(request)
        force_authenticate(request, user=self.admin)

        response = views.ProveedorViewSet.as_view({'delete': 'destroy'})(request, pk=proveedor.id)

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Proveedor.objects.filter(pk=proveedor.id).exists())
        self.assertFalse(Usuario.objects.filter(pk=usuario_id).exists())

    def test_no_elimina_un_usuario_vinculado_con_otro_rol(self):
        usuario_ajeno = Usuario.objects.create_user(
            correo='usuario.ajeno@test.com',
            password='Clave123!',
            nombre='Usuario ajeno',
            rol=self.rol_admin,
        )
        proveedor = Proveedor.objects.create(
            usuario=usuario_ajeno,
            nit='900000001-1',
            razon_social='Proveedor con vínculo incorrecto',
            tipo_proveedor='Servicios',
        )
        request = self.factory.delete(f'/api/financiero/proveedores/{proveedor.id}/')
        self._con_sesion(request)
        force_authenticate(request, user=self.admin)

        response = views.ProveedorViewSet.as_view({'delete': 'destroy'})(request, pk=proveedor.id)

        self.assertEqual(response.status_code, 400)
        self.assertTrue(Proveedor.objects.filter(pk=proveedor.id).exists())
        self.assertTrue(Usuario.objects.filter(pk=usuario_ajeno.id).exists())
