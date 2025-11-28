const API_BASE_URL = 'http://localhost:8000';

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
