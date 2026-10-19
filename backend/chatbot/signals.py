import logging

from django.db import DatabaseError, transaction
from django.db.models.signals import post_delete
from django.dispatch import receiver

from .models import Agente, AnexoRespuesta, ChatbotAppMessage, ChatbotDocument

logger = logging.getLogger(__name__)


@receiver(post_delete, sender=AnexoRespuesta)
def borrar_archivo_del_anexo(sender, instance, **kwargs):
    """
    Borra del almacenamiento el archivo de un anexo eliminado (directamente, o en cascada
    al borrar su pregunta-respuesta o su agente). Se hace al confirmar la transacción:
    si se revierte, el registro vuelve y su archivo debe seguir ahí.
    """
    archivo = instance.archivo
    if not archivo:
        return

    def borrar():
        try:
            archivo.storage.delete(archivo.name)
        except OSError:
            logger.warning('No se pudo borrar el archivo del anexo %s', archivo.name, exc_info=True)

    transaction.on_commit(borrar)


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
