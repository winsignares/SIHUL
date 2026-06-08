import { useEffect, useMemo, useState } from 'react';
import { Receipt, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { facturasService } from '../../../../services/financiero';
import type { Factura } from '../../../../models/financiero/core.models';
import type { FuncionarioStatsApi } from '../../../../models/financiero/funcionario';

const toList = <T,>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (typeof data === 'object' && data !== null && Array.isArray((data as { results?: unknown }).results)) {
    return (data as { results: T[] }).results;
  }
  return [];
};

const isFuncionarioStatsApi = (value: unknown): value is FuncionarioStatsApi => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<FuncionarioStatsApi>;
  return (
    typeof candidate.total_facturas === 'number' &&
    typeof candidate.vencidas === 'number' &&
    typeof candidate.atrasadas === 'number' &&
    typeof candidate.por_estado === 'object' &&
    candidate.por_estado !== null
  );
};

export function useFuncionarioHome() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [statsApi, setStatsApi] = useState<FuncionarioStatsApi | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [listResp, statsResp, pendingResp] = await Promise.all([
          facturasService.getAll({ limit: 20 }),
          facturasService.getEstadisticas(),
          facturasService.getPendientes(),
        ]);

        setFacturas(toList<Factura>(listResp));
        setStatsApi(isFuncionarioStatsApi(statsResp) ? statsResp : null);
        setPendingCount(Array.isArray(pendingResp) ? pendingResp.length : 0);
      } catch {
        setFacturas([]);
        setStatsApi(null);
        setPendingCount(0);
        setLoadError('No fue posible cargar el dashboard desde el backend.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const stats = useMemo(() => {
    const total = statsApi?.total_facturas ?? 0;
    const porEstado = statsApi?.por_estado ?? {};
    const recibidas = porEstado['Recibida'] ?? 0;
    const pendientes = pendingCount;
    const procesadas = (porEstado['Pagada'] ?? 0) + (porEstado['Pago Aplicado'] ?? 0) + (porEstado['Autorizada'] ?? 0);
    const enRadicacion = porEstado['Radicada'] ?? 0;

    return [
      {
        title: 'Facturas Recibidas',
        value: String(recibidas),
        icon: Receipt,
        color: 'from-blue-600 to-blue-700',
        iconColor: 'text-blue-100',
        trend: `Total sistema: ${total}`,
      },
      {
        title: 'Facturas Pendientes',
        value: String(pendientes),
        icon: Clock,
        color: 'from-yellow-600 to-yellow-700',
        iconColor: 'text-yellow-100',
        trend: 'Requieren atención',
      },
      {
        title: 'Procesadas',
        value: String(procesadas),
        icon: CheckCircle2,
        color: 'from-green-600 to-green-700',
        iconColor: 'text-green-100',
        trend: `Vencidas: ${statsApi?.vencidas ?? 0}`,
      },
      {
        title: 'En Radicación',
        value: String(enRadicacion),
        icon: TrendingUp,
        color: 'from-red-600 to-red-700',
        iconColor: 'text-red-100',
        trend: `Atrasadas: ${statsApi?.atrasadas ?? 0}`,
      },
    ];
  }, [pendingCount, statsApi]);

  const recentActivity = useMemo(
    () =>
      [...facturas]
        .sort((a, b) => new Date(b.fecha_modificacion || b.fecha_recepcion || b.fecha_creacion || 0).getTime() - new Date(a.fecha_modificacion || a.fecha_recepcion || a.fecha_creacion || 0).getTime())
        .slice(0, 5)
        .map((f) => ({
        id: f.id,
        factura: f.numero_factura,
        proveedor: f.proveedor?.razon_social || 'Proveedor sin nombre',
        monto: Number(f.valor_total || 0),
        estado: f.estado,
        fecha: f.fecha_recepcion || '',
      })),
    [facturas]
  );

  return {
    loading,
    loadError,
    stats,
    recentActivity,
  };
}
