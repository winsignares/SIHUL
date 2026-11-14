import { AlertCircle, Eye, FileText, Search, XCircle } from 'lucide-react';
import { displayDate, displayText } from '../../../../../components/ui/field-placeholders';
import { Pagination } from '../../../../../components/common/Pagination';
import { ITEMS_PER_PAGE } from '../../../hooks/funcionario/misPendientesFuncionarioUtils';
import type { useMisPendientesFuncionario } from '../../../hooks/funcionario/useMisPendientesFuncionario';

type Gestion = ReturnType<typeof useMisPendientesFuncionario>;

/** Facturas pendientes de registro con su paginación. */
export function TablaMisPendientes({ navigate, loading, loadError, setOpenDetail, setSelectedId, searchTerm, setSearchTerm, orderBy, setOrderBy, currentPage, setCurrentPage, filteredRows, totalPages, paginatedRows, riskDotClass, abrirRechazo }: Pick<Gestion, 'navigate' | 'loading' | 'loadError' | 'setOpenDetail' | 'setSelectedId' | 'searchTerm' | 'setSearchTerm' | 'orderBy' | 'setOrderBy' | 'currentPage' | 'setCurrentPage' | 'filteredRows' | 'totalPages' | 'paginatedRows' | 'riskDotClass' | 'abrirRechazo'>) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 overflow-x-auto">
      {loadError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {loadError}
        </div>
      )}
      <h3 className="text-xl font-semibold text-slate-800 mb-1">Facturas Pendientes de Registro</h3>
      <p className="text-slate-500 mb-5">Ordenadas de la factura más antigua a la más reciente para priorizar el registro.</p>

      <div className="mb-5 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por proveedor, NIT, factura o descripción"
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
          />
        </div>
        <select
          value={orderBy}
          onChange={(event) => setOrderBy(event.target.value as 'oldest' | 'newest')}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
        >
          <option value="oldest">Más antigua primero</option>
          <option value="newest">Más reciente primero</option>
        </select>
      </div>

      <table className="w-full min-w-[920px] text-sm">
        <thead>
          <tr className="bg-slate-50 border border-slate-200">
            <th className="py-3 px-3 text-left">SLA</th>
            <th className="py-3 px-3 text-left">Factura</th>
            <th className="py-3 px-3 text-left">Proveedor</th>
            <th className="py-3 px-3 text-left">Tipo</th>
            <th className="py-3 px-3 text-left">Monto</th>
            <th className="py-3 px-3 text-left">Recepción</th>
            <th className="py-3 px-3 text-left">Dias</th>
            <th className="py-3 px-3 text-left">Estado</th>
            <th className="py-3 px-3 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td className="p-4 text-slate-500" colSpan={9}>Cargando pendientes...</td>
            </tr>
          ) : filteredRows.length === 0 ? (
            <tr>
              <td className="p-4 text-slate-500" colSpan={9}>No hay pendientes que coincidan con la búsqueda.</td>
            </tr>
          ) : paginatedRows.map((row) => (
            <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${riskDotClass(row.nivelRiesgo)}`} />
                  {row.nivelRiesgo === 'vencido' && <AlertCircle className="w-4 h-4 text-red-700" />}
                </div>
              </td>
              <td className="p-3 text-slate-700 font-mono">{row.numeroFactura || `PEND-${row.id}`}</td>
              <td className="p-3 text-slate-700">
                <div className="font-medium text-slate-800">{row.proveedor}</div>
                <div className="text-xs text-slate-500 font-mono">NIT: {displayText(row.nit)}</div>
              </td>
              <td className="p-3 text-slate-700">{displayText(row.tipoDocumento)}</td>
              <td className="p-3 font-semibold text-slate-800">${row.valorTotal.toLocaleString('es-CO')}</td>
              <td className="p-3 text-slate-700">{displayDate(row.fechaRecepcion)}</td>
              <td className="p-3 font-semibold">
                <span className={row.nivelRiesgo === 'vencido' ? 'text-red-700' : row.nivelRiesgo === 'amarillo' ? 'text-yellow-700' : 'text-green-700'}>
                  {row.dias}d / {row.slaMax}d
                </span>
              </td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded-full text-xs border ${row.nivelRiesgo === 'vencido' ? 'bg-red-100 text-red-800 border-red-300' : row.nivelRiesgo === 'amarillo' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'bg-green-100 text-green-800 border-green-300'}`}>
                  {row.accion}
                </span>
              </td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigate('/financiero/funcionario/registrar', {
                        state: {
                          prefillFromPendiente: {
                            facturaId: Number(row.id),
                            snapshot: {
                              numeroFactura: row.numeroFactura,
                              proveedorId: row.proveedorId,
                              proveedorNombre: row.proveedor,
                              nit: row.nit,
                              tipoDocumento: row.tipoDocumento,
                              valorTotal: row.valorTotal,
                              fechaFactura: row.fechaFactura,
                              fechaRecepcion: row.fechaRecepcion,
                              departamentoId: row.departamentoId,
                              departamentoNombre: row.departamentoNombre,
                              observaciones: row.observaciones,
                            },
                          },
                        },
                      });
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    title="Registrar factura"
                    aria-label="Registrar factura"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => abrirRechazo(row)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                    title="Rechazar factura"
                    aria-label="Rechazar factura"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedId(row.id);
                      setOpenDetail(true);
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
                    title="Ver detalle"
                    aria-label="Ver detalle"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!loading && filteredRows.length > 0 && (
        <div className="mt-5">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={filteredRows.length}
          />
        </div>
      )}
    </div>
  );
}
