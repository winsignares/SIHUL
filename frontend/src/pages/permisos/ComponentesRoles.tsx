import React, { useState } from 'react';
import { useComponentesRoles } from '../../hooks/permisos/useComponentesRoles';
import type { ComponenteRol, Componente } from '../../services/componentes/componentesAPI';
import type { Rol } from '../../services/users/authService';
import { Search, Shield, ChevronLeft, ChevronRight } from 'lucide-react';

type PermisoType = 'VER' | 'EDITAR';

interface PermisoComponente {
  componente: Componente;
  asignacion?: ComponenteRol;
  seleccionado: boolean;
  permiso: PermisoType;
}

export default function ComponentesRoles() {
  const {
    componentes,
    rolesPaginados,
    loading,
    error,
    paginaActual,
    totalPaginas,
    cambiarPagina,
    terminoBusqueda,
    setTerminoBusqueda,
    obtenerAsignacionesPorRol,
    crearAsignacion,
    actualizarAsignacion,
    eliminarAsignacion
  } = useComponentesRoles();

  // Estados para modal de Permisos
  const [mostrarModalPermisos, setMostrarModalPermisos] = useState(false);
  const [rolPermisos, setRolPermisos] = useState<Rol | null>(null);
  const [permisosComponentes, setPermisosComponentes] = useState<PermisoComponente[]>([]);
  const [busquedaComponentes, setBusquedaComponentes] = useState('');

  /**
   * Abrir modal de gestión de permisos
   */
  const abrirModalPermisos = (rol: Rol) => {
    setRolPermisos(rol);
    const asignaciones = obtenerAsignacionesPorRol(rol.id);
    
    const permisos: PermisoComponente[] = componentes.map(componente => {
      const asignacion = asignaciones.find(a => a.componente_id === componente.id);
      return {
        componente,
        asignacion,
        seleccionado: !!asignacion,
        permiso: asignacion?.permiso || 'VER'
      };
    });
    
    setPermisosComponentes(permisos);
    setBusquedaComponentes('');
    setMostrarModalPermisos(true);
  };

  /**
   * Filtrar componentes por búsqueda
   */
  const componentesFiltrados = permisosComponentes.filter(permiso => {
    if (!busquedaComponentes.trim()) return true;
    const termino = busquedaComponentes.toLowerCase();
    return (
      permiso.componente.nombre.toLowerCase().includes(termino) ||
      (permiso.componente.descripcion && permiso.componente.descripcion.toLowerCase().includes(termino))
    );
  });

  /**
   * Toggle selección de componente
   */
  const toggleComponente = (index: number) => {
    const nuevosPermisos = [...permisosComponentes];
    nuevosPermisos[index].seleccionado = !nuevosPermisos[index].seleccionado;
    setPermisosComponentes(nuevosPermisos);
  };

  /**
   * Cambiar permiso de componente
   */
  const cambiarPermiso = (index: number, permiso: PermisoType) => {
    const nuevosPermisos = [...permisosComponentes];
    nuevosPermisos[index].permiso = permiso;
    setPermisosComponentes(nuevosPermisos);
  };

  /**
   * Guardar permisos del rol
   */
  const handleGuardarPermisos = async () => {
    if (!rolPermisos) return;

    try {
      // Procesar cada componente
      for (const permiso of permisosComponentes) {
        const { componente, asignacion, seleccionado, permiso: permisoTipo } = permiso;

        if (seleccionado && !asignacion) {
          // Crear nueva asignación
          await crearAsignacion({
            componente_id: componente.id!,
            rol_id: rolPermisos.id,
            permiso: permisoTipo
          });
        } else if (seleccionado && asignacion && asignacion.permiso !== permisoTipo) {
          // Actualizar permiso existente
          await actualizarAsignacion({
            id: asignacion.id!,
            permiso: permisoTipo
          });
        } else if (!seleccionado && asignacion) {
          // Eliminar asignación
          await eliminarAsignacion(asignacion.id!);
        }
      }

      setMostrarModalPermisos(false);
    } catch (err) {
      console.error('Error al guardar permisos:', err);
    }
  };

  if (loading && rolesPaginados.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-red-600" />
            Gestión de Componentes
          </h1>
          <p className="text-gray-600">
            Asigna componentes del sistema a cada rol y configura sus permisos de acceso
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Barra de búsqueda */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Búsqueda */}
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
        </div>

        {/* Tabla de Roles */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Nombre del Rol
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                    Componentes Asignados
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rolesPaginados.map((rol) => {
                  const numPermisos = obtenerAsignacionesPorRol(rol.id).length;
                  
                  return (
                    <tr key={rol.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-800">{rol.nombre}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600 text-sm">{rol.descripcion}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {numPermisos} {numPermisos === 1 ? 'componente' : 'componentes'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Botón Gestionar Permisos */}
                          <button
                            onClick={() => abrirModalPermisos(rol)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Gestionar componentes"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {rolesPaginados.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      {terminoBusqueda ? 'No se encontraron roles que coincidan con la búsqueda' : 'No hay roles registrados'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Página {paginaActual} de {totalPaginas}
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => cambiarPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                  <button
                    key={pagina}
                    onClick={() => cambiarPagina(pagina)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      pagina === paginaActual
                        ? 'bg-red-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pagina}
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

        {/* Modal: Gestionar Permisos */}
        {mostrarModalPermisos && rolPermisos && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col p-6 border-2 border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Permisos de "{rolPermisos.nombre}"
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Selecciona los componentes que puede acceder este rol y el tipo de permiso
              </p>

              {/* Búsqueda de componentes */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar componentes..."
                  value={busquedaComponentes}
                  onChange={(e) => setBusquedaComponentes(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Lista de componentes scrolleable */}
              <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-12">
                        <input
                          type="checkbox"
                          checked={componentesFiltrados.length > 0 && componentesFiltrados.every(p => p.seleccionado)}
                          onChange={(e) => {
                            const seleccionar = e.target.checked;
                            setPermisosComponentes(prev => 
                              prev.map(p => {
                                // Solo actualizar los componentes que están en la vista filtrada
                                const estaFiltrado = componentesFiltrados.some(cf => cf.componente.id === p.componente.id);
                                if (estaFiltrado) {
                                  return { ...p, seleccionado: seleccionar };
                                }
                                return p;
                              })
                            );
                          }}
                          className="w-4 h-4 text-red-600 rounded"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Componente
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                        Permiso
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {componentesFiltrados.map((permiso) => {
                      const index = permisosComponentes.findIndex(p => p.componente.id === permiso.componente.id);
                      
                      return (
                        <tr key={permiso.componente.id} className={permiso.seleccionado ? 'bg-blue-50' : ''}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={permiso.seleccionado}
                            onChange={() => toggleComponente(index)}
                            className="w-4 h-4 text-red-600 rounded"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-800">{permiso.componente.nombre}</p>
                            {permiso.componente.descripcion && (
                              <p className="text-xs text-gray-500">{permiso.componente.descripcion}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {permiso.seleccionado ? (
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => cambiarPermiso(index, 'VER')}
                                className={`px-3 py-1 text-xs font-medium rounded border transition-all ${
                                  permiso.permiso === 'VER'
                                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                                    : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                                }`}
                              >
                                VER
                              </button>
                              <button
                                onClick={() => cambiarPermiso(index, 'EDITAR')}
                                className={`px-3 py-1 text-xs font-medium rounded border transition-all ${
                                  permiso.permiso === 'EDITAR'
                                    ? 'bg-green-100 text-green-800 border-green-300'
                                    : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                                }`}
                              >
                                EDITAR
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                      </tr>
                      );
                    })}

                    {componentesFiltrados.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-gray-500 text-sm">
                          No se encontraron componentes que coincidan con la búsqueda
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Botones */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setMostrarModalPermisos(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardarPermisos}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Guardando...' : 'Guardar Permisos'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
