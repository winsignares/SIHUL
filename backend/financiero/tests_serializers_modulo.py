"""Serializadores del módulo financiero: interfaz pública (caracterización).

Las vistas los usan como `serializers.<Nombre>`; la validación de cada uno ya se prueba por la API en `tests.py`,
`tests_documentos.py` y `tests_flujo_factura*.py`. Aquí se fija que todos los nombres y los límites de los
documentos siguen disponibles y que cada serializador apunta a su modelo.
"""
from django.test import SimpleTestCase

from . import models, serializers


class InterfazPublicaTests(SimpleTestCase):
    MODELOS = {
        'ProveedorSerializer': 'Proveedor',
        'PaisSerializer': 'Pais',
        'DepartamentoGeograficoSerializer': 'DepartamentoGeografico',
        'CiudadSerializer': 'Ciudad',
        'DepartamentoSerializer': 'Departamento',
        'CuentaContableSerializer': 'CuentaContable',
        'CentroCostoSerializer': 'CentroCosto',
        'ParametroSLASerializer': 'ParametroSLA',
        'ParametrosFinancieroSerializer': 'ParametrosFinanciero',
        'ReporteGeneradoSerializer': 'ReporteGenerado',
        'DocumentoAdjuntoSerializer': 'DocumentoAdjunto',
        'HistorialFacturaSerializer': 'HistorialFactura',
        'ComentarioFacturaSerializer': 'ComentarioFactura',
        'RechazoDevolacionSerializer': 'RechazoDevolucion',
        'ItemFacturaSerializer': 'ItemFactura',
        'FacturaListSerializer': 'Factura',
        'FacturaDetailSerializer': 'Factura',
        'FacturaCreateSerializer': 'Factura',
        'BancoSerializer': 'Banco',
        'TipoCuentaSerializer': 'TipoCuenta',
    }

    def test_cada_serializador_sigue_disponible_y_apunta_a_su_modelo(self):
        for nombre, modelo in self.MODELOS.items():
            with self.subTest(nombre):
                serializador = getattr(serializers, nombre)
                self.assertIs(serializador.Meta.model, getattr(models, modelo))

    def test_limites_de_los_documentos(self):
        self.assertEqual(serializers.ALLOWED_DOC_EXTENSIONS, {'pdf', 'xml', 'png', 'jpg', 'jpeg', 'txt'})
        self.assertEqual(serializers.MAX_DOC_SIZE_BYTES, 25 * 1024 * 1024)
        self.assertIn('application/pdf', serializers.ALLOWED_DOC_MIME_TYPES)
        self.assertIn('application/octet-stream', serializers.ALLOWED_DOC_MIME_TYPES)
