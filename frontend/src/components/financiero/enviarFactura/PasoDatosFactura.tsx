import {
  FileText,
  DollarSign,
  Plus,
  Trash2,
} from 'lucide-react';
import { formatMoney, formatNumberInput, TIPO_DOCUMENTO_OPTS } from './auxiliares';
import type { useEnviarFactura } from '../../../hooks/financiero/proveedor/useEnviarFactura';

interface Props {
  hook: ReturnType<typeof useEnviarFactura>;
}

/** Paso 2 de Enviar Factura: datos de la factura. */
export function PasoDatosFactura({ hook }: Props) {
  const {
    isCorreccion,
    catalogLoading,
    proveedorSeleccionado,
    departamentos,
    numeroFacturaSugerido,
    form,
    serviceItemsCalculated,
    invoiceTotals,
    handleFieldChange,
    handleServiceItemChange,
    handleAddServiceItem,
    handleRemoveServiceItem,
    handleBancoChange,
    bancosOptions,
    tiposCuentaOptions,
  } = hook;

  return (
  <div className="space-y-6">
    <h4 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
      <FileText size={20} className="text-orange-600" />
      Datos de la Factura
    </h4>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label htmlFor="tipo-documento" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Tipo de Documento <span className="text-red-500">*</span>
        </label>
        <select
          id="tipo-documento"
          aria-label="Seleccionar tipo de documento"
          value={form.tipoDocumento}
          onChange={e => handleFieldChange('tipoDocumento', e.target.value)}
          className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-500 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none font-medium cursor-pointer"
        >
          {TIPO_DOCUMENTO_OPTS.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="numero-factura-env" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          N° Factura{' '}
          <span className="text-slate-400 text-xs">
            {isCorreccion ? '(número original de la factura)' : '(generado automáticamente por el sistema)'}
          </span>
        </label>
        <input
          id="numero-factura-env"
          aria-label="Número de factura"
          type="text"
          value={numeroFacturaSugerido}
          disabled
          className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 outline-none"
        />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {isCorreccion
            ? 'Este número se mantiene y solo actualizas la información requerida.'
            : 'Evita errores de duplicidad: el consecutivo se asigna automáticamente.'}
        </p>
      </div>

      <div>
        <label htmlFor="fecha-factura-env" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Fecha de la Factura <span className="text-red-500">*</span>
        </label>
        <input
          id="fecha-factura-env"
          aria-label="Fecha de la factura"
          type="date"
          value={form.fechaFactura}
          max={new Date().toISOString().split('T')[0]}
          onChange={e => handleFieldChange('fechaFactura', e.target.value)}
          className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-500 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none font-medium"
        />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Se autocompleta con hoy. Cámbiala solo si la factura física tiene otra fecha.</p>
      </div>

      <div>
        <label htmlFor="fecha-recepcion-env" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Fecha de Recepción <span className="text-red-500">*</span>
        </label>
        <input
          id="fecha-recepcion-env"
          aria-label="Fecha de recepción"
          type="date"
          value={form.fechaRecepcion}
          max={new Date().toISOString().split('T')[0]}
          disabled
          className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 outline-none"
        />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Corresponde al día de envío en el portal.</p>
      </div>

      <div className="md:col-span-2">
        <label htmlFor="departamento-id" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Área / Departamento Solicitante <span className="text-red-500">*</span>
        </label>
        <select
          id="departamento-id"
          aria-label="Seleccionar área o departamento solicitante"
          value={form.departamentoId}
          onChange={e => handleFieldChange('departamentoId', Number(e.target.value))}
          disabled={catalogLoading}
          className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-500 rounded-lg text-sm outline-none font-medium cursor-pointer bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:border-red-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value={0}>-- Seleccionar área --</option>
          {departamentos.map(d => (
            <option key={d.id} value={d.id}>{d.nombre}</option>
          ))}
        </select>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {proveedorSeleccionado
            ? 'El área se asigna automáticamente para reducir errores de radicación.'
            : 'Selecciona el área interna a la que corresponde tu servicio o bien.'}
        </p>
      </div>

    </div>

    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/30 p-4">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        Descripción de la factura <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        placeholder="Ejemplo: Compra de computadores y envío"
        value={form.identificacionFactura}
        onChange={e => handleFieldChange('identificacionFactura', e.target.value)}
        className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-500 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none font-medium"
      />
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        Describa brevemente el concepto facturado, por ejemplo: Compra de computadores y envío.
      </p>
    </div>

    {/* Valores */}
    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
      <h5 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
        <DollarSign size={18} className="text-orange-600" />
        Servicios Facturados
      </h5>
      <div className="space-y-4">
        <div className="hidden xl:grid xl:grid-cols-[96px_minmax(220px,1.6fr)_minmax(150px,1fr)_110px_minmax(150px,1fr)_minmax(150px,1fr)_48px] gap-3 px-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <span>Items</span>
          <span>Servicio</span>
          <span>Valor unitario</span>
          <span>IVA / INC </span>
          <span>Subtotal</span>
          <span>Total</span>
          <span />
        </div>

        {serviceItemsCalculated.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/30 p-4"
          >
            <div className="grid grid-cols-1 xl:grid-cols-[96px_minmax(220px,1.6fr)_minmax(150px,1fr)_110px_minmax(150px,1fr)_minmax(150px,1fr)_48px] gap-3 items-start">
              <div>
                <label className="block xl:hidden text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Cantidad</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={item.cantidad}
                  onChange={e => handleServiceItemChange(item.id, 'cantidad', e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block xl:hidden text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Servicio</label>
                <input
                  type="text"
                  placeholder="Nombre del servicio o bien"
                  value={item.servicio}
                  onChange={e => handleServiceItemChange(item.id, 'servicio', e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block xl:hidden text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Valor unitario</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formatNumberInput(String(item.valorUnitario || ''))}
                  onChange={e => handleServiceItemChange(item.id, 'valorUnitario', e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2.5 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block xl:hidden text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">IVA %</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  placeholder="19"
                  value={item.ivaPorcentaje}
                  onChange={e => handleServiceItemChange(item.id, 'ivaPorcentaje', e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 xl:block">
                <div>
                  <label className="block xl:hidden text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Subtotal</label>
                  <input
                    type="text"
                    readOnly
                    value={formatNumberInput(String(item.subtotal || ''))}
                    className="w-full px-3 py-2.5 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-semibold"
                  />
                </div>
                <div className="xl:hidden">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">IVA valor</label>
                  <input
                    type="text"
                    readOnly
                    value={formatNumberInput(String(item.valorIva || ''))}
                    className="w-full px-3 py-2.5 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block xl:hidden text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Total</label>
                <input
                  type="text"
                  readOnly
                  value={formatNumberInput(String(item.total || ''))}
                  className="w-full px-3 py-2.5 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-bold"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  IVA / INC: {formatMoney(item.valorIva)}
                </p>
              </div>

              <div className="flex xl:justify-center">
                <button
                  type="button"
                  onClick={() => handleRemoveServiceItem(item.id)}
                  className="h-11 w-11 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:border-red-300 hover:bg-red-100 transition-colors flex items-center justify-center"
                  title={serviceItemsCalculated.length === 1 ? 'Limpiar fila' : 'Eliminar fila'}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleAddServiceItem}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:border-red-300 hover:bg-red-100"
          >
            <Plus size={16} />
            Agregar servicio
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Subtotal factura</p>
            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{formatMoney(invoiceTotals.subtotal)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">IVA / INC total</p>
            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{formatMoney(invoiceTotals.iva)}</p>
          </div>
          <div className="rounded-xl border border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-300">Total factura</p>
            <p className="mt-1 text-xl font-bold text-orange-700 dark:text-orange-300">{formatMoney(invoiceTotals.total)}</p>
          </div>
        </div>
      </div>
    </div>

    {/* Cuenta bancaria */}
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        Cuenta Bancaria para Pago <span className="text-slate-400 text-xs">(opcional)</span>
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <select
          id="banco"
          aria-label="Seleccionar banco"
          value={form.banco}
          onChange={e => handleBancoChange(e.target.value)}
          className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-500 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none font-medium cursor-pointer"
        >
          <option value="">Seleccionar banco</option>
          {bancosOptions.map((banco) => (
            <option key={banco.id} value={banco.nombre}>{banco.nombre}</option>
          ))}
        </select>

        <select
          id="tipo-cuenta"
          aria-label="Seleccionar tipo de cuenta"
          value={form.tipoCuenta}
          onChange={e => handleFieldChange('tipoCuenta', e.target.value)}
          className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-500 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none font-medium cursor-pointer"
        >
          <option value="">Tipo de cuenta</option>
          {tiposCuentaOptions.map((tipo) => (
            <option key={tipo.id} value={tipo.nombre}>{tipo.nombre}</option>
          ))}
        </select>

        <input
          type="text"
          inputMode="numeric"
          placeholder="Número de cuenta"
          value={form.numeroCuenta}
          onChange={e => handleFieldChange('numeroCuenta', e.target.value.replace(/[^0-9]/g, ''))}
          className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-500 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none font-medium"
        />
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Completa estos datos para agilizar validación y pago en tesorería.</p>
    </div>

  </div>
  );
}
