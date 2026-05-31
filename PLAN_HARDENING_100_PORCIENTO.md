# 🛡️ PLAN DE HARDENING TOTAL - SIHUL 100%

**Objetivo:** Llevar todas las 13 vulnerabilidades a 100% de mitigación  
**Fecha Inicio:** 31 Mayo 2026  
**Meta:** Completar antes del 15 Junio 2026  
**Duración Total Estimada:** 21 días de trabajo

---

## 📊 RESUMEN EJECUTIVO

| Fase | Vulnerabilidades | Prioridad | Duración | Estado |
|------|-----------------|-----------|----------|--------|
| **FASE 1** | A2, A4, A9, B5 (4 vulnerabilidades CRÍTICAS) | CRÍTICO | 10d | ⏳ PRÓXIMO |
| **FASE 2** | A1, A5, A7 (3 vulnerabilidades CRÍTICAS) | CRÍTICO | 8d | ⏳ DESPUÉS |
| **FASE 3** | A3, A6, A8, A10, B1, B2 (6 vulnerabilidades ALTAS) | ALTO | 8d | ⏳ FINAL |
| **TOTAL** | 13 vulnerabilidades | - | 21d | 🔄 EN PROGRESO |

---

## 🚨 FASE 1: MITIGACIONES CRÍTICAS (10 días)

### **FILA 1: A2 - Cryptographic Failures [0% → 100%]** 
**Duración:** 3 días  
**Prioridad:** 🔴 CRÍTICA  
**Riesgo:** Datos sensibles no encriptados

#### **Paso 1.1: Crear modelo de encriptación para datos sensibles**

**Archivo:** `backend/usuarios/models.py`

```python
# Agregar imports
from cryptography.fernet import Fernet
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class UsuarioEncrypted(models.Model):
    """Mixin para encriptación de campos sensibles"""
    
    ENCRYPTED_FIELDS = []  # Sobrescribir en modelos que lo usen
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._encrypted_values = {}
    
    def encrypt_field(self, field_name, value):
        """Encripta un campo sensible"""
        if not value:
            return None
        
        try:
            cipher = Fernet(settings.ENCRYPTION_KEY)
            encrypted = cipher.encrypt(str(value).encode())
            return encrypted
        except Exception as e:
            logger.error(f"Encryption failed for {field_name}: {e}")
            raise
    
    def decrypt_field(self, field_name, encrypted_value):
        """Desencripta un campo sensible"""
        if not encrypted_value:
            return None
        
        try:
            cipher = Fernet(settings.ENCRYPTION_KEY)
            decrypted = cipher.decrypt(encrypted_value).decode()
            return decrypted
        except Exception as e:
            logger.error(f"Decryption failed for {field_name}: {e}")
            raise
    
    def save(self, *args, **kwargs):
        """Encripta campos antes de guardar"""
        for field_name in self.ENCRYPTED_FIELDS:
            if hasattr(self, f'{field_name}_decrypted'):
                value = getattr(self, f'{field_name}_decrypted')
                encrypted = self.encrypt_field(field_name, value)
                setattr(self, field_name, encrypted)
        super().save(*args, **kwargs)
    
    class Meta:
        abstract = True


# Actualizar modelo Usuario
class Usuario(UsuarioEncrypted):
    # ... campos existentes ...
    
    # Nuevos campos encriptados
    numero_identificacion_encrypted = models.BinaryField(null=True, blank=True)
    numero_telefono_encrypted = models.BinaryField(null=True, blank=True)
    
    ENCRYPTED_FIELDS = [
        'numero_identificacion_encrypted',
        'numero_telefono_encrypted',
    ]
    
    @property
    def numero_identificacion(self):
        if self.numero_identificacion_encrypted:
            return self.decrypt_field('numero_identificacion', self.numero_identificacion_encrypted)
        return None
    
    @numero_identificacion.setter
    def numero_identificacion(self, value):
        self.numero_identificacion_decrypted = value
    
    @property
    def numero_telefono(self):
        if self.numero_telefono_encrypted:
            return self.decrypt_field('numero_telefono', self.numero_telefono_encrypted)
        return None
    
    @numero_telefono.setter
    def numero_telefono(self, value):
        self.numero_telefono_decrypted = value
```

#### **Paso 1.2: Configurar claves de encriptación en settings.py**

```python
# backend/mysite/settings.py

import os
from cryptography.fernet import Fernet

# ✅ NUEVA: Generar/cargar clave de encriptación
def get_encryption_key():
    """Obtiene o crea clave de encriptación segura"""
    key_file = os.path.join(BASE_DIR, '.encryption.key')
    
    if os.path.exists(key_file):
        with open(key_file, 'rb') as f:
            return f.read()
    else:
        # Generar nueva clave (solo primera vez)
        key = Fernet.generate_key()
        
        # ⚠️ IMPORTANTE: Guardar en archivo con permisos 600
        with open(key_file, 'wb') as f:
            f.write(key)
        
        # Cambiar permisos a 600 (solo propietario puede leer/escribir)
        os.chmod(key_file, 0o600)
        
        logger.warning("✅ Generated new encryption key. Store .encryption.key securely!")
        return key

ENCRYPTION_KEY = get_encryption_key()
HASH_SALT = os.getenv('HASH_SALT', 'default-salt-change-in-prod')  # ⚠️ CAMBIAR EN PRODUCCIÓN

# ✅ NUEVA: Force HTTPS en producción
if os.getenv('ENVIRONMENT') == 'production':
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
```

#### **Paso 1.3: Crear migration para agregar campos encriptados**

```bash
cd backend
python manage.py makemigrations usuarios --name add_encrypted_fields
python manage.py migrate
```

#### **Paso 1.4: Actualizar serializers para no retornar datos encriptados**

```python
# backend/usuarios/serializers.py

class UsuarioSerializer(serializers.ModelSerializer):
    # No incluir campos encriptados en respuesta
    numero_identificacion = serializers.SerializerMethodField()
    numero_telefono = serializers.SerializerMethodField()
    
    class Meta:
        model = Usuario
        fields = [
            'id', 'nombre', 'correo', 'numero_identificacion',
            'numero_telefono', 'rol'
        ]
    
    def get_numero_identificacion(self, obj):
        # Solo retornar últimos 4 dígitos
        if obj.numero_identificacion:
            return f"****{obj.numero_identificacion[-4:]}"
        return None
    
    def get_numero_telefono(self, obj):
        # No retornar teléfono en respuesta (muy sensible)
        return None
    
    def validate_numero_identificacion(self, value):
        # Validar formato
        if not value or len(value) < 8:
            raise ValidationError("ID must be at least 8 characters")
        return value
```

#### **Paso 1.5: Tests de encriptación**

```python
# backend/usuarios/tests.py

from django.test import TestCase
from .models import Usuario
from cryptography.fernet import Fernet

class EncryptionTests(TestCase):
    def setUp(self):
        self.usuario = Usuario.objects.create(
            nombre="Test User",
            correo="test@example.com"
        )
    
    def test_numero_identificacion_encrypted(self):
        """Test que el número de identificación se encripta"""
        # Set valor
        self.usuario.numero_identificacion = "1234567890"
        self.usuario.save()
        
        # Recuperar desde BD
        usuario_db = Usuario.objects.get(id=self.usuario.id)
        
        # Verificar que está encriptado en BD
        self.assertNotEqual(
            usuario_db.numero_identificacion_encrypted,
            b"1234567890"
        )
        
        # Verificar que se desencripta correctamente
        self.assertEqual(
            usuario_db.numero_identificacion,
            "1234567890"
        )
    
    def test_telefono_not_in_response(self):
        """Test que el teléfono no se retorna en API"""
        self.usuario.numero_telefono = "3001234567"
        self.usuario.save()
        
        serializer = UsuarioSerializer(self.usuario)
        self.assertIsNone(serializer.data['numero_telefono'])
    
    def test_identificacion_masked(self):
        """Test que el ID se retorna enmascarado"""
        self.usuario.numero_identificacion = "1234567890"
        self.usuario.save()
        
        serializer = UsuarioSerializer(self.usuario)
        self.assertEqual(serializer.data['numero_identificacion'], "****7890")
```

**Ejecución:** `python manage.py test usuarios.tests.EncryptionTests`

---

### **FILA 2: A4 - Insecure Design [0% → 100%]**
**Duración:** 3 días  
**Prioridad:** 🔴 CRÍTICA  
**Riesgo:** Arquitectura de seguridad débil

#### **Paso 2.1: Implementar Multi-Factor Authentication (MFA)**

```bash
pip install django-otp qrcode pillow
```

**Archivo:** `backend/mysite/settings.py`

```python
INSTALLED_APPS = [
    # ... apps existentes ...
    'django_otp',
    'django_otp.plugins.otp_totp',
]

MIDDLEWARE = [
    # ... middleware existente ...
    'django_otp.middleware.OTPMiddleware',  # Agregar
]

OTP_TOTP_ISSUER = 'SIHUL'
```

**Archivo:** `backend/usuarios/models.py`

```python
from django_otp.plugins.otp_totp.models import AbstractTOTPDevice

class UsuarioTOTPDevice(AbstractTOTPDevice):
    """Dispositivo TOTP para 2FA del usuario"""
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='totp_device')
    is_backup = models.BooleanField(default=False)
    
    def __str__(self):
        return f"TOTP Device for {self.usuario.correo}"
```

**Archivo:** `backend/usuarios/views.py`

```python
from django_otp.decorators import otp_required
from django_otp.plugins.otp_totp.models import AbstractTOTPDevice
import pyotp
import qrcode
from io import BytesIO
import base64

@csrf_exempt
def setup_2fa(request):
    """Configurar 2FA para usuario"""
    if request.method != 'POST':
        return JsonResponse({"error": "POST required"}, status=405)
    
    user = request.user
    
    # Generar secret
    secret = pyotp.random_base32()
    
    # Generar código QR
    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(
        name=user.correo,
        issuer_name='SIHUL'
    )
    
    # Crear QR image
    qr = qrcode.QRCode(version=1)
    qr.add_data(uri)
    qr.make(fit=True)
    img = qr.make_image()
    
    # Convertir a base64
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    # Guardar temporalmente (sin confirmar aún)
    request.session['2fa_secret_pending'] = secret
    
    return JsonResponse({
        "qr_code": f"data:image/png;base64,{img_base64}",
        "secret": secret,  # Para guardia manual si escaneo falla
        "message": "Escanea el código QR con tu app de autenticación"
    })

@csrf_exempt
def confirm_2fa(request):
    """Confirmar 2FA con código del usuario"""
    if request.method != 'POST':
        return JsonResponse({"error": "POST required"}, status=405)
    
    code = request.data.get('code')
    secret = request.session.get('2fa_secret_pending')
    
    if not secret:
        return JsonResponse({"error": "No pending 2FA setup"}, status=400)
    
    # Validar código
    totp = pyotp.TOTP(secret)
    if not totp.verify(code):
        return JsonResponse({"error": "Invalid code"}, status=400)
    
    # Guardar device
    user = request.user
    device, created = AbstractTOTPDevice.objects.get_or_create(
        user=user,
        name='default',
        defaults={'secret': secret, 'confirmed': True}
    )
    
    del request.session['2fa_secret_pending']
    
    return JsonResponse({
        "message": "2FA habilitado",
        "backup_codes": generate_backup_codes(user)
    })

@otp_required
@csrf_exempt
def dashboard(request):
    """Dashboard solo accesible con 2FA confirmado"""
    return JsonResponse({
        "user": request.user.correo,
        "2fa_enabled": True
    })

def generate_backup_codes(user, count=10):
    """Generar códigos de backup para 2FA"""
    codes = []
    for i in range(count):
        code = secrets.token_hex(4).upper()
        codes.append(code)
        # Guardar en BD (hasheados)
        BackupCode.objects.create(
            user=user,
            code_hash=make_password(code)
        )
    return codes
```

#### **Paso 2.2: Implementar validación de contraseña fuerte**

**Archivo:** `backend/mysite/settings.py`

```python
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 12,  # Mínimo 12 caracteres
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
    {
        'NAME': 'backend.mysite.validators.PasswordStrengthValidator',  # Custom
    },
]
```

**Archivo:** `backend/mysite/validators.py` (NUEVO)

```python
from django.contrib.auth.password_validation import BasePasswordValidator
from django.core.exceptions import ValidationError
import re

class PasswordStrengthValidator(BasePasswordValidator):
    """Validar contraseña fuerte con requisitos específicos"""
    
    def validate(self, password, user=None):
        errors = []
        
        # Al menos 1 mayúscula
        if not re.search(r'[A-Z]', password):
            errors.append("La contraseña debe contener al menos 1 mayúscula")
        
        # Al menos 1 minúscula
        if not re.search(r'[a-z]', password):
            errors.append("La contraseña debe contener al menos 1 minúscula")
        
        # Al menos 1 número
        if not re.search(r'\d', password):
            errors.append("La contraseña debe contener al menos 1 número")
        
        # Al menos 1 carácter especial
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', password):
            errors.append("La contraseña debe contener al menos 1 carácter especial")
        
        if errors:
            raise ValidationError(errors, code='password_strength')
    
    def get_help_text(self):
        return "Contraseña debe tener: 12+ caracteres, 1 mayúscula, 1 minúscula, 1 número, 1 especial"
```

#### **Paso 2.3: Implementar recuperación de contraseña segura**

**Archivo:** `backend/usuarios/models.py`

```python
class PasswordResetToken(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    
    def is_valid(self):
        """Token es válido si no expiró y no fue usado"""
        return not self.used and timezone.now() < self.expires_at
```

**Archivo:** `backend/usuarios/views.py`

```python
import secrets
from datetime import timedelta

@csrf_exempt
def request_password_reset(request):
    """Solicitar reset de contraseña"""
    if request.method != 'POST':
        return JsonResponse({"error": "POST required"}, status=405)
    
    email = request.data.get('email')
    
    try:
        usuario = Usuario.objects.get(correo=email)
    except Usuario.DoesNotExist:
        # NO revelar si email existe (prevenir enumeration)
        return JsonResponse({
            "message": "Si el email está registrado, recibirás un enlace de reset"
        })
    
    # Generar token válido por 1 hora
    token = secrets.token_urlsafe(32)
    PasswordResetToken.objects.create(
        usuario=usuario,
        token=token,
        expires_at=timezone.now() + timedelta(hours=1)
    )
    
    # Enviar email
    send_password_reset_email(usuario.correo, token)
    
    return JsonResponse({
        "message": "Si el email está registrado, recibirás un enlace de reset"
    })

@csrf_exempt
def reset_password(request):
    """Hacer reset de contraseña con token"""
    if request.method != 'POST':
        return JsonResponse({"error": "POST required"}, status=405)
    
    token = request.data.get('token')
    new_password = request.data.get('password')
    
    try:
        reset_token = PasswordResetToken.objects.get(token=token)
    except PasswordResetToken.DoesNotExist:
        return JsonResponse({"error": "Invalid or expired token"}, status=400)
    
    # Validar token
    if not reset_token.is_valid():
        return JsonResponse({"error": "Token expired"}, status=400)
    
    # Validar contraseña nueva
    try:
        validate_password(new_password)
    except ValidationError as e:
        return JsonResponse({"error": str(e)}, status=400)
    
    # Cambiar contraseña
    usuario = reset_token.usuario
    usuario.set_password(new_password)
    usuario.save()
    
    # Marcar token como usado
    reset_token.used = True
    reset_token.save()
    
    # Invalidar todos los otros tokens
    PasswordResetToken.objects.filter(usuario=usuario, used=False).update(used=True)
    
    # Log del evento
    audit_logger.info(f"Password reset for user {usuario.id}")
    
    return JsonResponse({"message": "Contraseña cambiada exitosamente"})
```

---

### **FILA 3: A9 - Logging/Monitoring [0% → 100%]**
**Duración:** 2 días  
**Prioridad:** 🔴 CRÍTICA  
**Riesgo:** Sin visibilidad de eventos de seguridad

#### **Paso 3.1: Implementar sistema de logging centralizado**

**Archivo:** `backend/mysite/settings.py`

```python
import logging.handlers
import os

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} {module} {process:d} {thread:d} - {message}',
            'style': '{',
            'datefmt': '%Y-%m-%d %H:%M:%S'
        },
        'json': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '%(asctime)s %(name)s %(levelname)s %(message)s'
        }
    },
    'handlers': {
        'security_file': {
            'level': 'WARNING',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs/security.log'),
            'maxBytes': 10485760,  # 10MB
            'backupCount': 10,
            'formatter': 'json',
        },
        'audit_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs/audit.log'),
            'maxBytes': 10485760,
            'backupCount': 20,
            'formatter': 'json',
        },
        'access_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs/access.log'),
            'maxBytes': 10485760,
            'backupCount': 20,
            'formatter': 'json',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose'
        },
    },
    'loggers': {
        'security': {
            'handlers': ['security_file', 'console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'audit': {
            'handlers': ['audit_file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        'access': {
            'handlers': ['access_file'],
            'level': 'INFO',
            'propagate': False,
        },
    }
}

# Crear directorio de logs si no existe
os.makedirs(os.path.join(BASE_DIR, 'logs'), exist_ok=True)
```

#### **Paso 3.2: Crear modelo para auditoría**

**Archivo:** `backend/mysite/models.py` (NUEVO)

```python
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import json

Usuario = get_user_model()

class AuditLog(models.Model):
    """Registro de auditoría de eventos críticos"""
    
    EVENT_TYPES = [
        ('LOGIN_SUCCESS', 'Login Exitoso'),
        ('LOGIN_FAILED', 'Login Fallido'),
        ('LOGIN_ATTEMPT_BLOCKED', 'Intento de Login Bloqueado'),
        ('PASSWORD_CHANGED', 'Contraseña Cambiada'),
        ('PASSWORD_RESET', 'Reset de Contraseña'),
        ('2FA_ENABLED', '2FA Habilitado'),
        ('2FA_DISABLED', '2FA Deshabilitado'),
        ('CSRF_VIOLATION', 'Violación CSRF'),
        ('IDOR_ATTEMPT', 'Intento IDOR'),
        ('XSS_ATTEMPT', 'Intento XSS'),
        ('PERMISSION_DENIED', 'Permiso Denegado'),
        ('ADMIN_ACTION', 'Acción de Admin'),
        ('DATA_EXPORT', 'Exportación de Datos'),
        ('SUSPICIOUS_ACTIVITY', 'Actividad Sospechosa'),
    ]
    
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    endpoint = models.CharField(max_length=500, blank=True)
    method = models.CharField(max_length=10, blank=True)  # GET, POST, etc
    status_code = models.IntegerField(null=True, blank=True)
    details = models.JSONField(default=dict)
    severity = models.CharField(
        max_length=10,
        choices=[('LOW', 'Bajo'), ('MEDIUM', 'Medio'), ('HIGH', 'Alto'), ('CRITICAL', 'Crítico')],
        default='LOW'
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['usuario', '-timestamp']),
            models.Index(fields=['event_type', '-timestamp']),
            models.Index(fields=['severity', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.event_type} - {self.usuario} - {self.timestamp}"
```

#### **Paso 3.3: Crear middleware para logging automático**

**Archivo:** `backend/mysite/audit_middleware.py` (NUEVO)

```python
from django.utils.deprecation import MiddlewareMixin
from mysite.models import AuditLog
import logging

audit_logger = logging.getLogger('audit')
security_logger = logging.getLogger('security')

class AuditLoggingMiddleware(MiddlewareMixin):
    """Middleware que registra todos los eventos importantes"""
    
    SENSITIVE_ENDPOINTS = [
        '/api/usuarios/login/',
        '/api/usuarios/logout/',
        '/api/usuarios/change-password/',
        '/api/admin/',
        '/api/financiero/facturas/',
    ]
    
    def process_request(self, request):
        request._audit_start = timezone.now()
        request._audit_data = {
            'ip_address': self._get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'endpoint': request.path,
            'method': request.method,
        }
    
    def process_response(self, request, response):
        if not hasattr(request, '_audit_start'):
            return response
        
        # Registrar acceso a endpoints sensibles
        if any(ep in request.path for ep in self.SENSITIVE_ENDPOINTS):
            self._log_audit_event(request, response)
        
        # Registrar errores de seguridad
        if response.status_code in [403, 401, 405]:
            self._log_security_event(request, response)
        
        return response
    
    def _log_audit_event(self, request, response):
        """Registra evento de auditoría"""
        user = request.user if request.user.is_authenticated else None
        
        AuditLog.objects.create(
            event_type='ADMIN_ACTION' if user and user.is_staff else 'USER_ACTION',
            usuario=user,
            ip_address=request._audit_data['ip_address'],
            user_agent=request._audit_data['user_agent'],
            endpoint=request._audit_data['endpoint'],
            method=request._audit_data['method'],
            status_code=response.status_code,
            details={
                'duration_ms': (timezone.now() - request._audit_start).total_seconds() * 1000,
                'user_id': user.id if user else None,
            }
        )
        
        audit_logger.info(
            f"API Access: {request._audit_data['method']} {request._audit_data['endpoint']} "
            f"- Status: {response.status_code} - User: {user}"
        )
    
    def _log_security_event(self, request, response):
        """Registra evento de seguridad"""
        event_map = {
            401: ('LOGIN_FAILED', 'HIGH'),
            403: ('PERMISSION_DENIED', 'MEDIUM'),
            405: ('SUSPICIOUS_ACTIVITY', 'LOW'),
        }
        
        event_type, severity = event_map.get(response.status_code, ('SUSPICIOUS_ACTIVITY', 'MEDIUM'))
        
        AuditLog.objects.create(
            event_type=event_type,
            usuario=request.user if request.user.is_authenticated else None,
            ip_address=request._audit_data['ip_address'],
            endpoint=request._audit_data['endpoint'],
            method=request._audit_data['method'],
            status_code=response.status_code,
            severity=severity,
        )
        
        security_logger.warning(
            f"Security Event: {event_type} - {request._audit_data['endpoint']} "
            f"from {request._audit_data['ip_address']}"
        )
    
    @staticmethod
    def _get_client_ip(request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
```

**Agregar a settings.py:**
```python
MIDDLEWARE = [
    # ... middleware existente ...
    'mysite.audit_middleware.AuditLoggingMiddleware',
]
```

#### **Paso 3.4: Crear dashboard de auditoría**

**Archivo:** `backend/mysite/admin.py`

```python
from django.contrib import admin
from mysite.models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'event_type', 'usuario', 'ip_address', 'status_code', 'severity']
    list_filter = ['event_type', 'severity', 'timestamp']
    search_fields = ['usuario__correo', 'ip_address', 'endpoint']
    readonly_fields = ['timestamp', 'ip_address', 'user_agent']
    
    def has_add_permission(self, request):
        return False  # No permitir agregar manualmente
    
    def has_delete_permission(self, request, obj=None):
        return False  # No permitir borrar registros de auditoría
```

---

### **FILA 4: B5 - Insecure Deserialization [0% → 100%]**
**Duración:** 1 día  
**Prioridad:** 🔴 CRÍTICA  
**Riesgo:** Arbitrary code execution

#### **Paso 4.1: Auditar y remover unsafe deserialization**

**Buscar en todo el código:**
```bash
grep -r "pickle.loads" backend/
grep -r "yaml.load" backend/
grep -r "marshal.loads" backend/
```

**Reemplazar todos:**

```python
# ❌ INSEGURO
import pickle
data = pickle.loads(user_input)

# ✅ SEGURO
import json
data = json.loads(user_input)

# O si necesitas más funciones:
import ast
data = ast.literal_eval(user_input)  # Solo para literals seguros
```

#### **Paso 4.2: Implementar validación estricta de JSON**

**Archivo:** `backend/mysite/serialization.py` (NUEVO)

```python
import json
from django.core.exceptions import ValidationError
from decimal import Decimal

class SafeJSONDecoder(json.JSONDecoder):
    """Decoder JSON seguro que valida tipos"""
    
    ALLOWED_TYPES = (str, int, float, bool, type(None), list, dict, Decimal)
    
    def decode(self, s, _w=json.decoder.WHITESPACE.match):
        obj = super().decode(s)
        return self._validate_types(obj)
    
    def _validate_types(self, obj, depth=0):
        """Valida que el objeto solo contiene tipos permitidos"""
        if depth > 20:  # Prevenir deep nesting
            raise ValidationError("JSON nesting too deep")
        
        if type(obj) not in self.ALLOWED_TYPES:
            raise ValidationError(f"Type {type(obj).__name__} not allowed")
        
        if isinstance(obj, dict):
            for key, value in obj.items():
                if not isinstance(key, str):
                    raise ValidationError("Dict keys must be strings")
                obj[key] = self._validate_types(value, depth + 1)
        
        elif isinstance(obj, list):
            obj = [self._validate_types(item, depth + 1) for item in obj]
        
        return obj

def safe_json_loads(data):
    """Carga JSON de manera segura"""
    try:
        return json.loads(data, cls=SafeJSONDecoder)
    except json.JSONDecodeError as e:
        raise ValidationError(f"Invalid JSON: {e}")
```

#### **Paso 4.3: Actualizar todas las vistas para usar safe JSON**

```python
# En todos los views que reciben JSON:

from mysite.serialization import safe_json_loads

@csrf_exempt
def create_grupo(request):
    if request.method != 'POST':
        return JsonResponse({"error": "POST required"}, status=405)
    
    try:
        # ✅ Usar safe_json_loads en lugar de json.loads
        data = safe_json_loads(request.body)
    except ValidationError as e:
        return JsonResponse({"error": str(e)}, status=400)
    
    # ... resto del código
```

---

## 📋 RESUMEN FASE 1

| Tarea | Archivo | Líneas | Duración |
|-------|---------|--------|----------|
| A2: Encriptación | usuarios/models.py | 150 | 1d |
| A2: Settings | mysite/settings.py | 20 | 0.5d |
| A2: Serializers | usuarios/serializers.py | 30 | 0.5d |
| A2: Tests | usuarios/tests.py | 50 | 0.5d |
| A4: 2FA | usuarios/models.py, views.py | 200 | 1.5d |
| A4: Password Validation | mysite/validators.py | 80 | 0.5d |
| A4: Password Reset | usuarios/models.py, views.py | 120 | 1d |
| A9: Logging | mysite/settings.py | 50 | 0.5d |
| A9: Audit Model | mysite/models.py | 60 | 0.5d |
| A9: Audit Middleware | mysite/audit_middleware.py | 100 | 0.5d |
| B5: Safe Deserialization | mysite/serialization.py | 80 | 1d |
| **TOTAL FASE 1** | **11 archivos** | **~960 líneas** | **~10 días** |

---

## 🚀 FASE 2: MITIGACIONES CRÍTICAS RESTANTES (8 días)

### **A1: Broken Access Control [70% → 100%]** (2 días)
- Rate limiting en todos los endpoints críticos
- Session binding (token + IP + User-Agent)
- Logout remoto (invalidar todos los tokens)

### **A5: Broken Authentication [60% → 100%]** (2 días)
- Cookies seguras (HttpOnly, Secure, SameSite)
- Account lockout temporal
- Login notifications al usuario

### **A7: Identification Failures [50% → 100%]** (2 días)
- Account enumeration prevention
- Login attempt tracking
- IP whitelist para admins

---

## 🎯 FASE 3: MITIGACIONES ALTAS (8 días)

### **A3: Injection [50% → 100%]** (2 días)
- Validar querysets contra SQL injection
- Template injection prevention
- OS command injection prevention

### **A6: Software Integrity [0% → 100%]** (1 día)
- Dependency pinning
- Hash verification
- SBOM generation

### **A8: Data Validation [80% → 100%]** (1 día)
- Business logic validation
- Email/Phone/URL validation
- File type magic bytes validation

### **A10: SSRF [0% → 100%]** (1 día)
- URL whitelist validation
- Private IP blocking
- Redirect validation

### **B1: Path Traversal [0% → 100%]** (1 día)
- Path normalization
- Directory boundary validation

### **B2: Weak Crypto [0% → 100%]** (1 día)
- Replace MD5/SHA1 with argon2
- Secure random generation

---

## 📅 CRONOGRAMA

```
SEMANA 1 (31 Mayo - 6 Junio)
├─ Lunes 31:   Inicio Fase 1 (A2, A4, A9, B5)
├─ Martes 1:   Continuar implementación
├─ Miércoles 2: Testing y validación
├─ Jueves 3:   Ajustes y refinamiento
├─ Viernes 4:  Cierre Fase 1 + Inicio Fase 2
└─ Weekend:    Revisión y documentación

SEMANA 2 (7 Junio - 13 Junio)
├─ Lunes 7:    Fase 2 (A1, A5, A7)
├─ Miércoles 9: Testing
├─ Viernes 11: Cierre Fase 2 + Inicio Fase 3
└─ Weekend:    Documentación

SEMANA 3 (14 Junio - 15 Junio)
├─ Lunes 14:   Fase 3 (A3, A6, A8, A10, B1, B2)
├─ Martes 15:  Testing E2E y ZAP COMPLETO
└─ Miércoles 16: AUDITORÍA FINAL Y REPORTE
```

---

## ✅ CRITERIOS DE ACEPTACIÓN POR FASE

### **FASE 1: Listo cuando...**
- ✅ Todos los datos sensibles están encriptados
- ✅ 2FA funciona completamente
- ✅ Validación de contraseña cumple requisitos
- ✅ Todos los eventos se registran en auditoría
- ✅ JSON deserialization es 100% seguro
- ✅ 0 fallos en tests unitarios

### **FASE 2: Listo cuando...**
- ✅ Rate limiting evita brute force
- ✅ Cookies tienen flags de seguridad
- ✅ Account lockout temporal funciona
- ✅ No hay enumeration de cuentas
- ✅ 0 violaciones IDOR

### **FASE 3: Listo cuando...**
- ✅ 0 SQL injection posible
- ✅ Todas las dependencias tienen pin exacto
- ✅ Business logic validado
- ✅ SSRF bloqueado
- ✅ Path traversal imposible

---

## 🧪 TESTING POR FASE

### **Tests Unitarios (Cada Fase)**
```bash
python manage.py test --verbosity=2
```

### **Tests de Seguridad (Cada Fase)**
```bash
# Inyección SQL
sqlmap -u "http://localhost:8000/api/grupos/" --dbs

# XSS
python -m pytest backend/tests/security/xss_tests.py

# IDOR
python -m pytest backend/tests/security/idor_tests.py
```

### **ZAP Scanning (Al final de cada Fase)**
```bash
docker compose -f docker-compose.yml -f docker-compose.zap.yml run --rm zap
```

---

## 📊 TRACKING DE PROGRESO

| Fase | Vuln | Target | Actual | % | Estado |
|------|------|--------|--------|---|--------|
| 1 | A2 | 100% | 0% | 0% | ⏳ |
| 1 | A4 | 100% | 0% | 0% | ⏳ |
| 1 | A9 | 100% | 0% | 0% | ⏳ |
| 1 | B5 | 100% | 0% | 0% | ⏳ |
| 2 | A1 | 100% | 70% | 70% | ⏳ |
| 2 | A5 | 100% | 60% | 60% | ⏳ |
| 2 | A7 | 100% | 50% | 50% | ⏳ |
| 3 | A3 | 100% | 50% | 50% | ⏳ |
| 3 | A6 | 100% | 0% | 0% | ⏳ |
| 3 | A8 | 100% | 80% | 80% | ⏳ |
| 3 | A10 | 100% | 0% | 0% | ⏳ |
| 3 | B1 | 100% | 0% | 0% | ⏳ |
| 3 | B2 | 100% | 0% | 0% | ⏳ |
| **TOTAL** | 13 | 100% | 37% | 37% | 🔄 |

---

## 🎯 AL 100% - ENTONCES SÍ HACER E2E + ZAP

Una vez todas las vulnerabilidades estén al 100%, haremos:

1. **E2E Tests Completos** (3-5 días)
   - Login con 2FA
   - Todos los flujos académicos
   - Todos los flujos financieros
   - Recuperación de contraseña
   - Logout y sessions

2. **ZAP Full Scanning** (2 días)
   - Baseline scan
   - Full scan con ataques activos
   - Generar reporte final

3. **Auditoría Externa** (Optional pero recomendado)
   - Pentesting profesional
   - Validación de requisitos de compliance

---

¿ **EMPEZAMOS CON FASE 1 AHORA?** ¿Quieres que implemente:

1. ✅ **A2: Cryptographic Failures** (Encriptación de datos)
2. ✅ **A4: Insecure Design** (2FA + Password validation)
3. ✅ **A9: Logging/Monitoring** (Auditoría centralizada)
4. ✅ **B5: Insecure Deserialization** (Safe JSON)

