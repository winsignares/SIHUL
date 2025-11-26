import { useState, useRef, useEffect } from 'react';
import { Button } from '../../share/button';
import { Input } from '../../share/input';
import { Badge } from '../../share/badge';
import { 
  BookOpen, 
  DoorOpen, 
  Trophy, 
  Headphones,
  Send,
  Bot,
  User,
  Sparkles,
  Check,
  CheckCheck,
  Smile,
  Paperclip,
  Search,
  Zap,
  Star,
  Heart,
  MessageCircle,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Asistente {
  id: string;
  nombre: string;
  subtitulo: string;
  descripcion: string;
  icon: any;
  color: string;
  bgGradient: string;
  ultimoMensaje: string;
  timestamp: string;
  online: boolean;
  mensajeBienvenida: string;
  prompt: string;
  preguntasRapidas: string[];
}

interface Mensaje {
  id: string;
  tipo: 'user' | 'bot';
  texto: string;
  timestamp: Date;
  leido?: boolean;
}

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

export default function AsistentesVirtuales() {
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

  return (
    <div className="flex-1 min-h-0 flex">
      {/* Panel Izquierdo - Lista de Agentes */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-[380px] border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col relative overflow-hidden"
      >
        {/* Efectos de fondo animados */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-red-500/5 to-yellow-500/5 rounded-full blur-3xl"
            animate={{
              x: [0, 50, 0],
              y: [0, 30, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 10, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"
            animate={{
              x: [0, -30, 0],
              y: [0, -50, 0],
              scale: [1, 1.3, 1]
            }}
            transition={{ duration: 12, repeat: Infinity, delay: 1 }}
          />
        </div>

        {/* Header del Panel */}
        <div className="relative z-10 p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-red-500 via-red-600 to-rose-600 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <motion.div 
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center relative"
              whileHover={{ scale: 1.1, rotate: 10 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <User className="w-5 h-5 text-white" />
              <motion.div
                className="absolute inset-0 rounded-full bg-white/30"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            <div className="flex-1">
              <motion.h2 
                className="text-white"
                animate={{ opacity: [1, 0.8, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                Asistentes Virtuales
              </motion.h2>
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-2 h-2 bg-green-400 rounded-full shadow-lg shadow-green-400/50"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-white/80 text-sm">En línea</span>
              </div>
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </motion.div>
          </div>
          
          {/* Buscador */}
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar agente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/90 dark:bg-slate-900/50 border-white/20 focus:bg-white focus:scale-105 transition-all"
            />
          </motion.div>
        </div>

        {/* Lista de Agentes */}
        <div className="flex-1 overflow-y-auto relative z-10 p-3 scrollbar-hidden">
          {filteredAsistentes.map((asistente, index) => {
            const Icon = asistente.icon;
            const isActive = asistenteActivo?.id === asistente.id;
            const mensajesAgente = mensajes[asistente.id] || [];
            const ultimoMensaje = mensajesAgente[mensajesAgente.length - 1];
            
            return (
              <motion.div
                key={asistente.id}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ 
                  scale: 1.02,
                  y: -4,
                  boxShadow: isActive 
                    ? '0 20px 40px rgba(239, 68, 68, 0.2)' 
                    : '0 10px 30px rgba(0, 0, 0, 0.1)',
                  transition: { type: 'spring', stiffness: 400, damping: 25 }
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => abrirChat(asistente)}
                className={`mb-3 p-4 rounded-2xl cursor-pointer relative overflow-hidden group transition-all ${
                  isActive 
                    ? 'bg-gradient-to-br from-white via-red-50/30 to-rose-50/30 dark:from-slate-700 dark:via-red-900/10 dark:to-rose-900/10 border-2 border-red-200 dark:border-red-800 shadow-lg shadow-red-100 dark:shadow-red-900/20' 
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {/* Efecto de brillo al hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />

                <div className="flex items-start gap-3 relative z-10">
                  {/* Avatar del Agente */}
                  <div className="relative flex-shrink-0">
                    <motion.div 
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${asistente.bgGradient} flex items-center justify-center shadow-lg relative overflow-hidden`}
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Icon className="w-7 h-7 text-white relative z-10" />
                    </motion.div>
                    {asistente.online && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg shadow-green-500/50" />
                    )}
                  </div>

                  {/* Info del Agente */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <motion.span 
                        className={`truncate ${isActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-900 dark:text-slate-100'}`}
                        whileHover={{ x: 3 }}
                      >
                        {asistente.nombre}
                      </motion.span>
                      <motion.span 
                        className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0 ml-2"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        {ultimoMensaje 
                          ? ultimoMensaje.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                          : asistente.timestamp
                        }
                      </motion.span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600 dark:text-slate-400 truncate flex-1">
                        {ultimoMensaje?.texto.split('\n')[0] || asistente.ultimoMensaje}
                      </span>
                      {ultimoMensaje?.tipo === 'user' && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500 }}
                        >
                          <CheckCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        </motion.div>
                      )}
                    </div>
                    
                    {/* Badge de estado */}
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-2 flex items-center gap-1"
                      >
                        <div className="px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                          <span className="text-xs text-red-700 dark:text-red-300 flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            Chat activo
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Indicador de activo - Barra lateral */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className={`absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full bg-gradient-to-b ${asistente.bgGradient} shadow-lg`}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                
                {/* Brillo decorativo en la esquina */}
                {isActive && (
                  <motion.div
                    className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-red-200/40 to-transparent rounded-2xl"
                    animate={{ 
                      opacity: [0.3, 0.6, 0.3],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Footer Info */}
        <motion.div 
          className="relative z-10 p-4 border-t border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/30 dark:to-slate-800/30"
          whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
        >
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <Bot className="w-4 h-4" />
            </motion.div>
            <span>Powered by IA INTEGRADA</span>
            <motion.div
              animate={{ 
                rotate: [0, 15, -15, 0],
                scale: [1, 1.2, 1.2, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-3 h-3 text-yellow-500" />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* Panel Derecho - Chat */}
      <motion.div 
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="flex-1 min-h-0 flex flex-col bg-slate-50 dark:bg-slate-900/20 relative overflow-hidden"
      >
        {/* Efectos de fondo del chat */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.5
              }}
            />
          ))}
        </div>

        {asistenteActivo ? (
          <>
            {/* Header del Chat */}
            <motion.div 
              className="relative z-10 p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-md"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <motion.div 
                      className={`w-12 h-12 rounded-full bg-gradient-to-br ${asistenteActivo.bgGradient} flex items-center justify-center shadow-lg relative overflow-hidden`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <asistenteActivo.icon className="w-6 h-6 text-white relative z-10" />
                      <motion.div
                        className="absolute inset-0 bg-white/30"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </motion.div>
                    {asistenteActivo.online && (
                      <motion.div 
                        className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </div>
                  <div>
                    <h2 className="text-slate-900 dark:text-slate-100">{asistenteActivo.nombre}</h2>
                    <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      {isTyping ? (
                        <motion.span
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3" />
                          escribiendo...
                        </motion.span>
                      ) : (
                        <>
                          <motion.div
                            className="w-2 h-2 bg-green-500 rounded-full shadow-lg shadow-green-500/50"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                          <span>En línea</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Indicadores de actividad */}
                <div className="flex items-center gap-2">
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    className="cursor-pointer"
                  >
                    <MessageCircle className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: -10 }}
                    className="cursor-pointer"
                  >
                    <Star className="w-5 h-5 text-slate-400 hover:text-yellow-500" />
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Área de Mensajes */}
            <div 
              className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 relative z-10 scrollbar-hidden"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23cbd5e1' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            >
              <AnimatePresence>
                {mensajesActuales.map((mensaje, index) => (
                  <motion.div
                    key={mensaje.id}
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 300, 
                      damping: 25,
                      delay: index * 0.05 
                    }}
                    className={`flex gap-2 ${mensaje.tipo === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    {mensaje.tipo === 'bot' && (
                      <motion.div 
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${asistenteActivo.bgGradient} flex items-center justify-center flex-shrink-0 shadow-md relative overflow-hidden`}
                        whileHover={{ scale: 1.2, rotate: 10 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                      >
                        <asistenteActivo.icon className="w-4 h-4 text-white relative z-10" />
                        <motion.div
                          className="absolute inset-0 bg-white/20"
                          animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      </motion.div>
                    )}

                    {/* Burbuja de Mensaje */}
                    <div className={`max-w-[70%] ${mensaje.tipo === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      <motion.div
                        className={`rounded-2xl px-4 py-3 shadow-lg relative overflow-hidden ${
                          mensaje.tipo === 'user'
                            ? 'bg-gradient-to-br from-red-500 via-red-600 to-rose-600 text-white rounded-tr-md'
                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-2 border-slate-200 dark:border-slate-700 rounded-tl-md'
                        }`}
                        whileHover={{ 
                          scale: 1.02,
                          y: -2,
                          boxShadow: mensaje.tipo === 'user' 
                            ? '0 20px 40px rgba(239, 68, 68, 0.3)' 
                            : '0 20px 40px rgba(0, 0, 0, 0.1)'
                        }}
                        transition={{ type: 'spring', stiffness: 400 }}
                      >
                        {/* Efecto de brillo */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          initial={{ x: '-100%' }}
                          whileHover={{ x: '100%' }}
                          transition={{ duration: 0.6 }}
                        />
                        <div className="text-sm leading-relaxed whitespace-pre-line relative z-10">{mensaje.texto}</div>
                      </motion.div>
                      
                      {/* Timestamp y Estado */}
                      <div className={`flex items-center gap-1 px-2 ${mensaje.tipo === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {mensaje.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {mensaje.tipo === 'user' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, delay: 0.2 }}
                          >
                            {mensaje.leido ? (
                              <CheckCheck className="w-3 h-3 text-blue-500" />
                            ) : (
                              <Check className="w-3 h-3 text-slate-400" />
                            )}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Indicador de escritura */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-2"
                >
                  <motion.div 
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${asistenteActivo.bgGradient} flex items-center justify-center flex-shrink-0 shadow-md`}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <asistenteActivo.icon className="w-4 h-4 text-white" />
                  </motion.div>
                  <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-md px-4 py-3 shadow-lg">
                    <div className="flex gap-1">
                      {[0, 0.2, 0.4].map((delay, i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-gradient-to-br from-red-500 to-rose-600 rounded-full"
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Preguntas Rápidas */}
              {mostrarPreguntasRapidas && !isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col gap-2 pl-10"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                    </motion.div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">Preguntas sugeridas:</span>
                  </div>
                  {asistenteActivo.preguntasRapidas.map((pregunta, idx) => (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + idx * 0.1 }}
                      onClick={() => enviarPreguntaRapida(pregunta)}
                      whileHover={{ 
                        scale: 1.03, 
                        x: 8,
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
                      }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-left text-sm text-slate-700 dark:text-slate-300 hover:border-red-300 dark:hover:border-red-700 transition-all relative overflow-hidden group"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-rose-500/5"
                        initial={{ x: '-100%' }}
                        whileHover={{ x: '0%' }}
                        transition={{ duration: 0.3 }}
                      />
                      <motion.span 
                        className="text-slate-400 text-lg"
                        whileHover={{ scale: 1.2, rotate: 10 }}
                      >
                        💬
                      </motion.span>
                      <span className="relative z-10">{pregunta}</span>
                      <motion.div
                        className="ml-auto opacity-0 group-hover:opacity-100"
                        initial={{ x: -10 }}
                        whileHover={{ x: 0 }}
                      >
                        <TrendingUp className="w-4 h-4 text-red-500" />
                      </motion.div>
                    </motion.button>
                  ))}
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input de Mensaje */}
            <motion.div 
              className="relative z-10 p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-2xl"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <div className="flex items-end gap-3">
                <motion.div whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 text-slate-400 hover:text-yellow-500 transition-colors"
                  >
                    <Smile className="w-5 h-5" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.1, rotate: -5 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 text-slate-400 hover:text-blue-500 transition-colors"
                  >
                    <Paperclip className="w-5 h-5" />
                  </Button>
                </motion.div>
                
                <motion.div 
                  className="flex-1 relative"
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <Input
                    value={inputMensaje}
                    onChange={(e) => setInputMensaje(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe un mensaje..."
                    className="pr-12 py-6 rounded-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 focus:border-red-300 focus:ring-2 focus:ring-red-200 transition-all"
                    disabled={isTyping}
                  />
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  animate={inputMensaje.trim() ? { 
                    rotate: [0, -10, 10, -10, 0],
                  } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <Button
                    onClick={enviarMensaje}
                    disabled={!inputMensaje.trim() || isTyping}
                    className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-rose-600 hover:from-red-600 hover:via-red-700 hover:to-rose-700 text-white shadow-lg hover:shadow-2xl hover:shadow-red-500/50 disabled:opacity-50 relative overflow-hidden group"
                  >
                    <Send className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                    <motion.div
                      className="absolute inset-0 bg-white/20"
                      initial={{ scale: 0, opacity: 0 }}
                      whileHover={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 0.6 }}
                    />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center relative z-10">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-24 h-24 bg-gradient-to-br from-red-500 via-red-600 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl relative overflow-hidden"
              >
                <Bot className="w-12 h-12 text-white relative z-10" />
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              <motion.h3 
                className="text-slate-900 dark:text-slate-100 mb-2"
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                Asistentes Virtuales UNISPACE
              </motion.h3>
              <span className="text-slate-600 dark:text-slate-400">Selecciona un agente para comenzar la conversación</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}