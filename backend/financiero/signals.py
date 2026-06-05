from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import ParametroSLA, Factura
from .sla import build_parametros_sla_map, sincronizar_sla_facturas


@receiver(post_save, sender=ParametroSLA)
def parametro_sla_post_save(sender, instance, **kwargs):
    """Recalcular SLA cuando cambian los parámetros."""
    facturas = Factura.objects.exclude(estado__in=['Pagada', 'Anulada'])
    parametros_map = build_parametros_sla_map()
    sincronizar_sla_facturas(facturas, parametros_map=parametros_map)
