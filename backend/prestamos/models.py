from django.db import models
from django.db.models import F, CheckConstraint, Q, Index
from espacios.models import EspacioFisico
from usuarios.models import Usuario

class TipoActividad(models.Model):
    """
    Tipos de actividades para los préstamos de espacios
    """
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name = 'Tipo de Actividad'
        verbose_name_plural = 'Tipos de Actividad'
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre

class PrestamoEspacio(models.Model):
    """
    Préstamos de espacios para usuarios autenticados (docentes, estudiantes, etc.)
    """
    ESTADO_CHOICES = [
        ('Pendiente', 'Pendiente'),
        ('Aprobado', 'Aprobado'),
        ('Rechazado', 'Rechazado'),
        ('Vencido', 'Vencido'),
    ]

    id = models.AutoField(primary_key=True)
    espacio = models.ForeignKey(EspacioFisico, on_delete=models.CASCADE, related_name='prestamos')
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='prestamos_solicitados')
    administrador = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='prestamos_admin')
    tipo_actividad = models.ForeignKey(TipoActividad, on_delete=models.PROTECT, related_name='prestamos')
    fecha = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    motivo = models.TextField(blank=True, null=True)
    asistentes = models.IntegerField(default=0)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='Pendiente')

    class Meta:
        constraints = [
            CheckConstraint(
                check=Q(hora_fin__gt=F('hora_inicio')),
                name='chk_prestamo_horas',
            ),
        ]
        indexes = [
            Index(fields=['espacio', 'fecha'], name='idx_prestamo_espacio_fecha'),
        ]
        verbose_name = 'Préstamo de Espacio'
        verbose_name_plural = 'Préstamos de Espacios'

    def __str__(self):
        return f"{self.espacio} - {self.fecha}"

class PrestamoEspacioPublico(models.Model):
    """
    Préstamos de espacios para usuarios públicos (sin cuenta en el sistema)
    Tabla separada para mantener independencia de PrestamoEspacio
    """
    ESTADO_CHOICES = [
        ('Pendiente', 'Pendiente'),
        ('Aprobado', 'Aprobado'),
        ('Rechazado', 'Rechazado'),
        ('Vencido', 'Vencido'),
    ]

    id = models.AutoField(primary_key=True)
    espacio = models.ForeignKey(EspacioFisico, on_delete=models.CASCADE, related_name='prestamos_publicos')
    # Datos del solicitante público (sin tabla separada)
    nombre_solicitante = models.CharField(max_length=200)
    correo_solicitante = models.EmailField()
    telefono_solicitante = models.CharField(max_length=20)
    identificacion_solicitante = models.CharField(max_length=50)
    # Datos del préstamo
    administrador = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='prestamos_publicos_admin')
    tipo_actividad = models.ForeignKey(TipoActividad, on_delete=models.PROTECT, related_name='prestamos_publicos')
    fecha = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    motivo = models.TextField(blank=True, null=True)
    asistentes = models.IntegerField(default=0)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='Pendiente')

    class Meta:
        constraints = [
            CheckConstraint(
                check=Q(hora_fin__gt=F('hora_inicio')),
                name='chk_prestamo_publico_horas',
            ),
        ]
        indexes = [
            Index(fields=['espacio', 'fecha'], name='idx_pub_espacio_fecha'),
        ]
        verbose_name = 'Préstamo Público de Espacio'
        verbose_name_plural = 'Préstamos Públicos de Espacios'

    def __str__(self):
        return f"{self.espacio} - {self.fecha} ({self.nombre_solicitante})"

class PrestamoRecurso(models.Model):
    """
    Tabla intermedia para asociar recursos con préstamos de usuarios autenticados
    """
    id = models.AutoField(primary_key=True)
    prestamo = models.ForeignKey(PrestamoEspacio, on_delete=models.CASCADE, related_name='prestamo_recursos')
    recurso = models.ForeignKey('recursos.Recurso', on_delete=models.CASCADE, related_name='prestamos')
    cantidad = models.PositiveIntegerField(default=1)
    
    class Meta:
        unique_together = ('prestamo', 'recurso')
        verbose_name = 'Recurso de Préstamo'
        verbose_name_plural = 'Recursos de Préstamos'
    
    def __str__(self):
        return f"{self.prestamo} - {self.recurso} (x{self.cantidad})"
