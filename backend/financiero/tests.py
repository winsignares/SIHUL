from django.test import TestCase
from . import models
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
            fecha_factura='2026-04-05',
            fecha_recepcion='2026-04-05',
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
            fecha_factura='2026-04-05',
            fecha_recepcion='2026-04-05',
            creado_por=self.usuario
        )
        
        factura.estado = 'Radicada'
        factura.save()
        
        self.assertEqual(factura.estado, 'Radicada')
        self.assertIsNotNone(factura.fecha_radicacion)
