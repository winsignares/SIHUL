from django.db import models
from django.utils import timezone

# Create your models here.

class PeriodoAcademico(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    activo = models.BooleanField(default=True)

    @classmethod
    def sincronizar_activos_por_fecha(cls, fecha=None):
        """Activa periodos vigentes para la fecha y desactiva los demas."""
        hoy = fecha or timezone.localdate()

        vigentes_qs = cls.objects.filter(fecha_inicio__lte=hoy, fecha_fin__gte=hoy)
        no_vigentes_qs = cls.objects.exclude(fecha_inicio__lte=hoy, fecha_fin__gte=hoy)

        activados = vigentes_qs.exclude(activo=True).update(activo=True)
        desactivados = no_vigentes_qs.exclude(activo=False).update(activo=False)

        return {
            'fecha': hoy,
            'activados': activados,
            'desactivados': desactivados,
        }

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.__class__.sincronizar_activos_por_fecha()

    def __str__(self):
        return self.nombre
