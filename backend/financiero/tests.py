from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIRequestFactory, force_authenticate
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
