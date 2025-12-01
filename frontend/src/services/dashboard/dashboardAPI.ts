import { apiClient } from '../../core/apiClient';
import { prestamoService } from '../prestamos/prestamoAPI';
import type { PrestamoEspacio } from '../prestamos/prestamoAPI';
import { espacioService } from '../espacios/espaciosAPI';
import { listarNotificaciones } from '../notificaciones/notificacionesAPI';

export interface OccupationStats {
  day: string;
  dayShort: string;
  value: number;
  espaciosOcupados: number;
  totalEspacios: number;
  prestamosActivos: number;
  color: string;
  isToday?: boolean;
}

export interface OccupationDetail {
  day: string;
  franjas: {
    hora: string;
    ocupacion: number;
    espaciosUsados: number;
    totalEspacios: number;
    color: string;
  }[];
}

export interface ActivityRecent {
  id: string;
  title: string;
  description: string;
  time: string;
  date: string;
  status: 'pending' | 'completed';
  icon: any;
  color: string;
}

export interface DashboardStats {
  ocupacionSemanal: OccupationStats[];
  ocupacionDetallada: OccupationDetail[];
  actividadesRecientes: ActivityRecent[];
}

/**
 * Calcula estadísticas de ocupación de espacios basadas en horarios y préstamos
 */
export const obtenerEstadisticasOcupacion = async (): Promise<{
  ocupacionSemanal: OccupationStats[];
  ocupacionDetallada: OccupationDetail[];
}> => {
  try {
    // Obtener todos los préstamos y espacios
    const [prestamosResponse, espaciosResponse] = await Promise.all([
      prestamoService.listarPrestamos(),
      espacioService.list()
    ]);

    const prestamos = prestamosResponse.prestamos || [];
    const totalEspacios = espaciosResponse.espacios?.length || 1;

    // Días de la semana
    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    
    // Franjas horarias (formato 24h)
    const franjasHorarias = [
      { inicio: 6, fin: 8, label: '6:00 - 8:00' },
      { inicio: 8, fin: 10, label: '8:00 - 10:00' },
      { inicio: 10, fin: 12, label: '10:00 - 12:00' },
      { inicio: 12, fin: 14, label: '12:00 - 14:00' },
      { inicio: 14, fin: 16, label: '14:00 - 16:00' },
      { inicio: 16, fin: 18, label: '16:00 - 18:00' },
      { inicio: 18, fin: 20, label: '18:00 - 20:00' },
      { inicio: 20, fin: 22, label: '20:00 - 22:00' }
    ];

    // Calcular ocupación por día y franja horaria
    const ocupacionPorDiaYFranja: { [key: string]: { [key: string]: Set<number> } } = {};
    
    diasSemana.forEach(dia => {
      ocupacionPorDiaYFranja[dia] = {};
      franjasHorarias.forEach(franja => {
        ocupacionPorDiaYFranja[dia][franja.label] = new Set();
      });
    });

    // Obtener la fecha actual y calcular el rango de la semana actual
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay() + 1); // Lunes de esta semana
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6); // Domingo de esta semana

    // Procesar préstamos de la semana actual
    prestamos.forEach(prestamo => {
      const fechaPrestamo = new Date(prestamo.fecha);
      
      // Solo considerar préstamos de la semana actual y con estado Aprobado o Pendiente
      if (
        fechaPrestamo >= inicioSemana && 
        fechaPrestamo <= finSemana &&
        (prestamo.estado === 'Aprobado' || prestamo.estado === 'Pendiente')
      ) {
        const diaIndex = fechaPrestamo.getDay() === 0 ? 6 : fechaPrestamo.getDay() - 1; // Ajustar domingo
        const diaNombre = diasSemana[diaIndex];
        
        // Extraer hora de inicio y fin
        const horaInicio = parseInt(prestamo.hora_inicio.split(':')[0]);
        const horaFin = parseInt(prestamo.hora_fin.split(':')[0]);
        
        // Marcar franjas horarias ocupadas
        franjasHorarias.forEach(franja => {
          // Si hay solapamiento entre el préstamo y la franja
          if (horaInicio < franja.fin && horaFin > franja.inicio) {
            ocupacionPorDiaYFranja[diaNombre][franja.label].add(prestamo.espacio_id);
          }
        });
      }
    });

    // Obtener el día actual para marcarlo
    const diaActualIndex = hoy.getDay() === 0 ? 6 : hoy.getDay() - 1;
    const diaActualNombre = diasSemana[diaActualIndex];

    // Calcular porcentajes de ocupación por día
    const ocupacionSemanal: OccupationStats[] = diasSemana.map((dia, index) => {
      // Contar espacios únicos ocupados en todas las franjas del día
      const espaciosOcupadosSet = new Set<number>();
      let totalPrestamosDelDia = 0;

      franjasHorarias.forEach(franja => {
        const espaciosEnFranja = ocupacionPorDiaYFranja[dia][franja.label];
        espaciosEnFranja.forEach(espacioId => espaciosOcupadosSet.add(espacioId));
        totalPrestamosDelDia += espaciosEnFranja.size;
      });

      const espaciosOcupados = espaciosOcupadosSet.size;
      const porcentajeOcupacion = totalEspacios > 0 
        ? Math.round((espaciosOcupados / totalEspacios) * 100)
        : 0;

      // Determinar color según ocupación con gradiente más visual
      let color = 'from-emerald-400 to-emerald-600';
      if (porcentajeOcupacion === 0) {
        color = 'from-slate-300 to-slate-400';
      } else if (porcentajeOcupacion < 30) {
        color = 'from-green-400 to-green-600';
      } else if (porcentajeOcupacion < 50) {
        color = 'from-blue-400 to-blue-600';
      } else if (porcentajeOcupacion < 70) {
        color = 'from-amber-400 to-amber-600';
      } else if (porcentajeOcupacion < 90) {
        color = 'from-orange-400 to-orange-600';
      } else {
        color = 'from-red-400 to-red-600';
      }

      const diasCortos = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

      return {
        day: dia,
        dayShort: diasCortos[index],
        value: porcentajeOcupacion,
        espaciosOcupados,
        totalEspacios,
        prestamosActivos: totalPrestamosDelDia,
        color,
        isToday: dia === diaActualNombre
      };
    });

    // Calcular ocupación detallada por franja
    const ocupacionDetallada: OccupationDetail[] = diasSemana.map(dia => {
      const franjas = franjasHorarias.map(franja => {
        const espaciosOcupados = ocupacionPorDiaYFranja[dia][franja.label].size;
        const porcentaje = totalEspacios > 0 
          ? Math.round((espaciosOcupados / totalEspacios) * 100)
          : 0;

        let color = 'from-emerald-400 to-emerald-600';
        if (porcentaje === 0) {
          color = 'from-slate-300 to-slate-400';
        } else if (porcentaje < 30) {
          color = 'from-green-400 to-green-600';
        } else if (porcentaje < 50) {
          color = 'from-blue-400 to-blue-600';
        } else if (porcentaje < 70) {
          color = 'from-amber-400 to-amber-600';
        } else if (porcentaje < 90) {
          color = 'from-orange-400 to-orange-600';
        } else {
          color = 'from-red-400 to-red-600';
        }

        return {
          hora: franja.label,
          ocupacion: porcentaje,
          espaciosUsados: espaciosOcupados,
          totalEspacios,
          color
        };
      });

      return {
        day: dia,
        franjas
      };
    });

    return {
      ocupacionSemanal,
      ocupacionDetallada
    };
  } catch (error) {
    console.error('Error al obtener estadísticas de ocupación:', error);
    // Retornar datos vacíos en caso de error
    return {
      ocupacionSemanal: [],
      ocupacionDetallada: []
    };
  }
};

/**
 * Calcula el tiempo transcurrido desde una fecha
 */
const calcularTiempoTranscurrido = (fecha: Date): string => {
  const ahora = new Date();
  const diffMs = ahora.getTime() - fecha.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
  return `Hace ${Math.floor(diffDays / 30)} mes${Math.floor(diffDays / 30) > 1 ? 'es' : ''}`;
};

/**
 * Obtiene las actividades recientes del sistema desde las NOTIFICACIONES REALES
 * El backend Django ya registra TODAS las acciones del sistema automáticamente vía signals
 */
export const obtenerActividadesRecientes = async (usuarioId?: number): Promise<ActivityRecent[]> => {
  try {
    const actividades: ActivityRecent[] = [];

    // ========== OBTENER TODAS LAS NOTIFICACIONES DEL SISTEMA ==========
    // El backend registra automáticamente TODAS las acciones vía Django signals
    try {
      const notificacionesResponse = await listarNotificaciones();
      const notificaciones = notificacionesResponse.notificaciones || [];

      // Mapear cada notificación a una actividad
      notificaciones.forEach((notif) => {
        const fechaNotif = new Date(notif.fecha_creacion);
        
        // Determinar color según el tipo de notificación
        let color = 'bg-blue-500';
        
        if (notif.tipo_notificacion.includes('CREADO') || notif.tipo_notificacion.includes('CREADA')) {
          color = 'bg-emerald-500';
        } else if (notif.tipo_notificacion.includes('ELIMINADO') || notif.tipo_notificacion.includes('ELIMINADA')) {
          color = 'bg-red-500';
        } else if (notif.tipo_notificacion.includes('ACTUALIZADO') || notif.tipo_notificacion.includes('ACTUALIZADA')) {
          color = 'bg-amber-500';
        } else if (notif.tipo_notificacion.includes('APROBADO') || notif.tipo_notificacion.includes('APROBADA')) {
          color = 'bg-green-500';
        } else if (notif.tipo_notificacion.includes('RECHAZADO') || notif.tipo_notificacion.includes('RECHAZADA')) {
          color = 'bg-red-600';
        } else if (notif.tipo_notificacion.includes('CONFLICTO')) {
          color = 'bg-orange-500';
        } else if (notif.tipo_notificacion.includes('HORARIO')) {
          color = 'bg-violet-500';
        } else if (notif.tipo_notificacion.includes('ESPACIO')) {
          color = 'bg-cyan-500';
        } else if (notif.tipo_notificacion.includes('PROGRAMA') || notif.tipo_notificacion.includes('FACULTAD')) {
          color = 'bg-indigo-500';
        } else if (notif.tipo_notificacion.includes('ASIGNATURA') || notif.tipo_notificacion.includes('GRUPO')) {
          color = 'bg-purple-500';
        } else if (notif.tipo_notificacion.includes('SEDE')) {
          color = 'bg-teal-500';
        } else if (notif.tipo_notificacion.includes('USUARIO') || notif.tipo_notificacion.includes('ROL')) {
          color = 'bg-pink-500';
        } else if (notif.tipo_notificacion.includes('PRESTAMO')) {
          color = 'bg-sky-500';
        }

        // Asignar prioridad de color
        if (notif.prioridad === 'alta') {
          color = 'bg-red-500';
        }

        // Formatear el título desde el tipo de notificación
        const titulo = notif.tipo_notificacion
          .replace(/_/g, ' ')
          .toLowerCase()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        actividades.push({
          id: `notif-${notif.id}`,
          title: titulo,
          description: notif.mensaje,
          time: calcularTiempoTranscurrido(fechaNotif),
          date: notif.fecha_creacion.split('T')[0],
          status: 'completed',
          icon: null,
          color
        });
      });
    } catch (error) {
      console.error('Error al cargar notificaciones del sistema:', error);
    }

    // Ordenar todas las actividades por fecha más reciente
    const actividadesOrdenadas = actividades
      .sort((a, b) => {
        const fechaA = new Date(a.date + 'T00:00:00');
        const fechaB = new Date(b.date + 'T00:00:00');
        return fechaB.getTime() - fechaA.getTime();
      })
      .slice(0, 50); // Limitar a 50 actividades más recientes

    return actividadesOrdenadas;
  } catch (error) {
    console.error('Error al obtener actividades recientes:', error);
    return [];
  }
};

/**
 * Obtiene todas las estadísticas del dashboard
 */
export const obtenerEstadisticasDashboard = async (usuarioId?: number): Promise<DashboardStats> => {
  const [ocupacion, actividades] = await Promise.all([
    obtenerEstadisticasOcupacion(),
    obtenerActividadesRecientes(usuarioId)
  ]);

  return {
    ocupacionSemanal: ocupacion.ocupacionSemanal,
    ocupacionDetallada: ocupacion.ocupacionDetallada,
    actividadesRecientes: actividades
  };
};
