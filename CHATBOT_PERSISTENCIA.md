# Sistema de Persistencia de Conversaciones - Chatbot IA

## 📋 Resumen

Se ha implementado un sistema completo de persistencia de conversaciones entre usuarios y agentes de IA, permitiendo guardar, recuperar y gestionar el historial de chats.

## 🗄️ Backend - Base de Datos

### Nuevo Modelo: `ChatMessage`

**Ubicación:** `backend/chatbot/models.py`

```python
class ChatMessage(models.Model):
    chat_id = models.UUIDField(default=uuid.uuid4, editable=False, db_index=True)
    chatbot = models.ForeignKey(Agente, on_delete=models.CASCADE, related_name='mensajes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_messages', null=True, blank=True)
    sender = models.CharField(max_length=10, choices=[('user', 'Usuario'), ('agent', 'Agente')])
    message = models.TextField()
    metadata = models.JSONField(null=True, blank=True, default=dict)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
```

**Campos:**
- `chat_id`: UUID único que identifica una conversación completa
- `chatbot`: Relación con el agente de IA
- `user`: Relación con el usuario (null si es mensaje del agente)
- `sender`: 'user' o 'agent' para identificar quién envió el mensaje
- `message`: Texto del mensaje
- `metadata`: JSON para información adicional (errores, IDs de preguntas sugeridas, etc.)
- `created_at`, `updated_at`: Timestamps automáticos

**Índices:**
- `(chat_id, created_at)`: Para recuperar mensajes de una conversación ordenados
- `(chatbot, user, created_at)`: Para filtrar conversaciones por agente y usuario

### Migración

**Archivo:** `backend/chatbot/migrations/0004_chatmessage.py`

Para aplicar la migración:
```bash
cd backend
python manage.py migrate chatbot
```

## 🔌 Backend - Endpoints API

### 1. POST `/chatbot/pregunta/` - Enviar Pregunta (MODIFICADO)

**Request:**
```json
{
  "agente_id": 1,
  "pregunta": "¿Cuál es el horario de atención?",
  "chat_id": "uuid-opcional",  // Si existe, continúa conversación
  "user_id": 123,              // ID del usuario autenticado
  "pregunta_sugerida_id": 5    // Opcional
}
```

**Response:**
```json
{
  "chat_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "respuesta": "El horario de atención es...",
  "mensaje_usuario": {
    "id": 456,
    "tipo": "user",
    "texto": "¿Cuál es el horario de atención?",
    "timestamp": "2025-12-02T10:30:00Z",
    "leido": true
  },
  "mensaje_agente": {
    "id": 457,
    "tipo": "bot",
    "texto": "El horario de atención es...",
    "timestamp": "2025-12-02T10:30:05Z",
    "leido": false
  }
}
```

**Funcionalidad:**
1. Guarda el mensaje del usuario en la BD
2. Llama al servicio RAG para obtener respuesta
3. Guarda la respuesta del agente en la BD
4. Retorna ambos mensajes con sus IDs de BD

### 2. GET `/chatbot/historial/` - Obtener Historial

**Query Params:**
- `chat_id` (opcional): UUID de la conversación
- `agente_id` (opcional): ID del agente
- `user_id` (opcional): ID del usuario

**Response:**
```json
{
  "mensajes": [
    {
      "id": 456,
      "chat_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "tipo": "user",
      "texto": "Pregunta del usuario",
      "timestamp": "2025-12-02T10:30:00Z",
      "leido": true,
      "metadata": {}
    },
    {
      "id": 457,
      "chat_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "tipo": "bot",
      "texto": "Respuesta del agente",
      "timestamp": "2025-12-02T10:30:05Z",
      "leido": true,
      "metadata": null
    }
  ],
  "total": 2
}
```

### 3. GET `/chatbot/conversaciones/` - Listar Conversaciones

**Query Params:**
- `agente_id` (requerido): ID del agente
- `user_id` (opcional): ID del usuario

**Response:**
```json
{
  "conversaciones": [
    {
      "chat_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "agente_id": "1",
      "primer_mensaje": "¿Cuál es el horario de atención?",
      "ultimo_mensaje": "Gracias por la información",
      "fecha_inicio": "2025-12-02T10:30:00Z",
      "fecha_actualizacion": "2025-12-02T11:45:00Z",
      "total_mensajes": 10
    }
  ],
  "total": 1
}
```

## 💻 Frontend - Integración

### Servicio API

**Ubicación:** `frontend/src/services/chatbot/chatbotAPI.ts`

**Nuevas Interfaces:**
```typescript
export interface EnviarPreguntaRequest {
    agente_id: number;
    pregunta: string;
    chat_id?: string;        // Nuevo
    user_id?: number;        // Nuevo
    pregunta_sugerida_id?: number;
}

export interface MensajeAPI {
    id: number;
    tipo: 'user' | 'bot';
    texto: string;
    timestamp: string;
    leido: boolean;
    metadata?: any;
}

export interface EnviarPreguntaResponse {
    chat_id: string;                    // Nuevo
    respuesta: string;
    mensaje_usuario: MensajeAPI;        // Nuevo
    mensaje_agente: MensajeAPI;         // Nuevo
}
```

**Nuevos Métodos:**
- `obtenerHistorial()`: Recupera mensajes de una conversación
- `listarConversaciones()`: Lista todas las conversaciones de un agente

### Hook Principal

**Ubicación:** `frontend/src/hooks/chatbot/useAsistentesVirtuales.ts`

**Nuevas Funcionalidades:**

1. **Estado de Chat IDs:**
```typescript
const [chatIds, setChatIds] = useState<{ [key: string]: string }>({});
```
Mapea cada agente con su `chat_id` actual para mantener continuidad.

2. **Cargar Historial al Abrir Chat:**
```typescript
const abrirChat = async (asistente: Asistente) => {
    // Intenta cargar historial desde el backend
    const response = await chatbotAPI.obtenerHistorial({
        agente_id: asistente.id,
        user_id: userId
    });
    
    if (response.mensajes.length > 0) {
        // Cargar mensajes existentes
    } else {
        // Mostrar mensaje de bienvenida
    }
};
```

3. **Envío de Mensajes con Persistencia:**
```typescript
const enviarMensaje = async () => {
    // 1. Mostrar mensaje del usuario inmediatamente (Optimistic UI)
    
    // 2. Enviar al backend con chat_id y user_id
    const response = await chatbotAPI.enviarPregunta({
        agente_id: Number(asistenteActivo.id),
        pregunta: preguntaEnviada,
        chat_id: currentChatId,
        user_id: userId
    });
    
    // 3. Guardar chat_id para futuras conversaciones
    if (response.chat_id) {
        setChatIds(prev => ({ ...prev, [asistenteActivo.id]: response.chat_id }));
    }
    
    // 4. Reemplazar mensaje temporal con datos reales del backend
};
```

## 🔄 Flujo de Conversación

### Primera Conversación (Sin Historial)

1. Usuario abre chat con agente → `abrirChat()`
2. Frontend intenta cargar historial → No hay mensajes
3. Muestra mensaje de bienvenida del agente
4. Usuario envía primer mensaje → `enviarMensaje()`
5. Backend crea nuevo `chat_id` (UUID)
6. Backend guarda mensaje usuario + respuesta agente
7. Frontend recibe `chat_id` y lo almacena
8. Mensajes se actualizan con IDs reales de BD

### Conversación Continua (Con Historial)

1. Usuario abre chat con agente → `abrirChat()`
2. Frontend carga historial desde backend
3. Mensajes anteriores se muestran
4. Usuario envía nuevo mensaje
5. Backend usa `chat_id` existente
6. Nuevos mensajes se agregan a la misma conversación

## 🎯 Características Implementadas

### ✅ Optimistic UI
- Mensajes del usuario aparecen inmediatamente
- Se reemplazan con datos reales del backend

### ✅ Persistencia Completa
- Todos los mensajes se guardan en PostgreSQL
- Historial se mantiene entre sesiones

### ✅ Continuidad de Conversación
- `chat_id` mantiene hilos de conversación
- Usuario puede retomar chat donde lo dejó

### ✅ Manejo de Errores
- Si falla el RAG, se guarda mensaje de error
- Frontend muestra mensaje alternativo

### ✅ Metadatos Flexibles
- Campo JSON para información adicional
- IDs de preguntas sugeridas, errores, etc.

## 🔧 Configuración y Uso

### 1. Aplicar Migración

```bash
cd backend
python manage.py migrate chatbot
```

### 2. Verificar en Django Admin

El modelo `ChatMessage` está registrado en el admin:
- URL: `/admin/chatbot/chatmessage/`
- Filtros por agente, usuario, fecha
- Búsqueda por contenido de mensaje

### 3. Obtener User ID en Frontend

Para asociar mensajes con usuarios:

```typescript
// Opción 1: Desde localStorage
const userId = localStorage.getItem('userId');

// Opción 2: Desde AuthContext (recomendado)
import { useAuth } from '@/context/AuthContext';
const { usuario } = useAuth();
const userId = usuario?.id;
```

### 4. Testing

**Probar envío de mensaje:**
```bash
curl -X POST http://localhost:8000/chatbot/pregunta/ \
  -H "Content-Type: application/json" \
  -d '{
    "agente_id": 1,
    "pregunta": "Test de persistencia",
    "user_id": 1
  }'
```

**Probar historial:**
```bash
curl http://localhost:8000/chatbot/historial/?agente_id=1&user_id=1
```

## 📊 Panel de Administración

### Ver Conversaciones

```python
# En Django Admin o shell
from chatbot.models import ChatMessage

# Mensajes de un chat específico
ChatMessage.objects.filter(chat_id='uuid-aqui').order_by('created_at')

# Conversaciones de un usuario
ChatMessage.objects.filter(user_id=1).values('chat_id').distinct()

# Estadísticas
from django.db.models import Count
ChatMessage.objects.values('chatbot__nombre').annotate(total=Count('id'))
```

## 🚀 Mejoras Futuras

- [ ] WebSockets para mensajes en tiempo real
- [ ] Paginación de historial (cargar mensajes antiguos on-demand)
- [ ] Exportar conversaciones a PDF
- [ ] Análisis de sentimiento de conversaciones
- [ ] Sugerencias automáticas basadas en historial
- [ ] Borrar/editar mensajes
- [ ] Reacciones a mensajes (👍👎)
- [ ] Búsqueda dentro de conversaciones

## 📝 Notas Importantes

1. **UUIDs vs Secuenciales**: Los `chat_id` son UUIDs para evitar colisiones y mejorar seguridad
2. **User NULL**: Si `user_id` es NULL, es una conversación anónima (útil para visitantes)
3. **Índices**: Los índices en BD optimizan consultas frecuentes
4. **Metadata JSON**: Flexible para agregar información sin cambiar esquema
5. **Timestamps**: `created_at` no se modifica, `updated_at` sí (para futuras ediciones)

## 🐛 Troubleshooting

### Los mensajes no se guardan
- Verificar que la migración se aplicó
- Revisar logs del backend para errores
- Confirmar que el endpoint recibe `user_id`

### No carga historial
- Verificar que el `agente_id` sea correcto
- Comprobar que hay mensajes en BD
- Revisar console del navegador para errores

### Chat_id se pierde al recargar
- Implementar persistencia en `localStorage`
- O cargar última conversación automáticamente

---

**Fecha de Implementación:** 2 de diciembre de 2025  
**Autor:** GitHub Copilot  
**Estado:** ✅ Completado y Funcionando
