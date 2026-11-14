from django.db.models.signals import post_delete, post_save

from academico.asignaturas.models import Asignatura, AsignaturaPrograma
from instalaciones.espacios.models import TipoEspacio
from academico.facultades.models import Facultad
from academico.grupos.models import Grupo
from instalaciones.prestamos.models import TipoActividad
from academico.programas.models import Programa
from instalaciones.recursos.models import Recurso
from academico.sedes.models import Sede
from identidad.usuarios.models import Rol

from .cache_utils import invalidate_catalog_cache

_CATALOG_MODELS = {
    Sede: 'SedeViewSet',
    Facultad: 'FacultadViewSet',
    Programa: 'ProgramaViewSet',
    TipoEspacio: 'TipoEspacioViewSet',
    Rol: 'RolViewSet',
    Grupo: 'GrupoViewSet',
    Asignatura: 'AsignaturaViewSet',
    AsignaturaPrograma: 'AsignaturaProgramaViewSet',
    Recurso: 'RecursoViewSet',
    TipoActividad: 'TipoActividadListCreateAPIView',
}


def _make_handler(viewset_class_name: str):
    def _handler(sender, **kwargs):
        invalidate_catalog_cache(viewset_class_name)
    return _handler


def register_catalog_cache_signals() -> None:
    for model, viewset_class_name in _CATALOG_MODELS.items():
        handler = _make_handler(viewset_class_name)
        post_save.connect(handler, sender=model, weak=False)
        post_delete.connect(handler, sender=model, weak=False)
