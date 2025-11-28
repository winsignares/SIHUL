const API_BASE_URL = 'http://localhost:8000';

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
