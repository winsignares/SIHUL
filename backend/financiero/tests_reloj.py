"""Reloj fijo para las pruebas del flujo de la factura.

Los pasos fijan sus fechas con `timezone.now()` (que las pruebas ya reemplazan), pero el cálculo de días hábiles del SLA
(`sla.py`) usa `date.today()`: sin fijarlo también, el resultado cambia con el día en que se corren las pruebas, y con él
las alertas de SLA que se notifican.
"""
from datetime import date
from unittest import mock


def fijar_hoy(caso, hoy):
    """Hace que `date.today()` del SLA devuelva `hoy` durante la prueba `caso`."""

    class FechaFija(date):
        @classmethod
        def today(cls):
            return hoy

    parche = mock.patch('financiero.sla.date', FechaFija)
    parche.start()
    caso.addCleanup(parche.stop)
