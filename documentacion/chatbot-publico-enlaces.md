# Chatbot público para la página de la Universidad

Enlace por seccional que abre **solo el asistente virtual** (sin menú, sin inicio de sesión, sin captcha visible),
con la misma pantalla del módulo de Asistentes Virtuales en acceso público y un botón «Volver a Universidad Libre».

## Enlaces para entregar

| Seccional | Enlace | «Volver» lleva a |
|---|---|---|
| Barranquilla | `https://sihul.unilibre.edu.co/asistente/barranquilla` | `https://www.unilibre.edu.co/barranquilla` |
| Bogotá | `https://sihul.unilibre.edu.co/asistente/bogota` | `https://www.unilibre.edu.co/bogota` |
| Cali | `https://sihul.unilibre.edu.co/asistente/cali` | `https://www.unilibre.edu.co/cali` |
| Cartagena | `https://sihul.unilibre.edu.co/asistente/cartagena` | `https://www.unilibre.edu.co/cartagena` |
| Cúcuta | `https://sihul.unilibre.edu.co/asistente/cucuta` | `https://www.unilibre.edu.co/cucuta` |
| Pereira | `https://sihul.unilibre.edu.co/asistente/pereira` | `https://www.unilibre.edu.co/pereira` |
| El Socorro | `https://sihul.unilibre.edu.co/asistente/socorro` | `https://www.unilibre.edu.co/socorro` |
| Virtual | `https://sihul.unilibre.edu.co/asistente/virtual` | `https://www.unilibre.edu.co/programas-virtuales/` |

- Cada seccional muestra solo los chatbots disponibles en ella («Disponible en» en Gestión de Chatbots) y responde con los
  documentos de esa seccional.
- Las direcciones de «Volver» están fijas en `frontend/src/config/seccionalesPublicas.ts` (no viajan en el enlace).
- **Cómo ponerlo en el sitio de la Universidad:** un botón o enlace normal (idealmente que abra en pestaña nueva:
  `target="_blank" rel="noopener"`). Si prefieren incrustarlo en una página, se puede en un marco (`<iframe>`) desde
  cualquier página de `unilibre.edu.co` o sus subdominios; dentro del marco el botón «Volver» no se muestra (la persona
  sigue en su página).

## Cómo se protege

1. **Desafío invisible:** al abrir la página, el navegador resuelve un cálculo pequeño (1 a 3 segundos) y el servidor
   entrega una sesión firmada de 30 minutos. Sin esa sesión, `POST /api/chatbot/public/pregunta/` responde 401 y no se gasta IA.
2. **Límites:** 20 preguntas por sesión, 60 por minuto y 1.000 por día por IP (generosos a propósito: detrás del equipo de la
   Universidad muchos visitantes pueden compartir IP) y **1.500 preguntas por día en total**; al superarlo el chat responde
   «no disponible por hoy».
3. **Entrada:** pregunta de 1 a 500 caracteres; identificador de chat validado; errores genéricos (nunca el texto interno).
4. **Orígenes:** solo `unilibre.edu.co` y `*.unilibre.edu.co` pueden incrustar la página (`frame-ancestors`).
5. **El servicio del chatbot (FastAPI) ya no se publica** en `https://sihul.unilibre.edu.co/chatbot/`: no autentica y permitía
   preguntar, subir y borrar documentos sin pasar por el backend. nginx responde 404; el backend lo usa por la red interna.
6. **Red de seguridad:** proyecto y llave de OpenAI con **límite mensual de gasto** y alertas (se configura en el panel de OpenAI).

## Ajustar los topes (sin tocar el código)

En `despliegue/env/prod.env` (ver `prod.env.example`), y luego `deploy.sh prod <sha>` o reiniciar el backend:

```
CHATBOT_PUBLICO_TOPE_DIARIO=1500
CHATBOT_PUBLICO_MAX_PREGUNTAS_SESION=20
CHATBOT_PUBLICO_PREGUNTAS_POR_IP_MINUTO=60
CHATBOT_PUBLICO_PREGUNTAS_POR_IP_DIA=1000
CHATBOT_PUBLICO_DIFICULTAD_BITS=17
```

## Ver cuántas preguntas públicas van hoy

```bash
docker exec sihul-redis-1 sh -c 'for k in $(redis-cli --scan --pattern "*chatbot-publico:dia:*"); do echo "$k = $(redis-cli get $k)"; done'
```

## Lo que debe aplicarse en el servidor al desplegar

1. Desplegar la versión nueva (`deploy.sh prod <sha>`): trae el backend y el frontend.
2. Actualizar el nginx del servidor (cierra `/chatbot/` y permite la cabecera de la sesión):
   ```bash
   cd /opt/sihul-repo && diff /etc/nginx/sites-available/sihul despliegue/nginx/sihul.conf
   cp despliegue/nginx/sihul.conf /etc/nginx/sites-available/sihul && nginx -t && systemctl reload nginx
   ```
3. Comprobar que `https://sihul.unilibre.edu.co/chatbot/docs` ya responde **404** y que
   `https://sihul.unilibre.edu.co/asistente/barranquilla` abre el asistente.

## Pendiente de la Universidad

- Confirmar si el equipo que termina el HTTPS envía la IP real del visitante en `X-Forwarded-For` (para poder afinar los
  límites por IP).
- Acordar si este enlace reemplaza o convive con el «Chatea con nosotros» actual.
- Quién publica el botón o enlace en cada página de seccional.
