import { motion } from 'framer-motion';
import { Download, Eye } from 'lucide-react';
import type { FuncionarioConsultaRow } from '../../../models/funcionario';
import { displayDate, displayRadicado } from '../../../../../components/ui/field-placeholders';
import { downloadDocumentosConsolidadosPdf } from '../../documentos-consolidados';
import { inferEtapaActual } from '../../../hooks/funcionario/consultarFacturasUtils';
import type { useConsultarFacturas } from '../../../hooks/funcionario/useConsultarFacturas';

type Gestion = ReturnType<typeof useConsultarFacturas>;

/** Resultados de la búsqueda con su paginación. */
export function TablaConsultarFacturas({ loading, setOpenDetail, setSelectedId, currentPage, setCurrentPage, itemsPerPage, filtered, totalPages, paginatedFiltered, estadoBadge, riskDot, diasBadge }: Pick<Gestion, 'loading' | 'setOpenDetail' | 'setSelectedId' | 'currentPage' | 'setCurrentPage' | 'itemsPerPage' | 'filtered' | 'totalPages' | 'paginatedFiltered' | 'estadoBadge' | 'riskDot' | 'diasBadge'>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
      className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-6 overflow-x-auto mt-6"
    >
      <div className="flex items-center justify-between mb-5 pb-4 border-b-2 border-slate-200">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Resultados de la búsqueda</h3>
          <p className="text-sm text-slate-500 mt-1">{filtered.length} factura(s) encontrada(s) - Página {currentPage} de {totalPages || 1}</p>
        </div>
      </div>

      <div className="min-w-[1300px]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-300">
              <th className="py-3 px-4 text-left text-xs font-bold text-slate-700 uppercase">Riesgo</th>
              <th className="py-3 px-4 text-left text-xs font-bold text-slate-700 uppercase">ID Trámite</th>
              <th className="py-3 px-4 text-left text-xs font-bold text-slate-700 uppercase">Proveedor</th>
              <th className="py-3 px-4 text-left text-xs font-bold text-slate-700 uppercase">Área</th>
              <th className="py-3 px-4 text-left text-xs font-bold text-slate-700 uppercase">Monto</th>
              <th className="py-3 px-4 text-left text-xs font-bold text-slate-700 uppercase">Estado</th>
              <th className="py-3 px-4 text-left text-xs font-bold text-slate-700 uppercase">Etapa</th>
              <th className="py-3 px-4 text-left text-xs font-bold text-slate-700 uppercase">N° Radicado</th>
              <th className="py-3 px-4 text-left text-xs font-bold text-slate-700 uppercase">Fecha</th>
              <th className="py-3 px-4 text-center text-xs font-bold text-slate-700 uppercase">Días</th>
              <th className="py-3 px-4 text-center text-xs font-bold text-slate-700 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4 text-slate-500 text-center" colSpan={11}>Cargando facturas...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="p-4 text-slate-500 text-center" colSpan={11}>No hay resultados con los filtros actuales.</td></tr>
            ) : paginatedFiltered.map((row: FuncionarioConsultaRow, idx: number) => (
              <motion.tr 
                key={row.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + idx * 0.05 }}
                className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <td className="p-4">
                  <motion.div 
                    className={`w-4 h-4 rounded-full ${riskDot(row.riesgo)}`}
                    whileHover={{ scale: 1.3 }}
                    title={row.riesgo}
                  />
                </td>
                <td className="p-4 font-bold text-slate-900">{row.idTramite}</td>
                <td className="p-4 text-slate-700 font-semibold">{row.proveedor}</td>
                <td className="p-4 text-slate-700">{row.area}</td>
                <td className="p-4 font-bold text-green-600">${row.monto.toLocaleString('es-CO')}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${estadoBadge(row.estado)}`}>
                    {row.estado}
                  </span>
                </td>
                <td className="p-4 text-slate-700 text-sm">{inferEtapaActual(row.estado) || row.etapa}</td>
                <td className="p-4">
                  {row.sinRadicado
                    ? <span className="text-slate-400 italic text-xs">{displayRadicado(row.numeroRadicado)}</span>
                    : <span className="text-slate-600 font-mono">{displayRadicado(row.numeroRadicado)}</span>
                  }
                </td>
                <td className="p-4 text-slate-700">{displayDate(row.fechaRecepcion)}</td>
                <td className="p-4 text-center">
                  <div className="inline-flex justify-center">
                    <div className={`w-14 h-14 rounded-full border flex flex-col items-center justify-center text-[11px] font-semibold tracking-tight ${diasBadge(row.dias)}`}>
                      <span className="text-base leading-none font-black">{row.dias}</span>
                      <span className="text-[9px] uppercase mt-0.5">{row.dias === 1 ? 'día' : 'días'}</span>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Descargar documentos adjuntos"
                      onClick={() => downloadDocumentosConsolidadosPdf(row.facturaId, row.idTramite, 'funcionario')}
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-emerald-50 border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-100 transition-all"
                    >
                      <Download className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Ver detalle"
                      onClick={() => {
                        setSelectedId(row.id);
                        setOpenDetail(true);
                      }}
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-50 border-2 border-red-300 text-red-600 hover:bg-red-100 transition-all"
                    >
                      <Eye className="w-4 h-4" />
                    </motion.button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Controles de Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
          <div className="text-sm text-slate-600">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filtered.length)} de {filtered.length} resultados
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage((prev: number) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
            >
              ← Anterior
            </motion.button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <motion.button
                    key={pageNum}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-medium transition-all ${
                      currentPage === pageNum
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </motion.button>
                );
              })}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage((prev: number) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
            >
              Siguiente →
            </motion.button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
