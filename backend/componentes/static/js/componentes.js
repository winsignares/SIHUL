const API_BASE_URL = 'http://localhost:8000';

// ========== Componente API ==========
async function createComponente(nombre, descripcion) {
  const response = await fetch(`${API_BASE_URL}/componentes/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, descripcion })
  });
  return response.json();
}

async function listComponentes() {
  const response = await fetch(`${API_BASE_URL}/componentes/list/`, { method: 'GET' });
  return response.json();
}

async function getComponente(id) {
  const response = await fetch(`${API_BASE_URL}/componentes/${id}/`, { method: 'GET' });
  return response.json();
}

async function updateComponente(id, nombre, descripcion) {
  const response = await fetch(`${API_BASE_URL}/componentes/update/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, nombre, descripcion })
  });
  return response.json();
}

async function deleteComponente(id) {
  const response = await fetch(`${API_BASE_URL}/componentes/delete/`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  return response.json();
}

// ========== ComponenteRol API ==========
async function createComponenteRol(componente_id, rol_id, permiso = 'ver') {
  const response = await fetch(`${API_BASE_URL}/componentes/rol/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ componente_id, rol_id, permiso })
  });
  return response.json();
}

async function listComponenteRoles() {
  const response = await fetch(`${API_BASE_URL}/componentes/rol/list/`, { method: 'GET' });
  return response.json();
}

async function getComponenteRol(id) {
  const response = await fetch(`${API_BASE_URL}/componentes/rol/${id}/`, { method: 'GET' });
  return response.json();
}

async function updateComponenteRol(id, permiso) {
  const response = await fetch(`${API_BASE_URL}/componentes/rol/update/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, permiso })
  });
  return response.json();
}

async function deleteComponenteRol(id) {
  const response = await fetch(`${API_BASE_URL}/componentes/rol/delete/`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  return response.json();
}

// ========== ComponenteUsuario API ==========
async function createComponenteUsuario(componente_id, usuario_id, permiso = 'ver') {
  const response = await fetch(`${API_BASE_URL}/componentes/usuario/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ componente_id, usuario_id, permiso })
  });
  return response.json();
}

async function listComponenteUsuarios() {
  const response = await fetch(`${API_BASE_URL}/componentes/usuario/list/`, { method: 'GET' });
  return response.json();
}

async function getComponenteUsuario(id) {
  const response = await fetch(`${API_BASE_URL}/componentes/usuario/${id}/`, { method: 'GET' });
  return response.json();
}

async function updateComponenteUsuario(id, permiso) {
  const response = await fetch(`${API_BASE_URL}/componentes/usuario/update/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, permiso })
  });
  return response.json();
}

async function deleteComponenteUsuario(id) {
  const response = await fetch(`${API_BASE_URL}/componentes/usuario/delete/`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  return response.json();
}
