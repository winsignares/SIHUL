import type { Dispatch, SetStateAction } from 'react';
import type { Asistente, Mensaje } from '../../../models/index';
import { chatbotAPI } from '../services/chatbotAPI';
import { useAuth } from '../../../context/AuthContext';
import { construirConversacionPublica, registrarConversacionPublica, type MapaChatIds } from './asistentes/almacenamientoChat';

type Sesion = ReturnType<typeof useAuth>;

/** Datos del chat que necesita el envío de un mensaje. */
export interface ContextoEnvioMensaje {
    user: Sesion['user'] | null;
    asistenteActivo: Asistente | null;
    mensajes: { [key: string]: Mensaje[] };
    inputMensaje: string;
    chatIds: { [key: string]: string };
    seccionalPublica: string;
    guardarChatIdsEnStorage: (chatIdsMap: MapaChatIds) => void;
    cargarHistorialConversaciones: () => Promise<void>;
    setMensajes: Dispatch<SetStateAction<{ [key: string]: Mensaje[] }>>;
    setInputMensaje: Dispatch<SetStateAction<string>>;
    setIsTyping: Dispatch<SetStateAction<boolean>>;
    setChatIds: Dispatch<SetStateAction<{ [key: string]: string }>>;
}

/** Crea la función que envía la pregunta escrita al asistente activo y registra la respuesta. */
export function crearEnvioMensaje({
    user, asistenteActivo, mensajes, inputMensaje, chatIds, seccionalPublica, guardarChatIdsEnStorage,
    cargarHistorialConversaciones, setMensajes, setInputMensaje, setIsTyping, setChatIds,
}: ContextoEnvioMensaje) {
    const enviarMensaje = async () => {
        if (!inputMensaje.trim() || !asistenteActivo) return;

        const preguntaEnviada = inputMensaje;
        setInputMensaje('');
        setIsTyping(true);

        // Mostrar mensaje del usuario inmediatamente (optimistic UI)
        const mensajeUsuarioTemporal: Mensaje = {
            id: `temp-${Date.now()}`,
            tipo: 'user',
            texto: preguntaEnviada,
            timestamp: new Date(),
            leido: true
        };

        setMensajes(prev => ({
            ...prev,
            [asistenteActivo.id]: [...(prev[asistenteActivo.id] || []), mensajeUsuarioTemporal]
        }));

        try {
            const currentChatId = chatIds[asistenteActivo.id];

            // Usar endpoint público o autenticado según el usuario
            if (!user?.id) {
                if (!seccionalPublica) {
                    const mensajeErrorSeccional: Mensaje = {
                        id: `error-${Date.now()}`,
                        tipo: 'bot',
                        texto: 'Selecciona una seccional para continuar con el chat público.',
                        timestamp: new Date(),
                        leido: true
                    };

                    setMensajes(prev => ({
                        ...prev,
                        [asistenteActivo.id]: [...(prev[asistenteActivo.id] || []), mensajeErrorSeccional]
                    }));
                    setIsTyping(false);
                    return;
                }

                // Usuario público - Enviar a endpoint público
                const response = await chatbotAPI.enviarPreguntaPublico({
                    agente_id: Number(asistenteActivo.id),
                    pregunta: preguntaEnviada,
                    seccional: seccionalPublica
                });

                // Mantener un chat_id único y consistente para la sesión activa hasta pulsar "Nueva"
                let activeChatId = chatIds[asistenteActivo.id];
                if (!activeChatId) {
                    activeChatId = response.chat_id || `guest-chat-${asistenteActivo.id}-${Date.now()}`;
                    setChatIds(prev => {
                        const updated = { ...prev, [asistenteActivo.id]: activeChatId! };
                        guardarChatIdsEnStorage(updated);
                        return updated;
                    });
                }

                // Mensaje del usuario
                const mensajeUsuarioReal: Mensaje = {
                    id: `user-${Date.now()}`,
                    tipo: 'user',
                    texto: preguntaEnviada,
                    timestamp: new Date(response.timestamp || Date.now()),
                    leido: true
                };

                // Mensaje del bot
                const mensajeAgente: Mensaje = {
                    id: `bot-${Date.now()}`,
                    tipo: 'bot',
                    texto: response.respuesta,
                    timestamp: new Date(response.timestamp || Date.now()),
                    leido: false,
                    anexos: response.anexos ?? []
                };

                const mensajesActuales = mensajes[asistenteActivo.id] || [];
                const mensajesSinTemporal = mensajesActuales.filter(
                    m => m.id !== mensajeUsuarioTemporal.id
                );
                const nuevosMensajes = [...mensajesSinTemporal, mensajeUsuarioReal, mensajeAgente];

                // Guardar historial síncronamente antes de actualizar estado
                const item = construirConversacionPublica(activeChatId, asistenteActivo.id, nuevosMensajes);
                if (item) registrarConversacionPublica(item);

                setMensajes(prev => ({
                    ...prev,
                    [asistenteActivo.id]: nuevosMensajes
                }));

                // Marcar como leído después de un momento
                setTimeout(() => {
                    setMensajes(prev => ({
                        ...prev,
                        [asistenteActivo.id]: prev[asistenteActivo.id].map(m =>
                            m.id === mensajeAgente.id ? { ...m, leido: true } : m
                        )
                    }));
                }, 1000);

                // Refrescar lista del historial en tiempo real
                void cargarHistorialConversaciones();

            } else {
                // Usuario autenticado - Se guarda historial
                const response = await chatbotAPI.enviarPregunta({
                    agente_id: Number(asistenteActivo.id),
                    pregunta: preguntaEnviada,
                    chat_id: currentChatId,
                    id_usuario: user.id,
                    nombre_usuario: user.nombre
                });

                // Guardar el chat_id para futuras conversaciones y persistir
                if (response.chat_id) {
                    setChatIds(prev => {
                        const updated = { ...prev, [asistenteActivo.id]: response.chat_id };
                        guardarChatIdsEnStorage(updated);
                        return updated;
                    });
                }

                // Reemplazar mensaje temporal con el mensaje real del backend
                const mensajeUsuarioReal: Mensaje = {
                    id: `${response.id}-user`,
                    tipo: 'user',
                    texto: response.mensaje,
                    timestamp: new Date(response.fecha),
                    leido: true
                };

                const mensajeAgente: Mensaje = {
                    id: `${response.id}-bot`,
                    tipo: 'bot',
                    texto: response.respuesta,
                    timestamp: new Date(response.fecha),
                    leido: false,
                    anexos: response.anexos ?? []
                };

                // Actualizar mensajes con los datos reales del backend
                setMensajes(prev => {
                    const mensajesActuales = prev[asistenteActivo.id] || [];
                    const mensajesSinTemporal = mensajesActuales.filter(
                        m => m.id !== mensajeUsuarioTemporal.id
                    );
                    return {
                        ...prev,
                        [asistenteActivo.id]: [...mensajesSinTemporal, mensajeUsuarioReal, mensajeAgente]
                    };
                });

                // Marcar como leído después de un momento
                setTimeout(() => {
                    setMensajes(prev => ({
                        ...prev,
                        [asistenteActivo.id]: prev[asistenteActivo.id].map(m =>
                            m.id === mensajeAgente.id ? { ...m, leido: true } : m
                        )
                    }));
                }, 1000);

                // Sincronizar inmediatamente la lista de historial
                void cargarHistorialConversaciones();
            }

        } catch (error) {
            console.error('Error al enviar pregunta:', error);

            const mensajeError: Mensaje = {
                id: `error-${Date.now()}`,
                tipo: 'bot',
                texto: 'Lo siento, hubo un error al procesar tu pregunta. Por favor, intenta nuevamente.',
                timestamp: new Date(),
                leido: true
            };

            setMensajes(prev => ({
                ...prev,
                [asistenteActivo.id]: [...(prev[asistenteActivo.id] || []), mensajeError]
            }));
        } finally {
            setIsTyping(false);
        }
    };

    return enviarMensaje;
}
