import { useEffect, useState } from 'react';
import { Receipt, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { proveedoresService } from '../../../../services/financiero';
import type { Factura } from '../../../../models/financiero/core.models';

const toList = <T,>(data: any): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(data?.results)) return data.results as T[];
  return [];
};

export function useProveedorHome(miProveedorId?: number) {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!miProveedorId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const resp = await proveedoresService.getMisFacturas(miProveedorId, { limit: 20 });
        setFacturas(toList<Factura>(resp));
      } catch {
        setFacturas([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [miProveedorId]);

  const stats = [
    {
      title: 'Facturas Enviadas',
      value: facturas.length,
      icon: Receipt,
      color: 'from-blue-600 to-blue-700',
      iconColor: 'text-blue-100',
      trend: 'Total histórico',
    },
    {
      title: 'En Proceso',
      value: facturas.filter((f) => !['Pagada', 'Pago Aplicado', 'Rechazada', 'Anulada', 'Devuelta'].includes(f.estado)).length,
      icon: Clock,
      color: 'from-orange-600 to-orange-700',
      iconColor: 'text-orange-100',
      trend: 'Siendo procesadas',
    },
    {
      title: 'Pagadas',
      value: facturas.filter((f) => f.estado === 'Pagada' || f.estado === 'Pago Aplicado').length,
      icon: CheckCircle2,
      color: 'from-green-600 to-green-700',
      iconColor: 'text-green-100',
      trend: 'Completadas',
    },
    {
      title: 'Devueltas',
      value: facturas.filter((f) => f.estado === 'Devuelta' || f.estado === 'Rechazada').length,
      icon: TrendingUp,
      color: 'from-red-600 to-red-700',
      iconColor: 'text-red-100',
      trend: 'Requieren atención',
    },
  ];

  return {
    loading,
    stats,
    recentFacturas: facturas.slice(0, 6),
  };
}
