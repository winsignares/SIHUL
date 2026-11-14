import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { Textarea } from '../../../../components/ui/textarea';
import { safeString, formatMoney, ReadonlyServiciosFactura } from './auxiliares';
import type { useRegistrarFactura } from '../../hooks/funcionario/useRegistrarFactura';

interface Props {
  hook: ReturnType<typeof useRegistrarFactura>;
}

/** Paso 3 de Registrar Factura: confirmación. */
export function PasoConfirmacion({ hook }: Props) {
  const {
    loading,
    numeroFacturaSugerido,
    departamentos,
    docs,
    existingDocs,
    facturaItems,
    form,
    setField,
    prevStep,
    submit,
  } = hook;

  return (
  <motion.div
    key="step-3"
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.95 }}
    transition={{ duration: 0.4, ease: 'easeInOut' }}
    className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50"
  >
    <div className="mb-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-red-800 p-6 text-white shadow-lg">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-200">Paso final</p>
      <h2 className="mt-1 text-3xl font-bold">Confirmación del registro</h2>
      <p className="mt-2 text-sm text-slate-200">Revise los datos, los bienes o servicios y los documentos antes de registrar la factura.</p>
    </div>

    {/* Tarjeta de datos principales */}
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl bg-slate-50 border border-slate-200 p-6 mb-6"
    >
      <p className="font-bold text-slate-700 mb-4 text-lg border-b border-slate-300 pb-2">Información del Proveedor</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <p className="text-sm text-slate-600 font-semibold mb-1">Proveedor</p>
          <p className="text-lg font-bold text-slate-900">{safeString(form.proveedorNombre, 'No seleccionado')}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <p className="text-sm text-slate-600 font-semibold mb-1">NIT</p>
          <p className="text-lg font-bold text-slate-900 font-mono">{safeString(form.nit, 'No disponible')}</p>
        </div>
      </div>
    </motion.div>

    {/* Tarjeta de factura */}
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl bg-slate-50 border border-slate-200 p-6 mb-6"
    >
      <p className="font-bold text-slate-700 mb-4 text-lg border-b border-slate-300 pb-2">Datos de la Factura</p>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <p className="text-sm text-slate-600 font-semibold mb-1">Número</p>
          <p className="text-lg font-bold text-slate-900">{safeString(numeroFacturaSugerido, 'Cargando...')}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <p className="text-sm text-slate-600 font-semibold mb-1">Tipo</p>
          <p className="text-lg font-bold text-slate-900">{safeString(form.tipoDocumento, 'No especificado')}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <p className="text-sm text-slate-600 font-semibold mb-1">Subtotal</p>
          <p className="text-xl font-bold text-slate-800">{formatMoney(form.valorSubtotal)}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <p className="text-sm text-slate-600 font-semibold mb-1">Tasa</p>
          <p className="text-xl font-bold text-slate-800">{formatMoney(form.valorIva)}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <p className="text-sm text-slate-600 font-semibold mb-1">Valor Total</p>
          <p className="text-2xl font-bold text-slate-900">{formatMoney(form.valorTotal)}</p>
        </div>
      </div>
    </motion.div>

    {/* Tarjeta de fechas */}
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl bg-slate-50 border border-slate-200 p-6 mb-6"
    >
      <p className="font-bold text-slate-700 mb-4 text-lg border-b border-slate-300 pb-2">Fechas Importantes</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <p className="text-sm text-slate-600 font-semibold mb-1">Emisión de Factura</p>
          <p className="text-lg font-bold text-slate-900">{safeString(form.fechaFactura, 'Sin fecha')}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <p className="text-sm text-slate-600 font-semibold mb-1">Recepción en Universidad (SLA)</p>
          <p className="text-lg font-bold text-slate-900">{safeString(form.fechaRecepcion, 'Sin fecha')}</p>
        </div>
      </div>
    </motion.div>

    {/* Resumen adicional */}
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.25 }}
      className="rounded-2xl bg-slate-50 border-2 border-slate-300 p-6 mb-6"
    >
      <p className="font-bold text-slate-700 mb-4 text-lg border-b border-slate-300 pb-2">Información Adicional</p>
      <div className="space-y-3">
        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <p className="text-sm text-slate-600 font-semibold mb-1">Área Solicitante</p>
          <p className="text-slate-800 font-semibold">
            {departamentos?.length > 0 
              ? safeString(departamentos.find(d => d?.id === form.departamentoId)?.nombre, 'No seleccionada')
              : 'No seleccionada'}
          </p>
        </div>
        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <p className="text-sm text-slate-600 font-semibold mb-3">Descripción del servicio o bien</p>
          <ReadonlyServiciosFactura items={facturaItems} />
        </div>
        {form.observaciones && safeString(form.observaciones) !== 'Sin observaciones' && (
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-sm text-slate-600 font-semibold mb-1">Observaciones</p>
            <p className="text-slate-800 text-sm font-medium">{safeString(form.observaciones, 'Sin observaciones')}</p>
          </div>
        )}
      </div>
    </motion.div>

    {/* Sumario de documentos */}
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl bg-slate-50 border border-slate-200 p-6 mb-6"
    >
      <p className="font-bold text-slate-700 mb-4 text-lg border-b border-slate-300 pb-2">Documentos Verificados ({existingDocs.length + docs.length})</p>
      <div className="space-y-2">
        {existingDocs.map((d) => (
          <div
            key={`confirm-existing-${d.id}`}
            className="flex items-center gap-3 bg-white rounded-lg p-3 border border-slate-200"
          >
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-slate-300">✓</span>
            <div>
              <p className="font-semibold text-slate-900 text-sm">{d.tipo_documento}</p>
              <p className="text-xs text-slate-500 truncate">{d.nombre_archivo}</p>
            </div>
          </div>
        ))}

        {docs.map((d, idx) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 + idx * 0.05 }}
            className="flex items-center gap-3 bg-white rounded-lg p-3 border border-slate-200"
          >
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-slate-300">✓</span>
            <div>
              <p className="font-semibold text-slate-900 text-sm">{d.type}</p>
              <p className="text-xs text-slate-500 truncate">{d.file.name}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>

    {/* Observacion obligatoria del proceso */}
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.35 }}
      className="rounded-2xl bg-slate-50 border border-slate-200 p-6 mb-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-5 h-5 text-amber-600" />
        <p className="font-semibold text-slate-900 text-sm">Observacion del Proceso <span className="text-red-600">*</span></p>
      </div>
      <p className="font-semibold text-slate-900 text-sm mb-3">Registre una observacion sobre el proceso de verificacion y registro de esta factura. Este campo es obligatorio.</p>
      <Textarea
        value={form.observaciones}
        onChange={(e) => setField('observaciones', e.target.value)}
        placeholder="Describa las verificaciones realizadas, novedades encontradas o cualquier observacion relevante del proceso (minimo 10 caracteres)..."
        rows={4}
        className="bg-white"
      />
      {form.observaciones.trim().length > 0 && form.observaciones.trim().length < 10 ? (
        <p className="text-xs text-red-600 mt-2">Minimo 10 caracteres ({form.observaciones.trim().length}/10)</p>
      ) : form.observaciones.trim().length === 0 ? (
        <p className="font-semibold text-slate-900 text-sm mt-2">Campo obligatorio.</p>
      ) : (
        <p className="text-xs text-green-700 mt-2">✓ Observacion registrada.</p>
      )}
    </motion.div>

    {/* Botones de navegación */}
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="flex justify-between gap-3 pt-6 border-t-2 border-slate-200"
    >
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={prevStep}
        type="button"
        className="px-6 py-3 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition-all"
      >
        ← Anterior
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={submit}
        type="button"
        disabled={loading || form.observaciones.trim().length < 10}
        className="px-8 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-lg shadow-green-300 hover:shadow-lg hover:shadow-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '⏳ Registrando...' : form.observaciones.trim().length < 10 ? 'Ingrese observacion' : '✓ Registrar Factura'}
      </motion.button>
    </motion.div>
  </motion.div>
  );
}
