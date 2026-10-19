"""Shim de compatibilidad.
Los modelos ahora viven en las sub-apps (proveedores, contabilidad, facturas,
parametros, reportes). Se reexportan aqui para no romper el codigo legado que
hace `from financiero.models import X`. Los helpers de rutas siguen accesibles
como financiero.models.documento_financiero_upload_to (migracion 0011).
"""
from ._upload_paths import _safe_path_segment, documento_financiero_upload_to  # noqa: F401

from .proveedores.models import *  # noqa: F401,F403
from .contabilidad.models import *  # noqa: F401,F403
from .facturas.models import *  # noqa: F401,F403
from .parametros.models import *  # noqa: F401,F403
from .reportes.models import *  # noqa: F401,F403
