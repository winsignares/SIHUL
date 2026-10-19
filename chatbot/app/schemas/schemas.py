from datetime import datetime
from pydantic import BaseModel, Field
from app.core.sedes import Sede


#  Documents 

class DocumentOut(BaseModel):
    id: int
    filename: str
    chatbot_id: int | None
    sede: Sede
    prioridad: int | None = Field(None, description="1 = la más alta entre los documentos de su chatbot y sede")
    created_at: datetime
    model_config = {"from_attributes": True}


class PrioridadIn(BaseModel):
    prioridad: int = Field(..., ge=1, description="Nueva prioridad (1 = la más alta)")


#  Chat

class ChatRequest(BaseModel):
    nombre: str = Field(
        ...,
        min_length=1,
        max_length=150,
        examples=["Jesús Peña"],
        description="Nombre completo del estudiante",
    )
    chatbot_id: int = Field(
        ...,
        examples=[1],
        description="ID del chatbot (agente) al que se dirige la pregunta",
    )
    sede: Sede = Field(
        ...,
        examples=[Sede.BARRANQUILLA],
        description="Sede de la universidad desde la que consulta",
    )
    question: str = Field(
        ...,
        min_length=2,
        examples=["¿Cuál es el proceso de matrícula en Barranquilla?"],
        description="Pregunta del usuario",
    )
    chat_id: str | None = Field(
        None,
        max_length=64,
        description="Identificador del hilo de conversación. Si se envía, el chatbot "
        "usa los últimos intercambios del hilo para resolver preguntas de seguimiento.",
    )
    id_usuario: int | None = Field(
        None, description="ID del usuario en SIHUL (para correlacionar con el historial de Django)"
    )


class AnexoOut(BaseModel):
    """Documento de soporte de la pregunta-respuesta oficial que corresponde a lo preguntado."""
    id: int
    pregunta_respuesta_id: int
    nombre: str = Field(description="Nombre original del archivo")
    tipo_mime: str
    tamano: int = Field(description="Tamaño en bytes")


class ChatResponse(BaseModel):
    id: int
    nombre: str
    chatbot_id: int | None
    sede: Sede
    question: str
    answer: str
    relevance_score: float = Field(
        description="Similitud coseno promedio (0–1). Más cerca de 1 = contexto más relevante."
    )
    created_at: datetime
    anexos: list[AnexoOut] = Field(
        default_factory=list,
        description="Anexos (Word, PDF, Excel) que acompañan la respuesta. Vacío si no aplica. "
        "Los enlaces de descarga los genera Django.",
    )
    model_config = {"from_attributes": True}


class QASyncOut(BaseModel):
    preguntas: int = Field(description="Preguntas-respuestas activas del chatbot en la sede")
    actualizadas: int = Field(description="Embeddings calculados o recalculados")


class ChatHistoryItem(BaseModel):
    id: int
    nombre: str
    chatbot_id: int | None
    sede: Sede
    question: str
    answer: str
    relevance_score: float
    chat_id: str | None = None
    id_usuario: int | None = None
    fecha: str = Field(description="Fecha (YYYY-MM-DD)")
    hora: str = Field(description="Hora (HH:MM:SS)")
    model_config = {"from_attributes": True}
