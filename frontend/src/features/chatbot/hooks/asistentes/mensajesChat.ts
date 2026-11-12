import type { Mensaje } from '../../../../models/index';
import type { chatbotAPI } from '../../services/chatbotAPI';

type MensajeDelHistorial = Awaited<ReturnType<typeof chatbotAPI.obtenerHistorial>>['mensajes'][number];

/** Primer mensaje de una conversación: la bienvenida del asistente. */
export const mensajeBienvenida = (texto: string): Mensaje => ({
    id: '1',
    tipo: 'bot',
    texto,
    timestamp: new Date(),
    leido: true
});

/** Mensajes que devuelve el historial del servidor, con la forma que usa la pantalla. */
export const mensajesDesdeHistorial = (mensajes: MensajeDelHistorial[]): Mensaje[] =>
    mensajes.map((msg) => ({
        id: msg.id,
        tipo: msg.tipo,
        texto: msg.texto,
        timestamp: new Date(msg.timestamp),
        leido: true,
        anexos: msg.anexos ?? []
    }));
