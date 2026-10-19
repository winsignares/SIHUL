from django.db import models
from django.db.models import Q

# Create your models here.


class Seccional(models.Model):
    id = models.AutoField(primary_key=True)
    ciudad = models.CharField(max_length=100, unique=True)
    activa = models.BooleanField(default=True)

    def __str__(self):
        return self.ciudad


class Sede(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    direccion = models.CharField(max_length=150, blank=True, null=True)
    source_system = models.CharField(max_length=50, null=True, blank=True, db_index=True)
    external_id = models.CharField(max_length=50, null=True, blank=True, db_index=True)
    seccional = models.ForeignKey(
        Seccional,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sedes',
    )
    activa = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['source_system', 'external_id'],
                condition=Q(source_system__isnull=False, external_id__isnull=False),
                name='uq_sede_source_external',
            )
        ]

    def __str__(self):
        return self.nombre


class OracleSyncRun(models.Model):
    STATUS_RUNNING = 'running'
    STATUS_SUCCESS = 'success'
    STATUS_PARTIAL = 'partial'
    STATUS_FAILED = 'failed'

    STATUS_CHOICES = [
        (STATUS_RUNNING, 'Running'),
        (STATUS_SUCCESS, 'Success'),
        (STATUS_PARTIAL, 'Partial'),
        (STATUS_FAILED, 'Failed'),
    ]

    TYPE_SEDES = 'sedes'
    TYPE_FACULTADES = 'facultades'
    TYPE_FULL = 'full'

    TYPE_CHOICES = [
        (TYPE_SEDES, 'Sedes'),
        (TYPE_FACULTADES, 'Facultades'),
        (TYPE_FULL, 'Full'),
    ]

    source_system = models.CharField(max_length=50, default='ORACLE_SIU', db_index=True)
    run_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_FULL)
    dry_run = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_RUNNING)
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    report = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f'{self.source_system} {self.run_type} {self.started_at:%Y-%m-%d %H:%M:%S}'


class StgOracleSede(models.Model):
    source_system = models.CharField(max_length=50, default='ORACLE_SIU', db_index=True)
    external_id = models.CharField(max_length=50, db_index=True)
    nombre_sede = models.CharField(max_length=255)
    raw_data = models.JSONField(default=dict, blank=True)
    row_hash = models.CharField(max_length=64, db_index=True)
    fecha_carga = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['source_system', 'external_id'],
                name='uq_stg_oracle_sede_source_external',
            )
        ]
        ordering = ['external_id']

    def __str__(self):
        return f'{self.source_system}:{self.external_id} {self.nombre_sede}'


class StgOracleFacultad(models.Model):
    source_system = models.CharField(max_length=50, default='ORACLE_SIU', db_index=True)
    external_id = models.CharField(max_length=50, db_index=True)
    id_sede_oracle = models.CharField(max_length=50, null=True, blank=True, db_index=True)
    nombre_sede_oracle = models.CharField(max_length=255, null=True, blank=True)
    nombre_facultad = models.CharField(max_length=255)
    raw_data = models.JSONField(default=dict, blank=True)
    row_hash = models.CharField(max_length=64, db_index=True)
    fecha_carga = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['source_system', 'external_id'],
                name='uq_stg_oracle_fac_source_external',
            )
        ]
        ordering = ['external_id']

    def __str__(self):
        return f'{self.source_system}:{self.external_id} {self.nombre_facultad}'


class MapOracleSedeSeccional(models.Model):
    METHOD_AUTO = 'automatico'
    METHOD_MANUAL = 'manual'
    METHOD_PENDING = 'pendiente'

    METHOD_CHOICES = [
        (METHOD_AUTO, 'Automatico'),
        (METHOD_MANUAL, 'Manual'),
        (METHOD_PENDING, 'Pendiente'),
    ]

    STATUS_MAPPED = 'mapped'
    STATUS_PENDING = 'pending'
    STATUS_CONFLICT = 'conflict'

    STATUS_CHOICES = [
        (STATUS_MAPPED, 'Mapped'),
        (STATUS_PENDING, 'Pending'),
        (STATUS_CONFLICT, 'Conflict'),
    ]

    source_system = models.CharField(max_length=50, default='ORACLE_SIU', db_index=True)
    external_id_oracle = models.CharField(max_length=50, db_index=True)
    nombre_oracle = models.CharField(max_length=255)
    seccional = models.ForeignKey(
        Seccional,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mapeos_oracle',
    )
    sede = models.ForeignKey(
        Sede,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mapeos_oracle',
    )
    metodo_asignacion = models.CharField(max_length=20, choices=METHOD_CHOICES, default=METHOD_PENDING)
    estado = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    confianza = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    observaciones = models.TextField(blank=True, default='')
    ultimo_hash_oracle = models.CharField(max_length=64, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['source_system', 'external_id_oracle'],
                name='uq_map_oracle_sede_source_external',
            )
        ]
        ordering = ['external_id_oracle']

    def __str__(self):
        return f'{self.source_system}:{self.external_id_oracle} -> {self.seccional_id or "pendiente"}'


class OracleSyncIssue(models.Model):
    SEVERITY_INFO = 'info'
    SEVERITY_WARNING = 'warning'
    SEVERITY_ERROR = 'error'

    SEVERITY_CHOICES = [
        (SEVERITY_INFO, 'Info'),
        (SEVERITY_WARNING, 'Warning'),
        (SEVERITY_ERROR, 'Error'),
    ]

    run = models.ForeignKey(
        OracleSyncRun,
        on_delete=models.CASCADE,
        related_name='issues',
    )
    source_system = models.CharField(max_length=50, default='ORACLE_SIU', db_index=True)
    issue_type = models.CharField(max_length=100)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default=SEVERITY_WARNING)
    external_id = models.CharField(max_length=50, blank=True, default='', db_index=True)
    message = models.TextField()
    payload = models.JSONField(default=dict, blank=True)
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.issue_type} ({self.severity}) {self.external_id}'
