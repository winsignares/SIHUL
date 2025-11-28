const API_BASE_URL = 'http://localhost:8000';

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
