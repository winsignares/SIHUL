# CHECKLIST PARA EL BACKEND

## ✅ TAREAS PRIORITARIAS

### 1. MODIFICAR LOGIN (CRÍTICO)
- [ ] Modificar endpoint `POST /usuarios/login/` para retornar:
  ```json
  {
    "message": "Login exitoso",
    "id": 1,
    "nombre": "Juan Pérez",
    "rol": "Administrador",
    "rol_id": 1,
    "correo": "juan@example.com",
    "permisos": ["crear_usuario", "editar_usuario", "eliminar_usuario", ...],
    "areas": ["administracion", "gestion_academica", "reportes", ...]
  }
  ```

### 2. IMPLEMENTAR ENDPOINTS DE HORARIOS
- [ ] `GET /horario/docente/{docente_id}/` - Horarios de un docente
- [ ] `GET /horario/estudiante/{estudiante_id}/` - Horarios de un estudiante  
- [ ] `GET /horario/grupo/{grupo_id}/` - Horarios de un grupo
- [ ] `GET /horario/espacio/{espacio_id}/` - Horarios de un espacio

**Nota:** Cada uno debe retornar información enriquecida (nombres, no solo IDs)

### 3. IMPLEMENTAR ENDPOINTS DE PRÉSTAMOS
- [ ] `GET /prestamos/usuario/{usuario_id}/` - Préstamos de un usuario
- [ ] `GET /prestamos/espacio/{espacio_id}/` - Préstamos de un espacio

### 4. IMPLEMENTAR VALIDACIÓN DE DISPONIBILIDAD
- [ ] `POST /espacios/validar-disponibilidad/`
  - Recibe: espacio_id, fecha, hora_inicio, hora_fin
  - Retorna: disponible (boolean) + lista de conflictos

### 5. IMPLEMENTAR ESTADÍSTICAS DEL DASHBOARD
- [ ] `GET /dashboard/estadisticas/`
  - total_usuarios
  - total_espacios
  - total_horarios
  - total_prestamos
  - prestamos_pendientes
  - prestamos_hoy
  - espacios_disponibles
  - ocupacion_promedio

---

## 📊 ENDPOINTS SECUNDARIOS (IMPORTANTE)

### 6. OCUPACIÓN DE ESPACIOS
- [ ] `GET /espacios/ocupacion/`
  - Query params: sede_id, tipo, fecha_inicio, fecha_fin
  - Retorna porcentaje de ocupación por espacio

### 7. RELACIONES
- [ ] `GET /espacios/{espacio_id}/recursos/` - Recursos de un espacio
- [ ] `GET /sedes/{sede_id}/espacios/` - Espacios de una sede
- [ ] `GET /facultades/{facultad_id}/programas/` - Programas de una facultad
- [ ] `GET /programas/{programa_id}/grupos/` - Grupos de un programa

### 8. NOTIFICACIONES
- [ ] `GET /usuarios/{usuario_id}/notificaciones/` - Notificaciones de un usuario
  - Query param: leidas (boolean, opcional)
- [ ] `PUT /notificaciones/{notificacion_id}/marcar-leida/` - Marcar como leída

### 9. REPORTES
- [ ] `GET /reportes/ocupacion-espacios/`
  - Query params: fecha_inicio, fecha_fin, sede_id (opcional)
  - Retorna reporte detallado de ocupación

### 10. BÚSQUEDA GLOBAL
- [ ] `GET /buscar/`
  - Query params: q (término), tipo (opcional)
  - Retorna resultados en espacios, usuarios, horarios, préstamos

---

## 📝 MEJORAS EN RESPUESTAS EXISTENTES

### HORARIOS
**GET /horario/list/** debe retornar información enriquecida:
```json
{
  "horarios": [
    {
      "id": 1,
      "grupo_id": 1,
      "grupo_nombre": "Grupo A",              // ← AGREGAR
      "asignatura_id": 1,
      "asignatura_nombre": "Matemáticas",     // ← AGREGAR
      "asignatura_codigo": "MAT101",          // ← AGREGAR
      "docente_id": 2,
      "docente_nombre": "Prof. Juan",         // ← AGREGAR
      "espacio_id": 3,
      "espacio_tipo": "Aula",                 // ← AGREGAR
      "espacio_ubicacion": "Edificio A-101",  // ← AGREGAR
      "dia_semana": "Lunes",
      "hora_inicio": "08:00:00",
      "hora_fin": "10:00:00",
      "cantidad_estudiantes": 30
    }
  ]
}
```

### PRÉSTAMOS
**GET /prestamos/list/** debe retornar información enriquecida:
```json
{
  "prestamos": [
    {
      "id": 1,
      "espacio_id": 3,
      "espacio_tipo": "Aula",                     // ← AGREGAR
      "espacio_ubicacion": "Edificio A-101",      // ← AGREGAR
      "usuario_id": 5,
      "usuario_nombre": "María García",           // ← AGREGAR
      "administrador_id": 1,
      "administrador_nombre": "Admin Juan",       // ← AGREGAR
      "fecha": "2025-11-25",
      "hora_inicio": "14:00:00",
      "hora_fin": "16:00:00",
      "motivo": "Reunión",
      "estado": "Aprobado"
    }
  ]
}
```

### GRUPOS
**GET /grupos/list/** debe incluir:
```json
{
  "grupos": [
    {
      "id": 1,
      "nombre": "Grupo A",
      "programa_id": 1,
      "programa_nombre": "Ingeniería de Sistemas",  // ← AGREGAR
      "periodo_id": 1,
      "periodo_nombre": "2025-1",                   // ← AGREGAR
      "semestre": 3,
      "activo": true
    }
  ]
}
```

### ESPACIOS
**GET /espacios/list/** debe incluir:
```json
{
  "espacios": [
    {
      "id": 1,
      "sede_id": 1,
      "sede_nombre": "Campus Principal",  // ← AGREGAR
      "tipo": "Aula",
      "capacidad": 40,
      "ubicacion": "Edificio A-101",
      "recursos": "Proyector, Pizarra",
      "disponible": true
    }
  ]
}
```

### PROGRAMAS
**GET /programas/list/** debe incluir:
```json
{
  "programas": [
    {
      "id": 1,
      "nombre": "Ingeniería de Sistemas",
      "facultad_id": 1,
      "facultad_nombre": "Facultad de Ingeniería",  // ← AGREGAR
      "activo": true
    }
  ]
}
```

---

## 🔒 PERMISOS Y ÁREAS

### Definir permisos del sistema
Lista sugerida de permisos:
```
- crear_usuario
- editar_usuario
- eliminar_usuario
- ver_usuarios
- crear_espacio
- editar_espacio
- eliminar_espacio
- ver_espacios
- crear_horario
- editar_horario
- eliminar_horario
- ver_horarios
- aprobar_prestamo
- rechazar_prestamo
- crear_prestamo
- ver_prestamos
- crear_asignatura
- editar_asignatura
- eliminar_asignatura
- ver_reportes
- gestionar_roles
- gestionar_permisos
```

### Definir áreas del sistema
Lista sugerida de áreas:
```
- administracion
- gestion_academica
- gestion_espacios
- gestion_prestamos
- reportes
- configuracion
- audiovisual
- consulta
```

### Asignar permisos y áreas por rol

**Administrador:**
- Permisos: TODOS
- Áreas: TODAS

**Docente:**
- Permisos: ver_horarios, crear_prestamo, ver_prestamos
- Áreas: consulta, gestion_prestamos

**Estudiante:**
- Permisos: ver_horarios
- Áreas: consulta

**Audiovisual:**
- Permisos: ver_espacios, ver_prestamos, aprobar_prestamo, rechazar_prestamo
- Áreas: gestion_espacios, gestion_prestamos, audiovisual

**Consultor:**
- Permisos: ver_horarios, ver_espacios, ver_prestamos
- Áreas: consulta

---

## 🔄 MIGRACIONES NECESARIAS

Si el backend usa Django, crear migraciones para:

1. **Tabla de Permisos**
```python
class Permiso(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField()
    activo = models.BooleanField(default=True)
```

2. **Tabla de Áreas**
```python
class Area(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField()
    activa = models.BooleanField(default=True)
```

3. **Relación Rol-Permiso (Many-to-Many)**
```python
class Rol(models.Model):
    # ... campos existentes
    permisos = models.ManyToManyField(Permiso, related_name='roles')
```

4. **Relación Rol-Área (Many-to-Many)**
```python
class Rol(models.Model):
    # ... campos existentes
    areas = models.ManyToManyField(Area, related_name='roles')
```

---

## 📋 PRIORIDADES

### ALTA (Implementar PRIMERO)
1. ✅ Modificar login para retornar permisos y áreas
2. ✅ Endpoints de horarios filtrados
3. ✅ Validación de disponibilidad

### MEDIA (Implementar SEGUNDO)
4. ✅ Estadísticas del dashboard
5. ✅ Endpoints de préstamos filtrados
6. ✅ Endpoints de relaciones (espacios por sede, etc.)

### BAJA (Implementar DESPUÉS)
7. ✅ Notificaciones
8. ✅ Reportes
9. ✅ Búsqueda global
10. ✅ Ocupación de espacios

---

## 🧪 TESTING

Para cada endpoint nuevo, verificar:
- [ ] Retorna el formato correcto
- [ ] Maneja errores apropiadamente
- [ ] Filtra correctamente por parámetros
- [ ] Incluye información enriquecida (nombres, no solo IDs)
- [ ] Valida permisos del usuario
- [ ] Retorna códigos HTTP apropiados (200, 400, 401, 403, 404, 500)

---

## 📞 COORDINACIÓN FRONTEND-BACKEND

Una vez implementados los endpoints:
1. Probar con Postman o similar
2. Compartir ejemplos de respuestas reales
3. Ajustar frontend si es necesario
4. Realizar pruebas integradas
5. Documentar cualquier cambio en el formato de respuesta

---

## 🎯 OBJETIVO FINAL

Que el frontend pueda:
- ✅ Autenticar usuarios y obtener sus permisos/áreas
- ✅ Mostrar solo las opciones permitidas según permisos
- ✅ Filtrar horarios por docente/estudiante/grupo/espacio
- ✅ Validar disponibilidad antes de crear horarios/préstamos
- ✅ Mostrar estadísticas en el dashboard
- ✅ Gestionar notificaciones
- ✅ Generar reportes
- ✅ Buscar información globalmente

Todo esto ya está implementado en el frontend, solo falta que el backend proporcione los datos correctos.
