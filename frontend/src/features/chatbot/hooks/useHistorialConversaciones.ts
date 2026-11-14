import { useState, type Dispatch, type SetStateAction } from 'react';
import type { Asistente, Mensaje } from '../../../models/index';
import { chatbotAPI } from '../services/chatbotAPI';
import { useAuth } from '../../../context/AuthContext';
import { cargarHistorialPublico, type MapaChatIds } from './asistentes/almacenamientoChat';
import { mensajesDesdeHistorial } from './asistentes/mensajesChat';
import { useActualizacionEnVivo } from '../../../hooks/useActualizacionEnVivo';

type Sesion = ReturnType<typeof useAuth>;

/** Historial de conversaciones del asistente activo y carga de una conversación anterior. */
export function useHistorialConversaciones({ user, asistenteActivo, setMensajes, setChatIds, guardarChatIdsEnStorage }: {
    user: Sesion['user'] | null;
    asistenteActivo: Asistente | null;
    setMensajes: Dispatch<SetStateAction<{ [key: string]: Mensaje[] }>>;
    setChatIds: Dispatch<SetStateAction<{ [key: string]: string }>>;
    guardarChatIdsEnStorage: (chatIdsMap: MapaChatIds) => void;
}) {
    const [mostrarHistorial, setMostrarHistorial] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [conversacionesHistorial, setConversacionesHistorial] = useState<any[]>([]);
    const [cargandoHistorial, setCargandoHistorial] = useState(false);

    const cargarHistorialConversaciones = async () => {
        if (!asistenteActivo) return;

        try {
            setCargandoHistorial(true);
            if (user?.id) {
                // Usuario autenticado: consultar base de datos
                const response = await chatbotAPI.listarConversaciones({
                    agente_id: asistenteActivo.id,
                    id_usuario: user.id
                });
                setConversacionesHistorial(response.conversaciones || []);
            } else {
                // Público: leer historial guardado en caché de almacenamiento local
                const historial = cargarHistorialPublico();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const filtrados = historial.filter((c: any) => String(c.agente_id) === String(asistenteActivo.id));
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                filtrados.sort((a: any, b: any) => new Date(b.fecha_actualizacion).getTime() - new Date(a.fecha_actualizacion).getTime());
                setConversacionesHistorial(filtrados);
            }
        } catch (error) {
            console.error('Error al cargar historial de conversaciones:', error);
        } finally {
            setCargandoHistorial(false);
        }
    };

    // Se guardó una conversación tuya (por ejemplo desde otra pestaña): se actualiza el historial.
    useActualizacionEnVivo(['conversaciones'], () => {
        void cargarHistorialConversaciones();
    }, Boolean(user?.id));

    const cargarConversacionAnterior = async (chat_id: string) => {
        if (!asistenteActivo) return;

        try {
            // Vaciar lienzo previo del chat antes de cargar la conversación seleccionada
            setMensajes(prev => ({
                ...prev,
                [asistenteActivo.id]: []
            }));

            if (user?.id) {
                // Usuario autenticado: consultar base de datos
                const response = await chatbotAPI.obtenerHistorial({
                    chat_id: chat_id,
                    id_usuario: user.id
                });

                if (response.mensajes && response.mensajes.length > 0) {
                    const mensajesHistorial = mensajesDesdeHistorial(response.mensajes);

                    setMensajes(prev => ({
                        ...prev,
                        [asistenteActivo.id]: mensajesHistorial
                    }));

                    setChatIds(prev => {
                        const updated = { ...prev, [asistenteActivo.id]: chat_id };
                        guardarChatIdsEnStorage(updated);
                        return updated;
                    });

                    setMostrarHistorial(false);
                }
            } else {
                // Modo público: restaurar desde el almacenamiento de caché
                const historial = cargarHistorialPublico();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const encontrado = historial.find((c: any) => c.chat_id === chat_id);
                if (encontrado && encontrado.mensajes) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const mensajesHistorial = encontrado.mensajes.map((msg: any) => ({
                        ...msg,
                        timestamp: new Date(msg.timestamp)
                    }));

                    setMensajes(prev => ({
                        ...prev,
                        [asistenteActivo.id]: mensajesHistorial
                    }));

                    setChatIds(prev => {
                        const updated = { ...prev, [asistenteActivo.id]: chat_id };
                        guardarChatIdsEnStorage(updated);
                        return updated;
                    });

                    setMostrarHistorial(false);
                }
            }
        } catch (error) {
            console.error('Error al cargar conversación anterior:', error);
        }
    };

    return {
        mostrarHistorial, setMostrarHistorial, conversacionesHistorial, cargandoHistorial,
        cargarHistorialConversaciones, cargarConversacionAnterior,
    };
}
