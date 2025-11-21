import { useState } from 'react';
import { busquedaService, type ResultadosBusqueda } from '../services/busqueda/busquedaService';

export function useBusqueda() {
  const [resultados, setResultados] = useState<ResultadosBusqueda | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscar = async (query: string, tipo?: string) => {
    if (!query || query.trim().length < 2) {
      setResultados(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await busquedaService.buscar(query, tipo);
      setResultados(data);
    } catch (err: any) {
      setError(err.message || 'Error en la búsqueda');
    } finally {
      setLoading(false);
    }
  };

  const limpiar = () => {
    setResultados(null);
    setError(null);
  };

  return {
    resultados,
    loading,
    error,
    buscar,
    limpiar,
  };
}
