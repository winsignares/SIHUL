# ENDPOINTS ADICIONALES QUE EL BACKEND DEBE IMPLEMENTAR

## MEJORAS CRÍTICAS PARA EL FRONTEND

### 1. LOGIN - Modificar respuesta
**Endpoint:** `POST /usuarios/login/`

**Respuesta actual:**
```json
{
  "message": "Login exitoso",
  "id": integer,
  "nombre": "string",
  "rol": "string"|null
}
```

**Respuesta REQUERIDA:**
```json
{
  "message": "Login exitoso",
  "id": integer,
  "nombre": "string",
  "rol": "string"|null,
  "rol_id": integer|null,
  "correo": "string",
  "permisos": ["permiso1", "permiso2", ...],
  "areas": ["area1", "area2", ...]
}
```

**Razón:** El frontend necesita saber qué áreas/componentes mostrar al usuario según su rol y permisos.

---

### 2. HORARIOS POR DOCENTE
**Endpoint NUEVO:** `GET /horario/docente/{docente_id}/`

**Recibe:** ID del docente en la URL

**Envía:**
```json
{
  "horarios": [
    {
      "id": integer,
      "grupo_id": integer,
      "grupo_nombre": "string",
      "asignatura_id": integer,
      "asignatura_nombre": "string",
      "asignatura_codigo": "string",
      "espacio_id": integer,
      "espacio_tipo": "string",
      "espacio_ubicacion": "string",
      "dia_semana": "string",
      "hora_inicio": "string",
      "hora_fin": "string",
      "cantidad_estudiantes": integer|null
    }
  ]
}
```

**Razón:** Los docentes necesitan ver su horario completo con información detallada.

---

### 3. HORARIOS POR ESTUDIANTE
**Endpoint NUEVO:** `GET /horario/estudiante/{estudiante_id}/`

**Recibe:** ID del estudiante en la URL

**Envía:**
```json
{
  "horarios": [
    {
      "id": integer,
      "grupo_id": integer,
      "grupo_nombre": "string",
      "asignatura_id": integer,
      "asignatura_nombre": "string",
      "asignatura_codigo": "string",
      "docente_id": integer|null,
      "docente_nombre": "string"|null,
      "espacio_id": integer,
      "espacio_tipo": "string",
      "espacio_ubicacion": "string",
      "dia_semana": "string",
      "hora_inicio": "string",
      "hora_fin": "string"
    }
  ]
}
```

**Razón:** Los estudiantes necesitan ver su horario según los grupos en los que están inscritos.

---

### 4. HORARIOS POR GRUPO
**Endpoint NUEVO:** `GET /horario/grupo/{grupo_id}/`

**Recibe:** ID del grupo en la URL

**Envía:**
```json
{
  "horarios": [
    {
      "id": integer,
      "asignatura_id": integer,
      "asignatura_nombre": "string",
      "docente_id": integer|null,
      "docente_nombre": "string"|null,
      "espacio_id": integer,
      "espacio_tipo": "string",
      "dia_semana": "string",
      "hora_inicio": "string",
      "hora_fin": "string"
    }
  ]
}
```

---

### 5. HORARIOS POR ESPACIO
**Endpoint NUEVO:** `GET /horario/espacio/{espacio_id}/`

**Recibe:** ID del espacio en la URL

**Envía:**
```json
{
  "horarios": [
    {
      "id": integer,
      "grupo_id": integer,
      "grupo_nombre": "string",
      "asignatura_id": integer,
      "asignatura_nombre": "string",
      "docente_id": integer|null,
      "docente_nombre": "string"|null,
      "dia_semana": "string",
      "hora_inicio": "string",
      "hora_fin": "string",
      "cantidad_estudiantes": integer|null
    }
  ]
}
```

**Razón:** Necesario para visualizar la ocupación de espacios.

---

### 6. PRÉSTAMOS POR USUARIO
**Endpoint NUEVO:** `GET /prestamos/usuario/{usuario_id}/`

**Recibe:** ID del usuario en la URL

**Envía:**
```json
{
  "prestamos": [
    {
      "id": integer,
      "espacio_id": integer,
      "espacio_tipo": "string",
      "espacio_ubicacion": "string",
      "fecha": "string (YYYY-MM-DD)",
      "hora_inicio": "string (HH:MM:SS)",
      "hora_fin": "string (HH:MM:SS)",
      "motivo": "string",
      "estado": "string",
      "administrador_id": integer|null,
      "administrador_nombre": "string"|null
    }
  ]
}
```

**Razón:** Los usuarios necesitan ver sus préstamos.

---

### 7. PRÉSTAMOS POR ESPACIO
**Endpoint NUEVO:** `GET /prestamos/espacio/{espacio_id}/`

**Recibe:** ID del espacio en la URL

**Envía:**
```json
{
  "prestamos": [
    {
      "id": integer,
      "usuario_id": integer|null,
      "usuario_nombre": "string"|null,
      "fecha": "string (YYYY-MM-DD)",
      "hora_inicio": "string (HH:MM:SS)",
      "hora_fin": "string (HH:MM:SS)",
      "motivo": "string",
      "estado": "string"
    }
  ]
}
```

---

### 8. OCUPACIÓN SEMANAL DE ESPACIOS
**Endpoint NUEVO:** `GET /espacios/ocupacion/`

**Recibe:** Query params opcionales:
- `sede_id`: integer (opcional)
- `tipo`: string (opcional)
- `fecha_inicio`: string YYYY-MM-DD (opcional)
- `fecha_fin`: string YYYY-MM-DD (opcional)

**Envía:**
```json
{
  "ocupacion": [
    {
      "espacio_id": integer,
      "espacio_tipo": "string",
      "espacio_ubicacion": "string",
      "capacidad": integer,
      "disponible": boolean,
      "horarios": [
        {
          "dia_semana": "string",
          "hora_inicio": "string",
          "hora_fin": "string",
          "tipo": "horario"|"prestamo",
          "asignatura_nombre": "string"|null,
          "grupo_nombre": "string"|null
        }
      ],
      "porcentaje_ocupacion": float
    }
  ]
}
```

**Razón:** Para visualizar la ocupación semanal de espacios.

---

### 9. RECURSOS POR ESPACIO
**Endpoint NUEVO:** `GET /espacios/{espacio_id}/recursos/`

**Recibe:** ID del espacio en la URL

**Envía:**
```json
{
  "recursos": [
    {
      "recurso_id": integer,
      "nombre": "string",
      "descripcion": "string",
      "disponible": boolean
    }
  ]
}
```

---

### 10. ESPACIOS POR SEDE
**Endpoint NUEVO:** `GET /sedes/{sede_id}/espacios/`

**Recibe:** ID de la sede en la URL

**Envía:**
```json
{
  "espacios": [
    {
      "id": integer,
      "tipo": "string",
      "capacidad": integer,
      "ubicacion": "string",
      "disponible": boolean
    }
  ]
}
```

---

### 11. PROGRAMAS POR FACULTAD
**Endpoint NUEVO:** `GET /facultades/{facultad_id}/programas/`

**Recibe:** ID de la facultad en la URL

**Envía:**
```json
{
  "programas": [
    {
      "id": integer,
      "nombre": "string",
      "activo": boolean
    }
  ]
}
```

---

### 12. GRUPOS POR PROGRAMA
**Endpoint NUEVO:** `GET /programas/{programa_id}/grupos/`

**Recibe:** ID del programa en la URL, query params opcionales:
- `periodo_id`: integer (opcional)
- `semestre`: integer (opcional)

**Envía:**
```json
{
  "grupos": [
    {
      "id": integer,
      "nombre": "string",
      "periodo_id": integer,
      "periodo_nombre": "string",
      "semestre": integer,
      "activo": boolean
    }
  ]
}
```

---

### 13. ESTADÍSTICAS DEL DASHBOARD
**Endpoint NUEVO:** `GET /dashboard/estadisticas/`

**Recibe:** Nada (usa el usuario autenticado)

**Envía:**
```json
{
  "total_usuarios": integer,
  "total_espacios": integer,
  "total_horarios": integer,
  "total_prestamos": integer,
  "prestamos_pendientes": integer,
  "prestamos_hoy": integer,
  "espacios_disponibles": integer,
  "ocupacion_promedio": float
}
```

**Razón:** Para mostrar estadísticas en el dashboard.

---

### 14. VALIDAR DISPONIBILIDAD DE ESPACIO
**Endpoint NUEVO:** `POST /espacios/validar-disponibilidad/`

**Recibe:**
```json
{
  "espacio_id": integer,
  "fecha": "string (YYYY-MM-DD)",
  "hora_inicio": "string (HH:MM:SS)",
  "hora_fin": "string (HH:MM:SS)"
}
```

**Envía:**
```json
{
  "disponible": boolean,
  "conflictos": [
    {
      "tipo": "horario"|"prestamo",
      "descripcion": "string",
      "hora_inicio": "string",
      "hora_fin": "string"
    }
  ]
}
```

**Razón:** Para validar antes de crear horarios o préstamos.

---

### 15. NOTIFICACIONES DEL USUARIO
**Endpoint NUEVO:** `GET /usuarios/{usuario_id}/notificaciones/`

**Recibe:** ID del usuario en la URL, query param opcional:
- `leidas`: boolean (opcional, default: false)

**Envía:**
```json
{
  "notificaciones": [
    {
      "id": integer,
      "titulo": "string",
      "mensaje": "string",
      "tipo": "string",
      "leida": boolean,
      "fecha_creacion": "string (YYYY-MM-DD HH:MM:SS)"
    }
  ]
}
```

---

### 16. MARCAR NOTIFICACIÓN COMO LEÍDA
**Endpoint NUEVO:** `PUT /notificaciones/{notificacion_id}/marcar-leida/`

**Recibe:** ID de la notificación en la URL

**Envía:**
```json
{
  "message": "Notificación marcada como leída"
}
```

---

### 17. REPORTES
**Endpoint NUEVO:** `GET /reportes/ocupacion-espacios/`

**Recibe:** Query params:
- `fecha_inicio`: string YYYY-MM-DD
- `fecha_fin`: string YYYY-MM-DD
- `sede_id`: integer (opcional)

**Envía:**
```json
{
  "reporte": {
    "periodo": {
      "fecha_inicio": "string",
      "fecha_fin": "string"
    },
    "espacios": [
      {
        "espacio_id": integer,
        "espacio_tipo": "string",
        "total_horas_disponibles": float,
        "total_horas_ocupadas": float,
        "porcentaje_ocupacion": float,
        "horarios_count": integer,
        "prestamos_count": integer
      }
    ]
  }
}
```

---

### 18. BÚSQUEDA GLOBAL
**Endpoint NUEVO:** `GET /buscar/`

**Recibe:** Query params:
- `q`: string (término de búsqueda)
- `tipo`: string (opcional: "espacios"|"usuarios"|"horarios"|"prestamos")

**Envía:**
```json
{
  "resultados": {
    "espacios": [...],
    "usuarios": [...],
    "horarios": [...],
    "prestamos": [...]
  }
}
```

---

## RESUMEN DE CAMBIOS NECESARIOS

1. **Login**: Agregar permisos y áreas al response
2. **Horarios**: Crear endpoints filtrados por docente, estudiante, grupo y espacio
3. **Préstamos**: Crear endpoints filtrados por usuario y espacio
4. **Ocupación**: Endpoint para visualizar ocupación de espacios
5. **Relaciones**: Endpoints para recursos por espacio, espacios por sede, programas por facultad, grupos por programa
6. **Dashboard**: Endpoint de estadísticas
7. **Validaciones**: Endpoint para validar disponibilidad
8. **Notificaciones**: CRUD completo de notificaciones
9. **Reportes**: Endpoints para generar reportes
10. **Búsqueda**: Endpoint de búsqueda global

Todos estos endpoints son necesarios para que el frontend funcione completamente.
