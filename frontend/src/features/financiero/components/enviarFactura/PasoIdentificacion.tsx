import {
  AlertCircle,
  CheckCircle2,
  Building2,
  Search,
} from 'lucide-react';
import type { EnviarFacturaProps } from '../../models/proveedor';
import type { useEnviarFactura } from '../../hooks/proveedor/useEnviarFactura';

interface Props {
  hook: ReturnType<typeof useEnviarFactura>;
  miProveedor: EnviarFacturaProps['miProveedor'];
}

/** Paso 1 de Enviar Factura: identificación del proveedor. */
export function PasoIdentificacion({ hook, miProveedor }: Props) {
  const {
    nitBusqueda,
    setNitBusqueda,
    proveedorSeleccionado,
    setProveedorSeleccionado,
    buscandoProveedor,
    errBusqueda,
    handleBuscarProveedor,
  } = hook;

  return (
  <div className="space-y-6">
    <h4 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
      <Building2 size={20} className="text-orange-600" />
      Identificación del Proveedor
    </h4>

    {proveedorSeleccionado ? (
      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={20} className="text-green-600" />
          <span className="font-semibold text-green-800 dark:text-green-300">Proveedor identificado</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs">Razón Social</p>
            <p className="font-semibold text-slate-900 dark:text-white">{proveedorSeleccionado.razon_social}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs">NIT</p>
            <p className="font-semibold text-slate-900 dark:text-white">{proveedorSeleccionado.nit}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs">Tipo</p>
            <p className="font-medium text-slate-700 dark:text-slate-300">{proveedorSeleccionado.tipo_proveedor}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs">Estado</p>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${proveedorSeleccionado.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {proveedorSeleccionado.estado}
            </span>
          </div>
        </div>
        {!miProveedor && (
          <button onClick={() => setProveedorSeleccionado(null)} className="text-xs text-red-600 hover:underline">
            Cambiar proveedor
          </button>
        )}
      </div>
    ) : (
      <div className="space-y-4">
        <p className="text-slate-600 dark:text-slate-300 text-sm">
          No se encontró un proveedor vinculado automáticamente a tu cuenta. Ingresa tu NIT para buscarte en el sistema.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ingresa tu NIT (ej: 900123456-1)"
            value={nitBusqueda}
            onChange={e => setNitBusqueda(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleBuscarProveedor()}
            className="flex-1 px-4 py-3 border-2 border-slate-300 dark:border-slate-500 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none font-medium"
          />
          <button
            onClick={handleBuscarProveedor}
            disabled={buscandoProveedor || !nitBusqueda.trim()}
            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-700 hover:from-orange-700 hover:to-red-800 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-md hover:shadow-lg disabled:shadow-none"
          >
            <Search size={16} />
            {buscandoProveedor ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {errBusqueda && (
          <p className="text-red-600 text-sm flex items-center gap-1">
            <AlertCircle size={14} /> {errBusqueda}
          </p>
        )}
      </div>
    )}
  </div>
  );
}
