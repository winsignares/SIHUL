const API_BASE_URL = 'http://localhost:8000';

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
