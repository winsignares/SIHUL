import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../share/card';
import { Input } from '../share/input';
import { Button } from '../share/button';
import { Avatar, AvatarFallback } from '../share/avatar';
import { Badge } from '../share/badge';
import { ScrollArea } from '../share/scroll-area';
import { Separator } from '../share/separator';
import { 
  Send, 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  Paperclip,
  Smile,
  X,
  Check,
  CheckCheck,
  Circle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: number;
  text: string;
  sender: string;
  timestamp: string;
  isOwn: boolean;
  status: 'sent' | 'delivered' | 'read';
}

interface Contact {
  id: number;
  name: string;
  role: string;
  status: 'online' | 'offline' | 'away';
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  avatar: string;
}

export default function ChatInterno() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Datos de ejemplo
  const contacts: Contact[] = [
    {
      id: 1,
      name: 'María González',
      role: 'Administrador',
      status: 'online',
      lastMessage: 'Perfecto, nos vemos mañana',
      lastMessageTime: '10:30',
      unread: 2,
      avatar: 'MG'
    },
    {
      id: 2,
      name: 'Roberto Medina',
      role: 'Personal Audiovisual',
      status: 'online',
      lastMessage: 'Los proyectores están listos',
      lastMessageTime: '09:15',
      unread: 0,
      avatar: 'RM'
    },
    {
      id: 3,
      name: 'Carlos Ramírez',
      role: 'Docente',
      status: 'away',
      lastMessage: '¿Está disponible el aula A301?',
      lastMessageTime: 'Ayer',
      unread: 1,
      avatar: 'CR'
    },
    {
      id: 4,
      name: 'Ana López',
      role: 'Estudiante',
      status: 'offline',
      lastMessage: 'Gracias por la información',
      lastMessageTime: 'Ayer',
      unread: 0,
      avatar: 'AL'
    },
    {
      id: 5,
      name: 'Jorge Martínez',
      role: 'Docente',
      status: 'online',
      lastMessage: 'Necesito reservar el auditorio',
      lastMessageTime: '08:45',
      unread: 3,
      avatar: 'JM'
    }
  ];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: 'Hola, ¿cómo estás?',
      sender: 'María González',
      timestamp: '10:15',
      isOwn: false,
      status: 'read'
    },
    {
      id: 2,
      text: 'Bien, ¿necesitas algo?',
      sender: 'Tú',
      timestamp: '10:16',
      isOwn: true,
      status: 'read'
    },
    {
      id: 3,
      text: 'Sí, quería consultarte sobre la disponibilidad del laboratorio de física para mañana',
      sender: 'María González',
      timestamp: '10:18',
      isOwn: false,
      status: 'read'
    },
    {
      id: 4,
      text: 'Déjame verificar el horario',
      sender: 'Tú',
      timestamp: '10:20',
      isOwn: true,
      status: 'delivered'
    },
    {
      id: 5,
      text: 'El laboratorio está disponible de 14:00 a 16:00',
      sender: 'Tú',
      timestamp: '10:25',
      isOwn: true,
      status: 'sent'
    },
    {
      id: 6,
      text: 'Perfecto, nos vemos mañana',
      sender: 'María González',
      timestamp: '10:30',
      isOwn: false,
      status: 'read'
    }
  ]);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      text: messageText,
      sender: 'Tú',
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
      status: 'sent'
    };

    setMessages([...messages, newMessage]);
    setMessageText('');
  };

  const getStatusColor = (status: Contact['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-slate-400';
    }
  };

  const getMessageStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sent': return <Check className="w-3 h-3" />;
      case 'delivered': return <CheckCheck className="w-3 h-3" />;
      case 'read': return <CheckCheck className="w-3 h-3 text-blue-500" />;
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <Card className="h-full flex flex-col shadow-xl">
          <CardHeader className="border-b bg-gradient-to-r from-red-50 to-white">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center">
                <Send className="w-5 h-5 text-yellow-400" />
              </div>
              <span className="bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
                Chat Interno
              </span>
              <Badge variant="outline" className="ml-auto">
                Sistema de Mensajería
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 p-0 flex h-0">
            {/* Lista de contactos */}
            <div className="w-80 border-r flex flex-col bg-slate-50">
              {/* Búsqueda */}
              <div className="p-4 border-b bg-white">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Buscar contactos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Contactos */}
              <ScrollArea className="flex-1">
                <div className="p-2">
                  {filteredContacts.map((contact) => (
                    <motion.div
                      key={contact.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedContact(contact)}
                      className={`p-3 rounded-lg cursor-pointer transition-all mb-2 ${
                        selectedContact?.id === contact.id
                          ? 'bg-gradient-to-r from-red-100 to-red-50 border border-red-200'
                          : 'hover:bg-white border border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar>
                            <AvatarFallback className="bg-gradient-to-br from-red-600 to-red-800 text-white">
                              {contact.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(contact.status)} rounded-full border-2 border-white`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-slate-900 truncate">{contact.name}</p>
                            <span className="text-slate-400">{contact.lastMessageTime}</span>
                          </div>
                          <p className="text-slate-500 mb-1">{contact.role}</p>
                          <p className="text-slate-600 truncate">{contact.lastMessage}</p>
                        </div>
                        {contact.unread > 0 && (
                          <Badge className="bg-red-600 text-white">{contact.unread}</Badge>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Área de chat */}
            <div className="flex-1 flex flex-col">
              {selectedContact ? (
                <>
                  {/* Header del chat */}
                  <div className="p-4 border-b bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarFallback className="bg-gradient-to-br from-red-600 to-red-800 text-white">
                            {selectedContact.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(selectedContact.status)} rounded-full border-2 border-white`} />
                      </div>
                      <div>
                        <h3 className="text-slate-900">{selectedContact.name}</h3>
                        <p className="text-slate-500">{selectedContact.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Video className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Mensajes */}
                  <ScrollArea className="flex-1 p-4 bg-slate-50">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-md ${message.isOwn ? 'order-2' : 'order-1'}`}>
                            <div
                              className={`rounded-2xl px-4 py-2 ${
                                message.isOwn
                                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                                  : 'bg-white border border-slate-200'
                              }`}
                            >
                              <p>{message.text}</p>
                            </div>
                            <div className={`flex items-center gap-1 mt-1 ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-slate-400">{message.timestamp}</span>
                              {message.isOwn && (
                                <span className="text-slate-400">
                                  {getMessageStatusIcon(message.status)}
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Input de mensaje */}
                  <div className="p-4 border-t bg-white">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Smile className="w-4 h-4" />
                      </Button>
                      <Input
                        type="text"
                        placeholder="Escribe un mensaje..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSendMessage}
                        className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-slate-50">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="w-12 h-12 text-red-600" />
                    </div>
                    <h3 className="text-slate-900 mb-2">Selecciona una conversación</h3>
                    <p className="text-slate-500">Elige un contacto para comenzar a chatear</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
