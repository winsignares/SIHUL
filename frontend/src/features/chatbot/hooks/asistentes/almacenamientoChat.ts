import type { Mensaje } from '../../../../models/index';

// Lo que el chat guarda en el navegador: chat_ids y mensajes por usuario, e historial del chat público.

export type MapaChatIds = { [key: string]: string };
export type MapaMensajes = { [key: string]: Mensaje[] };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ConversacionGuardada = any;

const obtenerClavesStorage = (userId: string | number) => ({
    CHAT_IDS_KEY: `sihul_chat_ids_${userId}`,
    MENSAJES_KEY: `sihul_mensajes_chat_${userId}`
});

// Historial público en caché de almacenamiento local para no-usuarios
const PUBLIC_HIST_KEY = 'sihul_public_history_cache';

export const cargarHistorialPublico = (): ConversacionGuardada[] => {
    try {
        const stored = localStorage.getItem(PUBLIC_HIST_KEY) || sessionStorage.getItem(PUBLIC_HIST_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

export const guardarHistorialPublico = (lista: ConversacionGuardada[]) => {
    try {
        const limitada = lista.slice(0, 30);
        const str = JSON.stringify(limitada);
        localStorage.setItem(PUBLIC_HIST_KEY, str);
        sessionStorage.setItem(PUBLIC_HIST_KEY, str);
    } catch (error) {
        console.error('Error al guardar historial público en caché:', error);
    }
};

/** Conversación del chat público lista para el historial; null si el visitante aún no escribió nada. */
export const construirConversacionPublica = (chatId: string, agenteId: string, mensajes: Mensaje[]) => {
    const userMsgs = mensajes.filter(m => m.tipo === 'user');
    if (userMsgs.length === 0) return null;

    return {
        chat_id: chatId,
        agente_id: agenteId,
        usuario: 'Invitado',
        primer_mensaje: userMsgs[0].texto.substring(0, 100),
        ultimo_mensaje: userMsgs[userMsgs.length - 1].texto.substring(0, 100),
        fecha_inicio: mensajes[0]?.timestamp ? new Date(mensajes[0].timestamp).toISOString() : new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString(),
        total_interacciones: mensajes.length,
        mensajes
    };
};

/** Agrega la conversación al historial público, o reemplaza la que ya tenía ese chat_id. */
export const registrarConversacionPublica = (item: NonNullable<ReturnType<typeof construirConversacionPublica>>) => {
    const historial = cargarHistorialPublico();
    const idx = historial.findIndex((c: ConversacionGuardada) => String(c.chat_id) === String(item.chat_id));
    if (idx >= 0) {
        historial[idx] = item;
    } else {
        historial.unshift(item);
    }
    guardarHistorialPublico(historial);
};

export const cargarChatIdsDesdeStorage = (userId: string | number): MapaChatIds => {
    try {
        const { CHAT_IDS_KEY } = obtenerClavesStorage(userId);
        const stored = localStorage.getItem(CHAT_IDS_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.error('Error al cargar chat_ids desde localStorage:', error);
        return {};
    }
};

export const guardarChatIdsEnStorage = (userId: string | number, chatIdsMap: MapaChatIds) => {
    try {
        const { CHAT_IDS_KEY } = obtenerClavesStorage(userId);
        localStorage.setItem(CHAT_IDS_KEY, JSON.stringify(chatIdsMap));
    } catch (error) {
        console.error('Error al guardar chat_ids en localStorage:', error);
    }
};

export const cargarMensajesDesdeStorage = (userId: string | number): MapaMensajes => {
    try {
        const { MENSAJES_KEY } = obtenerClavesStorage(userId);
        const stored = localStorage.getItem(MENSAJES_KEY);
        if (!stored) return {};

        const parsed = JSON.parse(stored);
        // Convertir las fechas de string a Date
        const mensajesConvertidos: MapaMensajes = {};
        for (const [key, mensajes] of Object.entries(parsed)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mensajesConvertidos[key] = (mensajes as any[]).map(msg => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
            }));
        }
        return mensajesConvertidos;
    } catch (error) {
        console.error('Error al cargar mensajes desde localStorage:', error);
        return {};
    }
};

export const guardarMensajesEnStorage = (userId: string | number, mensajesMap: MapaMensajes) => {
    try {
        const { MENSAJES_KEY } = obtenerClavesStorage(userId);
        localStorage.setItem(MENSAJES_KEY, JSON.stringify(mensajesMap));
    } catch (error) {
        console.error('Error al guardar mensajes en localStorage:', error);
    }
};
