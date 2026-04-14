import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, Eye, FileText, TrendingUp } from 'lucide-react';
import { facturasService } from '../../../services/financiero';
import type { Factura } from '../../../models/financiero';
import FacturaDetailModal from '../../../share/factura-detail-modal';

type PendingRow = {
  id: string;
  numeroFactura: string;
  proveedor: string;
  area: string;
  valorTotal: number;
  fechaRecepcion: string;
  dias: number;
  slaMax: number;
  nivelRiesgo: 'verde' | 'amarillo' | 'vencido';
  accion: string;
};

const mockPendientes: PendingRow[] = [
  {
    id: '1',
    numeroFactura: 'FAC-2026-145',
    proveedor: 'Tecnologia Global SAS',
    area: 'Sistemas',
    valorTotal: 8900000,
    fechaRecepcion: '2026-03-30',
    dias: 1,
    slaMax: 2,
    nivelRiesgo: 'amarillo',
    accion: 'Registrar factura y subir documentos',
  },
  {
    id: '2',
    numeroFactura: 'FAC-2026-138',
    proveedor: 'Editorial Academica Colombia',
    area: 'Biblioteca',
    valorTotal: 6750000,
    fechaRecepcion: '2026-03-26',
    dias: 4,
    slaMax: 2,
    nivelRiesgo: 'vencido',
    accion: 'URGENTE: Registrar factura VENCIDA',
  },
  {
    id: '3',
    numeroFactura: 'FAC-2026-152',
    proveedor: 'Servicios Medicos Especializados',
    area: 'Enfermeria',
    valorTotal: 12500000,
    fechaRecepcion: '2026-03-31',
    dias: 0,
    slaMax: 2,
    nivelRiesgo: 'verde',
    accion: 'Registrar factura y subir documentos',
  },
];

function mapFacturaToPendingRow(f: Factura): PendingRow {
  const dias = Number(f.dias_transcurridos || 0);
  const riesgo: PendingRow['nivelRiesgo'] = dias > 2 ? 'vencido' : dias > 0 ? 'amarillo' : 'verde';

  return {
    id: String(f.id),
    numeroFactura: f.numero_factura || `FAC-${f.id}`,
    proveedor: f.proveedor?.razon_social || 'Proveedor sin nombre',
    area: f.departamento?.nombre || 'Sin area',
    valorTotal: Number(f.valor_total || 0),
    fechaRecepcion: f.fecha_recepcion || '',
    dias,
    slaMax: 2,
    nivelRiesgo: riesgo,
    accion: riesgo === 'vencido' ? 'URGENTE: Registrar factura VENCIDA' : 'Registrar factura y subir documentos',
  };
}

export default function MisPendientes() {
  const [rows, setRows] = useState<PendingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await facturasService.getPendientes();
        const apiRows = Array.isArray(response) ? response.map(mapFacturaToPendingRow) : [];
        setRows(apiRows.length > 0 ? apiRows : mockPendientes);
      } catch {
        setRows(mockPendientes);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const vencidas = useMemo(() => rows.filter(r => r.nivelRiesgo === 'vencido').length, [rows]);
  const proximas = useMemo(() => rows.filter(r => r.nivelRiesgo === 'amarillo').length, [rows]);

  const riskDotClass = (risk: PendingRow['nivelRiesgo']) => {
    if (risk === 'vencido') return 'bg-purple-700';
    if (risk === 'amarillo') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const selectedRow = rows.find((r) => r.id === selectedId) || null;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-white shadow-lg"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Clock className="w-6 h-6 text-yellow-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Mis Pendientes</h2>
            <p className="text-red-100">Facturas recibidas que debo registrar en el sistema (SLA: 2 dias)</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Pendientes</p>
              <p className="text-4xl font-bold text-slate-800 mt-1">{rows.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl border border-purple-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-semibold">Facturas VENCIDAS</p>
              <p className="text-4xl font-bold text-purple-800 mt-1">{vencidas}</p>
            </div>
            <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-purple-700" />
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-xl border border-yellow-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 font-semibold">Proximas a Vencer</p>
              <p className="text-4xl font-bold text-yellow-800 mt-1">{proximas}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-yellow-700" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 overflow-x-auto">
        <h3 className="text-xl font-semibold text-slate-800 mb-1">Facturas Pendientes de Registro</h3>
        <p className="text-slate-500 mb-5">Facturas fisicas recibidas que debo registrar en el sistema antes de 2 dias</p>

        <table className="w-full min-w-[1050px] text-sm">
          <thead>
            <tr className="bg-slate-50 border border-slate-200">
              <th className="py-3 px-3 text-left">SLA</th>
              <th className="py-3 px-3 text-left">N° Factura</th>
              <th className="py-3 px-3 text-left">Proveedor</th>
              <th className="py-3 px-3 text-left">Area</th>
              <th className="py-3 px-3 text-left">Monto</th>
              <th className="py-3 px-3 text-left">Fecha Recepcion</th>
              <th className="py-3 px-3 text-left">Dias</th>
              <th className="py-3 px-3 text-left">Accion Requerida</th>
              <th className="py-3 px-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-4 text-slate-500" colSpan={9}>Cargando pendientes...</td>
              </tr>
            ) : rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${riskDotClass(row.nivelRiesgo)}`} />
                    {row.nivelRiesgo === 'vencido' && <AlertCircle className="w-4 h-4 text-purple-700" />}
                  </div>
                </td>
                <td className="p-3 font-medium text-slate-800">{row.numeroFactura}</td>
                <td className="p-3 text-slate-700">{row.proveedor}</td>
                <td className="p-3 text-slate-700">{row.area}</td>
                <td className="p-3 font-semibold text-slate-800">${row.valorTotal.toLocaleString('es-CO')}</td>
                <td className="p-3 text-slate-700">{row.fechaRecepcion || 'Sin fecha'}</td>
                <td className="p-3 font-semibold">
                  <span className={row.nivelRiesgo === 'vencido' ? 'text-purple-700' : row.nivelRiesgo === 'amarillo' ? 'text-yellow-700' : 'text-green-700'}>
                    {row.dias}d / {row.slaMax}d
                  </span>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs border ${row.nivelRiesgo === 'vencido' ? 'bg-purple-100 text-purple-800 border-purple-300' : 'bg-blue-100 text-blue-800 border-blue-300'}`}>
                    {row.accion}
                  </span>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => {
                      setSelectedId(row.id);
                      setOpenDetail(true);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700"
                  >
                    <Eye className="w-4 h-4" /> Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FacturaDetailModal
        isOpen={openDetail}
        onClose={() => setOpenDetail(false)}
        factura={
          selectedRow
            ? {
                numeroFactura: selectedRow.numeroFactura,
                proveedor: selectedRow.proveedor,
                valorTotal: selectedRow.valorTotal,
                fechaRecepcion: selectedRow.fechaRecepcion,
                areaSolicitante: selectedRow.area,
                estado: 'Recibida',
                diasTranscurridos: selectedRow.dias,
                descripcion: selectedRow.accion,
                nivelRiesgo:
                  selectedRow.nivelRiesgo === 'vencido'
                    ? 'vencido'
                    : selectedRow.nivelRiesgo === 'amarillo'
                      ? 'amarillo'
                      : 'verde',
              }
            : null
        }
      />
    </div>
  );
}
