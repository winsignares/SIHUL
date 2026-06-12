import datetime

from django.test import TestCase

from espacios.models import EspacioFisico, TipoEspacio
from prestamos.models import PrestamoEspacio, PrestamoRecurso, TipoActividad
from prestamos.serializers import PrestamoEspacioSerializer
from recursos.models import Recurso
from sedes.models import Sede


class PrestamoEspacioSerializerRecursosTests(TestCase):
    def setUp(self):
        sede = Sede.objects.create(nombre='Sede de prueba')
        tipo_espacio = TipoEspacio.objects.create(nombre='Aula de prueba')
        self.espacio = EspacioFisico.objects.create(
            nombre='Espacio de prueba',
            sede=sede,
            tipo=tipo_espacio,
            capacidad=30,
        )
        self.tipo_actividad = TipoActividad.objects.create(nombre='Actividad de prueba')
        self.recurso = Recurso.objects.create(nombre='Videobeam de prueba')

    def test_crea_prestamo_con_recursos_y_los_serializa(self):
        serializer = PrestamoEspacioSerializer(data={
            'espacio': self.espacio.id,
            'usuario': None,
            'administrador': None,
            'tipo_actividad': self.tipo_actividad.id,
            'fecha': datetime.date.today().isoformat(),
            'hora_inicio': '10:00:00',
            'hora_fin': '11:00:00',
            'estado': 'Pendiente',
            'recursos': [{
                'recurso_id': self.recurso.id,
                'cantidad': 2,
            }],
        })

        self.assertTrue(serializer.is_valid(), serializer.errors)
        prestamo = serializer.save()

        self.assertTrue(
            PrestamoRecurso.objects.filter(
                prestamo=prestamo,
                recurso=self.recurso,
                cantidad=2,
            ).exists()
        )
        self.assertEqual(
            PrestamoEspacioSerializer(
                PrestamoEspacio.objects.prefetch_related(
                    'prestamo_recursos__recurso'
                ).get(id=prestamo.id)
            ).data['recursos'],
            [{
                'recurso_id': self.recurso.id,
                'recurso_nombre': self.recurso.nombre,
                'cantidad': 2,
            }],
        )
