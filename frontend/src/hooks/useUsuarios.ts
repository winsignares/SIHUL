import { useState, useEffect } from 'react';
import { usuariosService } from '../services/usuarios/usuariosService';
import type { Usuario, CreateUsuarioDto, UpdateUsuarioDto } from '../models/usuario';

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsuarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usuariosService.getAll();
      setUsuarios(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const getUsuario = async (id: number): Promise<Usuario | null> => {
    setLoading(true);
    setError(null);
    try {
      const usuario = await usuariosService.getById(id);
      return usuario;
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuario');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createUsuario = async (data: CreateUsuarioDto): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const newUsuario = await usuariosService.create(data);
      setUsuarios((prev) => [...prev, newUsuario]);
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al crear usuario');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateUsuario = async (data: UpdateUsuarioDto): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const updatedUsuario = await usuariosService.update(data);
      setUsuarios((prev) =>
        prev.map((u) => (u.id === updatedUsuario.id ? updatedUsuario : u))
      );
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al actualizar usuario');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteUsuario = async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await usuariosService.delete(id);
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al eliminar usuario');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  return {
    usuarios,
    loading,
    error,
    fetchUsuarios,
    getUsuario,
    createUsuario,
    updateUsuario,
    deleteUsuario,
  };
}
