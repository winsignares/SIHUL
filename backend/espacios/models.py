from django.db import models
from sedes.models import Sede
from usuarios.models import Usuario


class TipoEspacio(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.nombre

class EspacioFisico(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)  # Nombre del espacio
    sede = models.ForeignKey(Sede, on_delete=models.CASCADE, related_name='espacios')
    tipo = models.ForeignKey(TipoEspacio, on_delete=models.PROTECT, related_name='espacios')
    capacidad = models.PositiveIntegerField()
    ubicacion = models.CharField(max_length=100, blank=True, null=True)
    # Indica si el espacio esta abierto (True) o cerrado (False) para acceso fisico.
    esta_abierto = models.BooleanField(default=True)
    # Disponible: apto para uso.
    # Mantenimiento: no apto por condicion fisica/tecnica del espacio.
    # No Disponible: no apto por razones administrativas u otras ajenas al mantenimiento.
    estado = models.CharField(
        max_length=20, 
        choices=[
            ('Disponible', 'Disponible'), 
            ('Mantenimiento', 'En Mantenimiento'), 
            ('No Disponible', 'No Disponible')
        ], 
        default='Disponible'
    )

    @property
    def recursos_con_estado(self):
        """Lista de recursos asociados con su estado actual."""
        return [
            {
                'id': relacion.recurso_id,
                'nombre': relacion.recurso.nombre,
                'estado': relacion.estado,
            }
            for relacion in self.espacio_recursos.select_related('recurso').all()
        ]

    def __str__(self):
        return f"{self.nombre} - {self.tipo.nombre} ({self.ubicacion or 'sin ubicación'})"
    
class EspacioPermitido(models.Model):
    espacio = models.ForeignKey(EspacioFisico, on_delete=models.CASCADE, related_name='espacios_permitidos')
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='espacios_permitidos')   

    def __str__(self):
        return f"{self.usuario} para {self.espacio}"


class StgOracleEspacioFisico(models.Model):
    source_system = models.CharField(max_length=50, default='ORACLE_SIU', db_index=True)
    external_id = models.CharField(max_length=100, db_index=True)
    ident_aula_oracle = models.CharField(max_length=10, null=True, blank=True, db_index=True)
    bloque_oracle = models.CharField(max_length=22, null=True, blank=True)
    nombre_espacio_oracle = models.CharField(max_length=60, null=True, blank=True)
    tipo_espacio_oracle = models.CharField(max_length=6, null=True, blank=True, db_index=True)
    id_sede_oracle = models.CharField(max_length=20, null=True, blank=True, db_index=True)
    nombre_sede_oracle = models.CharField(max_length=50, null=True, blank=True)
    nombre_facultad_oracle = models.CharField(max_length=250, null=True, blank=True)
    raw_data = models.JSONField(default=dict, blank=True)
    row_hash = models.CharField(max_length=64, db_index=True)
    estado_registro = models.CharField(max_length=30, default='valido', db_index=True)
    fecha_carga = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['source_system', 'external_id'],
                name='uq_stg_oracle_espacio_source_external',
            )
        ]
        ordering = ['external_id']

    def __str__(self):
        display_name = self.nombre_espacio_oracle or self.ident_aula_oracle or ''
        return f'{self.source_system}:{self.external_id} {display_name}'.strip()