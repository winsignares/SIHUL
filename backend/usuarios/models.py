from django.db import models
from django.db.models import Index
from django.contrib.auth.models import AbstractUser, UserManager
from facultades.models import Facultad
from sedes.models import Sede, Seccional

# Create your models here.


class UsuarioManager(UserManager):
    use_in_migrations = True

    def create_user(self, correo, password=None, **extra_fields):
        if not correo:
            raise ValueError('El correo es requerido')
        correo = self.normalize_email(correo)
        user = self.model(correo=correo, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, correo, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('es_superusuario', True)
        extra_fields.setdefault('activo', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser debe tener is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser debe tener is_superuser=True.')

        return self.create_user(correo, password, **extra_fields)

class Rol(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    supervisa_espacios = models.BooleanField(default=False)

    def __str__(self):
        return self.nombre

class Usuario(AbstractUser):
    id = models.AutoField(primary_key=True)
    username = None
    password = models.CharField(max_length=128, default='')
    nombre = models.CharField(max_length=100)
    correo = models.EmailField(max_length=100, unique=True)
    contrasena_hash = models.CharField(max_length=255)
    rol = models.ForeignKey(Rol, on_delete=models.SET_NULL, null=True, blank=True, related_name='usuarios')
    activo = models.BooleanField(default=True)
    facultad = models.ForeignKey(Facultad, on_delete=models.SET_NULL, null=True, blank=True, related_name='usuarios')
    sede = models.ForeignKey(Sede, on_delete=models.SET_NULL, null=True, blank=True, related_name='usuarios')
    seccional = models.ForeignKey(Seccional, on_delete=models.SET_NULL, null=True, blank=True, related_name='usuarios')
    es_superusuario = models.BooleanField(default=False)
    objects = UsuarioManager()

    USERNAME_FIELD = 'correo'
    REQUIRED_FIELDS = ['nombre']
    
    class Meta:
        indexes = [
            Index(fields=['rol'], name='idx_usuario_rol'),
            Index(fields=['facultad'], name='idx_usuario_facultad'),
            Index(fields=['sede'], name='idx_usuario_sede'),  # Agregar índice
            Index(fields=['seccional'], name='idx_usuario_seccional'),
        ]

    def __str__(self):
        return self.nombre or self.correo

    def save(self, *args, **kwargs):
        self.is_active = self.activo

        # Mantiene consistencia: la seccional del usuario siempre se deriva de su sede.
        if self.sede_id:
            sede_seccional_id = self.sede.seccional_id if self.sede else None
            if self.seccional_id != sede_seccional_id:
                self.seccional_id = sede_seccional_id

        if self.is_superuser or self.es_superusuario:
            self.is_superuser = True
            self.es_superusuario = True
            self.is_staff = True
        else:
            self.is_superuser = False
            self.es_superusuario = False
            self.is_staff = False

        if self.password and self.password != self.contrasena_hash:
            self.contrasena_hash = self.password
        elif self.contrasena_hash and len(self.contrasena_hash) <= 128 and self.password != self.contrasena_hash:
            self.password = self.contrasena_hash

        super().save(*args, **kwargs)


class StgOracleDocente(models.Model):
    source_system = models.CharField(max_length=50, default='ORACLE_SIU', db_index=True)
    external_id = models.CharField(max_length=100, db_index=True)
    id_docente_oracle = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    tipo_documento = models.CharField(max_length=30, null=True, blank=True)
    numero_documento = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    nombres = models.CharField(max_length=501, null=True, blank=True)
    apellidos = models.CharField(max_length=501, null=True, blank=True)
    nombre_completo = models.CharField(max_length=501, null=True, blank=True)
    correo_institucional = models.CharField(max_length=150, null=True, blank=True, db_index=True)
    correo_personal = models.CharField(max_length=150, null=True, blank=True)
    id_sede_oracle = models.CharField(max_length=50, null=True, blank=True, db_index=True)
    nombre_sede_oracle = models.CharField(max_length=255, null=True, blank=True)
    id_facultad_oracle = models.CharField(max_length=50, null=True, blank=True, db_index=True)
    nombre_facultad_oracle = models.CharField(max_length=255, null=True, blank=True)
    periodo_academico = models.CharField(max_length=50, null=True, blank=True, db_index=True)
    estado_docente = models.CharField(max_length=50, null=True, blank=True, db_index=True)
    raw_data = models.JSONField(default=dict, blank=True)
    row_hash = models.CharField(max_length=64, db_index=True)
    estado_registro = models.CharField(max_length=30, default='valido', db_index=True)
    fecha_carga = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['source_system', 'external_id'],
                name='uq_stg_oracle_doc_source_external',
            )
        ]
        ordering = ['external_id']

    def __str__(self):
        display_name = self.nombre_completo or self.correo_institucional or self.numero_documento or ''
        return f'{self.source_system}:{self.external_id} {display_name}'.strip()


class StgOracleEstudiante(models.Model):
    source_system = models.CharField(max_length=50, default='ORACLE_SIU', db_index=True)
    external_id = models.CharField(max_length=100, db_index=True)
    tipo_identificacion = models.CharField(max_length=6, null=True, blank=True)
    id_estudiante_oracle = models.CharField(max_length=30, null=True, blank=True, db_index=True)
    codigo_estudiante_oracle = models.CharField(max_length=12, null=True, blank=True, db_index=True)
    nombres = models.CharField(max_length=501, null=True, blank=True)
    apellidos = models.CharField(max_length=501, null=True, blank=True)
    nombre_completo = models.CharField(max_length=501, null=True, blank=True)
    semestre_oracle = models.IntegerField(null=True, blank=True)
    periodo_academico = models.CharField(max_length=5, null=True, blank=True, db_index=True)
    programa_oracle = models.CharField(max_length=250, null=True, blank=True)
    id_sede_oracle = models.CharField(max_length=50, null=True, blank=True, db_index=True)
    raw_data = models.JSONField(default=dict, blank=True)
    row_hash = models.CharField(max_length=64, db_index=True)
    estado_registro = models.CharField(max_length=30, default='valido', db_index=True)
    fecha_carga = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['source_system', 'external_id'],
                name='uq_stg_oracle_est_source_external',
            )
        ]
        ordering = ['external_id']

    def __str__(self):
        display_name = self.nombre_completo or self.id_estudiante_oracle or self.codigo_estudiante_oracle or ''
        return f'{self.source_system}:{self.external_id} {display_name}'.strip()
