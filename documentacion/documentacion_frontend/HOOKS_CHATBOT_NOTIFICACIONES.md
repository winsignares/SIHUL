# Hooks: Chatbot y Notificaciones

Ver también [HOOKS_INDICE.md](HOOKS_INDICE.md), [SERVICES_CHATBOT.md](SERVICES_CHATBOT.md) y [RESUMEN_NOTIFICACIONES.md](RESUMEN_NOTIFICACIONES.md).

## `hooks/chatbot/useAsistentesVirtuales.ts` (752 líneas)

Único consumidor: `pages/chatbot/AsistentesVirtuales.tsx`.

- Estado: `asistentes`, `asistenteActivo`, `mensajes` (por agente), `inputMensaje`, `isTyping`, `searchTerm`, `loading`, `preguntasRotadas`, `chatIds` (mapeo agente→chat_id), `seccionalesPublico`, `seccionalPublica`, `cargandoSeccionales`, `mostrarHistorial`, `conversacionesHistorial`, `cargandoHistorial`, `messagesEndRef`.
- Expone: `abrirChat`, `enviarMensaje`, `enviarPreguntaRapida`, `handleKeyPress`, `limpiarConversacion`, `cargarHistorialConversaciones`, `cargarConversacionAnterior`, y getters derivados: `mensajesActuales`, `mostrarPreguntasRapidas`, `filteredAsistentes`, `esPublico`.
- Servicio: `services/chatbot/chatbotAPI.ts` — `listarAgentes`/`listarAgentesPublico`, `enviarPregunta`/`enviarPreguntaPublico`, `obtenerHistorial`, `listarConversaciones`.
- Cache: usa `core/sessionCache.ts` con clave `chatbot-asistentes-virtuales-{userId}-{rol}`. Además persiste `chat_ids` y mensajes en `localStorage` por usuario (`sihul_chat_ids_{userId}`, `sihul_mensajes_chat_{userId}`) con un patrón *distinto* al `sessionCache` genérico: como los iconos de `lucide-react` no son serializables, solo se guarda el nombre del icono (`icono: string`) y se "rehidrata" con un `iconMap` al leer.
- Detecta usuario público vs. autenticado (`user?.id`) y cambia de endpoint público/privado en consecuencia.

## `hooks/users/useNotificaciones.ts` (376 líneas)

Único consumidor: `pages/users/Notificaciones.tsx`.

- Estado: `notificaciones`, `filterTab` (`'importantes'|'pendientes'|'leidas'`), `isLoading`, `stats` (`total/pendientes/leidas/eliminadas`), paginación (`paginaActual`, `totalPaginas`, `totalNotificaciones`, `limite=5`), `busqueda`/`busquedaActiva` (debounce 500ms), `filtroTiempo`, `filtroPrioridad`.
- Expone: `setFilterTab` (alias `cambiarTab`), `marcarComoLeida`, `marcarTodasComoLeidas`, `eliminarNotificacion`, `filteredNotificaciones`, `recargar`, `cambiarPagina`, `setBusqueda`, `setFiltroTiempo`, `setFiltroPrioridad`.
- Servicios: `services/notificaciones/notificacionesAPI.ts` — `obtenerMisNotificaciones`, `obtenerEstadisticas`, `marcarComoLeida`, `marcarTodasComoLeidas`, `eliminarNotificacion`.
- También consume `context/NotificacionesContext` (`actualizarContador`) para sincronizar el badge global de notificaciones no leídas.
- Polling: refresca estadísticas cada 30 segundos.
- Mapea el modelo backend (`NotificacionBackend`) a un modelo de UI (`NotificacionUsuario`) vía `mapearNotificacion`, con lógica especial para los tipos `factura_devuelta`/`factura_etapa_actualizada` (usa el mensaje completo) y `solicitud_rechazada` (separa título/descripción por líneas).

> Nota: `useAdminDashboard.ts` (ver [HOOKS_PRINCIPALES.md](HOOKS_PRINCIPALES.md)) tiene un contador `notificacionesSinLeer` hardcodeado a `3` — todavía no está conectado a este hook/servicio real.
