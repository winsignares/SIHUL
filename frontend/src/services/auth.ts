// ============================================
// SISTEMA DE AUTENTICACIÓN
// ============================================

import { db } from './database';
import type { Usuario } from '../models/users/user.model';

export interface LoginResult {
  success: boolean;
  usuario?: Usuario;
  error?: string;
}

export class AuthService {
  // Iniciar sesión
  static login(email: string, password: string): LoginResult {
    // Validar formato de email
    if (!email.endsWith('@unilibre.edu.co')) {
      return {
        success: false,
        error: 'El correo debe ser institucional (@unilibre.edu.co)'
      };
    }

    // Buscar usuario
    const usuario = db.getUsuarioByEmail(email);

    if (!usuario) {
      return {
        success: false,
        error: 'Usuario no encontrado'
      };
    }

    // Verificar si está activo
    if (!usuario.activo) {
      return {
        success: false,
        error: 'Usuario inactivo. Contacte al administrador'
      };
    }

    // Verificar contraseña
    if (usuario.password !== password) {
      return {
        success: false,
        error: 'Contraseña incorrecta'
      };
    }

    // Actualizar último acceso
    db.updateUsuario(usuario.id, {
      ultimoAcceso: new Date().toISOString()
    });

    // Guardar sesión
    db.setSesionActiva(usuario);

    return {
      success: true,
      usuario
    };
  }

  // Cerrar sesión
  static logout(): void {
    db.cerrarSesion();
  }

  // Obtener sesión activa
  static getSession(): Usuario | null {
    return db.getSesionActiva();
  }

  // Verificar si hay sesión activa
  static isAuthenticated(): boolean {
    return db.getSesionActiva() !== null;
  }

  // Cambiar contraseña
  static changePassword(usuarioId: string, oldPassword: string, newPassword: string): { success: boolean; error?: string } {
    const usuario = db.getUsuarios().find(u => u.id === usuarioId);

    if (!usuario) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    if (usuario.password !== oldPassword) {
      return { success: false, error: 'Contraseña actual incorrecta' };
    }

    db.updateUsuario(usuarioId, { password: newPassword });

    return { success: true };
  }

  // Verificar permisos
  static hasPermission(usuario: Usuario, componenteId: string, requiredPermission: 'ver' | 'editar' = 'ver'): boolean {
    // Admin tiene todos los permisos
    if (usuario.rol === 'admin') {
      return true;
    }

    const permiso = usuario.permisos.find(p => p.componenteId === componenteId);

    if (!permiso) {
      return false;
    }

    if (requiredPermission === 'ver') {
      return true; // Tiene el permiso
    }

    // Para editar, necesita específicamente permiso de editar
    return permiso.permiso === 'editar';
  }

  // Verificar acceso a programa
  static hasAccessToProgram(usuario: Usuario, programaId: string): boolean {
    // Admin tiene acceso a todo
    if (usuario.rol === 'admin') {
      return true;
    }

    // Si no tiene restricciones, tiene acceso a todo
    if (usuario.programasRestringidos.length === 0) {
      return true;
    }

    // Verificar si el programa está en sus restricciones
    return usuario.programasRestringidos.includes(programaId);
  }
}
