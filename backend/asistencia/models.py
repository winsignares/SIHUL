from django.conf import settings
from django.db import models


class LugarPractica(models.Model):
    """Sitio donde se hace una práctica (por ejemplo, un hospital), con el radio en el que cuenta la asistencia."""
    nombre = models.CharField(max_length=150)
    latitud = models.DecimalField(max_digits=9, decimal_places=6)
    longitud = models.DecimalField(max_digits=9, decimal_places=6)
    radio_metros = models.PositiveIntegerField(default=100)
    precision_maxima_metros = models.PositiveIntegerField(
        default=50, help_text='Se rechaza una lectura cuyo error de ubicación supere este valor.',
    )
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre


class AsignacionPractica(models.Model):
    """Un estudiante en un lugar de práctica, con las fechas y el horario en que se puede registrar su ubicación."""
    estudiante = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='asignaciones_practica')
    lugar = models.ForeignKey(LugarPractica, on_delete=models.PROTECT, related_name='asignaciones')
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='practicas_a_cargo',
    )
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    activa = models.BooleanField(default=True)

    def __str__(self):
        return f'{self.estudiante_id} en {self.lugar_id}'


class ConsentimientoUbicacion(models.Model):
    """Autorización expresa del usuario para registrar su ubicación durante la práctica."""
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='consentimientos_ubicacion')
    version_texto = models.CharField(max_length=20)
    otorgado_en = models.DateTimeField(auto_now_add=True)
    revocado_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-otorgado_en']


class RegistroAsistencia(models.Model):
    TIPO_ENTRADA = 'entrada'
    TIPO_SALIDA = 'salida'
    TIPO_POSICION = 'posicion'
    TIPOS = [(TIPO_ENTRADA, 'Entrada'), (TIPO_SALIDA, 'Salida'), (TIPO_POSICION, 'Posición')]

    asignacion = models.ForeignKey(AsignacionPractica, on_delete=models.CASCADE, related_name='registros')
    tipo = models.CharField(max_length=10, choices=TIPOS)
    registrado_en = models.DateTimeField(auto_now_add=True, db_index=True)
    latitud = models.DecimalField(max_digits=9, decimal_places=6)
    longitud = models.DecimalField(max_digits=9, decimal_places=6)
    precision_metros = models.FloatField()
    distancia_metros = models.FloatField()
    dentro_del_radio = models.BooleanField()

    class Meta:
        ordering = ['registrado_en']
