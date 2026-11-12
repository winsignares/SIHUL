import { motion } from 'framer-motion';
import { Calendar, XCircle } from 'lucide-react';
import { safeString, ReadonlyServiciosFactura } from './auxiliares';
import type { useRegistrarFactura } from '../../hooks/funcionario/useRegistrarFactura';

interface Props {
  hook: ReturnType<typeof useRegistrarFactura>;
}

/** Paso 1 de Registrar Factura: información general. */
export function PasoInformacionGeneral({ hook }: Props) {
  const {
    prefillFromPendiente,
    showLegacyBlocks,
    isReviewMode,
    catalogLoading,
    prefillLoading,
    numeroFacturaSugerido,
    proveedores,
    departamentos,
    facturaItems,
    identificacionFactura,
    form,
    setField,
    openRejectDialog,
    nextStep,
  } = hook;

  return (
  <motion.div
    key="step-1"
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.95 }}
    transition={{ duration: 0.4, ease: 'easeInOut' }}
    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8"
  >
  <div className="relative mb-8 pr-32">
    <h2 className="text-4xl font-bold text-slate-900">Información General</h2>
    <p className="max-w-xl text-slate-500 mt-2">Revise los datos enviados por el proveedor.</p>
    {prefillFromPendiente && (
      <button
        type="button"
        onClick={openRejectDialog}
        className="absolute right-0 top-0 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
      >
        <XCircle className="h-4 w-4" />
        Rechazar
      </button>
    )}
  </div>

  <div className="space-y-6">
    {/* Selección de Proveedor */}
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-slate-50 rounded-xl p-5 border border-slate-200"
    >
      <label className="block text-sm font-bold text-slate-800 mb-2">Seleccionar Proveedor *</label>
      <select
        className="w-full border-2 border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all bg-white text-slate-900 font-medium"
        value={form.proveedorId}
        onChange={(e) => setField('proveedorId', Number(e.target.value))}
        disabled={isReviewMode || catalogLoading || proveedores.length === 0}
      >
        <option value={0}>-- Seleccione un proveedor --</option>
        {proveedores.map((p) => (
          <option key={p.id} value={p.id}>{p.razon_social}</option>
        ))}
      </select>
      <p className="text-xs text-slate-600 mt-2">
        {prefillFromPendiente
          ? 'Proveedor bloqueado: corresponde a la solicitud pendiente seleccionada.'
          : catalogLoading
          ? 'Cargando proveedores...'
          : proveedores.length === 0
            ? 'No hay proveedores disponibles. Cree proveedores en el modulo Admin Financiero.'
            : 'Si el proveedor no existe, contacte al Administrador Financiero'}
      </p>
    </motion.div>

    {/* Datos del Proveedor */}
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <div>
        <label htmlFor="proveedor-nombre" className="block text-sm font-semibold text-slate-700 mb-2">Nombre del Proveedor</label>
        <input 
          id="proveedor-nombre"
          aria-label="Nombre del proveedor"
          className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 bg-slate-50 text-slate-600 font-medium"
          value={form.proveedorNombre} 
          readOnly 
          placeholder="Auto-completado"
        />
      </div>
      <div>
        <label htmlFor="proveedor-nit" className="block text-sm font-semibold text-slate-700 mb-2">NIT</label>
        <input 
          id="proveedor-nit"
          aria-label="NIT del proveedor"
          className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 bg-slate-50 text-slate-600 font-medium"
          value={form.nit} 
          readOnly 
          placeholder="Auto-completado"
        />
      </div>
    </motion.div>

    {/* Datos de la Factura */}
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-slate-50 rounded-xl p-5 border border-slate-200"
    >
      <p className="text-sm font-bold text-slate-800 mb-4">Datos de la Factura *</p>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label htmlFor="numero-factura" className="block text-xs font-semibold text-slate-700 mb-2">Número de Factura</label>
          <input 
            className="w-full border-2 border-slate-200 rounded-lg px-4 py-2.5 bg-white text-slate-700"
            value={numeroFacturaSugerido || 'Cargando consecutivo...'}
            readOnly
          />
        </div>
        <div>
          <label htmlFor="tipo-documento" className="block text-xs font-semibold text-slate-700 mb-2">Tipo de Documento</label>
          <select 
            className="w-full border-2 border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
            value={form.tipoDocumento} 
            onChange={(e) => setField('tipoDocumento', e.target.value)}
            disabled={isReviewMode}
          >
            <option value="Factura">Factura</option>
            <option value="Cuenta de Cobro">Cuenta de Cobro</option>
          </select>
        </div>
        <div>
          <label htmlFor="subtotal" className="block text-xs font-semibold text-slate-700 mb-2">Subtotal</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold">$</span>
            <input 
              id="subtotal"
              aria-label="Subtotal"
              type="number" 
              className="w-full border-2 border-slate-200 rounded-lg pl-8 pr-4 py-2.5 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
              value={form.valorSubtotal || ''} 
              onChange={(e) => setField('valorSubtotal', Number(e.target.value || 0))} 
              readOnly={isReviewMode}
              placeholder="0"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Tasa</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold">$</span>
            <input
              id="iva"
              aria-label="IVA"
              type="number"
              className="w-full border-2 border-slate-200 rounded-lg pl-8 pr-4 py-2.5 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
              value={form.valorIva || ''}
              onChange={(e) => setField('valorIva', Number(e.target.value || 0))}
              readOnly={isReviewMode}
              placeholder="0"
            />
          </div>
        </div>
        <div>
          <label htmlFor="valor-total" className="block text-xs font-semibold text-slate-700 mb-2">Valor Total</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold">$</span>
            <input
              id="valor-total"
              aria-label="Valor total"
              type="number"
              className="w-full border-2 border-slate-200 rounded-lg pl-8 pr-4 py-2.5 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
              value={form.valorTotal || ''}
              onChange={(e) => setField('valorTotal', Number(e.target.value || 0))}
              readOnly={isReviewMode}
              placeholder="0"
            />
          </div>
        </div>
      </div>
    </motion.div>

    {/* Fechas Importantes */}
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.25 }}
      className="bg-slate-50 rounded-xl p-5 border border-slate-200"
    >
      <p className="text-sm font-bold text-slate-800 mb-4">Fechas Clave *</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="fecha-emision" className="block text-xs font-semibold text-slate-700 mb-2">Fecha de Emisión (Factura)</label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              id="fecha-emision"
              aria-label="Fecha de emisión"
              type="date" 
              className="w-full border-2 border-slate-200 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
              value={form.fechaFactura} 
              onChange={(e) => setField('fechaFactura', e.target.value)}
              disabled={isReviewMode}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">Fecha que aparece en la factura</p>
        </div>
        <div>
          <label htmlFor="fecha-recepcion" className="block text-xs font-semibold text-slate-700 mb-2">Fecha de Recepción en la Universidad</label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-red-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              id="fecha-recepcion"
              aria-label="Fecha de recepción"
              type="date" 
              className="w-full border-2 border-red-400 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-semibold"
              value={form.fechaRecepcion} 
              onChange={(e) => setField('fechaRecepcion', e.target.value)}
              disabled={isReviewMode}
            />
          </div>
          <p className="text-xs text-red-600 font-semibold mt-1">
            ⚠ Desde esta fecha inician los 17 días hábiles del SLA del proceso completo.
          </p>
        </div>
      </div>
    </motion.div>

    {/* Área y Descripción */}
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      <div>
        <label htmlFor="area-solicitante" className="block text-sm font-semibold text-slate-700 mb-2">Área Solicitante *</label>
        <select 
          id="area-solicitante"
          aria-label="Seleccionar área solicitante"
          className="w-full border-2 border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
          value={form.departamentoId} 
          onChange={(e) => setField('departamentoId', Number(e.target.value))}
          disabled={catalogLoading || departamentos.length === 0}
        >
          <option value={0}>Seleccione un área</option>
          {departamentos.map((d) => (
            <option key={d.id} value={d.id}>{d.nombre}</option>
          ))}
        </select>
        {!catalogLoading && departamentos.length === 0 && (
          <p className="text-xs text-red-600 mt-2">No hay áreas o departamentos disponibles para asignar.</p>
        )}
      </div>

      {isReviewMode && (
        <>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Descripción de la factura</label>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Dato enviado por el proveedor</p>
              <p className="mt-1 whitespace-pre-line text-sm font-medium text-amber-900">
                {safeString(identificacionFactura || form.observaciones, 'Sin descripción cargada')}
              </p>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Descripción del servicio o bien</label>
            <ReadonlyServiciosFactura items={facturaItems} />
          </div>
        </>
      )}

      <div className={isReviewMode ? 'hidden' : ''}>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Observaciones Adicionales</label>
        <textarea 
          className="w-full border-2 border-slate-300 rounded-lg px-4 py-3 min-h-20 focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
          value={form.observaciones} 
          onChange={(e) => setField('observaciones', e.target.value)} 
          placeholder="Notas adicionales, contexto de recepción o alertas... (opcional)"
        />
      </div>
    </motion.div>

    {/* Botones de navegación */}
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="flex justify-between gap-3 pt-4 border-t-2 border-slate-200"
    >
      {showLegacyBlocks && prefillFromPendiente ? (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openRejectDialog}
          type="button"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-red-200 bg-red-50 text-red-700 font-semibold hover:bg-red-100 transition-all"
        >
          <XCircle className="h-4 w-4" />
          Rechazar factura
        </motion.button>
      ) : <span />}
      <motion.button 
        whileHover={{ scale: 1.02 }} 
        whileTap={{ scale: 0.98 }} 
        onClick={nextStep} 
        type="button" 
        disabled={prefillLoading}
        className="px-8 py-3 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold shadow-lg shadow-red-300 hover:shadow-lg hover:shadow-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Siguiente →
      </motion.button>
    </motion.div>
  </div>
  </motion.div>
  );
}
