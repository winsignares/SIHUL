-- Roles
INSERT INTO usuarios_rol (nombre, descripcion) VALUES ('admin', 'Administrador del Sistema');
INSERT INTO usuarios_rol (nombre, descripcion) VALUES ('supervisor_general', 'Supervisor General');
INSERT INTO usuarios_rol (nombre, descripcion) VALUES ('docente', 'Docente');
INSERT INTO usuarios_rol (nombre, descripcion) VALUES ('estudiante', 'Estudiante');

-- Componentes (Admin)
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Dashboard', 'Dashboard Principal');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Facultades', 'Gestión de Facultades');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Programas', 'Gestión de Programas');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Periodos', 'Gestión de Periodos');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Grupos', 'Gestión de Grupos');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Asignaturas', 'Gestión de Asignaturas');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Espacios', 'Gestión de Espacios');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Horarios', 'Gestión de Horarios');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Préstamos', 'Gestión de Préstamos');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Ocupación', 'Reportes de Ocupación');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Reportes', 'Reportes Generales');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Usuarios', 'Gestión de Usuarios');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Notificaciones', 'Notificaciones del Sistema');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Chat', 'Chat Interno');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Ajustes', 'Ajustes del Sistema');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Recursos', 'Gestión de Recursos');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Mensajería', 'Sistema de Mensajería');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Cronograma', 'Cronograma de Actividades');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Apertura y Cierre', 'Control de Apertura y Cierre');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Estado de Recursos', 'Estado de los Recursos');

-- Componentes (Mapeos Adicionales / Específicos)
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Centro Institucional', 'Centro Institucional');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Centro de Horarios', 'Centro de Horarios');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Préstamos de Espacios', 'Préstamos de Espacios');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Periodos Académicos', 'Periodos Académicos');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Asistentes Virtuales', 'Asistentes Virtuales');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Reportes Generales', 'Reportes Generales');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Gestión de Usuarios', 'Gestión de Usuarios Completa');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Asignación Automática', 'Asignación Automática de Espacios');

-- Componentes (Supervisor)
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Dashboard Supervisor', 'Dashboard para Supervisor');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Disponibilidad de Espacios', 'Consulta de Disponibilidad');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Apertura y Cierre de Salones', 'Control de Salones');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Asistentes Virtuales Supervisor', 'Asistente Virtual para Supervisor');

-- Componentes (Docente)
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Dashboard Docente', 'Dashboard para Docente');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Mi Horario', 'Horario del Docente');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Préstamos Docente', 'Préstamos para Docente');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Asistentes Virtuales Docente', 'Asistente Virtual para Docente');

-- Componentes (Estudiante)
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Dashboard Estudiante', 'Dashboard para Estudiante');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Mi Horario Estudiante', 'Horario del Estudiante');
INSERT INTO componentes_componente (nombre, descripcion) VALUES ('Asistentes Virtuales Estudiante', 'Asistente Virtual para Estudiante');

-- Asignación de Componentes a Roles (Ejemplos básicos, ajustar IDs según inserción real)
-- Se asume que los IDs se generan secuencialmente. En un script real, se deberían buscar los IDs.

-- Admin tiene acceso a todo lo de Admin
-- Supervisor tiene acceso a sus componentes
-- Docente tiene acceso a sus componentes
-- Estudiante tiene acceso a sus componentes
