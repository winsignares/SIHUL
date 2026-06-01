import { useCallback, useEffect, useMemo, useState } from 'react';
import type { EncabezadoDiaCronograma, MensajeFiltroFecha } from './types';

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

function getFechaMasDias(fecha: Date, dias: number): Date {
  const resultado = new Date(fecha);
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
}

export function useConsultaEspaciosFiltros() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [filterApertura, setFilterApertura] = useState('todas');
  const [filterSede, setFilterSede] = useState('todas');
  const [filterPeriodo, setFilterPeriodo] = useState<number | null>(null);
  const [filterFechaInicio, setFilterFechaInicio] = useState<string>('');
  const [filterFechaFin, setFilterFechaFin] = useState<string>('');
  const [filterOcupacion, setFilterOcupacion] = useState('todos');
  const [mensajeFiltroFecha, setMensajeFiltroFecha] = useState<MensajeFiltroFecha | null>(null);

  const diasSemana = useMemo(
    () => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    []
  );

  // Generar slots de 15 minutos desde las 6:00 hasta las 22:00 (16 horas * 4 = 64 slots)
  const horas = useMemo(() => {
    const slots: number[] = [];
    for (let h = 6; h < 22; h++) {
      for (let m = 0; m < 60; m += 15) {
        slots.push(h + m / 60);
      }
    }
    return slots;
  }, []);

  // Función auxiliar para convertir hora decimal a índice de slot
  const horaToSlotIndex = useCallback((hora: number): number => {
    // Agregar pequeña tolerancia para errores de precisión flotante
    const horaConTolerancia = hora + 0.001;
    // Redondear a múltiplo de 0.25 (15 minutos)
    const horaRedondeada = Math.round(horaConTolerancia * 4) / 4;
    // hora 6.0 = slot 0, hora 6.25 = slot 1, etc.
    return Math.round((horaRedondeada - 6) * 4);
  }, []);

  // Función auxiliar para verificar si un slot es hora exacta (para mostrar etiquetas)
  const isHoraExacta = useCallback((hora: number): boolean => {
    return hora % 1 === 0;
  }, []);

  useEffect(() => {
    if (!filterFechaInicio) {
      const hoy = getFechaColombia();
      hoy.setHours(0, 0, 0, 0);

      const fechaInicioStr = formatFechaLocalYYYYMMDD(hoy);
      const fechaFinStr = formatFechaLocalYYYYMMDD(getFechaMasDias(hoy, 7));

      setFilterFechaInicio(fechaInicioStr);
      setFilterFechaFin(fechaFinStr);
    }
  }, [filterFechaInicio]);

  const handleFechaInicioChange = useCallback((fecha: string) => {
    if (!fecha) {
      setFilterFechaInicio('');
      setFilterFechaFin('');
      setMensajeFiltroFecha(null);
      return;
    }

    const fechaInicio = new Date(fecha + 'T00:00:00');
    const hoy = getFechaColombia();
    hoy.setHours(0, 0, 0, 0);

    if (fechaInicio < hoy) {
      setMensajeFiltroFecha({
        tipo: 'error',
        texto: 'La fecha de inicio ya pasó. Debes seleccionar tu día actual o una fecha futura.'
      });
      return;
    }

    setFilterFechaInicio(fecha);
    setFilterFechaFin(formatFechaLocalYYYYMMDD(getFechaMasDias(fechaInicio, 7)));
    setMensajeFiltroFecha({
      tipo: 'info',
      texto: 'Rango actualizado. Puedes ajustar la fecha manualmente si necesitas consultar un intervalo específico.'
    });
  }, []);

  const handleFechaFinChange = useCallback(
    (fecha: string) => {
      if (!fecha) {
        setFilterFechaFin('');
        setMensajeFiltroFecha(null);
        return;
      }

      if (!filterFechaInicio) {
        setMensajeFiltroFecha({
          tipo: 'error',
          texto: 'Primero selecciona la fecha de inicio. Luego podrás elegir la fecha fin.'
        });
        return;
      }

      const fechaFin = new Date(fecha + 'T00:00:00');
      const fechaInicio = new Date(filterFechaInicio + 'T00:00:00');
      const hoy = getFechaColombia();
      hoy.setHours(0, 0, 0, 0);

      if (fechaFin < hoy) {
        setMensajeFiltroFecha({
          tipo: 'error',
          texto: 'La fecha fin no puede estar en el pasado. Selecciona el día actual o una fecha futura.'
        });
        return;
      }

      if (fechaFin < fechaInicio) {
        setMensajeFiltroFecha({
          tipo: 'error',
          texto: 'La fecha fin no puede ser menor que la fecha de inicio. Ajusta el rango para continuar.'
        });
        return;
      }

      setFilterFechaFin(fecha);
      setMensajeFiltroFecha({ tipo: 'info', texto: 'Fecha fin actualizada correctamente.' });
    },
    [filterFechaInicio]
  );

  const formatearFechaEncabezado = useCallback((fecha: Date): string => {
    const partes = new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      day: 'numeric',
      month: 'long'
    }).formatToParts(fecha);

    const dia = partes.find((p) => p.type === 'day')?.value ?? '';
    const mesRaw = partes.find((p) => p.type === 'month')?.value ?? '';
    const mes = mesRaw ? mesRaw.charAt(0).toUpperCase() + mesRaw.slice(1) : '';

    return `${dia} ${mes}`.trim();
  }, []);

  const encabezadosDiasCronograma = useMemo<EncabezadoDiaCronograma[]>(() => {
    const referencia = filterFechaInicio ? new Date(filterFechaInicio + 'T12:00:00') : getFechaColombia();
    referencia.setHours(12, 0, 0, 0);

    const diaSemana = referencia.getDay();
    const diasHastaLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
    const lunes = new Date(referencia);
    lunes.setDate(referencia.getDate() + diasHastaLunes);

    return diasSemana.map((dia, index) => {
      const fechaDia = new Date(lunes);
      fechaDia.setDate(lunes.getDate() + index);
      return { dia, fecha: formatearFechaEncabezado(fechaDia) };
    });
  }, [diasSemana, filterFechaInicio, formatearFechaEncabezado]);

  const getFechaColombiaISO = useCallback((): string => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  }, []);

  const getIndiceDiaColombia = useCallback((): number => {
    const diaSemana = new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      weekday: 'long'
    })
      .format(new Date())
      .toLowerCase();

    const mapaDias: Record<string, number> = {
      lunes: 0,
      martes: 1,
      miercoles: 2,
      'miércoles': 2,
      jueves: 3,
      viernes: 4,
      sabado: 5,
      'sábado': 5
    };

    return mapaDias[diaSemana] ?? -1;
  }, []);

  const getHoraColombia = useCallback((): number => {
    const hora = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Bogota',
      hour: '2-digit',
      hour12: false
    }).format(new Date());

    return parseInt(hora, 10);
  }, []);

  const isDiaBloqueado = useCallback(
    (dia: string): boolean => {
      const hoyColombia = getFechaColombiaISO();
      const indiceDiaActual = getIndiceDiaColombia();
      const semanaActual = !filterFechaInicio || filterFechaInicio === hoyColombia;

      if (!semanaActual || indiceDiaActual < 0) return false;

      const indiceDia = diasSemana.indexOf(dia);
      return indiceDia !== -1 && indiceDia < indiceDiaActual;
    },
    [diasSemana, filterFechaInicio, getFechaColombiaISO, getIndiceDiaColombia]
  );

  const isCeldaBloqueada = useCallback(
    (dia: string, hora: number): boolean => {
      if (isDiaBloqueado(dia)) return true;

      const hoyColombia = getFechaColombiaISO();
      const indiceDiaActual = getIndiceDiaColombia();
      const horaActualColombia = getHoraColombia();
      const semanaActual = !filterFechaInicio || filterFechaInicio === hoyColombia;

      if (!semanaActual || indiceDiaActual < 0) return false;

      const indiceDia = diasSemana.indexOf(dia);
      return indiceDia === indiceDiaActual && hora < horaActualColombia;
    },
    [diasSemana, filterFechaInicio, getFechaColombiaISO, getHoraColombia, getIndiceDiaColombia, isDiaBloqueado]
  );

  const limpiarFiltros = useCallback(() => {
    setSearchTerm('');
    setFilterTipo('todos');
    setFilterApertura('todas');
    setFilterSede('todas');
    setFilterPeriodo(null);
    setFilterOcupacion('todos');

    const hoy = getFechaColombia();
    hoy.setHours(0, 0, 0, 0);
    const fechaInicioStr = formatFechaLocalYYYYMMDD(hoy);
    const fechaFinStr = formatFechaLocalYYYYMMDD(getFechaMasDias(hoy, 7));

    setFilterFechaInicio(fechaInicioStr);
    setFilterFechaFin(fechaFinStr);
    setMensajeFiltroFecha(null);
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    filterTipo,
    setFilterTipo,
    filterApertura,
    setFilterApertura,
    filterSede,
    setFilterSede,
    filterPeriodo,
    setFilterPeriodo,
    filterFechaInicio,
    filterFechaFin,
    filterOcupacion,
    setFilterOcupacion,
    mensajeFiltroFecha,
    handleFechaInicioChange,
    handleFechaFinChange,
    limpiarFiltros,
    diasSemana,
    encabezadosDiasCronograma,
    horas,
    isDiaBloqueado,
    isCeldaBloqueada,
    horaToSlotIndex,
    isHoraExacta
  };
}
