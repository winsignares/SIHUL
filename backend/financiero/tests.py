from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIRequestFactory, force_authenticate
from datetime import date
from . import models
from . import views, serializers
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
            descripcion='Factura de prueba',
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
            descripcion='Factura de prueba',
            fecha_factura=date(2026, 4, 5),
            fecha_recepcion=date(2026, 4, 5),
            creado_por=self.usuario
        )
        
        factura.estado = 'Radicada'
        factura.fecha_radicacion = date(2026, 4, 6)
        factura.save()
        
        self.assertEqual(factura.estado, 'Radicada')
        self.assertIsNotNone(factura.fecha_radicacion)

    def test_documento_adjunto_se_guarda_en_base_de_datos(self):
        factura = models.Factura.objects.create(
            numero_factura='FAC-003',
            proveedor=self.proveedor,
            departamento=self.departamento,
            valor_subtotal=1000000,
            valor_total=1000000,
            tipo_documento='Factura',
            descripcion='Factura con documento en DB',
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
        self.assertEqual(bytes(documento.contenido_archivo), b'%PDF-1.4 documento de prueba')
        self.assertFalse(bool(documento.archivo))
        self.assertEqual(documento.ciclo_documental, 1)

    def test_factura_detail_solo_devuelve_documentos_del_ciclo_actual(self):
        factura = models.Factura.objects.create(
            numero_factura='FAC-004',
            proveedor=self.proveedor,
            departamento=self.departamento,
            valor_subtotal=1000000,
            valor_total=1000000,
            tipo_documento='Factura',
            descripcion='Factura con ciclos documentales',
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
