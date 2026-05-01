import { useCallback, useEffect, useMemo, useState } from 'react';
import { facturasService } from '../../../../services/financiero';
import type { Factura } from '../../../../models/financiero/core.models';

export interface RectoriaStats {
  pagosPorAutorizar: number;
  autorizadosEsteMes: number;
  pendientesCriticos: number;
}

export function useRectoriaHome() {
  const [pendientes, setPendientes] = useState<Factura[]>([]);
  const [autorizadas, setAutorizadas] = useState<Factura[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date>(new Date());

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [enviadasRectoria, autorizadasPago] = await Promise.all([
        facturasService.getByEstado('Enviada Rectoría'),
        facturasService.getByEstado('Autorizada'),
      ]);
      setPendientes(enviadasRectoria);
      setAutorizadas(autorizadasPago);
      setUltimaActualizacion(new Date());
    } catch {
      setError('No se pudieron cargar los indicadores de Rectoría.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const stats = useMemo<RectoriaStats>(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const autorizadosEsteMes = autorizadas.filter((factura) => {
      if (!factura.fecha_autorizacion) return false;
      const fecha = new Date(factura.fecha_autorizacion);
      return fecha.getMonth() === month && fecha.getFullYear() === year;
    }).length;

    return {
      pagosPorAutorizar: pendientes.length,
      autorizadosEsteMes,
      pendientesCriticos: pendientes.filter((factura) => (factura.dias_transcurridos || 0) > 3).length,
    };
  }, [pendientes, autorizadas]);

  const formatUltimaActualizacion = () => {
    return ultimaActualizacion.toLocaleString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return {
    stats,
    cargando,
    error,
    recargar: cargarDatos,
    formatUltimaActualizacion,
  };
}
