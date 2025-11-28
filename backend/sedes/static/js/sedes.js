const API_BASE_URL = 'http://localhost:8000';

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
