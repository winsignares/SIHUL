import { useState, useRef, useEffect } from 'react';
import {
    BookOpen,
    DoorOpen,
    Trophy,
    Headphones,
    Bot
} from 'lucide-react';
import type { Asistente, Mensaje } from '../../models/index';
import { chatbotAPI, type AgenteAPI } from '../../services/chatbot/chatbotAPI';
import { useAuth } from '../../context/AuthContext';

// Mapeo de nombres de iconos a componentes de icono
const iconMap: Record<string, any> = {
    'BookOpen': BookOpen,
    'DoorOpen': DoorOpen,
    'Trophy': Trophy,
    'Headphones': Headphones,
    'Bot': Bot
};

// Función para convertir agente del API a formato UI
const convertirAgenteAPI = (agenteAPI: AgenteAPI): Asistente => {
    return {
        id: agenteAPI.id.toString(),
        nombre: agenteAPI.nombre,
        subtitulo: agenteAPI.subtitulo || '',
        descripcion: agenteAPI.descripcion,
        icon: iconMap[agenteAPI.icono] || Bot,
        color: agenteAPI.color,
        bgGradient: agenteAPI.bgGradient,
        ultimoMensaje: '¿En qué puedo ayudarte?',
        timestamp: 'Ahora',
        online: true,
        mensajeBienvenida: agenteAPI.mensajeBienvenida,
        prompt: agenteAPI.id.toString(),
        preguntasRapidas: agenteAPI.preguntasRapidas
    };
};

export function useAsistentesVirtuales() {
    const { user } = useAuth(); // Obtener usuario autenticado
    const [asistentes, setAsistentes] = useState<Asistente[]>([]);
    const [asistenteActivo, setAsistenteActivo] = useState<Asistente | null>(null);
    const [mensajes, setMensajes] = useState<{ [key: string]: Mensaje[] }>({});
    const [inputMensaje, setInputMensaje] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [preguntasRotadas, setPreguntasRotadas] = useState<string[]>([]);
    const [chatIds, setChatIds] = useState<{ [key: string]: string }>({}); // Mapeo agente_id -> chat_id
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Funciones para persistir chat_ids y mensajes en localStorage POR USUARIO
    const obtenerClavesStorage = () => {
        const userId = user?.id || 'guest';
        return {
            CHAT_IDS_KEY: `sihul_chat_ids_${userId}`,
            MENSAJES_KEY: `sihul_mensajes_chat_${userId}`
        };
    };

    const cargarChatIdsDesdeStorage = (): { [key: string]: string } => {
        try {
            const { CHAT_IDS_KEY } = obtenerClavesStorage();
            const stored = localStorage.getItem(CHAT_IDS_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error al cargar chat_ids desde localStorage:', error);
            return {};
        }
    };

    const guardarChatIdsEnStorage = (chatIdsMap: { [key: string]: string }) => {
        try {
            const { CHAT_IDS_KEY } = obtenerClavesStorage();
            localStorage.setItem(CHAT_IDS_KEY, JSON.stringify(chatIdsMap));
        } catch (error) {
            console.error('Error al guardar chat_ids en localStorage:', error);
        }
    };

    const cargarMensajesDesdeStorage = (): { [key: string]: Mensaje[] } => {
        try {
            const { MENSAJES_KEY } = obtenerClavesStorage();
            const stored = localStorage.getItem(MENSAJES_KEY);
            if (!stored) return {};
            
            const parsed = JSON.parse(stored);
            // Convertir las fechas de string a Date
            const mensajesConvertidos: { [key: string]: Mensaje[] } = {};
            for (const [key, mensajes] of Object.entries(parsed)) {
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

    const guardarMensajesEnStorage = (mensajesMap: { [key: string]: Mensaje[] }) => {
        try {
            const { MENSAJES_KEY } = obtenerClavesStorage();
            localStorage.setItem(MENSAJES_KEY, JSON.stringify(mensajesMap));
        } catch (error) {
            console.error('Error al guardar mensajes en localStorage:', error);
        }
    };

    // Cargar agentes y datos persistidos desde el backend
    useEffect(() => {
        const cargarAgentes = async () => {
            try {
                setLoading(true);
                // Cargar chat_ids y mensajes persistidos DEL USUARIO ACTUAL
                const chatIdsGuardados = cargarChatIdsDesdeStorage();
                setChatIds(chatIdsGuardados);
                
                const mensajesGuardados = cargarMensajesDesdeStorage();
                setMensajes(mensajesGuardados);

                const response = await chatbotAPI.listarAgentes();
                const agentesUI = response.agentes.map(convertirAgenteAPI);
                setAsistentes(agentesUI);

                // Seleccionar el primer agente por defecto SI NO HAY MENSAJES GUARDADOS
                if (agentesUI.length > 0 && Object.keys(mensajesGuardados).length === 0) {
                    const primerAgente = agentesUI[0];
                    setAsistenteActivo(primerAgente);
                    setMensajes({
                        [primerAgente.id]: [{
                            id: '1',
                            tipo: 'bot',
                            texto: primerAgente.mensajeBienvenida,
                            timestamp: new Date(),
                            leido: true
                        }]
                    });
                } else if (agentesUI.length > 0) {
                    // Si hay mensajes guardados, seleccionar el primer agente pero no sobrescribir mensajes
                    setAsistenteActivo(agentesUI[0]);
                }
            } catch (error) {
                console.error('Error al cargar agentes:', error);
            } finally {
                setLoading(false);
            }
        };

        cargarAgentes();
    }, [user?.id]); // Recargar cuando cambie el usuario

    // Guardar mensajes en localStorage cada vez que cambien
    useEffect(() => {
        if (Object.keys(mensajes).length > 0) {
            guardarMensajesEnStorage(mensajes);
        }
    }, [mensajes]);

    // Rotación de preguntas sugeridas
    useEffect(() => {
        if (!asistenteActivo?.preguntasRapidas?.length) {
            setPreguntasRotadas([]);
            return;
        }

        const rotarPreguntas = () => {
            const todas = asistenteActivo.preguntasRapidas;
            // Si hay 4 o menos, mostrar todas sin rotar
            if (todas.length <= 4) {
                setPreguntasRotadas(todas);
                return;
            }

            // Mezclar y tomar 4 aleatorias
            const shuffled = [...todas].sort(() => 0.5 - Math.random());
            setPreguntasRotadas(shuffled.slice(0, 4));
        };

        rotarPreguntas(); // Carga inicial

        // Rotar cada 10 segundos
        const interval = setInterval(rotarPreguntas, 10000);

        return () => clearInterval(interval);
    }, [asistenteActivo]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [mensajes, asistenteActivo]);

    const abrirChat = async (asistente: Asistente) => {
        setAsistenteActivo(asistente);

        // Si no hay usuario, mostrar solo mensaje de bienvenida
        if (!user?.id) {
            if (!mensajes[asistente.id]) {
                setMensajes(prev => ({
                    ...prev,
                    [asistente.id]: [{
                        id: '1',
                        tipo: 'bot',
                        texto: asistente.mensajeBienvenida,
                        timestamp: new Date(),
                        leido: true
                    }]
                }));
            }
            return;
        }

        // Si ya hay mensajes locales, mostrarlos inmediatamente (UX optimista)
        // pero aún así sincronizar en segundo plano
        const tieneMensajesLocales = mensajes[asistente.id] && mensajes[asistente.id].length > 0;

        // Siempre intentar sincronizar con el backend para obtener mensajes actualizados
        try {
            // Obtener chat_id si existe para esta conversación
            const currentChatId = chatIds[asistente.id];

            // Cargar historial usando chat_id si existe, o por agente_id + usuario si no
            const response = await chatbotAPI.obtenerHistorial(
                currentChatId 
                    ? { chat_id: currentChatId, id_usuario: user.id }
                    : { agente_id: asistente.id, id_usuario: user.id }
            );

            if (response.mensajes && response.mensajes.length > 0) {
                // Hay historial, cargar los mensajes
                const mensajesHistorial = response.mensajes.map((msg) => ({
                    id: msg.id,
                    tipo: msg.tipo,
                    texto: msg.texto,
                    timestamp: new Date(msg.timestamp),
                    leido: true
                }));

                // Solo actualizar si no tenemos mensajes locales o si el backend tiene más mensajes
                const mensajesLocales = mensajes[asistente.id] || [];
                if (!tieneMensajesLocales || mensajesHistorial.length > mensajesLocales.length) {
                    setMensajes(prev => ({
                        ...prev,
                        [asistente.id]: mensajesHistorial
                    }));
                }

                // Guardar el chat_id si existe y persistir en localStorage
                if (response.mensajes[0]?.chat_id) {
                    const nuevoChatId = response.mensajes[0].chat_id;
                    setChatIds(prev => {
                        const updated = { ...prev, [asistente.id]: nuevoChatId };
                        guardarChatIdsEnStorage(updated);
                        return updated;
                    });
                }
            } else {
                // No hay historial, mostrar mensaje de bienvenida
                setMensajes(prev => ({
                    ...prev,
                    [asistente.id]: [{
                        id: '1',
                        tipo: 'bot',
                        texto: asistente.mensajeBienvenida,
                        timestamp: new Date(),
                        leido: true
                    }]
                }));
            }
        } catch (error) {
            console.error('Error al cargar historial:', error);
            // Si hay error, mostrar mensaje de bienvenida
            setMensajes(prev => ({
                ...prev,
                [asistente.id]: [{
                    id: '1',
                    tipo: 'bot',
                    texto: asistente.mensajeBienvenida,
                    timestamp: new Date(),
                    leido: true
                }]
            }));
        }
    };

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
            // Validar que el usuario esté autenticado
            if (!user?.id || !user?.nombre) {
                throw new Error('Usuario no autenticado');
            }

            const currentChatId = chatIds[asistenteActivo.id];

            // Enviar pregunta al backend (que llama al RAG y guarda en BD)
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
                leido: false
            };

            // Actualizar mensajes con los datos reales del backend
            setMensajes(prev => {
                const mensajesActuales = prev[asistenteActivo.id] || [];
                // Eliminar mensaje temporal y agregar mensajes reales
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

    const enviarPreguntaRapida = (pregunta: string) => {
        setInputMensaje(pregunta);
        setTimeout(() => enviarMensaje(), 100);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            enviarMensaje();
        }
    };

    const [mostrarHistorial, setMostrarHistorial] = useState(false);
    const [conversacionesHistorial, setConversacionesHistorial] = useState<any[]>([]);
    const [cargandoHistorial, setCargandoHistorial] = useState(false);

    const cargarHistorialConversaciones = async () => {
        if (!asistenteActivo || !user?.id) return;
        
        try {
            setCargandoHistorial(true);
            const response = await chatbotAPI.listarConversaciones({
                agente_id: asistenteActivo.id,
                id_usuario: user.id
            });
            setConversacionesHistorial(response.conversaciones || []);
        } catch (error) {
            console.error('Error al cargar historial de conversaciones:', error);
        } finally {
            setCargandoHistorial(false);
        }
    };

    const cargarConversacionAnterior = async (chat_id: string) => {
        if (!asistenteActivo || !user?.id) return;
        
        try {
            const response = await chatbotAPI.obtenerHistorial({
                chat_id: chat_id,
                id_usuario: user.id
            });

            if (response.mensajes && response.mensajes.length > 0) {
                const mensajesHistorial = response.mensajes.map((msg) => ({
                    id: msg.id,
                    tipo: msg.tipo,
                    texto: msg.texto,
                    timestamp: new Date(msg.timestamp),
                    leido: true
                }));

                setMensajes(prev => ({
                    ...prev,
                    [asistenteActivo.id]: mensajesHistorial
                }));

                // Actualizar chat_id actual
                setChatIds(prev => {
                    const updated = { ...prev, [asistenteActivo.id]: chat_id };
                    guardarChatIdsEnStorage(updated);
                    return updated;
                });

                setMostrarHistorial(false);
            }
        } catch (error) {
            console.error('Error al cargar conversación anterior:', error);
        }
    };

    const limpiarConversacion = (asistenteId: string) => {
        // Eliminar chat_id para iniciar conversación nueva
        setChatIds(prev => {
            const updated = { ...prev };
            delete updated[asistenteId];
            guardarChatIdsEnStorage(updated);
            return updated;
        });

        // Limpiar mensajes locales y de localStorage
        setMensajes(prev => {
            const updated = { ...prev };
            delete updated[asistenteId];
            guardarMensajesEnStorage(updated);
            return updated;
        });

        // Si es el asistente activo, mostrar mensaje de bienvenida
        if (asistenteActivo?.id === asistenteId) {
            const asistente = asistentes.find(a => a.id === asistenteId);
            if (asistente) {
                setMensajes(prev => ({
                    ...prev,
                    [asistenteId]: [{
                        id: '1',
                        tipo: 'bot',
                        texto: asistente.mensajeBienvenida,
                        timestamp: new Date(),
                        leido: true
                    }]
                }));
            }
        }
    };

    const mensajesActuales = asistenteActivo ? (mensajes[asistenteActivo.id] || []) : [];
    // Mostrar preguntas sugeridas siempre, excepto cuando el bot está escribiendo
    const mostrarPreguntasRapidas = !isTyping;

    const filteredAsistentes = asistentes.filter(a =>
        a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.subtitulo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return {
        asistenteActivo,
        setAsistenteActivo,
        mensajes,
        inputMensaje,
        setInputMensaje,
        isTyping,
        searchTerm,
        setSearchTerm,
        messagesEndRef,
        abrirChat,
        enviarMensaje,
        enviarPreguntaRapida,
        handleKeyPress,
        limpiarConversacion,
        mensajesActuales,
        mostrarPreguntasRapidas,
        filteredAsistentes,
        loading,
        preguntasRotadas,
        mostrarHistorial,
        setMostrarHistorial,
        conversacionesHistorial,
        cargandoHistorial,
        cargarHistorialConversaciones,
        cargarConversacionAnterior
    };
}
