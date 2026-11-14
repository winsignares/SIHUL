"""Eventos en tiempo real del chatbot que dependen de otro registro."""
from nucleo.eventos.registro import registrar_recurso


def registrar_eventos_del_chatbot():
    # Un anexo que cambia es un cambio de su pregunta-respuesta.
    registrar_recurso('chatbot', 'AnexoRespuesta', 'preguntas-respuestas', referencia=lambda anexo: anexo.pregunta_respuesta)
