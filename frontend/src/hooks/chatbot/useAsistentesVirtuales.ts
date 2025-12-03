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

    // Cargar agentes desde el backend
    useEffect(() => {
        const cargarAgentes = async () => {
            try {
                setLoading(true);
                const response = await chatbotAPI.listarAgentes();
                const agentesUI = response.agentes.map(convertirAgenteAPI);
                setAsistentes(agentesUI);

                // Seleccionar el primer agente por defecto
                if (agentesUI.length > 0) {
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
                }
            } catch (error) {
                console.error('Error al cargar agentes:', error);
            } finally {
                setLoading(false);
            }
        };

        cargarAgentes();
    }, []);

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

        // Si ya hay mensajes cargados, no hacer nada más
        if (mensajes[asistente.id] && mensajes[asistente.id].length > 0) {
            return;
        }

        // Intentar cargar historial desde el backend
        try {
            if (!user?.id) {
                // Sin usuario, mostrar mensaje de bienvenida
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
                return;
            }

            const response = await chatbotAPI.obtenerHistorial({
                agente_id: asistente.id,
                id_usuario: user.id
            });

            if (response.mensajes && response.mensajes.length > 0) {
                // Hay historial, cargar los mensajes
                const mensajesHistorial = response.mensajes.map((msg) => ({
                    id: msg.id,
                    tipo: msg.tipo,
                    texto: msg.texto,
                    timestamp: new Date(msg.timestamp),
                    leido: true
                }));

                setMensajes(prev => ({
                    ...prev,
                    [asistente.id]: mensajesHistorial
                }));

                // Guardar el chat_id si existe
                if (response.mensajes[0]?.chat_id) {
                    setChatIds(prev => ({
                        ...prev,
                        [asistente.id]: response.mensajes[0].chat_id
                    }));
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

            // Guardar el chat_id para futuras conversaciones
            if (response.chat_id && !chatIds[asistenteActivo.id]) {
                setChatIds(prev => ({
                    ...prev,
                    [asistenteActivo.id]: response.chat_id
                }));
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
        mensajesActuales,
        mostrarPreguntasRapidas,
        filteredAsistentes,
        loading,
        preguntasRotadas
    };
}
