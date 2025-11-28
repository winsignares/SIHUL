const API_BASE_URL = 'http://localhost:8000';

// ========== Rol API ==========
async function createRol(nombre, descripcion) {
  const response = await fetch(`${API_BASE_URL}/usuarios/roles/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, descripcion })
  });
  return response.json();
}

async function updateRol(id, nombre, descripcion) {
  const response = await fetch(`${API_BASE_URL}/usuarios/roles/update/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, nombre, descripcion })
  });
  return response.json();
}

async function deleteRol(id) {
  const response = await fetch(`${API_BASE_URL}/usuarios/roles/delete/`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  return response.json();
}

async function getRol(id) {
  const response = await fetch(`${API_BASE_URL}/usuarios/roles/${id}/`, { method: 'GET' });
  return response.json();
}

async function listRoles() {
  const response = await fetch(`${API_BASE_URL}/usuarios/list/`, { method: 'GET' });
  return response.json();
}

// ========== Usuario API ==========
async function createUsuario(nombre, correo, contrasena, rol_id, activo = true) {
  const response = await fetch(`${API_BASE_URL}/usuarios/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, correo, contrasena, rol_id, activo })
  });
  return response.json();
}

async function updateUsuario(id, nombre, correo, contrasena, rol_id, activo) {
  const response = await fetch(`${API_BASE_URL}/usuarios/update/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, nombre, correo, contrasena, rol_id, activo })
  });
  return response.json();
}

async function deleteUsuario(id) {
  const response = await fetch(`${API_BASE_URL}/usuarios/delete/`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  return response.json();
}

async function getUsuario(id) {
  const response = await fetch(`${API_BASE_URL}/usuarios/${id}/`, { method: 'GET' });
  return response.json();
}

async function listUsuarios() {
  const response = await fetch(`${API_BASE_URL}/usuarios/list/`, { method: 'GET' });
  return response.json();
}

async function login(correo, contrasena) {
  const response = await fetch(`${API_BASE_URL}/usuarios/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, contrasena })
  });
  return response.json();
}

async function logout() {
  const response = await fetch(`${API_BASE_URL}/usuarios/logout/`, { method: 'POST' });
  return response.json();
}

async function changePassword(correo, old_contrasena, new_contrasena) {
  const response = await fetch(`${API_BASE_URL}/usuarios/change_password/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, old_contrasena, new_contrasena })
  });
  return response.json();
}
