"""
Signals para crear notificaciones automáticas en operaciones CRUD

Se divide por dominio; importar este paquete registra todas las señales y deja disponible el apoyo
(`crear_notificacion`, `CurrentUserMiddleware`, etc.) en `notificaciones.signals`.
"""
from .base import (  # noqa: F401
    CurrentUserMiddleware, crear_notificacion, es_origen_siul, get_current_user, obtener_id_usuario, set_current_user,
)
# Importar cada dominio registra sus señales y las deja importables (p. ej. usuario_post_save)
from .academico import *  # noqa: F401,F403
from .chatbot import *  # noqa: F401,F403
from .componentes import *  # noqa: F401,F403
from .espacios import *  # noqa: F401,F403
from .horarios import *  # noqa: F401,F403
from .prestamos import *  # noqa: F401,F403
from .usuarios import *  # noqa: F401,F403
