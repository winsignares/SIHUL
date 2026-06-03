import { useCallback, useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import type { EspacioView, NuevaSolicitudData, SeleccionRango, OcupacionView, ConflictoInfo } from './types';

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

type GetConflictoFn = (espacioId: string, dia: string, horaInicio: number, horaFin: number, ocupacionIgnorada?: any) => any;

export function useConsultaEspaciosSeleccion({
  puedeCrearSolicitudes,
  espacios,
  filterFechaInicio,
  getConflictoEnRango,
  horarios = []
}: {
  puedeCrearSolicitudes: boolean;
  espacios: EspacioView[];
  filterFechaInicio: string;
  getConflictoEnRango: GetConflictoFn;
  horarios?: OcupacionView[];
}) {
  // Usar refs para valores que cambian frecuentemente durante drag (evita re-renders)
  const isDraggingRef = useRef(false);
  const seleccionInicioRef = useRef<{ espacioId: string; dia: string; hora: number } | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef<{ espacioId: string; dia: string; hora: number } | null>(null);
  
  // Estado solo para valores que necesitan trigger de render al final
  const [isDragging, setIsDragging] = useState(false);
  const [seleccionRango, setSeleccionRango] = useState<SeleccionRango | null>(null);
  const [dialogSolicitudOpen, setDialogSolicitudOpen] = useState(false);
  const [nuevaSolicitudData, setNuevaSolicitudData] = useState<NuevaSolicitudData | null>(null);

  // Redondear hora al entero más cercano (para selección en celdas de 1 hora)
  const roundToHour = (hora: number): number => Math.floor(hora);
  
  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const iniciarSeleccion = useCallback(
    (espacioId: string, dia: string, hora: number) => {
      if (!puedeCrearSolicitudes) return;

      const horaEntera = roundToHour(hora);
      if (horaEntera >= 22) return;

      const ocupado = getConflictoEnRango(espacioId, dia, horaEntera, horaEntera + 1);
      if (ocupado) {
        const tipoConflicto = ocupado.tipo === 'prestamo' ? 'un préstamo' : 'una clase';
        const detalle = ocupado.materia || ocupado.tipo || 'Horario ocupado';
        toast.error(`Conflicto con ${tipoConflicto}: ${detalle} (${ocupado.horaInicio}:00-${ocupado.horaFin}:00)`);
        return;
      }

      // Actualizar refs inmediatamente (sin re-render)
      isDraggingRef.current = true;
      seleccionInicioRef.current = { espacioId, dia, hora: horaEntera };
      
      // Actualizar estado para trigger de render inicial
      setIsDragging(true);
      setSeleccionRango({ espacioId, dia, horaInicio: horaEntera, horaFin: horaEntera + 1 });
    },
    [getConflictoEnRango, puedeCrearSolicitudes]
  );

  // Función optimizada que usa RAF para limitar updates
  const actualizarSeleccion = useCallback(
    (espacioId: string, dia: string, hora: number) => {
      if (!isDraggingRef.current || !seleccionInicioRef.current) return;
      if (espacioId !== seleccionInicioRef.current.espacioId || dia !== seleccionInicioRef.current.dia) return;

      // Guardar update pendiente
      pendingUpdateRef.current = { espacioId, dia, hora };

      // Cancelar RAF previo si existe
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      // Programar update en próximo frame
      rafIdRef.current = requestAnimationFrame(() => {
        if (!pendingUpdateRef.current || !seleccionInicioRef.current) return;
        
        const horaEntera = roundToHour(pendingUpdateRef.current.hora);
        const horaInicio = Math.min(seleccionInicioRef.current.hora, horaEntera);
        const horaFin = Math.max(seleccionInicioRef.current.hora + 1, horaEntera + 1);
        const horaFinValidada = Math.min(horaFin, 22);

        setSeleccionRango({ 
          espacioId: pendingUpdateRef.current.espacioId, 
          dia: pendingUpdateRef.current.dia, 
          horaInicio, 
          horaFin: horaFinValidada 
        });
        
        pendingUpdateRef.current = null;
      });
    },
    []
  );

  const finalizarSeleccion = useCallback(() => {
    // Cancelar cualquier RAF pendiente
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    if (!isDraggingRef.current || !seleccionRango) {
      isDraggingRef.current = false;
      seleccionInicioRef.current = null;
      setIsDragging(false);
      setSeleccionRango(null);
      return;
    }

    const espacio = espacios.find((e) => e.id === seleccionRango.espacioId);
    
    // Normalizar IDs a strings para comparación
    const seleccionEspacioId = String(seleccionRango.espacioId);
    const seleccionDia = seleccionRango.dia;
    
    // Buscar TODOS los conflictos inmediatamente al soltar
    const conflictosEnRango = horarios.filter(h => {
      const horarioEspacioId = String(h.espacioId);
      const horarioDia = h.dia;
      
      const matchEspacio = horarioEspacioId === seleccionEspacioId;
      const matchDia = horarioDia === seleccionDia;
      const overlap = seleccionRango.horaInicio < h.horaFin && seleccionRango.horaFin > h.horaInicio;
      
      return matchEspacio && matchDia && overlap;
    });
    
    // Mostrar toast de advertencia inmediatamente si hay conflictos
    if (conflictosEnRango.length > 0) {
      const listaConflictos = conflictosEnRango
        .map(c => `• ${c.materia || 'Horario ocupado'} (${c.horaInicio}:00-${c.horaFin}:00)`)
        .join('\n');
      toast.warning(
        `⚠️ El espacio ${espacio?.nombre || 'seleccionado'} tiene ${conflictosEnRango.length} horario(s) ocupado(s):\n${listaConflictos}`,
        { 
          duration: 6000,
          position: 'top-center'
        }
      );
    }

    const conflictoFinal = getConflictoEnRango(
      seleccionRango.espacioId,
      seleccionRango.dia,
      seleccionRango.horaInicio,
      seleccionRango.horaFin
    );
    if (conflictoFinal) {
      const tipoConflicto = conflictoFinal.tipo === 'prestamo' ? 'un préstamo' : 'una clase';
      const detalle = conflictoFinal.materia || conflictoFinal.tipo || 'Horario ocupado';
      toast.error(`❌ No se puede crear la solicitud. Hay ${tipoConflicto}: ${detalle} (${conflictoFinal.horaInicio}:00-${conflictoFinal.horaFin}:00)`);
      isDraggingRef.current = false;
      seleccionInicioRef.current = null;
      setIsDragging(false);
      setSeleccionRango(null);
      return;
    }

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
        isDraggingRef.current = false;
        seleccionInicioRef.current = null;
        setIsDragging(false);
        setSeleccionRango(null);
        return;
      }

      if (
        fechaBaseNormalizada.getTime() === hoyColombia.getTime() &&
        diferenciaDias === 0 &&
        seleccionRango.horaInicio < horaActualColombia
      ) {
        isDraggingRef.current = false;
        seleccionInicioRef.current = null;
        setIsDragging(false);
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
        isDraggingRef.current = false;
        seleccionInicioRef.current = null;
        setIsDragging(false);
        setSeleccionRango(null);
        return;
      }

      // Preparar conflictos para el modal
      const conflictosData: ConflictoInfo[] = conflictosEnRango.map(h => ({
        tipo: h.tipo || 'horario',
        materia: h.materia || 'Horario ocupado',
        horaInicio: h.horaInicio,
        horaFin: h.horaFin
      }));

      setNuevaSolicitudData({
        espacio_id: parseInt(espacio.id, 10),
        espacio_nombre: espacio.nombre,
        fecha: formatFechaLocalYYYYMMDD(fecha),
        horaInicio: `${seleccionRango.horaInicio.toString().padStart(2, '0')}:00`,
        horaFin: `${seleccionRango.horaFin.toString().padStart(2, '0')}:00`,
        diaSemana: seleccionRango.dia,
        conflictos: conflictosData.length > 0 ? conflictosData : undefined
      });
      
      setDialogSolicitudOpen(true);
    }

    isDraggingRef.current = false;
    seleccionInicioRef.current = null;
    setIsDragging(false);
    setSeleccionRango(null);
  }, [espacios, filterFechaInicio, getConflictoEnRango, seleccionRango, horarios]);

  const cancelarSeleccion = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    isDraggingRef.current = false;
    seleccionInicioRef.current = null;
    setIsDragging(false);
    setSeleccionRango(null);
  }, []);

  // Exponer ref para que el componente pueda leer el estado actual sin re-render
  const seleccionInicio = seleccionInicioRef.current;

  return {
    isDragging,
    seleccionInicio,
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
