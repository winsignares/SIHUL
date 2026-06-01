import { useCallback, useState } from 'react';
import type { EspacioView, NuevaSolicitudData, SeleccionRango } from './types';

function formatFechaLocalYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getFechaColombia(): Date {
  const ahora = new Date();
  const utc = ahora.getTime() + ahora.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * -5);
}

type GetOcupacionFn = (espacioId: string, dia: string, hora: number) => unknown;

export function useConsultaEspaciosSeleccion({
  puedeCrearSolicitudes,
  espacios,
  filterFechaInicio,
  getOcupacionPorHora
}: {
  puedeCrearSolicitudes: boolean;
  espacios: EspacioView[];
  filterFechaInicio: string;
  getOcupacionPorHora: GetOcupacionFn;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [seleccionInicio, setSeleccionInicio] = useState<{
    espacioId: string;
    dia: string;
    hora: number;
  } | null>(null);
  const [seleccionRango, setSeleccionRango] = useState<SeleccionRango | null>(null);
  const [dialogSolicitudOpen, setDialogSolicitudOpen] = useState(false);
  const [nuevaSolicitudData, setNuevaSolicitudData] = useState<NuevaSolicitudData | null>(null);

  // Redondear hora al entero más cercano (para selección en celdas de 1 hora)
  const roundToHour = (hora: number): number => Math.floor(hora);

  const iniciarSeleccion = useCallback(
    (espacioId: string, dia: string, hora: number) => {
      if (!puedeCrearSolicitudes) return;

      // Redondear hora al entero más cercano (inicio de la celda de 1 hora)
      const horaEntera = roundToHour(hora);

      // Validar que no exceda el horario permitido
      if (horaEntera >= 22) return;

      const ocupado = getOcupacionPorHora(espacioId, dia, horaEntera);
      if (ocupado) return;

      setIsDragging(true);
      setSeleccionInicio({ espacioId, dia, hora: horaEntera });
      // Iniciar con 1 hora de duración
      setSeleccionRango({ espacioId, dia, horaInicio: horaEntera, horaFin: horaEntera + 1 });
    },
    [getOcupacionPorHora, puedeCrearSolicitudes]
  );

  const actualizarSeleccion = useCallback(
    (espacioId: string, dia: string, hora: number) => {
      if (!isDragging || !seleccionInicio) return;
      if (espacioId !== seleccionInicio.espacioId || dia !== seleccionInicio.dia) return;

      // Redondear hora al entero más cercano
      const horaEntera = roundToHour(hora);

      // Calcular la hora de inicio (la menor entre inicio y actual)
      const horaInicio = Math.min(seleccionInicio.hora, horaEntera);
      // Calcular la hora de fin (la mayor + 1, permitiendo múltiples horas)
      // Si arrastra hacia abajo, expande la selección
      const horaFin = Math.max(seleccionInicio.hora + 1, horaEntera + 1);

      // Validar que no exceda las 22:00
      const horaFinValidada = Math.min(horaFin, 22);

      setSeleccionRango({ espacioId, dia, horaInicio, horaFin: horaFinValidada });
    },
    [isDragging, seleccionInicio]
  );

  const finalizarSeleccion = useCallback(() => {
    if (!isDragging || !seleccionRango) {
      setIsDragging(false);
      setSeleccionInicio(null);
      setSeleccionRango(null);
      return;
    }

    const espacio = espacios.find((e) => e.id === seleccionRango.espacioId);
    if (espacio) {
      let fechaBase: Date;

      if (filterFechaInicio) {
        fechaBase = new Date(filterFechaInicio + 'T00:00:00');
      } else {
        const hoy = getFechaColombia();
        hoy.setHours(0, 0, 0, 0);
        fechaBase = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      }

      const diasMap: Record<string, number> = {
        Lunes: 1,
        Martes: 2,
        Miércoles: 3,
        Jueves: 4,
        Viernes: 5,
        Sábado: 6
      };

      const diaSeleccionado = diasMap[seleccionRango.dia];
      const diaBase = fechaBase.getDay();
      const hoyColombia = getFechaColombia();
      hoyColombia.setHours(0, 0, 0, 0);
      const horaActualColombia = getFechaColombia().getHours();
      const fechaBaseNormalizada = new Date(fechaBase);
      fechaBaseNormalizada.setHours(0, 0, 0, 0);

      let diferenciaDias = diaSeleccionado - diaBase;

      if (fechaBaseNormalizada.getTime() === hoyColombia.getTime() && diferenciaDias < 0) {
        setIsDragging(false);
        setSeleccionInicio(null);
        setSeleccionRango(null);
        return;
      }

      if (
        fechaBaseNormalizada.getTime() === hoyColombia.getTime() &&
        diferenciaDias === 0 &&
        seleccionRango.horaInicio < horaActualColombia
      ) {
        setIsDragging(false);
        setSeleccionInicio(null);
        setSeleccionRango(null);
        return;
      }

      if (diferenciaDias < 0) {
        diferenciaDias += 7;
      }

      const fecha = new Date(fechaBase);
      fecha.setDate(fechaBase.getDate() + diferenciaDias);
      fecha.setHours(0, 0, 0, 0);

      if (fecha < hoyColombia) {
        setIsDragging(false);
        setSeleccionInicio(null);
        setSeleccionRango(null);
        return;
      }

      setNuevaSolicitudData({
        espacio_id: parseInt(espacio.id, 10),
        espacio_nombre: espacio.nombre,
        fecha: formatFechaLocalYYYYMMDD(fecha),
        horaInicio: `${seleccionRango.horaInicio.toString().padStart(2, '0')}:00`,
        horaFin: `${seleccionRango.horaFin.toString().padStart(2, '0')}:00`,
        diaSemana: seleccionRango.dia
      });
      setDialogSolicitudOpen(true);
    }

    setIsDragging(false);
    setSeleccionInicio(null);
    setSeleccionRango(null);
  }, [espacios, filterFechaInicio, isDragging, seleccionRango]);

  const cancelarSeleccion = useCallback(() => {
    setIsDragging(false);
    setSeleccionInicio(null);
    setSeleccionRango(null);
  }, []);

  return {
    isDragging,
    seleccionRango,
    iniciarSeleccion,
    actualizarSeleccion,
    finalizarSeleccion,
    cancelarSeleccion,
    dialogSolicitudOpen,
    setDialogSolicitudOpen,
    nuevaSolicitudData,
    setNuevaSolicitudData
  };
}
