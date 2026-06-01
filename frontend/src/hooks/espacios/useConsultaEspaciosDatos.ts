import { useCallback, useEffect, useMemo, useState } from 'react';
import { espacioHorariosService } from '../../services/espacios/espaciosAPI';
import { horarioService } from '../../services/horarios/horariosAPI';
import { prestamoService } from '../../services/prestamos/prestamoAPI';
import { prestamosPublicAPI } from '../../services/prestamos/prestamosPublicAPI';
import type { PrestamoEspacio } from '../../services/prestamos/prestamoAPI';
import { clearSessionCache, getSessionCacheData, setSessionCacheData } from '../../core/sessionCache';
import {
  expandirPrestamosParaCronograma,
  getDiaSemanaEspanolDesdeISO,
  prestamoIntersectsRangoCronograma
} from './prestamosCronogramaUtils';
import type { EspacioView, OcupacionView } from './types';

const CONSULTA_ESPACIOS_CACHE_VERSION = 'v2';
const CONSULTA_ESPACIOS_CACHE_KEY = `espacios-consulta-espacios-${CONSULTA_ESPACIOS_CACHE_VERSION}`;

type UserLike = {
  id?: number;
  rol?: string;
  facultad?: { id?: number | null } | null;
};

function getConsultaEspaciosCacheKey(userId?: number, rol?: string, facultadId?: number | null): string {
  return `${CONSULTA_ESPACIOS_CACHE_KEY}-${String(rol ?? 'publico')}-${userId ?? 'anonimo'}-${facultadId ?? 'sin-facultad'}`;
}

function formatFechaLocalYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function rangoSemanaVisibleCronograma(fechaInicioISO: string): { desde: string; hasta: string } {
  const referencia = new Date(fechaInicioISO + 'T12:00:00');
  const diaSemana = referencia.getDay();
  const diasHastaLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
  const lunes = new Date(referencia);
  lunes.setDate(referencia.getDate() + diasHastaLunes);
  const sabado = new Date(lunes);
  sabado.setDate(lunes.getDate() + 5);

  return {
    desde: formatFechaLocalYYYYMMDD(lunes),
    hasta: formatFechaLocalYYYYMMDD(sabado)
  };
}

function horaANumero(hora: string): number {
  const partes = hora.split(':');
  const horas = parseInt(partes[0], 10);
  const minutos = parseInt(partes[1], 10) || 0;
  return horas + minutos / 60;
}

function normalizarDia(dia: string): string {
  const diaLower = dia.toLowerCase().trim();
  const mapeo: Record<string, string> = {
    lunes: 'Lunes',
    monday: 'Lunes',
    martes: 'Martes',
    tuesday: 'Martes',
    'miércoles': 'Miércoles',
    'miercoles': 'Miércoles',  // Backend envía sin tilde
    wednesday: 'Miércoles',
    jueves: 'Jueves',
    thursday: 'Jueves',
    viernes: 'Viernes',
    friday: 'Viernes',
    'sábado': 'Sábado',
    'sabado': 'Sábado',  // Backend envía sin tilde
    saturday: 'Sábado',
    domingo: 'Domingo',
    sunday: 'Domingo'
  };
  return mapeo[diaLower] || dia;
}

function getDiaDeSemana(): string {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return dias[new Date().getDay()];
}

function calcularProximaClaseYEstadoPrevio(
  espacioId: string,
  todosHorarios: OcupacionView[]
): { proximaClase: string; estado: 'disponible' | 'ocupado' | 'mantenimiento' } {
  const hoy = getDiaDeSemana();
  const ahora = new Date();
  const horaActual = ahora.getHours();

  const clasesHoy = todosHorarios
    .filter((h) => h.espacioId === espacioId && h.dia === hoy)
    .sort((a, b) => a.horaInicio - b.horaInicio);

  if (clasesHoy.length === 0) {
    return { proximaClase: 'Sin clases pendientes hoy', estado: 'disponible' };
  }

  const proximaClase = clasesHoy.find((c) => c.horaFin > horaActual);

  if (!proximaClase) {
    return { proximaClase: 'Sin clases pendientes hoy', estado: 'disponible' };
  }

  const tiempoHasta = proximaClase.horaInicio - horaActual;
  const estado = tiempoHasta <= 2 ? 'ocupado' : 'disponible';

  return {
    proximaClase: `${proximaClase.materia} - ${proximaClase.horaInicio}:00`,
    estado
  };
}

export function useConsultaEspaciosDatos({ user, filterFechaInicio }: { user?: UserLike; filterFechaInicio: string }) {
  const [espacios, setEspacios] = useState<EspacioView[]>([]);
  const [horarios, setHorarios] = useState<OcupacionView[]>([]);
  const [prestamos, setPrestamos] = useState<PrestamoEspacio[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      setLoading(true);
      try {
        const activeToken = localStorage.getItem('auth_token');
        const cacheKey = getConsultaEspaciosCacheKey(
          user?.id,
          String(user?.rol ?? 'publico'),
          user?.facultad?.id ?? null
        );
        const cachedData = force
          ? null
          : getSessionCacheData<{ espacios: EspacioView[]; horarios: OcupacionView[] }>(cacheKey, activeToken);

        if (cachedData) {
          setEspacios(cachedData.espacios);
          setHorarios(cachedData.horarios);
          return;
        }

        let espaciosConHorarios;

        const esSupervisor = String(user?.rol ?? '').toLowerCase().startsWith('supervisor');

        if (user?.id && esSupervisor) {
          const response = await espacioHorariosService.getSupervisorDisponiblesHorarios(user.id);
          espaciosConHorarios = response.espacios;
        } else {
          const response = await espacioHorariosService.getAllDisponiblesWithHorarios();
          espaciosConHorarios = response.espacios;
        }

        let horariosExtendidos: {
          id: number;
          espacio_id: number | null;
          dia_semana: string;
          hora_inicio: string;
          hora_fin: string;
          asignatura_nombre: string;
          docente_nombre: string;
          grupo_nombre: string;
          estado?: 'aprobado' | 'pendiente' | 'rechazado';
        }[] = [];

        try {
          const horariosResponse = await horarioService.listExtendidos({ includePending: true });
          horariosExtendidos = horariosResponse.horarios.map((h) => ({
            id: h.id,
            espacio_id: h.espacio_id,
            dia_semana: h.dia_semana,
            hora_inicio: h.hora_inicio,
            hora_fin: h.hora_fin,
            asignatura_nombre: h.asignatura_nombre,
            docente_nombre: h.docente_nombre,
            grupo_nombre: h.grupo_nombre,
            estado: h.estado
          }));
        } catch (error) {
          console.warn('No se pudieron cargar los horarios extendidos con IDs:', error);
        }

        const findHorarioMeta = (
          espacioId: string,
          dia: string,
          horaInicio: number,
          horaFin: number,
          materia: string
        ): { id: number; estado?: 'aprobado' | 'pendiente' | 'rechazado' } | undefined => {
          const diaNormalizado = normalizarDia(dia);
          const match = horariosExtendidos.find((h) => {
            const hDiaNormalizado = normalizarDia(h.dia_semana);
            const hHoraInicio = horaANumero(h.hora_inicio);
            const hHoraFin = horaANumero(h.hora_fin);
            return (
              String(h.espacio_id) === espacioId &&
              hDiaNormalizado === diaNormalizado &&
              hHoraInicio === horaInicio &&
              hHoraFin === horaFin &&
              h.asignatura_nombre === materia
            );
          });
          if (!match) return undefined;
          return { id: match.id, estado: match.estado };
        };

        const allHorarios: OcupacionView[] = [];
        const espaciosView: EspacioView[] = [];

        espaciosConHorarios.forEach((espacio: any) => {
          espacio.horarios.forEach((h: any) => {
            const horarioMeta = findHorarioMeta(
              espacio.id!.toString(),
              h.dia,
              horaANumero(h.hora_inicio),
              horaANumero(h.hora_fin),
              h.materia
            );

            allHorarios.push({
              id: horarioMeta?.id,
              espacioId: espacio.id!.toString(),
              dia: normalizarDia(h.dia),
              horaInicio: horaANumero(h.hora_inicio),
              horaFin: horaANumero(h.hora_fin),
              materia: h.materia,
              docente: h.docente,
              grupo: h.grupo,
              estado: horarioMeta?.estado === 'pendiente' ? 'pendiente' : 'ocupado',
              tipo: 'horario'
            });
          });

          const { proximaClase, estado } = calcularProximaClaseYEstadoPrevio(espacio.id!.toString(), allHorarios);

          espaciosView.push({
            id: espacio.id!.toString(),
            nombre: espacio.nombre,
            tipo: espacio.tipo || 'Sin Tipo',
            capacidad: espacio.capacidad,
            sede: espacio.sede || 'Sede Principal',
            edificio: espacio.ubicacion || 'Sin Ubicación',
            estado,
            estaAbierto: Boolean(espacio.esta_abierto),
            proximaClase,
            ubicacion: espacio.ubicacion
          });
        });

        setEspacios(espaciosView);
        setHorarios(allHorarios);
        setSessionCacheData(cacheKey, activeToken, {
          espacios: espaciosView,
          horarios: allHorarios
        });
      } catch (error) {
        console.error('Error loading spaces', error);
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const loadPrestamos = async () => {
      if (!filterFechaInicio) {
        setPrestamos([]);
        return;
      }

      try {
        const [prestamosAuthResponse, prestamosPublicosResponse] = await Promise.all([
          prestamoService.listarPrestamos({ includeOcurrencias: true }),
          prestamosPublicAPI.listarPrestamosPublicos({ includeOcurrencias: true })
        ]);

        const todosLosPrestamos: PrestamoEspacio[] = [
          ...(prestamosAuthResponse.prestamos || []),
          ...((prestamosPublicosResponse.prestamos || []) as unknown as PrestamoEspacio[])
        ];

        const { desde, hasta } = rangoSemanaVisibleCronograma(filterFechaInicio);
        const prestamosFiltrados = todosLosPrestamos.filter((p) =>
          prestamoIntersectsRangoCronograma(p, desde, hasta)
        );

        setPrestamos(prestamosFiltrados);
      } catch (error) {
        console.error('Error loading prestamos:', error);
        setPrestamos([]);
      }
    };

    loadPrestamos();
  }, [filterFechaInicio]);

  const tiposEspacio = useMemo(() => [...new Set(espacios.map((e) => e.tipo))], [espacios]);
  const sedes = useMemo(() => [...new Set(espacios.map((e) => e.sede))], [espacios]);

  const horariosConPrestamos = useMemo(() => {
    if (!filterFechaInicio || prestamos.length === 0) {
      return horarios;
    }

    const { desde, hasta } = rangoSemanaVisibleCronograma(filterFechaInicio);
    const prestamosVisibles = expandirPrestamosParaCronograma(prestamos, desde, hasta);

    const prestamosComoOcupacion: OcupacionView[] = prestamosVisibles.map((p) => ({
      espacioId: p.espacio_id.toString(),
      dia: getDiaSemanaEspanolDesdeISO(p.fecha),
      horaInicio: horaANumero(p.hora_inicio),
      horaFin: horaANumero(p.hora_fin),
      materia: p.tipo_actividad_nombre || 'Préstamo',
      docente: p.usuario_nombre || p.solicitante_publico_nombre,
      grupo: p.motivo,
      estado: p.estado || 'Pendiente',
      tipo: 'prestamo',
      prestamo: p
    }));

    return [...horarios, ...prestamosComoOcupacion];
  }, [horarios, prestamos, filterFechaInicio]);

  const getOcupacionPorHora = useCallback(
    (espacioId: string, dia: string, hora: number) => {
      const matches = horariosConPrestamos.filter(
        (h) => h.espacioId === espacioId && h.dia === dia && hora >= h.horaInicio && hora < h.horaFin
      );
      return matches.find((h) => h.tipo === 'prestamo') ?? matches[0];
    },
    [horariosConPrestamos]
  );

  const estadisticas = useMemo(
    () => ({
      total: espacios.length,
      abiertos: espacios.filter((e) => e.estaAbierto === true).length,
      cerrados: espacios.filter((e) => e.estaAbierto === false).length
    }),
    [espacios]
  );

  const calcularProximaClaseYEstado = useCallback(
    (espacioId: string): { proximaClase: string; estado: 'disponible' | 'ocupado' | 'mantenimiento' } => {
      return calcularProximaClaseYEstadoPrevio(espacioId, horarios);
    },
    [horarios]
  );

  const recargarDatos = useCallback(async () => {
    clearSessionCache(
      getConsultaEspaciosCacheKey(user?.id, String(user?.rol ?? 'publico'), user?.facultad?.id ?? null)
    );
    await loadData({ force: true });
  }, [loadData, user?.facultad?.id, user?.id, user?.rol]);

  return {
    espacios,
    horarios,
    prestamos,
    loading,
    tiposEspacio,
    sedes,
    horariosConPrestamos,
    getOcupacionPorHora,
    estadisticas,
    calcularProximaClaseYEstado,
    recargarDatos
  };
}
