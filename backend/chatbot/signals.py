import logging

from django.db import DatabaseError, transaction
from django.db.models.signals import post_delete
from django.dispatch import receiver

from .models import Agente, ChatbotAppMessage, ChatbotDocument

logger = logging.getLogger(__name__)


@receiver(post_delete, sender=Agente)
def limpiar_datos_rag_del_agente(sender, instance, **kwargs):
    """
    Las tablas del servicio RAG (documents, chunks, chat_messages) referencian al agente
    sin clave foránea, así que al borrarlo quedaban sus documentos, fragmentos y mensajes
    huérfanos. Los chunks se eliminan solos: chunks.document_id tiene ON DELETE CASCADE.
    """
    try:
        # Savepoint: si las tablas aún no existen (el RAG no ha arrancado) el borrado
        # del agente no debe fallar ni dejar la transacción abortada.
        with transaction.atomic():
            ChatbotDocument.objects.filter(chatbot_id=instance.pk).delete()
            ChatbotAppMessage.objects.filter(chatbot_id=instance.pk).delete()
    except DatabaseError:
        logger.warning('No se pudieron limpiar los datos RAG del agente %s', instance.pk, exc_info=True)
