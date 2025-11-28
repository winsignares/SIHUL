const API_BASE_URL = 'http://localhost:8000';

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
