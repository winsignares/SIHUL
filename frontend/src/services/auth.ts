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

  hasPermission(usuario: Usuario, componenteId: string, requiredPermission: 'ver' | 'editar' = 'ver'): boolean {
    // Simulación de permisos
    return true;
  },

  hasAccessToProgram(usuario: Usuario, programaId: string): boolean {
    // Simulación de acceso a programas
    return usuario.accesoTodosProgramas || (usuario.programasRestringidos?.includes(programaId) ?? false);
  }
};
