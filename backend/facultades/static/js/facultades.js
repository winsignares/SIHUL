const API_BASE_URL = 'http://localhost:8000';

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
