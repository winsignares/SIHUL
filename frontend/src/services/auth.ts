import type { Usuario } from '../models';
import { db } from '../hooks/database';

export const AuthService = {
  login(email: string, password: string): { success: boolean; usuario?: Usuario; error?: string } {
    // Buscar usuario en la base de datos real
    const usuarios = db.getUsuarios();
    console.log('AuthService - Usuarios en BD:', usuarios.length, 'usuarios encontrados');
    console.log('Buscando email:', email);
    const usuario = usuarios.find(u => u.email === email && u.password === password);
    console.log('Usuario encontrado:', usuario ? `Sí, rol: ${usuario.rol}` : 'No');
    if (usuario) {
      return { success: true, usuario };
    }
    return { success: false, error: 'Credenciales incorrectas' };
  },

  changePassword(usuarioId: string, currentPassword: string, newPassword: string): { success: boolean; error?: string } {
    // Simulación de cambio de contraseña
    const usuarios = db.getUsuarios();
    const usuario = usuarios.find(u => u.id === usuarioId);

    if (!usuario) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    if (usuario.password !== currentPassword) {
      return { success: false, error: 'La contraseña actual es incorrecta' };
    }

    // En una implementación real, aquí se actualizaría la contraseña en la BD
    // db.updateUsuario(usuarioId, { password: newPassword });
    console.log(`Contraseña cambiada para usuario ${usuarioId}`);

    return { success: true };
  },

  hasPermission(usuario: Usuario, componenteId: string, requiredPermission: 'ver' | 'editar' = 'ver'): boolean {
    // Simulación de permisos
    return true;
  },

  hasAccessToProgram(usuario: Usuario, programaId: string): boolean {
    // Simulación de acceso a programas
    return usuario.accesoTodosProgramas || (usuario.programasRestringidos?.includes(programaId) ?? false);
  }
};
