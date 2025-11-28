const API_BASE_URL = 'http://localhost:8000';

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
