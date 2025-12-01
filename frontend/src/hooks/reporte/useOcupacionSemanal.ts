import { useState, useEffect, useMemo } from 'react';
import type { EspacioOcupacion } from '../../models/index';
import { ocupacionSemanalService } from '../../services/reporte/ocupacionSemanalAPI';
import { toast } from 'sonner';

export function useOcupacionSemanal() {
  const [tipoEspacio, setTipoEspacio] = useState<string>('todos');
  const [tiposEspacioOptions, setTiposEspacioOptions] = useState<Array<{ id: number; nombre: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
  const [espaciosOcupacion, setEspaciosOcupacion] = useState<EspacioOcupacion[]>([]);
  const [semanaInfo, setSemanaInfo] = useState({ inicio: '', fin: '' });

  const PERIODO_TRABAJO = '2025-1';

  // Cargar tipos de espacio
  useEffect(() => {
    const cargarTipos = async () => {
      try {
        const tipos = await ocupacionSemanalService.getTiposEspacio();
        setTiposEspacioOptions(tipos);
      } catch (error) {
        console.error('Error loading tipos de espacio:', error);
      }
    };

    cargarTipos();
  }, []);

  // Cargar datos de ocupación semanal cuando cambia el tipo de espacio
  useEffect(() => {
    const cargarOcupacion = async () => {
      setLoading(true);
      try {
        const tipoId = tipoEspacio === 'todos' ? undefined : parseInt(tipoEspacio);
        const response = await ocupacionSemanalService.getOcupacionSemanal(tipoId, 0);
        
        // Mapear datos del backend al formato esperado por el modelo
        const ocupacionMapeada: EspacioOcupacion[] = response.ocupacion.map((espacio: any) => ({
          id: espacio.id.toString(),
          nombre: espacio.nombre,
          tipo: espacio.tipo,
          capacidad: espacio.capacidad,
          horasOcupadas: espacio.horasOcupadasSemana,
          horasDisponibles: espacio.horasDisponibles,
          porcentajeOcupacion: espacio.porcentajeOcupacion,
          edificio: espacio.edificio,
          jornada: {
            manana: Math.round(espacio.porcentajeManana),
            tarde: Math.round(espacio.porcentajeTarde),
            noche: Math.round(espacio.porcentajeNoche)
          }
        }));
        
        setEspaciosOcupacion(ocupacionMapeada);
        setSemanaInfo({
          inicio: response.semana_inicio,
          fin: response.semana_fin
        });
        setUltimaActualizacion(new Date());
      } catch (error) {
        console.error('Error loading ocupación semanal:', error);
        toast.error('Error cargando datos de ocupación semanal');
      } finally {
        setLoading(false);
      }
    };

    cargarOcupacion();
  }, [tipoEspacio]);

  const espaciosFiltrados = useMemo(() => {
    return tipoEspacio === 'todos'
      ? espaciosOcupacion
      : espaciosOcupacion.filter(e => e.tipo === tipoEspacio);
  }, [tipoEspacio, espaciosOcupacion]);

  const estadisticas = useMemo(() => {
    const promedioOcupacion = espaciosFiltrados.length > 0
      ? espaciosFiltrados.reduce((acc, e) => acc + e.porcentajeOcupacion, 0) / espaciosFiltrados.length
      : 0;
    const totalHorasOcupadas = espaciosFiltrados.reduce((acc, e) => acc + e.horasOcupadas, 0);
    const totalHorasDisponibles = espaciosFiltrados.reduce((acc, e) => acc + e.horasDisponibles, 0);
    const espaciosSobreocupados = espaciosFiltrados.filter(e => e.porcentajeOcupacion > 85).length;
    const espaciosSubutilizados = espaciosFiltrados.filter(e => e.porcentajeOcupacion < 50).length;

    return {
      promedioOcupacion,
      totalHorasOcupadas,
      totalHorasDisponibles,
      espaciosSobreocupados,
      espaciosSubutilizados
    };
  }, [espaciosFiltrados]);

  const exportarReporte = async () => {
    try {
      setLoading(true);
      const tipoId = tipoEspacio === 'todos' ? undefined : parseInt(tipoEspacio);
      await ocupacionSemanalService.generarPDFOcupacion(tipoId, 0);
      toast.success('PDF generado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al generar PDF');
    } finally {
      setLoading(false);
    }
  };

  const getColorPorOcupacion = (porcentaje: number) => {
    if (porcentaje >= 85) return 'text-red-600 bg-red-100 border-red-300';
    if (porcentaje >= 70) return 'text-yellow-600 bg-yellow-100 border-yellow-300';
    if (porcentaje >= 50) return 'text-green-600 bg-green-100 border-green-300';
    return 'text-slate-600 bg-slate-100 border-slate-300';
  };

  const getBarColor = (porcentaje: number) => {
    if (porcentaje >= 85) return 'bg-red-600';
    if (porcentaje >= 70) return 'bg-yellow-600';
    if (porcentaje >= 50) return 'bg-green-600';
    return 'bg-slate-400';
  };

  // Generar opciones para el select dinámicamente
  const tiposOptions = [
    { value: 'todos', label: 'Todos los tipos' },
    ...tiposEspacioOptions.map(tipo => ({
      value: tipo.nombre,
      label: tipo.nombre
    }))
  ];

  return {
    PERIODO_TRABAJO,
    tipoEspacio,
    setTipoEspacio,
    tiposOptions,
    loading,
    ultimaActualizacion,
    espaciosFiltrados,
    estadisticas,
    exportarReporte,
    getColorPorOcupacion,
    getBarColor
  };
}
