from django.db import models
from django.db.models import F, CheckConstraint, Q, Index
from espacios.models import EspacioFisico
from usuarios.models import Usuario

class PrestamoEspacio(models.Model):
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
    fecha = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    motivo = models.TextField(blank=True, null=True)
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

    def __str__(self):
        return f"{self.espacio} - {self.fecha}"
