import React from 'react';
import { motion } from 'framer-motion';
import { Check, Download, ExternalLink, FileText, Upload, X, XCircle } from 'lucide-react';
import type { FuncionarioUploadedDoc } from '../../models/funcionario';
import { DOCUMENT_TYPES, MAX_UPLOAD_SIZE_BYTES } from './auxiliares';
import type { useRegistrarFactura } from '../../hooks/funcionario/useRegistrarFactura';

interface Props {
  hook: ReturnType<typeof useRegistrarFactura>;
}

/** Paso 2 de Registrar Factura: soportes. */
export function PasoSoportes({ hook }: Props) {
  const {
    prefillFromPendiente,
    showLegacyBlocks,
    isReviewMode,
    setError,
    docs,
    existingDocs,
    selectedExistingDocIds,
    addDoc,
    openExistingDocument,
    downloadExistingDocument,
    openLocalDocument,
    downloadLocalDocument,
    removeDoc,
    getExistingDocKey,
    toggleExistingDocSelection,
    toggleDocumentoVerificado,
    hasSelectedDocsForReject,
    openRejectDialog,
    requiredDocTypes,
    existingDocTypes,
    uploadedDocTypes,
    requiredUploaded,
    uploadCompletion,
    nextStep,
    prevStep,
  } = hook;

  return (
  <motion.div
    key="step-2"
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.95 }}
    transition={{ duration: 0.4, ease: 'easeInOut' }}
    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8"
  >
    <div className="mb-6">
      <div>
        <h2 className="text-4xl font-bold text-slate-900">Carga de Documentos</h2>
        <p className="mt-2 text-slate-500">Verifique los soportes del proveedor, marque los correctos y solicite correcciones solo cuando sea necesario.</p>
      </div>
    </div>

    {showLegacyBlocks && existingDocs.length > 0 && (
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mb-6 rounded-2xl bg-blue-50 border-2 border-blue-200 p-5"
      >
        <p className="text-sm font-bold text-blue-900 mb-3">📎 Documentos ya enviados por proveedor ({existingDocs.length})</p>
        <div className="space-y-2">
          {existingDocs.map((doc) => (
            <div key={`existing-${doc.id}`} className="bg-white rounded-lg p-3 border border-blue-200">
              <p className="text-sm font-semibold text-slate-900">{doc.tipo_documento}</p>
              <p className="text-xs text-slate-600">{doc.nombre_archivo}</p>
            </div>
          ))}
        </div>
      </motion.div>
    )}

    {/* Barra de progreso de documentos */}
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="hidden"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-green-900">📊 Progreso de Carga</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{uploadCompletion}%</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-green-700 font-semibold">{requiredUploaded} de {requiredDocTypes.length}</p>
          <p className="text-xs text-green-600 mt-1">Documentos cargados</p>
        </div>
      </div>
      <div className="h-4 bg-green-200 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-lg"
          initial={{ width: 0 }}
          animate={{ width: `${uploadCompletion}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </motion.div>

    {/* Tarjetas de carga */}
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.15 }}
      className="hidden"
    >
      {DOCUMENT_TYPES.map((type, idx) => {
        const hasUpload = uploadedDocTypes.has(type);
        const hasExisting = existingDocTypes.has(type);
        const hasDoc = hasUpload || hasExisting;
        return (
          <motion.div
            key={type}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + idx * 0.08 }}
            whileHover={{ y: -4 }}
            className={`rounded-2xl p-6 border-2 transition-all ${
              hasDoc
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400'
                : 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-bold text-slate-900 text-lg">{type}</p>
                {hasUpload && <p className="text-xs text-green-600 font-semibold mt-1">✓ Actualizado en esta revisión</p>}
                {!hasUpload && hasExisting && <p className="text-xs text-blue-600 font-semibold mt-1">✓ Ya enviado por proveedor</p>}
              </div>
              {hasDoc && <span className="text-2xl">✓</span>}
            </div>
          
            <label className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:shadow-lg hover:shadow-red-300 cursor-pointer transition-all hover:scale-105 active:scale-95">
              <Upload className="w-4 h-4" /> 
              {hasDoc ? 'Cambiar' : 'Subir'}
              <input type="file" accept=".pdf,.xml,.png,.jpg,.jpeg,application/pdf,application/xml,text/xml,image/png,image/jpeg" className="hidden" onChange={(e) => addDoc(type, e.target.files?.[0])} />
            </label>
            <p className="text-[11px] text-slate-500 mt-2">Permitidos: PDF, XML, PNG, JPG. Máximo 25 MB.</p>
          </motion.div>
        );
      })}
    </motion.div>

    {/* Listado de documentos cargados */}
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="rounded-2xl border-2 border-slate-200 p-6 bg-slate-50"
    >
      <p className="font-bold text-slate-800 mb-4 text-lg">📁 Documentos Cargados</p>

      {docs.length === 0 && existingDocs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-8 text-center"
        >
          <p className="text-slate-500 text-sm">📪 Aún no has cargado documentos</p>
          <p className="text-slate-400 text-xs mt-1">Adjunta Factura, Orden de Compra, Certificación Bancaria, Acta de Entrega o Soporte Adicional</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {existingDocs.map((d) => {
            const selected = selectedExistingDocIds.has(getExistingDocKey(d));
            return (
            <div
              key={`exist-list-${d.id}`}
              className={`rounded-xl p-4 border transition-all ${selected ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    type="button"
                    onClick={() => { void toggleDocumentoVerificado(d); }}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${d.verificado ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'border-slate-300 bg-white text-slate-400 hover:border-emerald-500 hover:text-emerald-600'}`}
                    title={d.verificado ? 'Documento verificado correctamente' : 'Marcar documento como verificado'}
                    aria-label={d.verificado ? 'Documento verificado correctamente' : 'Marcar documento como verificado'}
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">{d.tipo_documento}</p>
                    <p className="text-xs text-slate-500 truncate">{d.nombre_archivo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openExistingDocument(d)}
                    className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 font-semibold text-blue-800 hover:bg-blue-100"
                  >
                    <ExternalLink className="w-4 h-4" /> Ver documento
                  </button>
                  <button
                    type="button"
                    onClick={() => { void downloadExistingDocument(d); }}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  >
                    <Download className="w-3.5 h-3.5" /> Descargar
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleExistingDocSelection(d)}
                    className={`inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${selected ? 'border-amber-400 bg-amber-100 text-amber-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-amber-50 hover:text-amber-800'}`}
                    title={selected ? 'Quitar solicitud de corrección' : 'Solicitar corrección de este documento'}
                  >
                    <XCircle className="h-3.5 w-3.5" /> {selected ? 'Corrección marcada' : 'Solicitar corrección'}
                  </button>
                </div>
              </div>
            </div>
            );
          })}

          {docs.map((d, idx) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, x: -12, y: 12 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.05 }}
              className="bg-white rounded-xl p-4 border-2 border-slate-200 hover:border-green-400 transition-all"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => removeDoc(d.id)}
                    className="p-2 rounded-lg hover:bg-red-100 text-red-600 hover:text-red-700 transition-all hover:scale-110 active:scale-95"
                    title="Eliminar documento"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">{d.type}</p>
                    <p className="text-xs text-slate-500 truncate">{d.file.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1 px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100">
                    <Upload className="w-3.5 h-3.5" /> Cambiar
                    <input
                      type="file"
                      accept=".pdf,.xml,.png,.jpg,.jpeg,application/pdf,application/xml,text/xml,image/png,image/jpeg"
                      className="hidden"
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => addDoc(d.type, event.target.files?.[0])}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => openLocalDocument(d)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Ver
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadLocalDocument(d)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  >
                    <Download className="w-3.5 h-3.5" /> Descargar
                  </button>
                </div>
              </div>

            </motion.div>
          ))}
        </div>
      )}

      {hasSelectedDocsForReject && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Tienes documentos marcados para corrección. Para devolver la factura usa “Rechazar factura”; si continuarás el proceso, desmárcalos primero.
        </div>
      )}
    </motion.div>

    {/* Sección de Documentos Adicionales */}
    {!isReviewMode && (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl border-2 border-slate-200 p-6 bg-slate-50 mt-8"
    >
      <div className="mb-4">
        <p className="font-bold text-slate-800 text-lg">📎 Documentos Adicionales</p>
        <p className="text-sm text-slate-600 mt-1">Agrega documentos adicionales si el funcionario necesita incluir más soportes (solo PDF)</p>
      </div>

      <div className="space-y-3">
        {/* Botón para agregar documentos adicionales */}
        <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 bg-white hover:bg-slate-50 cursor-pointer transition-all hover:border-blue-400">
          <Upload className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-slate-700">Agregar documento adicional (PDF)</span>
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const file = e.target.files?.[0];
              if (!file) return;
            
              if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
                setError('Solo se permiten archivos PDF');
                return;
              }
            
              if (file.size > MAX_UPLOAD_SIZE_BYTES) {
                setError('El archivo supera el tamaño máximo permitido (25 MB)');
                return;
              }
            
              addDoc('Soporte Adicional', file);
            }}
          />
        </label>

        {/* Listado de documentos adicionales cargados */}
        {docs.filter((d: FuncionarioUploadedDoc) => d.type === 'Soporte Adicional').length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-semibold text-slate-700">Documentos adicionales cargados:</p>
            {docs.filter((d: FuncionarioUploadedDoc) => d.type === 'Soporte Adicional').map((d: FuncionarioUploadedDoc, idx: number) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.05 }}
                className="bg-white rounded-lg p-3 border border-blue-200 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                  <p className="text-sm text-slate-700 truncate">{d.file.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeDoc(d.id)}
                  className="p-1 rounded hover:bg-red-100 text-red-600 hover:text-red-700 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
    )}

    {/* Botones de navegación */}
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="flex justify-between gap-3 pt-6 mt-6 border-t-2 border-slate-200"
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
      {showLegacyBlocks && prefillFromPendiente && (
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
      )}
      <motion.button 
        whileHover={{ scale: 1.02 }} 
        whileTap={{ scale: 0.98 }} 
        onClick={nextStep} 
        type="button" 
        disabled={hasSelectedDocsForReject}
        className="px-8 py-3 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold shadow-lg shadow-red-300 hover:shadow-lg hover:shadow-red-400 transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        Siguiente →
      </motion.button>
    </motion.div>
  </motion.div>
  );
}
