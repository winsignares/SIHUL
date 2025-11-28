const API_BASE_URL = 'http://localhost:8000';

// ========== Asignatura API ==========
async function createAsignatura(nombre, codigo, creditos, tipo = 'presencial') {
  const response = await fetch(`${API_BASE_URL}/asignaturas/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, codigo, creditos, tipo })
  });
  return response.json();
}

async function updateAsignatura(id, nombre, codigo, creditos, tipo) {
  const response = await fetch(`${API_BASE_URL}/asignaturas/update/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, nombre, codigo, creditos, tipo })
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
