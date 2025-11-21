import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../share/card';
import { Input } from '../share/input';
import { Button } from '../share/button';
import { Badge } from '../share/badge';
import { Avatar, AvatarFallback } from '../share/avatar';
import { ScrollArea } from '../share/scroll-area';
import { Search, Send, Users, MoreVertical, Check, CheckCheck, Paperclip, Image as ImageIcon, Trash2, X, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface Usuario {
  id: string;
  nombre: string;
  rol: string;
  avatar: string;
  estado: 'online' | 'offline' | 'ausente';
}

interface Mensaje {
  id: string;
  remitente: string;
  contenido: string;
  fecha: string;
  leido: boolean;
}

interface Conversacion {
  id: string;
  usuarioId: string;
  ultimoMensaje: string;
  fecha: string;
  noLeidos: number;
  mensajes: Mensaje[];
}

export default function Mensajeria() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversacion, setSelectedConversacion] = useState<string | null>('1');
  const [nuevoMensaje, setNuevoMensaje] = useState('');

  const usuarios: Usuario[] = [
    { id: '1', nombre: 'María González', rol: 'Coordinadora Académica', avatar: 'MG', estado: 'online' },
    { id: '2', nombre: 'Carlos Ruiz', rol: 'Docente', avatar: 'CR', estado: 'online' },
    { id: '3', nombre: 'Ana Martínez', rol: 'Administrador', avatar: 'AM', estado: 'ausente' },
    { id: '4', nombre: 'Juan Pérez', rol: 'Docente', avatar: 'JP', estado: 'offline' },
    { id: '5', nombre: 'Laura Sánchez', rol: 'Coordinadora', avatar: 'LS', estado: 'online' }
  ];

  const [conversaciones, setConversaciones] = useState<Conversacion[]>([
    {
      id: '1',
      usuarioId: '1',
      ultimoMensaje: '¿Podemos revisar el horario del próximo semestre?',
      fecha: '10:30',
      noLeidos: 2,
      mensajes: [
        { id: '1', remitente: '1', contenido: 'Hola, buenos días', fecha: '10:15', leido: true },
        { id: '2', remitente: 'yo', contenido: 'Buenos días María, ¿en qué puedo ayudarte?', fecha: '10:17', leido: true },
        { id: '3', remitente: '1', contenido: '¿Podemos revisar el horario del próximo semestre?', fecha: '10:30', leido: false },
        { id: '4', remitente: '1', contenido: 'Necesito confirmar algunos espacios para las asignaturas nuevas', fecha: '10:31', leido: false }
      ]
    },
    {
      id: '2',
      usuarioId: '2',
      ultimoMensaje: 'Perfecto, muchas gracias',
      fecha: 'Ayer',
      noLeidos: 0,
      mensajes: [
        { id: '1', remitente: '2', contenido: '¿Está disponible el Laboratorio 301 el martes?', fecha: 'Ayer 14:20', leido: true },
        { id: '2', remitente: 'yo', contenido: 'Sí, está disponible de 14:00 a 16:00', fecha: 'Ayer 14:25', leido: true },
        { id: '3', remitente: '2', contenido: 'Perfecto, muchas gracias', fecha: 'Ayer 14:26', leido: true }
      ]
    },
    {
      id: '3',
      usuarioId: '3',
      ultimoMensaje: 'Te envío el reporte actualizado',
      fecha: 'Ayer',
      noLeidos: 1,
      mensajes: [
        { id: '1', remitente: '3', contenido: 'Hola, necesito el reporte de ocupación', fecha: 'Ayer 11:00', leido: true },
        { id: '2', remitente: 'yo', contenido: 'Claro, te lo preparo ahora', fecha: 'Ayer 11:15', leido: true },
        { id: '3', remitente: '3', contenido: 'Te envío el reporte actualizado', fecha: 'Ayer 16:30', leido: false }
      ]
    },
    {
      id: '4',
      usuarioId: '4',
      ultimoMensaje: '¿Puedes ayudarme con un cambio de aula?',
      fecha: '21 Oct',
      noLeidos: 0,
      mensajes: [
        { id: '1', remitente: '4', contenido: '¿Puedes ayudarme con un cambio de aula?', fecha: '21 Oct 15:00', leido: true },
        { id: '2', remitente: 'yo', contenido: 'Claro, ¿qué necesitas?', fecha: '21 Oct 15:05', leido: true }
      ]
    }
  ]);

  const conversacionActual = conversaciones.find(c => c.id === selectedConversacion);
  const usuarioActual = conversacionActual ? usuarios.find(u => u.id === conversacionActual.usuarioId) : null;

  const enviarMensaje = () => {
    if (!nuevoMensaje.trim() || !selectedConversacion) return;

    const updatedConversaciones = conversaciones.map(conv => {
      if (conv.id === selectedConversacion) {
        return {
          ...conv,
          mensajes: [
            ...conv.mensajes,
            {
              id: String(conv.mensajes.length + 1),
              remitente: 'yo',
              contenido: nuevoMensaje,
              fecha: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
              leido: true
            }
          ],
          ultimoMensaje: nuevoMensaje,
          fecha: 'Ahora'
        };
      }
      return conv;
    });

    setConversaciones(updatedConversaciones);
    setNuevoMensaje('');
    toast.success('Mensaje enviado');
  };

  const marcarComoLeido = (conversacionId: string) => {
    setConversaciones(conversaciones.map(conv => {
      if (conv.id === conversacionId) {
        return {
          ...conv,
          noLeidos: 0,
          mensajes: conv.mensajes.map(m => ({ ...m, leido: true }))
        };
      }
      return conv;
    }));
  };

  const eliminarConversacion = (conversacionId: string) => {
    setConversaciones(conversaciones.filter(c => c.id !== conversacionId));
    if (selectedConversacion === conversacionId) {
      setSelectedConversacion(null);
    }
    toast.success('Conversación eliminada correctamente');
  };

  const vaciarBandeja = () => {
    setConversaciones([]);
    setSelectedConversacion(null);
    toast.success('Bandeja de mensajes vaciada');
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'online':
        return 'bg-green-500';
      case 'ausente':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-slate-400';
      default:
        return 'bg-slate-400';
    }
  };

  const filteredConversaciones = conversaciones.filter(conv => {
    const usuario = usuarios.find(u => u.id === conv.usuarioId);
    return usuario?.nombre.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalNoLeidos = conversaciones.reduce((sum, c) => sum + c.noLeidos, 0);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-slate-900 dark:text-slate-100 mb-2">Mensajería</h1>
        <p className="text-slate-600 dark:text-slate-400">Comunícate con otros usuarios del sistema</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-240px)]">
        {/* Lista de Conversaciones */}
        <Card className="lg:col-span-4 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-slate-900 dark:text-slate-100">Conversaciones</CardTitle>
              <div className="flex items-center gap-2">
                {totalNoLeidos > 0 && (
                  <Badge className="bg-red-600 text-white">{totalNoLeidos}</Badge>
                )}
                {conversaciones.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={vaciarBandeja}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar conversaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-50 dark:bg-slate-900"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              {filteredConversaciones.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <MessageSquare className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">No hay mensajes pendientes</p>
                  <p className="text-slate-500 dark:text-slate-500 mt-2">Tus conversaciones aparecerán aquí</p>
                </div>
              ) : (
                <div className="space-y-1 p-4">
                  {filteredConversaciones.map((conv) => {
                  const usuario = usuarios.find(u => u.id === conv.usuarioId);
                  if (!usuario) return null;

                  return (
                    <motion.div
                      key={conv.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => {
                        setSelectedConversacion(conv.id);
                        marcarComoLeido(conv.id);
                      }}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedConversacion === conv.id
                          ? 'bg-blue-100 dark:bg-blue-950'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                              {usuario.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${getEstadoColor(usuario.estado)}`}></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-slate-900 dark:text-slate-100 truncate">{usuario.nombre}</h4>
                            <span className="text-slate-500 dark:text-slate-400">{conv.fecha}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-slate-600 dark:text-slate-400 truncate">{conv.ultimoMensaje}</p>
                            {conv.noLeidos > 0 && (
                              <Badge className="bg-blue-600 text-white ml-2">{conv.noLeidos}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Área de Chat */}
        <Card className="lg:col-span-8 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col">
          {conversacionActual && usuarioActual ? (
            <>
              {/* Header del Chat */}
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                          {usuarioActual.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${getEstadoColor(usuarioActual.estado)}`}></div>
                    </div>
                    <div>
                      <h3 className="text-slate-900 dark:text-slate-100">{usuarioActual.nombre}</h3>
                      <p className="text-slate-600 dark:text-slate-400">{usuarioActual.rol}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => eliminarConversacion(conversacionActual.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>

              {/* Mensajes */}
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4">
                    {conversacionActual.mensajes.map((mensaje) => {
                      const esMio = mensaje.remitente === 'yo';
                      return (
                        <motion.div
                          key={mensaje.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] ${esMio ? 'order-2' : 'order-1'}`}>
                            <div
                              className={`rounded-lg p-3 ${
                                esMio
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                              }`}
                            >
                              <p>{mensaje.contenido}</p>
                            </div>
                            <div className={`flex items-center gap-1 mt-1 ${esMio ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-slate-500 dark:text-slate-400">{mensaje.fecha}</span>
                              {esMio && (
                                mensaje.leido ? (
                                  <CheckCheck className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <Check className="w-4 h-4 text-slate-400" />
                                )
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Input de Mensaje */}
              <div className="border-t border-slate-200 dark:border-slate-700 p-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                    onClick={() => toast.info('Funcionalidad de imagen en desarrollo')}
                  >
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                    onClick={() => toast.info('Funcionalidad de archivo en desarrollo')}
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Input
                    placeholder="Escribe un mensaje..."
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && enviarMensaje()}
                    className="flex-1 bg-slate-50 dark:bg-slate-900"
                  />
                  <Button
                    onClick={enviarMensaje}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                    disabled={!nuevoMensaje.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  {conversaciones.length === 0 
                    ? 'No hay mensajes pendientes' 
                    : 'Selecciona una conversación para comenzar'}
                </p>
                {conversaciones.length === 0 && (
                  <p className="text-slate-500 dark:text-slate-500 mt-2">Tus conversaciones aparecerán aquí</p>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
