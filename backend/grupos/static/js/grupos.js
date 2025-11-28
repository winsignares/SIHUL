const API_BASE_URL = 'http://localhost:8000';

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
