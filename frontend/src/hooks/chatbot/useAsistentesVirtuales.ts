import { useState, useRef, useEffect } from 'react';
import {
    BookOpen,
    DoorOpen,
    Trophy,
    Headphones
} from 'lucide-react';
import type { Asistente, Mensaje } from '../../models/index';

const asistentes: Asistente[] = [
    {
        id: 'biblioteca',
        nombre: 'Agente Biblioteca',
        subtitulo: 'Asistente de Biblioteca',
        descripcion: 'Consultas sobre préstamos de libros, horarios de la biblioteca, reservas de salas de estudio y recursos bibliográficos.',
        icon: BookOpen,
        color: 'blue',
        bgGradient: 'from-blue-500 via-blue-600 to-indigo-600',
        ultimoMensaje: '¿En qué puedo ayudarte hoy?',
        timestamp: 'Ahora',
        online: true,
        mensajeBienvenida: '¡Hola! 👋 Soy tu asistente de biblioteca.\n\nPuedo ayudarte con:\n📚 Préstamos de libros\n⏰ Horarios de la biblioteca\n📖 Reservas de salas de estudio\n🔄 Renovaciones\n\n¿En qué puedo asistirte hoy?',
        prompt: 'biblioteca',
        preguntasRapidas: ['¿Qué horarios tiene la biblioteca?', '¿Cómo puedo reservar una sala de estudio?', '¿Cómo puedo renovar un libro?']
    },
    {
        id: 'salones',
        nombre: 'Agente Salones',
        subtitulo: 'Gestión de Espacios',
        descripcion: 'Información sobre disponibilidad de salones, horarios académicos, préstamos de espacios y equipamiento de aulas.',
        icon: DoorOpen,
        color: 'red',
        bgGradient: 'from-red-500 via-red-600 to-rose-600',
        ultimoMensaje: 'Disponible para consultas',
        timestamp: 'Ahora',
        online: true,
        mensajeBienvenida: '¡Hola! 🏛️ Soy tu asistente de salones.\n\nPuedo ayudarte con:\n🚪 Disponibilidad de espacios\n📅 Horarios académicos\n📝 Préstamos temporales\n🎯 Equipamiento y recursos\n\n¿Qué necesitas saber?',
        prompt: 'salones',
        preguntasRapidas: ['¿Qué salones están disponibles?', '¿Cómo puedo reservar un salón?', '¿Qué recursos tienen los salones?']
    },
    {
        id: 'deporte',
        nombre: 'Agente Deporte',
        subtitulo: 'Centro Deportivo',
        descripcion: 'Reservas de canchas deportivas, inscripción a actividades deportivas, horarios de gimnasio y eventos deportivos.',
        icon: Trophy,
        color: 'green',
        bgGradient: 'from-green-500 via-emerald-600 to-teal-600',
        ultimoMensaje: 'Listo para ayudarte',
        timestamp: 'Ahora',
        online: true,
        mensajeBienvenida: '¡Hola! ⚽ Soy tu asistente de deportes.\n\nPuedo ayudarte con:\n🏀 Reservas de canchas\n💪 Inscripciones a actividades\n🏋️ Horarios de gimnasio\n🏆 Eventos deportivos\n\n¿Cómo puedo ayudarte?',
        prompt: 'deportes',
        preguntasRapidas: ['¿Cómo reservo una cancha deportiva?', '¿Qué actividades deportivas hay?', '¿Qué horarios tiene el gimnasio?']
    },
    {
        id: 'soporte',
        nombre: 'Agente Soporte',
        subtitulo: 'Soporte Técnico',
        descripcion: 'Ayuda con problemas técnicos, acceso a plataformas universitarias, credenciales y soporte general del sistema.',
        icon: Headphones,
        color: 'yellow',
        bgGradient: 'from-yellow-500 via-orange-500 to-amber-600',
        ultimoMensaje: 'Resolviendo problemas',
        timestamp: 'Ahora',
        online: true,
        mensajeBienvenida: '¡Hola! 🔧 Soy tu asistente de soporte técnico.\n\nPuedo ayudarte con:\n🔐 Problemas de acceso\n🔑 Credenciales\n💻 Plataformas universitarias\n📧 Correo institucional\n📡 WiFi y conectividad\n\n¿Qué problema tienes?',
        prompt: 'soporte',
        preguntasRapidas: ['¿Cómo recupero mi contraseña?', '¿Cómo accedo a una plataforma?', '¿Cómo me conecto al WiFi?']
    }
];

export function useAsistentesVirtuales() {
    const [asistenteActivo, setAsistenteActivo] = useState<Asistente | null>(asistentes[0]);
    const [mensajes, setMensajes] = useState<{ [key: string]: Mensaje[] }>({
        'biblioteca': [{
            id: '1',
            tipo: 'bot',
            texto: asistentes[0].mensajeBienvenida,
            timestamp: new Date(),
            leido: true
        }]
    });
    const [inputMensaje, setInputMensaje] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [mensajes, asistenteActivo]);

    const abrirChat = (asistente: Asistente) => {
        setAsistenteActivo(asistente);

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
    };

    const generarRespuesta = (pregunta: string, tipo: string): string => {
        const preguntaLower = pregunta.toLowerCase();

        if (tipo === 'biblioteca') {
            if (preguntaLower.includes('horario') || preguntaLower.includes('hora')) {
                return '📅 La biblioteca está abierta:\n\n🕐 Lunes a Viernes: 7:00 AM - 9:00 PM\n🕐 Sábados: 8:00 AM - 2:00 PM\n🚫 Domingos: Cerrado\n\n¿Necesitas algo más?';
            }
            if (preguntaLower.includes('préstamo') || preguntaLower.includes('prestamo') || preguntaLower.includes('libro')) {
                return '📚 Para realizar préstamos:\n\n✅ Necesitas tu carnet estudiantil vigente\n✅ Hasta 3 libros por 15 días\n✅ Renovaciones en línea o en mostrador\n\n¿Te gustaría saber cómo renovar?';
            }
            if (preguntaLower.includes('sala') || preguntaLower.includes('estudio')) {
                return '🏫 Reserva de salas de estudio:\n\n⏰ Con 24 horas de anticipación\n📱 A través del sistema UNISPACE\n⏱️ Duración máxima: 2 horas\n\n¿Necesitas ayuda con la reserva?';
            }
            if (preguntaLower.includes('renovar') || preguntaLower.includes('renovación')) {
                return '🔄 Para renovar tus libros:\n\n1️⃣ Ingresa a "Mi cuenta" en el portal\n2️⃣ Selecciona los libros a renovar\n3️⃣ O acércate al mostrador\n\n¿Tienes alguna duda?';
            }
            return '📖 Puedo ayudarte con:\n\n📚 Préstamos de libros\n⏰ Horarios\n🏫 Salas de estudio\n🔄 Renovaciones\n\n¿Qué necesitas saber específicamente?';
        }

        if (tipo === 'salones') {
            if (preguntaLower.includes('disponible') || preguntaLower.includes('disponibilidad')) {
                return '🏛️ Para consultar disponibilidad:\n\n📍 Ve al módulo "Centro de Horarios"\n📊 Encontrarás ocupamiento semanal actualizado\n🔍 Disponibilidad en tiempo real\n\n¿Necesitas reservar un salón?';
            }
            if (preguntaLower.includes('reservar') || preguntaLower.includes('préstamo')) {
                return '📝 Para solicitar préstamo de salón:\n\n1️⃣ Ve a "Préstamos de Espacios"\n2️⃣ Completa el formulario\n3️⃣ Indica fecha, hora y motivo\n⏱️ Aprobación: 24-48 horas\n\n¿Qué tipo de evento planeas?';
            }
            if (preguntaLower.includes('capacidad')) {
                return '👥 Capacidades de salones:\n\n📏 Desde 20 hasta 100 personas\n📊 Ver detalles en "Espacios Físicos"\n🎯 Diferentes configuraciones\n\n¿Cuántas personas esperan?';
            }
            if (preguntaLower.includes('equipamiento') || preguntaLower.includes('recursos')) {
                return '🎯 Recursos disponibles:\n\n📽️ Proyectores\n💻 Computadores\n🔊 Sistemas de audio\n📊 Pizarras digitales\n❄️ Aire acondicionado\n\nVerifica estado en "Estado de Recursos"';
            }
            return '🏛️ Puedo ayudarte con:\n\n✅ Disponibilidad de salones\n📝 Préstamos temporales\n🎯 Equipamiento\n👥 Capacidades\n\n¿Sobre qué deseas información?';
        }

        if (tipo === 'deportes') {
            if (preguntaLower.includes('cancha') || preguntaLower.includes('reserva')) {
                return '⚽ Reserva de canchas:\n\n🏀 Fútbol, Baloncesto, Voleibol, Tenis\n📅 Hasta 7 días de anticipación\n🔐 Login con @unilibre.edu.co\n\n¿Qué deporte practicas?';
            }
            if (preguntaLower.includes('gimnasio') || preguntaLower.includes('gym')) {
                return '🏋️ Gimnasio Universitario:\n\n⏰ Lunes a Viernes: 6:00 AM - 8:00 PM\n💳 Inscripción gratuita para estudiantes\n📝 Programa de actividad física\n\n¿Te gustaría inscribirte?';
            }
            if (preguntaLower.includes('inscri') || preguntaLower.includes('actividad')) {
                return '💪 Actividades deportivas:\n\n🎯 Inscripciones al inicio del semestre\n⚽ Fútbol, Baloncesto, Natación\n🧘 Yoga, Entrenamiento funcional\n✅ GRATIS para estudiantes\n\n¿Cuál te interesa?';
            }
            if (preguntaLower.includes('torneo') || preguntaLower.includes('evento')) {
                return '🏆 Torneos internos:\n\n📅 Cada semestre\n👥 Inscripción de equipos: primeras 3 semanas\n📋 Calendario en cartelera deportiva\n\n¿Tienes equipo formado?';
            }
            return '⚽ Puedo ayudarte con:\n\n🏀 Reservas de canchas\n💪 Actividades deportivas\n🏋️ Horarios de gimnasio\n🏆 Torneos y eventos\n\n¿Qué necesitas?';
        }

        if (tipo === 'soporte') {
            if (preguntaLower.includes('contraseña') || preguntaLower.includes('password') || preguntaLower.includes('clave')) {
                return '🔐 Recuperar contraseña:\n\n1️⃣ Ve a la página de login\n2️⃣ Click en "¿Olvidaste tu contraseña?"\n3️⃣ Recibirás email a @unilibre.edu.co\n4️⃣ Sigue las instrucciones\n\n¿Sigues teniendo problemas?';
            }
            if (preguntaLower.includes('acceso') || preguntaLower.includes('ingresar') || preguntaLower.includes('login')) {
                return '🔑 Problemas de acceso:\n\n✅ Usa tu email completo: ejemplo@unilibre.edu.co\n✅ Verifica mayúsculas/minúsculas\n✅ Si persiste: ext. 1234\n\n¿Cuál es el error específico?';
            }
            if (preguntaLower.includes('plataforma') || preguntaLower.includes('sistema')) {
                return '💻 Plataformas disponibles:\n\n🎯 UNISPACE (gestión académica)\n👤 Portal Estudiante\n📚 Biblioteca Virtual\n📖 Moodle (aula virtual)\n\n🔐 Mismas credenciales para todas\n\n¿Cuál necesitas usar?';
            }
            if (preguntaLower.includes('correo') || preguntaLower.includes('email')) {
                return '📧 Correo institucional:\n\n✅ Formato: nombre.apellido@unilibre.edu.co\n✅ Asignado en matrícula\n🌐 Acceso: mail.unilibre.edu.co\n\n¿Necesitas ayuda para acceder?';
            }
            if (preguntaLower.includes('wifi') || preguntaLower.includes('internet')) {
                return '📡 WiFi Institucional:\n\n📶 Red: "UNILIBRE-Estudiantes"\n🔐 Usuario y contraseña institucional\n🔄 Si hay problemas: reinicia dispositivo\n🏢 Soporte: Edificio A, 2do piso\n\n¿Sigue sin conectar?';
            }
            return '🔧 Puedo ayudarte con:\n\n🔐 Acceso y contraseñas\n💻 Plataformas\n📧 Correo institucional\n📡 WiFi\n\n¿Cuál es tu problema?';
        }

        return '🤔 Entiendo tu consulta. ¿Podrías ser más específico para ayudarte mejor?';
    };

    const enviarMensaje = async () => {
        if (!inputMensaje.trim() || !asistenteActivo) return;

        const nuevoMensajeUser: Mensaje = {
            id: Date.now().toString(),
            tipo: 'user',
            texto: inputMensaje,
            timestamp: new Date(),
            leido: true
        };

        setMensajes(prev => ({
            ...prev,
            [asistenteActivo.id]: [...(prev[asistenteActivo.id] || []), nuevoMensajeUser]
        }));

        setInputMensaje('');
        setIsTyping(true);

        setTimeout(() => {
            const respuesta = generarRespuesta(inputMensaje, asistenteActivo.prompt);

            const nuevoMensajeBot: Mensaje = {
                id: (Date.now() + 1).toString(),
                tipo: 'bot',
                texto: respuesta,
                timestamp: new Date(),
                leido: false
            };

            setMensajes(prev => ({
                ...prev,
                [asistenteActivo.id]: [...(prev[asistenteActivo.id] || []), nuevoMensajeBot]
            }));

            setIsTyping(false);

            setTimeout(() => {
                setMensajes(prev => ({
                    ...prev,
                    [asistenteActivo.id]: prev[asistenteActivo.id].map(m =>
                        m.id === nuevoMensajeBot.id ? { ...m, leido: true } : m
                    )
                }));
            }, 1000);
        }, 1500 + Math.random() * 1000);
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
    const mostrarPreguntasRapidas = mensajesActuales.length === 1;

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
        filteredAsistentes
    };
}
