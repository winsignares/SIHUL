import {
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { formatMoney } from './auxiliares';
import type { useEnviarFactura } from '../../../hooks/financiero/proveedor/useEnviarFactura';

interface Props {
  hook: ReturnType<typeof useEnviarFactura>;
}

/** Paso 4 de Enviar Factura: confirmar. */
export function PasoConfirmar({ hook }: Props) {
  const {
    isCorreccion,
    proveedorSeleccionado,
    departamentos,
    docs,
    form,
    serviceItemsCalculated,
    invoiceTotals,
  } = hook;

  return (
  <div className="space-y-6">
    <h4 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
      <CheckCircle2 size={20} className="text-orange-600" />
      Confirmar y Enviar
    </h4>

    <div className="space-y-4">
      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl space-y-3">
        <h5 className="font-semibold text-slate-800 dark:text-white text-sm">Proveedor</h5>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-slate-500 dark:text-slate-400">Razón Social:</span> <span className="font-medium text-slate-800 dark:text-white">{proveedorSeleccionado?.razon_social}</span></div>
          <div><span className="text-slate-500 dark:text-slate-400">NIT:</span> <span className="font-medium text-slate-800 dark:text-white">{proveedorSeleccionado?.nit}</span></div>
        </div>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl space-y-3">
        <h5 className="font-semibold text-slate-800 dark:text-white text-sm">Factura</h5>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-slate-500 dark:text-slate-400">Tipo:</span> <span className="font-medium text-slate-800 dark:text-white">{form.tipoDocumento}</span></div>
          <div><span className="text-slate-500 dark:text-slate-400">Fecha:</span> <span className="font-medium text-slate-800 dark:text-white">{form.fechaFactura}</span></div>
          <div><span className="text-slate-500 dark:text-slate-400">Área:</span> <span className="font-medium text-slate-800 dark:text-white">{departamentos.find(d => d.id === form.departamentoId)?.nombre || '-'}</span></div>
          <div><span className="text-slate-500 dark:text-slate-400">Documentos:</span> <span className="font-medium text-slate-800 dark:text-white">{docs.length} adjuntos</span></div>
        </div>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl space-y-2">
        <h5 className="font-semibold text-slate-800 dark:text-white text-sm">Descripción de la factura</h5>
        <p className="text-sm text-slate-700 dark:text-slate-200">{form.identificacionFactura}</p>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl space-y-3">
        <h5 className="font-semibold text-slate-800 dark:text-white text-sm">Detalle de servicios</h5>
        <div className="space-y-3">
          {serviceItemsCalculated.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <p className="font-semibold text-slate-800 dark:text-white">{item.servicio.trim() || 'Servicio sin nombre'}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <div className="rounded-xl bg-slate-100 dark:bg-slate-700 px-3 py-2 text-center min-w-[90px]">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Subtotal</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatMoney(item.subtotal)}</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-center min-w-[90px]">
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">IVA/INC {item.ivaPorcentaje}%</p>
                    <p className="text-sm font-bold text-amber-700 dark:text-amber-300">{formatMoney(item.valorIva)}</p>
                  </div>
                  <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-3 py-2 text-center min-w-[90px]">
                    <p className="text-xs text-red-700 dark:text-red-400 font-medium">Total</p>
                    <p className="text-sm font-bold text-red-800 dark:text-red-300">{formatMoney(item.total)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
        <h5 className="font-semibold text-orange-800 dark:text-orange-300 text-sm mb-2">Valores</h5>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Subtotal:</span>
            <span className="font-medium text-slate-800 dark:text-white">{formatMoney(invoiceTotals.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">IVA:</span>
            <span className="font-medium text-slate-800 dark:text-white">{formatMoney(invoiceTotals.iva)}</span>
          </div>
          <div className="flex justify-between border-t border-orange-200 dark:border-orange-700 pt-1 mt-1">
            <span className="font-bold text-slate-800 dark:text-white">Total:</span>
            <span className="font-bold text-orange-700 dark:text-orange-400 text-lg">{formatMoney(invoiceTotals.total)}</span>
          </div>
        </div>
      </div>

      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
        <AlertCircle size={14} className="inline mr-1" />
        {isCorreccion
          ? 'Al enviar la corrección, la factura vuelve a estado Recibida y se reanuda el proceso.'
          : 'Al enviar, tu factura quedará en estado Recibida y será procesada por el área de cuentas por pagar.'}
      </div>
    </div>
  </div>
  );
}
