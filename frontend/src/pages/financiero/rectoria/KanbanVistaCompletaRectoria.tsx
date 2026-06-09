import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, Calendar, ChevronLeft, ChevronRight, Eye, FileText, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../share/dialog';
import { Badge } from '../../../share/badge';
import { Button } from '../../../share/button';
import type { SharedFacturaDetail } from '../../../share/factura-detail-modal';
import type { KanbanEstadoRectoria } from '../../../hooks/financiero/rectoria/home/useRectoriaHome';
import { displayDate, displayText } from '../../../share/field-placeholders';
import { SlaIndicator } from '../../../share/sla-indicator';

interface KanbanVistaCompletaRectoriaProps {
  isOpen: boolean;
  kanbanEstados: KanbanEstadoRectoria[];
  onClose: () => void;
  onSelectFactura: (factura: SharedFacturaDetail) => void;
}

const ITEMS_POR_COLUMNA = 2;
const COLUMNAS_POR_VISTA = 4;

const estadoColor: Record<string, string> = {
  'Pendiente de autorizacion': 'from-amber-500 to-amber-600',
  'Autorizada por Rectoria': 'from-green-500 to-green-600',
  'Rechazada por Rectoria': 'from-red-500 to-red-600',
  'Pago aplicado': 'from-emerald-500 to-emerald-600',
  Pagada: 'from-teal-600 to-teal-700',
};

const parseFecha = (value?: string) => (value ? new Date(value).getTime() : Number.MAX_SAFE_INTEGER);

export default function KanbanVistaCompletaRectoria({
  isOpen,
  kanbanEstados,
  onClose,
  onSelectFactura,
}: KanbanVistaCompletaRectoriaProps) {
  const [paginasPorEstado, setPaginasPorEstado] = useState<Record<string, number>>({});
  const [paginaTablero, setPaginaTablero] = useState(1);
  const [ordenPorEstado, setOrdenPorEstado] = useState<Record<string, 'antiguos' | 'recientes'>>({});

  const estadosOrdenados = useMemo(() => {
    return kanbanEstados.map((estado) => {
      const ordenActual = ordenPorEstado[estado.estado] || 'antiguos';
      const facturasOrdenadas = [...estado.facturas].sort((a, b) => {
        const fechaA = parseFecha(a.fechaRecepcion || a.fechaFactura);
        const fechaB = parseFecha(b.fechaRecepcion || b.fechaFactura);
        return ordenActual === 'antiguos' ? fechaA - fechaB : fechaB - fechaA;
      });
      return { ...estado, facturas: facturasOrdenadas };
    });
  }, [kanbanEstados, ordenPorEstado]);

  const totalPaginasTablero = Math.max(1, Math.ceil(estadosOrdenados.length / COLUMNAS_POR_VISTA));

  const estadosVisibles = useMemo(() => {
    const inicio = (paginaTablero - 1) * COLUMNAS_POR_VISTA;
    return estadosOrdenados.slice(inicio, inicio + COLUMNAS_POR_VISTA);
  }, [estadosOrdenados, paginaTablero]);

  useEffect(() => {
    if (!isOpen) return;
    setPaginaTablero(1);
  }, [isOpen, kanbanEstados.length]);

  useEffect(() => {
    if (!isOpen) return;
    setPaginasPorEstado((prev) => {
      const next: Record<string, number> = { ...prev };
      estadosVisibles.forEach((estado) => {
        const totalPaginas = Math.max(1, Math.ceil(estado.facturas.length / ITEMS_POR_COLUMNA));
        next[estado.estado] = Math.min(prev[estado.estado] || 1, totalPaginas);
      });
      return next;
    });
  }, [estadosVisibles, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="h-[92vh] w-[96vw] max-w-[1680px] overflow-visible rounded-2xl border p-0 sm:max-w-[96vw]">
        <DialogHeader className="border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <DialogTitle className="flex items-center gap-2 pr-10 text-2xl text-slate-800">
              <FileText className="h-6 w-6 text-red-600" />
              Vista completa del tablero de autorizaciones
            </DialogTitle>
            <DialogDescription>
              Revisa pagos por etapa con prioridad a los mas antiguos y paginacion por columna para evitar saturar la vista.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-3 border-b border-slate-200 bg-white/80 px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <p>
              Mostrando columnas {(paginaTablero - 1) * COLUMNAS_POR_VISTA + 1} -
              {Math.min(paginaTablero * COLUMNAS_POR_VISTA, estadosOrdenados.length)} de {estadosOrdenados.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPaginaTablero((prev) => Math.max(1, prev - 1))}
                disabled={paginaTablero === 1}
                className="border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Columnas previas
              </Button>
              <Badge variant="outline">Pagina {paginaTablero} de {totalPaginasTablero}</Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPaginaTablero((prev) => Math.min(totalPaginasTablero, prev + 1))}
                disabled={paginaTablero === totalPaginasTablero}
                className="border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Columnas siguientes
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="h-[calc(92vh-160px)] overflow-x-auto overflow-y-hidden bg-slate-50 p-4 [scrollbar-gutter:stable_both-edges]">
          <div className="flex min-h-full w-max min-w-full items-start gap-4 pb-4">
            {estadosVisibles.map(({ estado, facturas }, colIndex) => {
              const totalMonto = facturas.reduce((sum, factura) => sum + factura.valorTotal, 0);
              const paginaActual = paginasPorEstado[estado] || 1;
              const totalPaginas = Math.max(1, Math.ceil(facturas.length / ITEMS_POR_COLUMNA));
              const inicio = (paginaActual - 1) * ITEMS_POR_COLUMNA;
              const facturasPaginadas = facturas.slice(inicio, inicio + ITEMS_POR_COLUMNA);
              const ordenActual = ordenPorEstado[estado] || 'antiguos';

              return (
                <motion.div
                  key={estado}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: colIndex * 0.04 }}
                  className="flex h-[calc(92vh-190px)] w-[340px] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className={`rounded-t-2xl bg-gradient-to-r p-4 text-white ${estadoColor[estado] || 'from-slate-500 to-slate-600'}`}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold leading-tight">{estado}</h3>
                        <p className="text-sm text-white/80">Total: ${totalMonto.toLocaleString('es-CO')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="border-white/30 bg-white/20 text-white">{facturas.length}</Badge>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8 rounded-full border border-white/40 bg-white/10 text-white hover:bg-white/20"
                          onClick={() =>
                            setPaginasPorEstado((prev) => ({
                              ...prev,
                              [estado]: paginaActual >= totalPaginas ? 1 : paginaActual + 1,
                            }))
                          }
                          title="Ver siguiente grupo"
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span className="sr-only">Cambiar grupo</span>
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8 rounded-full border border-white/40 bg-white/10 text-white hover:bg-white/20"
                          onClick={() =>
                            setOrdenPorEstado((prev) => ({
                              ...prev,
                              [estado]: ordenActual === 'antiguos' ? 'recientes' : 'antiguos',
                            }))
                          }
                          title={`Ordenar por ${ordenActual === 'antiguos' ? 'mas recientes' : 'mas antiguos'}`}
                        >
                          <ArrowUpDown className="h-4 w-4" />
                          <span className="sr-only">Cambiar orden</span>
                        </Button>
                      </div>
                    </div>
                    <p className="text-[11px] uppercase tracking-wide text-white/70">
                      Mostrando {ordenActual === 'antiguos' ? 'mas antiguos primero' : 'mas recientes primero'}
                    </p>
                  </div>

                  <div className="flex flex-1 flex-col p-3">
                    {facturas.length === 0 ? (
                      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500">
                        No hay pagos en esta etapa.
                      </div>
                    ) : (
                      <>
                        <div className="min-h-0 flex-1 space-y-3 overflow-hidden">
                          {facturasPaginadas.map((factura) => (
                            <div
                              key={`${estado}-${factura.numeroFactura}-${factura.facturaId || factura.numeroRadicado}`}
                              className="flex w-full flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-inner"
                            >
                              <div className="mb-2 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-[15px] font-bold text-slate-800">{displayText(factura.numeroFactura)}</p>
                                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{displayText(factura.proveedor)}</p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 rounded-full border-amber-200 text-amber-700 hover:bg-amber-50"
                                  onClick={() => onSelectFactura(factura)}
                                  title="Ver detalle"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">Ver detalle</span>
                                </Button>
                              </div>
                              <p className="text-xl font-semibold text-emerald-600">${factura.valorTotal.toLocaleString('es-CO')}</p>
                              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {displayDate(factura.fechaRecepcion || factura.fechaFactura)}
                                </span>
                                <Badge variant="outline" className="border-slate-300 text-slate-700">
                                  <SlaIndicator dias={factura.diasTranscurridos || 0} objetivo={factura.slaObjetivoDias ?? null} compact />
                                </Badge>
                              </div>
                              <p className="mt-2 truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                {displayText(factura.areaSolicitante)}
                              </p>
                            </div>
                          ))}
                        </div>

                        {totalPaginas > 1 && (
                          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-600">
                            <p className="flex items-center justify-between font-semibold">
                              <span>Grupo {paginaActual}/{totalPaginas}</span>
                              <span>
                                {inicio + 1} - {Math.min(inicio + ITEMS_POR_COLUMNA, facturas.length)} de {facturas.length}
                              </span>
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
