"""Chat con sesión iniciada, llamado directo desde el navegador (sin pasar por Django).

Django entrega al usuario un token firmado (`/api/chatbot/token/`) y el navegador lo envía aquí en `Authorization:
Bearer`. Quién pregunta, cómo se llama y con qué seccional se le responde salen del token, nunca del cuerpo de la
petición. Sin `CHATBOT_TOKEN_SECRET` estas rutas responden 503 y el chat sigue pasando por Django.

Esta es la única parte del servicio pensada para publicarse (nginx expone solo `/api/v1/directo/`): el resto no
autentica y sigue siendo de uso interno.
"""
import logging
import uuid

import openai
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.core.limites import LimitadorPorClave
from app.core.sedes import Sede
from app.core.token import TokenInvalido, verificar_token
from app.services import directo_service
from app.services.chat_service import ask
from app.services.chatbot_service import get_chatbot

logger = logging.getLogger("uvicorn.error")
router = APIRouter(prefix="/directo", tags=["Acceso directo (con token)"])

# Lo que ve el usuario cuando el RAG no responde; el detalle técnico va al log
MENSAJE_ERROR_RAG = "Lo siento, en este momento no puedo responder tu pregunta. Intenta de nuevo en unos minutos."

_limitador = LimitadorPorClave(maximo=get_settings().DIRECTO_PREGUNTAS_POR_MINUTO, ventana_segundos=60)


class UsuarioDelToken(BaseModel):
    id_usuario: int
    nombre: str
    sede: str


async def usuario_autenticado(authorization: str | None = Header(default=None)) -> UsuarioDelToken:
    ajustes = get_settings()
    if not ajustes.CHATBOT_TOKEN_SECRET:
        raise HTTPException(status_code=503, detail="El acceso directo al chat no está configurado.")
    esquema, _, token = (authorization or "").partition(" ")
    if esquema.lower() != "bearer" or not token.strip():
        raise HTTPException(status_code=401, detail="Falta el token de sesión del chat.")
    try:
        datos = verificar_token(token.strip(), ajustes.CHATBOT_TOKEN_SECRET, ajustes.CHATBOT_TOKEN_AUDIENCE)
    except TokenInvalido as error:
        raise HTTPException(status_code=error.codigo, detail=error.mensaje)
    return UsuarioDelToken(**datos)


class PreguntaDirecta(BaseModel):
    agente_id: int
    pregunta: str = Field(min_length=1)
    pregunta_sugerida_id: int | None = None
    chat_id: str | None = None


class AnexoDirecto(BaseModel):
    id: int
    nombre: str
    tipo: str
    tamano: int


class RespuestaDirecta(BaseModel):
    id: int | str
    chat_id: str
    respuesta: str
    mensaje: str
    fecha: str
    usuario: str
    error: str | None = None
    anexos: list[AnexoDirecto] = Field(default_factory=list)


def _identificador_de_hilo(valor: str | None) -> str:
    try:
        return str(uuid.UUID(str(valor))) if valor else str(uuid.uuid4())
    except ValueError:
        return str(uuid.uuid4())


@router.post(
    "/preguntas",
    response_model=RespuestaDirecta,
    summary="Pregunta de un usuario con sesión iniciada",
    description=(
        "Comprueba que el chatbot está activo y disponible en la seccional del usuario, responde con el RAG, guarda "
        "la conversación en el historial y devuelve la respuesta. Un fallo del servicio de IA se responde con "
        "`error` y un mensaje para el usuario, y no se guarda en el historial."
    ),
)
async def preguntar(
    cuerpo: PreguntaDirecta,
    usuario: UsuarioDelToken = Depends(usuario_autenticado),
    db: AsyncSession = Depends(get_db),
):
    ajustes = get_settings()
    pregunta = cuerpo.pregunta.strip()
    if not pregunta:
        raise HTTPException(status_code=400, detail="La pregunta es obligatoria.")
    if len(pregunta) > ajustes.DIRECTO_PREGUNTA_MAX_CARACTERES:
        raise HTTPException(
            status_code=413, detail=f"La pregunta supera los {ajustes.DIRECTO_PREGUNTA_MAX_CARACTERES} caracteres.",
        )

    permitido, espera = await _limitador.permitir(str(usuario.id_usuario))
    if not permitido:
        raise HTTPException(
            status_code=429, detail="Estás preguntando muy rápido. Espera un momento.", headers={"Retry-After": str(espera)},
        )

    chatbot = await get_chatbot(cuerpo.agente_id, db)
    if not chatbot or not chatbot.get("activo"):
        raise HTTPException(status_code=404, detail="Agente no encontrado o inactivo")
    seccionales = await directo_service.seccionales_del_chatbot(db, cuerpo.agente_id)
    if not directo_service.disponible_en(seccionales, usuario.sede):
        raise HTTPException(status_code=403, detail="Este chatbot no está disponible en esta seccional.")

    chat_id = _identificador_de_hilo(cuerpo.chat_id)
    await directo_service.registrar_uso_pregunta_sugerida(db, cuerpo.pregunta_sugerida_id, cuerpo.agente_id)
    await db.commit()

    try:
        mensaje, anexos_rag = await ask(
            nombre=usuario.nombre,
            chatbot_id=cuerpo.agente_id,
            sede=Sede(usuario.sede),
            question=pregunta,
            db=db,
            chat_id=chat_id,
            id_usuario=usuario.id_usuario,
            tipo=chatbot.get("tipo"),
            instrucciones=chatbot.get("instrucciones_adicionales"),
        )
    except openai.OpenAIError:
        logger.exception("Falló la llamada a OpenAI")
        return _respuesta_con_error(chat_id, pregunta, usuario, "servicio_no_disponible")
    except Exception:
        logger.exception("Error inesperado al responder una pregunta")
        return _respuesta_con_error(chat_id, pregunta, usuario, "servicio_no_disponible")

    texto = (mensaje.answer or "").strip()
    if not texto:
        logger.warning("El RAG devolvió una respuesta vacía (chatbot %s)", cuerpo.agente_id)
        return _respuesta_con_error(chat_id, pregunta, usuario, "respuesta_vacia")

    ids = [a.get("id") for a in anexos_rag or [] if isinstance(a, dict) and isinstance(a.get("id"), int)]
    anexos = await directo_service.anexos_validos(db, ids, cuerpo.agente_id, usuario.sede)
    conversacion_id, fecha = await directo_service.guardar_conversacion(
        db, chat_id=chat_id, chatbot_id=cuerpo.agente_id, id_usuario=usuario.id_usuario, usuario=usuario.nombre,
        mensaje=pregunta, respuesta=texto, anexos=anexos,
    )
    await db.commit()
    return RespuestaDirecta(
        id=conversacion_id, chat_id=chat_id, respuesta=texto, mensaje=pregunta, fecha=fecha.isoformat(),
        usuario=usuario.nombre,
        anexos=[AnexoDirecto(id=a["id"], nombre=a["nombre"], tipo=a["tipo_mime"], tamano=a["tamano"]) for a in anexos],
    )


def _respuesta_con_error(chat_id: str, pregunta: str, usuario: UsuarioDelToken, codigo: str) -> RespuestaDirecta:
    """Un intercambio fallido se muestra al usuario pero no se guarda: el historial no lleva disculpas."""
    from datetime import datetime, timezone

    return RespuestaDirecta(
        id=f"error-{uuid.uuid4().hex[:8]}", chat_id=chat_id, respuesta=MENSAJE_ERROR_RAG, mensaje=pregunta,
        fecha=datetime.now(timezone.utc).isoformat(), usuario=usuario.nombre, error=codigo,
    )
