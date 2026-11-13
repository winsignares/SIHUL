import { useState, useRef, useEffect } from 'react';
import type { Asistente, Mensaje } from '../../../models/index';
import { chatbotAPI } from '../services/chatbotAPI';
import { useAuth } from '../../../context/AuthContext';
import { getSessionCacheData, setSessionCacheData } from '../../../core/sessionCache';
import {
    ASISTENTES_VIRTUALES_CACHE_KEY,
    SECCIONALES_PUBLICAS_CHATBOT,
    convertirAgenteAPI,
    normalizarAgentes,
    rehidratarAsistente,
    serializarAsistente,
    type CachedAsistente
} from './asistentes/asistentesUI';
import {
    cargarChatIdsDesdeStorage as leerChatIds,
    cargarMensajesDesdeStorage as leerMensajes,
    construirConversacionPublica,
    guardarChatIdsEnStorage as escribirChatIds,
    guardarMensajesEnStorage as escribirMensajes,
    registrarConversacionPublica,
    type MapaChatIds,
    type MapaMensajes
} from './asistentes/almacenamientoChat';
import { mensajeBienvenida, mensajesDesdeHistorial } from './asistentes/mensajesChat';
import { useRotacionPreguntas } from './asistentes/useRotacionPreguntas';
import { crearEnvioMensaje } from './envioMensajeChat';
import { useHistorialConversaciones } from './useHistorialConversaciones';

export interface OpcionesAsistentesVirtuales {
    /** Ignora cualquier sesión abierta y funciona siempre como chat público (página embebible). */
    publicoForzado?: boolean;
    /** Seccional fija (nombre tal como la espera el servidor): no se puede cambiar desde la pantalla. */
    seccionalFija?: string;
}

export function useAsistentesVirtuales(opciones: OpcionesAsistentesVirtuales = {}) {
    const { user: usuarioAutenticado } = useAuth();
    const user = opciones.publicoForzado ? null : usuarioAutenticado;
    const [asistentes, setAsistentes] = useState<Asistente[]>([]);
    const [asistenteActivo, setAsistenteActivo] = useState<Asistente | null>(null);
    const [mensajes, setMensajes] = useState<{ [key: string]: Mensaje[] }>({});
    const [inputMensaje, setInputMensaje] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [chatIds, setChatIds] = useState<{ [key: string]: string }>({}); // Mapeo agente_id -> chat_id
    const [seccionalesPublico, setSeccionalesPublico] = useState<string[]>([]);
    const [seccionalPublica, setSeccionalPublica] = useState('');
    const [cargandoSeccionales, setCargandoSeccionales] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Funciones para persistir chat_ids y mensajes en localStorage POR USUARIO
    // En el enlace público con seccional elegible, cada seccional conserva su propia conversación: al cambiar
    // de seccional no se mezclan respuestas que salieron de los documentos de otra.
    const idAlmacenamiento = user?.id || (opciones.seccionalFija ? `guest-${opciones.seccionalFija}` : 'guest');

    const cargarChatIdsDesdeStorage = (): MapaChatIds => leerChatIds(idAlmacenamiento);
    const guardarChatIdsEnStorage = (chatIdsMap: MapaChatIds) => escribirChatIds(idAlmacenamiento, chatIdsMap);
    const cargarMensajesDesdeStorage = (): MapaMensajes => leerMensajes(idAlmacenamiento);
    const guardarMensajesEnStorage = (mensajesMap: MapaMensajes) => escribirMensajes(idAlmacenamiento, mensajesMap);

    const guardarSeccionalPublica = (valor: string) => {
        setSeccionalPublica(valor);
        if (valor) {
            localStorage.setItem('sihul_chatbot_public_seccional', valor);
        } else {
            localStorage.removeItem('sihul_chatbot_public_seccional');
        }
    };

    useEffect(() => {
        if (user?.id) {
            return;
        }

        if (opciones.seccionalFija) {
            setSeccionalesPublico([opciones.seccionalFija]);
            setSeccionalPublica(opciones.seccionalFija);
            setCargandoSeccionales(false);
            return;
        }

        const stored = localStorage.getItem('sihul_chatbot_public_seccional');
        if (stored) {
            setSeccionalPublica(stored);
        }

        // En acceso público no depende de /sedes/ (protegido) para evitar 401 -> redirect a login.
        setCargandoSeccionales(true);
        const unique = [...SECCIONALES_PUBLICAS_CHATBOT];
        setSeccionalesPublico(unique);
        if (!seccionalPublica && unique.length > 0) {
            guardarSeccionalPublica(unique[0]);
        }
        setCargandoSeccionales(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, opciones.seccionalFija]);

    // Cargar agentes y datos persistidos desde el backend
    useEffect(() => {
        const cargarAgentes = async () => {
            // En acceso público los chatbots dependen de la seccional elegida: se espera a tenerla.
            if (!user?.id && !seccionalPublica) return;
            try {
                setLoading(true);
                // Cargar chat_ids y mensajes persistidos DEL USUARIO ACTUAL
                const chatIdsGuardados = cargarChatIdsDesdeStorage();
                setChatIds(chatIdsGuardados);
                
                const mensajesGuardados = cargarMensajesDesdeStorage();
                setMensajes(mensajesGuardados);

                const activeToken = localStorage.getItem('auth_token');
                const userScope = `${user?.id || 'guest'}-${user?.rol || 'public'}${user?.id ? '' : `-${seccionalPublica}`}`;
                const cacheKey = `${ASISTENTES_VIRTUALES_CACHE_KEY}-${userScope}`;
                const cachedData = getSessionCacheData<{
                    asistentes: CachedAsistente[];
                    asistenteActivoId?: string;
                }>(cacheKey, activeToken);

                let asistenteActivoIdPrevio: string | undefined;

                if (cachedData?.asistentes?.length) {
                    const asistentesRehidratados = cachedData.asistentes.map(rehidratarAsistente);
                    setAsistentes(asistentesRehidratados);
                    const cachedActive = cachedData.asistenteActivoId
                        ? asistentesRehidratados.find((a) => a.id === cachedData.asistenteActivoId)
                        : asistentesRehidratados[0];
                    if (cachedActive) {
                        setAsistenteActivo(cachedActive);
                        asistenteActivoIdPrevio = cachedActive.id;
                    }
                }

                // Siempre revalidar contra el backend, aunque haya caché, para reflejar
                // cambios hechos fuera de esta app (ej. edición de agentes vía Django admin).
                // Usar endpoint público si no hay usuario autenticado
                const response = user?.id
                    ? await chatbotAPI.listarAgentes()
                    : await chatbotAPI.listarAgentesPublico(seccionalPublica);

                const agentes = normalizarAgentes(response);

                if (agentes.length === 0) {
                    console.warn('La respuesta de agentes no contiene una lista válida:', response);
                }

                const agentesUI = agentes.map(convertirAgenteAPI);
                setAsistentes(agentesUI);

                const activoPrevio = asistenteActivoIdPrevio
                    ? agentesUI.find((a) => a.id === asistenteActivoIdPrevio)
                    : undefined;

                // Seleccionar el primer agente por defecto SI NO HAY MENSAJES GUARDADOS
                if (agentesUI.length > 0 && Object.keys(mensajesGuardados).length === 0 && !activoPrevio) {
                    const primerAgente = agentesUI[0];
                    setAsistenteActivo(primerAgente);
                    setMensajes({
                        [primerAgente.id]: [mensajeBienvenida(primerAgente.mensajeBienvenida)]
                    });
                } else if (agentesUI.length > 0) {
                    // Mantener el agente ya activo (con los datos frescos) o caer al primero
                    const elegido = activoPrevio || agentesUI[0];
                    setAsistenteActivo(elegido);
                    // Un agente sin conversación guardada (p. ej. uno recién creado) debe abrir con su bienvenida
                    if (!mensajesGuardados[elegido.id]?.length) {
                        setMensajes((prev) => prev[elegido.id]?.length ? prev : {
                            ...prev,
                            [elegido.id]: [mensajeBienvenida(elegido.mensajeBienvenida)]
                        });
                    }
                }

                setSessionCacheData(cacheKey, activeToken, {
                    asistentes: agentesUI.map(serializarAsistente),
                    asistenteActivoId: (activoPrevio || agentesUI[0])?.id
                });
            } catch (error) {
                console.error('Error al cargar agentes:', error);
            } finally {
                setLoading(false);
            }
        };

        cargarAgentes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, user?.rol, user?.id ? '' : seccionalPublica]); // Recargar cuando cambie el usuario, su rol o (en público) la seccional

    // Guardar mensajes en localStorage cada vez que cambien
    useEffect(() => {
        if (Object.keys(mensajes).length > 0) {
            guardarMensajesEnStorage(mensajes);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mensajes]);

    // Rotación de preguntas sugeridas
    const preguntasRotadas = useRotacionPreguntas(asistenteActivo);



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
                    [asistente.id]: [mensajeBienvenida(asistente.mensajeBienvenida)]
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

            // Cargar historial usando chat_id solo si existe un chat_id activo para este asistente
            if (currentChatId) {
                const response = await chatbotAPI.obtenerHistorial({
                    chat_id: currentChatId,
                    id_usuario: user.id
                });

                if (response.mensajes && response.mensajes.length > 0) {
                    // Hay historial, cargar los mensajes
                    const mensajesHistorial = mensajesDesdeHistorial(response.mensajes);

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
                } else if (!tieneMensajesLocales) {
                    setMensajes(prev => ({
                        ...prev,
                        [asistente.id]: [mensajeBienvenida(asistente.mensajeBienvenida)]
                    }));
                }
            } else {
                // No hay chat_id activo (se presionó "Nueva" o es sesión limpia)
                if (!tieneMensajesLocales) {
                    setMensajes(prev => ({
                        ...prev,
                        [asistente.id]: [mensajeBienvenida(asistente.mensajeBienvenida)]
                    }));
                }
            }
        } catch (error) {
            console.error('Error al cargar historial:', error);
            // Si hay error, mostrar mensaje de bienvenida si no hay locales
            if (!tieneMensajesLocales) {
                setMensajes(prev => ({
                    ...prev,
                    [asistente.id]: [mensajeBienvenida(asistente.mensajeBienvenida)]
                }));
            }
        }
    };

    const {
        mostrarHistorial, setMostrarHistorial, conversacionesHistorial, cargandoHistorial,
        cargarHistorialConversaciones, cargarConversacionAnterior,
    } = useHistorialConversaciones({ user, asistenteActivo, setMensajes, setChatIds, guardarChatIdsEnStorage });

    const enviarMensaje = crearEnvioMensaje({
        user, asistenteActivo, mensajes, inputMensaje, chatIds, seccionalPublica, guardarChatIdsEnStorage,
        cargarHistorialConversaciones, setMensajes, setInputMensaje, setIsTyping, setChatIds,
    });


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


    const limpiarConversacion = (asistenteId: string) => {
        // En modo público (!user?.id), archivar la conversación actual en caché antes de resetear la pantalla
        if (!user?.id) {
            // Aseguramos que tomamos los mensajes más actualizados del state
            const currentChatId = chatIds[asistenteId];
            const msgsActuales = mensajes[asistenteId] || [];

            if (currentChatId) {
                const item = construirConversacionPublica(currentChatId, asistenteId, msgsActuales);
                if (item) registrarConversacionPublica(item);
            }
        }

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
                    [asistenteId]: [mensajeBienvenida(asistente.mensajeBienvenida)]
                }));
            }
        }

        // Actualizar la lista del historial para registrar la conversación previa finalizada
        void cargarHistorialConversaciones();
    };

    const mensajesActuales = asistenteActivo ? (mensajes[asistenteActivo.id] || []) : [];
    // Mostrar preguntas sugeridas siempre, excepto cuando el bot está escribiendo
    const mostrarPreguntasRapidas = !isTyping;

    const filteredAsistentes = asistentes.filter(a =>
        a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.subtitulo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return {
        esPublico: !user?.id,
        seccionalesPublico,
        seccionalPublica,
        setSeccionalPublica: guardarSeccionalPublica,
        cargandoSeccionales,
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
