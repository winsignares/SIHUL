import { useEffect, useState } from 'react';
import { CheckCircle2, FileCheck, Calculator, TrendingUp } from 'lucide-react';
import { facturasService, historialService } from '../../../../services/financiero';
import type { HistorialFactura } from '../../../../models/financiero/core.models';

interface UseContabilidadHomeParams {
  onGoToPendientes: () => void;
  onGoToRadicar: () => void;
  onGoToCausar: () => void;
}

export function useContabilidadHome({ onGoToPendientes, onGoToRadicar, onGoToCausar }: UseContabilidadHomeParams) {
  const [recibidas, setRecibidas] = useState<number | null>(null);
  const [radicadas, setRadicadas] = useState<number | null>(null);
  const [causadas, setCausadas] = useState<number | null>(null);
  const [historial, setHistorial] = useState<HistorialFactura[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    Promise.all([
      facturasService.getByEstado('Recibida'),
      facturasService.getByEstado('Registrada'),
      facturasService.getByEstado('Radicada'),
      facturasService.getByEstado('Causada'),
    ])
      .then(([rec, reg, rad, caus]) => {
        setRecibidas(rec.length + reg.length);
        setRadicadas(rad.length);
        setCausadas(caus.length);
        if (rad.length > 0) {
          historialService.getByFactura(rad[0].id).then(setHistorial).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, []);

  const stats = [
    {
      title: 'Facturas para Radicar',
      value: loadingStats ? '...' : String(recibidas ?? 0),
      icon: FileCheck,
      color: 'from-blue-600 to-blue-700',
      iconColor: 'text-blue-100',
      trend: 'Estado: Recibidas',
    },
    {
      title: 'Pendientes de Causación',
      value: loadingStats ? '...' : String(radicadas ?? 0),
      icon: Calculator,
      color: 'from-green-600 to-green-700',
      iconColor: 'text-green-100',
      trend: 'Estado: Radicadas',
    },
    {
      title: 'Causadas (en sistema)',
      value: loadingStats ? '...' : String(causadas ?? 0),
      icon: CheckCircle2,
      color: 'from-purple-600 to-purple-700',
      iconColor: 'text-purple-100',
      trend: 'Total acumulado',
    },
    {
      title: 'SLA Máximo',
      value: '12 días',
      icon: TrendingUp,
      color: 'from-red-600 to-red-700',
      iconColor: 'text-red-100',
      trend: 'Desde radicación hasta causación',
    },
  ];

  const quickActions = [
    {
      title: 'Radicar Facturas',
      description: 'Formalizar la entrada de documentos al sistema institucional',
      icon: FileCheck,
      color: 'from-blue-600 to-blue-700',
      action: onGoToRadicar,
    },
    {
      title: 'Causar Facturas',
      description: 'Registrar el reconocimiento contable de las obligaciones',
      icon: Calculator,
      color: 'from-green-600 to-green-700',
      action: onGoToCausar,
    },
  ];

  const recentActivity = historial.slice(0, 5);

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'Radicada':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Causada':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Devuelta':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return {
    loadingStats,
    stats,
    quickActions,
    recentActivity,
    getEstadoBadge,
    onGoToPendientes,
  };
}
