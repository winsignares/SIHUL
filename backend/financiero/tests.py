from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.sessions.middleware import SessionMiddleware
from rest_framework.test import APIClient, APIRequestFactory, force_authenticate
from datetime import date
from unittest.mock import patch
from . import models
from . import views, serializers
from .services.shared_storage_service import StorageResult
from usuarios.models import Usuario, Rol

# Create your tests here.

class FacturaTestCase(TestCase):
    def setUp(self):
        """Crear datos de prueba"""
        # Crear rol
        self.rol = Rol.objects.create(nombre='Contabilidad', descripcion='Área de Contabilidad')
        
        # Crear usuario
        self.usuario = Usuario.objects.create_user(
            correo='test@test.com',
            nombre='Test User',
            rol=self.rol
        )
        
        # Crear proveedor
        self.proveedor = models.Proveedor.objects.create(
            nit='123456789',
            razon_social='Proveedor Test S.A.S.',
            tipo_proveedor='Servicios'
        )
        
        # Crear departamento
        self.departamento = models.Departamento.objects.create(
            codigo='DEP001',
            nombre='Departamento Test',
            tipo='Administrativo'
        )
        self.factory = APIRequestFactory()

    def test_crear_factura(self):
        """Test para crear una factura"""
        factura = models.Factura.objects.create(
            numero_factura='FAC-001',
            proveedor=self.proveedor,
            departamento=self.departamento,
            valor_subtotal=1000000,
            valor_iva=190000,
            valor_total=1190000,
            tipo_documento='Factura',
            fecha_factura=date(2026, 4, 5),
            fecha_recepcion=date(2026, 4, 5),
            creado_por=self.usuario
        )
        
        self.assertEqual(factura.numero_factura, 'FAC-001')
        self.assertEqual(factura.estado, 'Recibida')
        self.assertEqual(factura.valor_neto_pagar, 1190000)

    def test_radicar_factura(self):
        """Test para radicar una factura"""
        factura = models.Factura.objects.create(
            numero_factura='FAC-002',
            proveedor=self.proveedor,
            departamento=self.departamento,
            valor_subtotal=1000000,
            valor_total=1000000,
            tipo_documento='Factura',
            fecha_factura=date(2026, 4, 5),
            fecha_recepcion=date(2026, 4, 5),
            creado_por=self.usuario
        )
        
        factura.estado = 'Radicada'
        factura.fecha_radicacion = date(2026, 4, 6)
        factura.save()
        
        self.assertEqual(factura.estado, 'Radicada')
        self.assertIsNotNone(factura.fecha_radicacion)

    @patch('financiero.views._regenerar_pdf_unificado_nas')
    @patch('financiero.services.shared_storage_service.shared_storage')
    def test_documento_adjunto_se_guarda_solo_en_carpeta_compartida(self, storage_mock, _regenerar_mock):
        storage_mock.enabled = True
        storage_mock.copy_document.return_value = StorageResult(
            True,
            nas_relative_path='facturas/2026/04/FAC-003/documentos_especificos/001_factura.pdf',
        )
        factura = models.Factura.objects.create(
            numero_factura='FAC-003',
            proveedor=self.proveedor,
            departamento=self.departamento,
            valor_subtotal=1000000,
            valor_total=1000000,
            tipo_documento='Factura',
            fecha_factura=date(2026, 4, 5),
            fecha_recepcion=date(2026, 4, 5),
            creado_por=self.usuario
        )

        archivo = SimpleUploadedFile(
            'factura.pdf',
            b'%PDF-1.4 documento de prueba',
            content_type='application/pdf',
        )
        request = self.factory.post(
            '/api/financiero/documentos/',
            {
                'factura': factura.id,
                'nombre_archivo': 'factura.pdf',
                'tipo_documento': 'Factura',
                'archivo': archivo,
                'tipo_mime': 'application/pdf',
            },
            format='multipart',
        )
        force_authenticate(request, user=self.usuario)

        response = views.DocumentoAdjuntoViewSet.as_view({'post': 'create'})(request)
        self.assertEqual(response.status_code, 201)

        documento = models.DocumentoAdjunto.objects.get(id=response.data['id'])
        self.assertIsNone(documento.contenido_archivo)
        self.assertFalse(bool(documento.archivo))
        self.assertEqual(documento.ciclo_documental, 1)
        self.assertEqual(documento.nas_storage_status, models.DocumentoAdjunto.NAS_STATUS_STORED)
        self.assertTrue(documento.nas_relative_path)

    def test_factura_detail_solo_devuelve_documentos_del_ciclo_actual(self):
        factura = models.Factura.objects.create(
            numero_factura='FAC-004',
            proveedor=self.proveedor,
            departamento=self.departamento,
            valor_subtotal=1000000,
            valor_total=1000000,
            tipo_documento='Factura',
            fecha_factura=date(2026, 4, 5),
            fecha_recepcion=date(2026, 4, 5),
            creado_por=self.usuario
        )

        models.DocumentoAdjunto.objects.create(
            factura=factura,
            nombre_archivo='viejo.pdf',
            tipo_documento='Factura',
            tipo_mime='application/pdf',
            contenido_archivo=b'viejo',
            ciclo_documental=1,
            cargado_por=self.usuario,
        )
        factura.ciclo_documental_actual = 2
        factura.save(update_fields=['ciclo_documental_actual'])
        models.DocumentoAdjunto.objects.create(
            factura=factura,
            nombre_archivo='nuevo.pdf',
            tipo_documento='Factura',
            tipo_mime='application/pdf',
            contenido_archivo=b'nuevo',
            ciclo_documental=2,
            cargado_por=self.usuario,
        )

        serializer = serializers.FacturaDetailSerializer(factura)
        nombres = [doc['nombre_archivo'] for doc in serializer.data['documentos']]

        self.assertEqual(nombres, ['nuevo.pdf'])


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
        self.pais = models.Pais.objects.create(nombre='Colombia', codigo_iso='COL')
        self.departamento = models.DepartamentoGeografico.objects.create(
            pais=self.pais,
            nombre='Atlántico',
        )
        self.ciudad = models.Ciudad.objects.create(
            departamento=self.departamento,
            nombre='Barranquilla',
        )
        self.banco = models.Banco.objects.create(nombre='Banco de prueba')
        self.tipo_cuenta = models.TipoCuenta.objects.create(nombre='Ahorros')

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
        proveedor = models.Proveedor.objects.select_related('usuario').get(nit='901940009-7')
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
        proveedor = models.Proveedor.objects.get(nit='901940009-7')
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
        proveedor = models.Proveedor.objects.get(nit='901940009-7')
        usuario_id = proveedor.usuario_id
        request = self.factory.delete(f'/api/financiero/proveedores/{proveedor.id}/')
        self._con_sesion(request)
        force_authenticate(request, user=self.admin)

        response = views.ProveedorViewSet.as_view({'delete': 'destroy'})(request, pk=proveedor.id)

        self.assertEqual(response.status_code, 204)
        self.assertFalse(models.Proveedor.objects.filter(pk=proveedor.id).exists())
        self.assertFalse(Usuario.objects.filter(pk=usuario_id).exists())

    def test_no_elimina_un_usuario_vinculado_con_otro_rol(self):
        usuario_ajeno = Usuario.objects.create_user(
            correo='usuario.ajeno@test.com',
            password='Clave123!',
            nombre='Usuario ajeno',
            rol=self.rol_admin,
        )
        proveedor = models.Proveedor.objects.create(
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
        self.assertTrue(models.Proveedor.objects.filter(pk=proveedor.id).exists())
        self.assertTrue(Usuario.objects.filter(pk=usuario_ajeno.id).exists())
