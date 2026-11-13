"""
Preguntas-respuestas de los chatbots con anexos (documentos de soporte).

Gestión (requiere poder gestionar la documentación, ver PuedeGestionarDocumentosChatbots):
    GET    /api/chatbot/admin/preguntas-respuestas/?agente=&sede=   listar
    POST   /api/chatbot/admin/preguntas-respuestas/                 crear (multipart)
    GET    /api/chatbot/admin/preguntas-respuestas/<id>/            detalle
    PATCH  /api/chatbot/admin/preguntas-respuestas/<id>/            editar (multipart)
    DELETE /api/chatbot/admin/preguntas-respuestas/<id>/            eliminar (con sus anexos)

Campos del formulario: `agente`, `sede` (solo al crear), `pregunta`, `respuesta`,
`activo`, `anexos` (uno o varios archivos nuevos) y, al editar, `anexos_eliminar`
(ids de anexos a quitar).

Descarga (enlace firmado, ver chatbot/anexos.py):
    GET    /api/chatbot/anexos/<id>/descargar/?token=...
"""
from .comunes import MAX_PREGUNTA, MAX_RESPUESTA, _VERDADERO, _como_bool, _puede_ver_todas_las_sedes, _sede_de_la_peticion, _serializar, _validar_textos, _validar_archivos, _guardar_anexos, _ids_a_eliminar, _sincronizar_al_confirmar
from .lista import PreguntasRespuestasView
from .detalle import PreguntaRespuestaDetalleView
from .anexo import AnexoDescargaView
