const API_BASE_URL = 'http://localhost:8000';

// ========== Rol API ==========
async function createRol(nombre, descripcion) {
  const response = await fetch(`${API_BASE_URL}/usuarios/roles/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, descripcion })
  });
  return response.json();
}

async function updateRol(id, nombre, descripcion) {
  const response = await fetch(`${API_BASE_URL}/usuarios/roles/update/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, nombre, descripcion })
  });
  return response.json();
}

async function deleteRol(id) {
  const response = await fetch(`${API_BASE_URL}/usuarios/roles/delete/`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  return response.json();
}

async function getRol(id) {
  const response = await fetch(`${API_BASE_URL}/usuarios/roles/${id}/`, { method: 'GET' });
  return response.json();
}

async function listRoles() {
  const response = await fetch(`${API_BASE_URL}/usuarios/list/`, { method: 'GET' });
  return response.json();
}

// ========== Usuario API ==========
async function createUsuario(nombre, correo, contrasena, rol_id, activo = true) {
  const response = await fetch(`${API_BASE_URL}/usuarios/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, correo, contrasena, rol_id, activo })
  });
  return response.json();
}

async function updateUsuario(id, nombre, correo, contrasena, rol_id, activo) {
  const response = await fetch(`${API_BASE_URL}/usuarios/update/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, nombre, correo, contrasena, rol_id, activo })
  });
  return response.json();
}

async function deleteUsuario(id) {
  const response = await fetch(`${API_BASE_URL}/usuarios/delete/`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  return response.json();
}

async function getUsuario(id) {
  const response = await fetch(`${API_BASE_URL}/usuarios/${id}/`, { method: 'GET' });
  return response.json();
}

async function listUsuarios() {
  const response = await fetch(`${API_BASE_URL}/usuarios/list/`, { method: 'GET' });
  return response.json();
}

async function login(correo, contrasena) {
  const response = await fetch(`${API_BASE_URL}/usuarios/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, contrasena })
  });
  return response.json();
}

async function logout() {
  const response = await fetch(`${API_BASE_URL}/usuarios/logout/`, { method: 'POST' });
  return response.json();
}

async function changePassword(correo, old_contrasena, new_contrasena) {
  const response = await fetch(`${API_BASE_URL}/usuarios/change_password/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, old_contrasena, new_contrasena })
  });
  return response.json();
}

// ========== Sede API ==========
async function createSede(nombre, direccion, ciudad, activa = true) {
  const response = await fetch(`${API_BASE_URL}/sedes/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, direccion, ciudad, activa })
  });
  return response.json();
}

async function updateSede(id, nombre, direccion, ciudad, activa) {
  const response = await fetch(`${API_BASE_URL}/sedes/update/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, nombre, direccion, ciudad, activa })
  });
  return response.json();
}

async function deleteSede(id) {
  const response = await fetch(`${API_BASE_URL}/sedes/delete/`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  return response.json();
}

async function getSede(id) {
  const response = await fetch(`${API_BASE_URL}/sedes/${id}/`, { method: 'GET' });
  return response.json();
}

async function listSedes() {
  const response = await fetch(`${API_BASE_URL}/sedes/list/`, { method: 'GET' });
  return response.json();
}

// ========== Facultad API ==========
async function createFacultad(nombre, activa = true) {
  const response = await fetch(`${API_BASE_URL}/facultades/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, activa })
  });
  return response.json();
}

async function updateFacultad(id, nombre, activa) {
  const response = await fetch(`${API_BASE_URL}/facultades/update/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, nombre, activa })
  });
  return response.json();
}

async function deleteFacultad(id) {
  const response = await fetch(`${API_BASE_URL}/facultades/delete/`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  return response.json();
}

async function getFacultad(id) {
  const response = await fetch(`${API_BASE_URL}/facultades/${id}/`, { method: 'GET' });
  return response.json();
}

async function listFacultades() {
  const response = await fetch(`${API_BASE_URL}/facultades/list/`, { method: 'GET' });
  return response.json();
}

// ========== Programa API ==========
async function createPrograma(nombre, facultad_id, activo = true) {
  const response = await fetch(`${API_BASE_URL}/programas/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, facultad_id, activo })
  });
  return response.json();
}

async function updatePrograma(id, nombre, facultad_id, activo) {
  const response = await fetch(`${API_BASE_URL}/programas/update/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, nombre, facultad_id, activo })
  });
  return response.json();
}

async function deletePrograma(id) {
  const response = await fetch(`${API_BASE_URL}/programas/delete/`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  return response.json();
}

async function getPrograma(id) {
  const response = await fetch(`${API_BASE_URL}/programas/${id}/`, { method: 'GET' });
  return response.json();
}

async function listProgramas() {
  const response = await fetch(`${API_BASE_URL}/programas/list/`, { method: 'GET' });
  return response.json();
}

// ========== Periodo API ==========
async function createPeriodo(nombre, fecha_inicio, fecha_fin, activo = true) {
  const response = await fetch(`${API_BASE_URL}/periodos/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, fecha_inicio, fecha_fin, activo })
  });
  return response.json();
}

async function updatePeriodo(id, nombre, fecha_inicio, fecha_fin, activo) {
  const response = await fetch(`${API_BASE_URL}/periodos/update/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, nombre, fecha_inicio, fecha_fin, activo })
  });
  return response.json();
}

async function deletePeriodo(id) {
  const response = await fetch(`${API_BASE_URL}/periodos/delete/`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  return response.json();
}

async function getPeriodo(id) {
  const response = await fetch(`${API_BASE_URL}/periodos/${id}/`, { method: 'GET' });
  return response.json();
}

async function listPeriodos() {
  const response = await fetch(`${API_BASE_URL}/periodos/list/`, { method: 'GET' });
  return response.json();
}

// ========== Grupo API ==========
async function createGrupo(nombre, programa_id, periodo_id, semestre, activo = true) {
  const response = await fetch(`${API_BASE_URL}/grupos/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, programa_id, periodo_id, semestre, activo })
  });
  return response.json();
}

async function updateGrupo(id, nombre, programa_id, periodo_id, semestre, activo) {
  const response = await fetch(`${API_BASE_URL}/grupos/update/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, nombre, programa_id, periodo_id, semestre, activo })
  });
  return response.json();
}

async function deleteGrupo(id) {
  const response = await fetch(`${API_BASE_URL}/grupos/delete/`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  return response.json();
}

async function getGrupo(id) {
  const response = await fetch(`${API_BASE_URL}/grupos/${id}/`, { method: 'GET' });
  return response.json();
}

async function listGrupos() {
  const response = await fetch(`${API_BASE_URL}/grupos/list/`, { method: 'GET' });
  return response.json();
}

// ========== Asignatura API ==========
async function createAsignatura(nombre, codigo, creditos) {
  const response = await fetch(`${API_BASE_URL}/asignaturas/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, codigo, creditos })
  });
  return response.json();
}

async function updateAsignatura(id, nombre, codigo, creditos) {
  const response = await fetch(`${API_BASE_URL}/asignaturas/update/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, nombre, codigo, creditos })
  });
  return response.json();
}

async function deleteAsignatura(id) {
  const response = await fetch(`${API_BASE_URL}/asignaturas/delete/`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  return response.json();
}

async function getAsignatura(id) {
  const response = await fetch(`${API_BASE_URL}/asignaturas/${id}/`, { method: 'GET' });
  return response.json();
}

async function listAsignaturas() {
  const response = await fetch(`${API_BASE_URL}/asignaturas/list/`, { method: 'GET' });
  return response.json();
}

// ========== Espacio API ==========
async function createEspacio(sede_id, tipo, capacidad, ubicacion, recursos, disponible = true) {
  const response = await fetch(`${API_BASE_URL}/espacios/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sede_id, tipo, capacidad, ubicacion, recursos, disponible })
  });
  return response.json();
}

async function updateEspacio(id, sede_id, tipo, capacidad, ubicacion, recursos, disponible) {
  const response = await fetch(`${API_BASE_URL}/espacios/update/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, sede_id, tipo, capacidad, ubicacion, recursos, disponible })
  });
  return response.json();
}

async function deleteEspacio(id) {
  const response = await fetch(`${API_BASE_URL}/espacios/delete/`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  return response.json();
}

async function getEspacio(id) {
  const response = await fetch(`${API_BASE_URL}/espacios/${id}/`, { method: 'GET' });
  return response.json();
}

async function listEspacios() {
  const response = await fetch(`${API_BASE_URL}/espacios/list/`, { method: 'GET' });
  return response.json();
}

// ========== Recurso API ==========
async function createRecurso(nombre, descripcion) {
  const response = await fetch(`${API_BASE_URL}/recursos/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, descripcion })
  });
  return response.json();
}

async function updateRecurso(id, nombre, descripcion) {
  const response = await fetch(`${API_BASE_URL}/recursos/update/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, nombre, descripcion })
  });
  return response.json();
}

async function deleteRecurso(id) {
  const response = await fetch(`${API_BASE_URL}/recursos/delete/`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  return response.json();
}

async function getRecurso(id) {
  const response = await fetch(`${API_BASE_URL}/recursos/${id}/`, { method: 'GET' });
  return response.json();
}

async function listRecursos() {
  const response = await fetch(`${API_BASE_URL}/recursos/list/`, { method: 'GET' });
  return response.json();
}

// ========== EspacioRecurso API ==========
async function createEspacioRecurso(espacio_id, recurso_id, disponible = true) {
  const response = await fetch(`${API_BASE_URL}/recursos/espacio_recurso/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ espacio_id, recurso_id, disponible })
  });
  return response.json();
}

async function updateEspacioRecurso(espacio_id, recurso_id, disponible) {
  const response = await fetch(`${API_BASE_URL}/recursos/espacio_recurso/update/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ espacio_id, recurso_id, disponible })
  });
  return response.json();
}

async function deleteEspacioRecurso(espacio_id, recurso_id) {
  const response = await fetch(`${API_BASE_URL}/recursos/espacio_recurso/delete/`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ espacio_id, recurso_id })
  });
  return response.json();
}

async function getEspacioRecurso(espacio_id, recurso_id) {
  const response = await fetch(`${API_BASE_URL}/recursos/espacio_recurso/${espacio_id}/${recurso_id}/`, { method: 'GET' });
  return response.json();
}

async function listEspacioRecursos() {
  const response = await fetch(`${API_BASE_URL}/recursos/espacio_recurso/list/`, { method: 'GET' });
  return response.json();
}

// ========== Horario API ==========
async function createHorario(grupo_id, asignatura_id, espacio_id, dia_semana, hora_inicio, hora_fin, docente_id, cantidad_estudiantes) {
  const response = await fetch(`${API_BASE_URL}/horario/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grupo_id, asignatura_id, espacio_id, dia_semana, hora_inicio, hora_fin, docente_id, cantidad_estudiantes })
  });
  return response.json();
}

async function updateHorario(id, grupo_id, asignatura_id, espacio_id, dia_semana, hora_inicio, hora_fin, docente_id, cantidad_estudiantes) {
  const response = await fetch(`${API_BASE_URL}/horario/update/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, grupo_id, asignatura_id, espacio_id, dia_semana, hora_inicio, hora_fin, docente_id, cantidad_estudiantes })
  });
  return response.json();
}

async function deleteHorario(id) {
  const response = await fetch(`${API_BASE_URL}/horario/delete/`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  return response.json();
}

async function getHorario(id) {
  const response = await fetch(`${API_BASE_URL}/horario/${id}/`, { method: 'GET' });
  return response.json();
}

async function listHorarios() {
  const response = await fetch(`${API_BASE_URL}/horario/list/`, { method: 'GET' });
  return response.json();
}

// ========== HorarioFusionado API ==========
async function createHorarioFusionado(grupo1_id, grupo2_id, grupo3_id, asignatura_id, espacio_id, dia_semana, hora_inicio, hora_fin, docente_id, cantidad_estudiantes, comentario) {
  const response = await fetch(`${API_BASE_URL}/horario/horario_fusionado/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grupo1_id, grupo2_id, grupo3_id, asignatura_id, espacio_id, dia_semana, hora_inicio, hora_fin, docente_id, cantidad_estudiantes, comentario })
  });
  return response.json();
}

async function updateHorarioFusionado(id, grupo1_id, grupo2_id, grupo3_id, asignatura_id, espacio_id, dia_semana, hora_inicio, hora_fin, docente_id, cantidad_estudiantes, comentario) {
  const response = await fetch(`${API_BASE_URL}/horario/horario_fusionado/update/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, grupo1_id, grupo2_id, grupo3_id, asignatura_id, espacio_id, dia_semana, hora_inicio, hora_fin, docente_id, cantidad_estudiantes, comentario })
  });
  return response.json();
}

async function deleteHorarioFusionado(id) {
  const response = await fetch(`${API_BASE_URL}/horario/horario_fusionado/delete/`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  return response.json();
}

async function getHorarioFusionado(id) {
  const response = await fetch(`${API_BASE_URL}/horario/horario_fusionado/${id}/`, { method: 'GET' });
  return response.json();
}

async function listHorariosFusionados() {
  const response = await fetch(`${API_BASE_URL}/horario/horario_fusionado/list/`, { method: 'GET' });
  return response.json();
}

// ========== Prestamo API ==========
async function createPrestamo(espacio_id, usuario_id, administrador_id, fecha, hora_inicio, hora_fin, motivo, estado = 'Pendiente') {
  const response = await fetch(`${API_BASE_URL}/prestamos/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ espacio_id, usuario_id, administrador_id, fecha, hora_inicio, hora_fin, motivo, estado })
  });
  return response.json();
}

async function updatePrestamo(id, espacio_id, usuario_id, administrador_id, fecha, hora_inicio, hora_fin, motivo, estado) {
  const response = await fetch(`${API_BASE_URL}/prestamos/update/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, espacio_id, usuario_id, administrador_id, fecha, hora_inicio, hora_fin, motivo, estado })
  });
  return response.json();
}

async function deletePrestamo(id) {
  const response = await fetch(`${API_BASE_URL}/prestamos/delete/`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  return response.json();
}

async function getPrestamo(id) {
  const response = await fetch(`${API_BASE_URL}/prestamos/${id}/`, { method: 'GET' });
  return response.json();
}

async function listPrestamos() {
  const response = await fetch(`${API_BASE_URL}/prestamos/list/`, { method: 'GET' });
  return response.json();
}