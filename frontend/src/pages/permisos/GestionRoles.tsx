import React, { useState } from 'react';
import { useGestionRoles } from '../../hooks/permisos/useGestionRoles';
import type { Rol } from '../../services/users/authService';
import { Search, Edit, Trash2, ChevronLeft, ChevronRight, Plus, Shield } from 'lucide-react';

export default function GestionRoles() {
  const {
    rolesPaginados,
    loading,
    error,
    paginaActual,
    totalPaginas,
    cambiarPagina,
    terminoBusqueda,
    setTerminoBusqueda,
    crearRol,
    actualizarRol,
    eliminarRol,
  } = useGestionRoles();

  const [mostrarModal, setMostrarModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [rolEdicion, setRolEdicion] = useState<Rol | null>(null);
  const [nombreRol, setNombreRol] = useState('');
  const [descripcionRol, setDescripcionRol] = useState('');

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setRolEdicion(null);
    setNombreRol('');
    setDescripcionRol('');
    setMostrarModal(true);
  };

  const abrirModalEditar = (rol: Rol) => {
    setModoEdicion(true);
    setRolEdicion(rol);
    setNombreRol(rol.nombre);
    setDescripcionRol(rol.descripcion);
    setMostrarModal(true);
  };

  const handleGuardar = async () => {
    if (!nombreRol.trim()) {
      alert('El nombre del rol es obligatorio');
      return;
    }
    try {
      if (modoEdicion && rolEdicion) {
        await actualizarRol({ id: rolEdicion.id, nombre: nombreRol, descripcion: descripcionRol });
      } else {
        await crearRol({ nombre: nombreRol, descripcion: descripcionRol });
      }
      setMostrarModal(false);
    } catch (err) {
      console.error('Error al guardar rol:', err);
    }
  };

  const handleEliminar = async (rol: Rol) => {
    if (!confirm(`¿Está seguro de eliminar el rol "${rol.nombre}"?`)) return;
    try {
      await eliminarRol(rol.id);
    } catch (err) {
      console.error('Error al eliminar rol:', err);
    }
  };

  if (loading && rolesPaginados.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-red-600" />
            Gestión de Roles
          </h1>
          <p className="text-gray-600">Administra los roles del sistema y sus descripciones</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar roles..."
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={abrirModalCrear}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Rol
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Descripción</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rolesPaginados.map((rol) => (
                  <tr key={rol.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-800">{rol.nombre}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600 text-sm">{rol.descripcion}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => abrirModalEditar(rol)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar rol"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEliminar(rol)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar rol"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {rolesPaginados.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      {terminoBusqueda ? 'No se encontraron roles que coincidan con la búsqueda' : 'No hay roles registrados'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">Página {paginaActual} de {totalPaginas}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => cambiarPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => cambiarPagina(p)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      p === paginaActual ? 'bg-red-600 text-white' : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => cambiarPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {mostrarModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border-2 border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {modoEdicion ? 'Editar Rol' : 'Nuevo Rol'}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Rol *
                  </label>
                  <input
                    type="text"
                    value={nombreRol}
                    onChange={(e) => setNombreRol(e.target.value)}
                    placeholder="Ej: Administrador, Supervisor, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={descripcionRol}
                    onChange={(e) => setDescripcionRol(e.target.value)}
                    placeholder="Describe las responsabilidades de este rol..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setMostrarModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardar}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
