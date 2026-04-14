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
    REQUIRED_FIELDS = []
    
    class Meta:
        indexes = [
            Index(fields=['rol'], name='idx_usuario_rol'),
            Index(fields=['facultad'], name='idx_usuario_facultad'),
            Index(fields=['sede'], name='idx_usuario_sede'),  # Agregar índice
            Index(fields=['seccional'], name='idx_usuario_seccional'),
        ]

    def __str__(self):
        return self.nombre

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
