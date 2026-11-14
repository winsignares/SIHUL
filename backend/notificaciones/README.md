# Sistema de Notificaciones Automáticas

Este módulo implementa un sistema de notificaciones automáticas basado en señales de Django que se activan en operaciones CRUD de todas las tablas del sistema.

## 📋 Configuración

### 1. Activar las Señales

Las señales se activan automáticamente cuando Django inicia gracias al método `ready()` en `apps.py`.

### 2. Configurar el Middleware (Opcional pero Recomendado)

Para capturar automáticamente el usuario que realiza cada operación, agrega el middleware en `settings.py`:

```python
MIDDLEWARE = [
    # ... otros middlewares
    'notificaciones.signals.CurrentUserMiddleware',
]
```

Si no usas el middleware, las notificaciones se asignarán al usuario con ID 1 (admin/sistema) por defecto.

### 3. Configurar el Usuario en Vistas Personalizadas

Si quieres especificar manualmente el usuario en scripts o vistas personalizadas:

```python
from notificaciones.signals import set_current_user

# En tu vista o script
def mi_funcion(request):
    set_current_user(request.user)
    
    # Realizar operaciones CRUD
    usuario = Usuario.objects.create(...)
    
    # Las notificaciones se crearán automáticamente para request.user
```

## 📊 Tipos de Notificaciones por Modelo

### Usuario
- `USUARIO_CREADO` (alta) - Cuando se crea un usuario
- `CUENTA_CREADA` (alta) - Notificación al usuario recién creado
- `USUARIO_ACTUALIZADO` (media) - Cuando se actualiza un usuario
- `USUARIO_ELIMINADO` (alta) - Cuando se elimina un usuario

### Rol
- `ROL_CREADO` (media)
- `ROL_ACTUALIZADO` (baja)
- `ROL_ELIMINADO` (alta)

### Sede
- `SEDE_CREADA` (alta)
- `SEDE_ACTUALIZADA` (media)
- `SEDE_ELIMINADA` (alta)

### Facultad
- `FACULTAD_CREADA` (alta)
- `FACULTAD_ACTUALIZADA` (media)
- `FACULTAD_ELIMINADA` (alta)

### Programa
- `PROGRAMA_CREADO` (alta)
- `PROGRAMA_ACTUALIZADO` (media)
- `PROGRAMA_ELIMINADO` (alta)

### Asignatura
- `ASIGNATURA_CREADA` (media)
- `ASIGNATURA_ACTUALIZADA` (baja)
- `ASIGNATURA_ELIMINADA` (alta)

### AsignaturaPrograma
- `ASIGNATURA_PROGRAMA_CREADA` (media)
- `ASIGNATURA_PROGRAMA_ELIMINADA` (media)

### PeriodoAcademico
- `PERIODO_CREADO` (alta)
- `PERIODO_ACTUALIZADO` (alta)
- `PERIODO_ELIMINADO` (alta)

### Grupo
- `GRUPO_CREADO` (alta)
- `GRUPO_ACTUALIZADO` (media)
- `GRUPO_ELIMINADO` (alta)

### EspacioFisico
- `ESPACIO_CREADO` (media)
- `ESPACIO_ACTUALIZADO` (media)
- `ESPACIO_ELIMINADO` (alta)

### EspacioPermitido
- `ESPACIO_ASIGNADO` (media) - Notifica al usuario asignado
- `ESPACIO_REVOCADO` (media) - Notifica al usuario revocado

### Horario
- `HORARIO_CREADO` (alta)
- `HORARIO_ASIGNADO` (alta) - Notifica al docente asignado
- `HORARIO_ACTUALIZADO` (media)
- `HORARIO_ELIMINADO` (alta)
- `HORARIO_CANCELADO` (alta) - Notifica al docente

### HorarioFusionado
- `HORARIO_FUSIONADO_CREADO` (alta)
- `HORARIO_FUSIONADO_ASIGNADO` (alta) - Notifica al docente
- `HORARIO_FUSIONADO_ELIMINADO` (alta)

### HorarioEstudiante
- `INSCRIPCION_HORARIO` (alta) - Notifica al estudiante inscrito
- `DESINSCRIPCION_HORARIO` (alta) - Notifica al estudiante desinscrito

### PrestamoEspacio
- `PRESTAMO_SOLICITADO` (alta) - Notifica al solicitante
- `PRESTAMO_NUEVA_SOLICITUD` (alta) - Notifica al administrador
- `PRESTAMO_APROBADO` (alta) - Notifica al solicitante
- `PRESTAMO_RECHAZADO` (alta) - Notifica al solicitante
- `PRESTAMO_CANCELADO` (alta) - Notifica al solicitante

### PrestamoRecurso
- `RECURSO_AGREGADO` (media) - Notifica al solicitante del préstamo

### Componente
- `COMPONENTE_CREADO` (media)
- `COMPONENTE_ELIMINADO` (media)

### ComponenteRol
- `PERMISO_ASIGNADO` (media)
- `PERMISO_REVOCADO` (media)

### Agente (Chatbot)
- `AGENTE_CREADO` (baja)
- `AGENTE_DESACTIVADO` (media)
- `AGENTE_ELIMINADO` (media)

### PreguntaSugerida
- `PREGUNTA_SUGERIDA_CREADA` (baja)
- `PREGUNTA_SUGERIDA_ELIMINADA` (baja)

### TipoActividad
- `TIPO_ACTIVIDAD_CREADO` (baja)

### TipoEspacio
- `TIPO_ESPACIO_CREADO` (baja)
- `TIPO_ESPACIO_ELIMINADO` (media)

## 🔍 Prioridades

- **alta**: Notificaciones críticas que requieren atención inmediata
- **media**: Notificaciones importantes pero no urgentes
- **baja**: Notificaciones informativas de baja prioridad

## 💡 Ejemplos de Uso

### Ejemplo 1: Crear un Usuario
```python
from usuarios.models import Usuario, Rol

# Al crear un usuario, automáticamente se generan notificaciones
rol_estudiante = Rol.objects.get(nombre='estudiante')
nuevo_usuario = Usuario.objects.create(
    nombre='Juan Pérez',
    correo='juan.perez@unilibre.edu.co',
    contrasena_hash='hash...',
    rol=rol_estudiante
)

# Notificaciones generadas:
# 1. USUARIO_CREADO para el administrador
# 2. CUENTA_CREADA para juan.perez
```

### Ejemplo 2: Aprobar un Préstamo
```python
from prestamos.models import PrestamoEspacio

prestamo = PrestamoEspacio.objects.get(id=1)
prestamo.estado = 'Aprobado'
prestamo.save()

# Notificación generada:
# PRESTAMO_APROBADO para el usuario solicitante
```

### Ejemplo 3: Inscribir Estudiante en Horario
```python
from horario.models import HorarioEstudiante

inscripcion = HorarioEstudiante.objects.create(
    horario=horario_obj,
    estudiante=estudiante_obj
)

# Notificación generada:
# INSCRIPCION_HORARIO para el estudiante
```

### Ejemplo 4: Consultar Notificaciones
```python
from notificaciones.models import Notificacion

# Obtener notificaciones no leídas de un usuario
notificaciones = Notificacion.objects.filter(
    id_usuario=usuario_id,
    es_leida=False
).order_by('-fecha_creacion')

# Marcar como leída
notificacion.es_leida = True
notificacion.save()
```

## 🛠️ Personalización

### Desactivar Notificaciones para Operaciones Específicas

Si necesitas desactivar temporalmente las señales para operaciones masivas:

```python
from django.db.models.signals import post_save
from usuarios.models import Usuario
from notificaciones.signals import usuario_post_save

# Desconectar la señal
post_save.disconnect(usuario_post_save, sender=Usuario)

# Realizar operaciones masivas sin notificaciones
Usuario.objects.bulk_create([...])

# Reconectar la señal
post_save.connect(usuario_post_save, sender=Usuario)
```

### Modificar Mensajes de Notificación

Edita el módulo del dominio en `signals/` (`usuarios.py`, `academico.py`, `espacios.py`, `horarios.py`, `prestamos.py`, `componentes.py` o `chatbot.py`) y modifica el mensaje en la función correspondiente:

```python
@receiver(post_save, sender=Usuario)
def usuario_post_save(sender, instance, created, **kwargs):
    if created:
        crear_notificacion(
            id_usuario=obtener_id_usuario(),
            tipo='USUARIO_CREADO',
            mensaje=f'¡Nuevo usuario registrado! {instance.nombre}',  # Mensaje personalizado
            prioridad='alta'
        )
```

## 📝 Logging

Todos los errores al crear notificaciones se registran en el logger de Django:

```python
import logging
logger = logging.getLogger(__name__)
```

## ⚠️ Notas Importantes

1. **Operaciones Masivas**: Las señales se ejecutan para cada registro. Para operaciones masivas (bulk_create, bulk_update), considera desconectarlas temporalmente.

2. **Performance**: Si las notificaciones afectan el rendimiento, considera usar Celery para procesarlas de forma asíncrona.

3. **Usuario por Defecto**: Sin el middleware, todas las notificaciones se asignan al usuario ID 1. Asegúrate de tener un usuario administrador con ID 1.

4. **Transacciones**: Las señales post_save y post_delete se ejecutan dentro de la transacción de la base de datos.

## 🚀 Mejoras Futuras

- Implementar notificaciones en tiempo real con WebSockets
- Agregar plantillas de correo electrónico para notificaciones importantes
- Sistema de preferencias de notificación por usuario
- Integración con servicios de notificaciones push
- Dashboard de análisis de notificaciones
