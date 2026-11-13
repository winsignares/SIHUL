import React from 'react';
import { toast } from 'sonner';
import { useNotificaciones } from './useNotificaciones';
import { useAuth } from '../../../context/AuthContext';
import { solicitudEspacioService } from '../../horarios/services/solicitudEspacioAPI';
import { useNavigate } from 'react-router-dom';

/** Estado y acciones de la página de notificaciones (aprobar, rechazar y modificar solicitudes). */
export function useNotificacionesPagina(onNotificacionesChange?: (count: number) => void) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [procesando, setProcesando] = React.useState(false);
  const [showModalRechazo, setShowModalRechazo] = React.useState(false);
  const [motivoRechazo, setMotivoRechazo] = React.useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [notificacionSeleccionada, setNotificacionSeleccionada] = React.useState<any>(null);
  const {
    filterTab,
    setFilterTab,
    marcarComoLeida,
    marcarTodasComoLeidas,
    filteredNotificaciones,
    stats,
    isLoading,
    recargar,
    paginaActual,
    totalPaginas,
    totalNotificaciones,
    cambiarPagina,
    busqueda,
    setBusqueda,
    filtroTiempo,
    setFiltroTiempo,
    filtroPrioridad,
    setFiltroPrioridad,
  } = useNotificaciones(onNotificacionesChange);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAprobarSolicitud = async (notificacion: any) => {
    if (!user?.id) return;
    try {
      setProcesando(true);
      // Extraer ID de solicitud del mensaje (formato: "ID: {numero}")
      console.log('Notificación:', notificacion);
      console.log('Descripción:', notificacion.descripcion);
      
      // Intentar extraer ID de varias formas
      let solicitudId = 0;
      
      // Intento 1: Buscar "ID: numero"
      let match = notificacion.descripcion.match(/ID:\s*(\d+)/);
      if (match) {
        solicitudId = parseInt(match[1]);
      } else {
        // Intento 2: Buscar solo números al inicio
        match = notificacion.descripcion.match(/\((\d+)\)/);
        if (match) {
          solicitudId = parseInt(match[1]);
        } else {
          // Intento 3: Buscar cualquier número
          match = notificacion.descripcion.match(/\d+/);
          if (match) {
            solicitudId = parseInt(match[0]);
          }
        }
      }
      
      console.log('Solicitud ID extraído:', solicitudId);
      
      if (!solicitudId) {
        toast.error('No se pudo identificar la solicitud. Mensaje: ' + notificacion.descripcion);
        return;
      }
      
      await solicitudEspacioService.aprobar({
        solicitud_id: solicitudId,
        admin_id: user.id,
        comentario: 'Aprobado desde notificaciones'
      });
      
      // Marcar como leída para que se mueva a "Espacios"
      await marcarComoLeida(notificacion.id);
      await recargar();
      toast.success('✅ Solicitud aprobada correctamente');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error completo:', error);
      const errorMsg = error?.response?.data?.error || error?.message || 'Error desconocido';
      toast.error(`Error al aprobar: ${errorMsg}`);
    } finally {
      setProcesando(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleModificarSolicitud = async (notificacion: any) => {
    if (!user?.id) return;
    try {
      setProcesando(true);
      // Extraer ID de solicitud del mensaje (formato: "ID: {numero}")
      console.log('Notificación:', notificacion);
      console.log('Descripción:', notificacion.descripcion);
      
      // Intentar extraer ID de varias formas
      let solicitudId = 0;
      
      // Intento 1: Buscar "ID: numero"
      let match = notificacion.descripcion.match(/ID:\s*(\d+)/);
      if (match) {
        solicitudId = parseInt(match[1]);
      } else {
        // Intento 2: Buscar solo números al inicio
        match = notificacion.descripcion.match(/\((\d+)\)/);
        if (match) {
          solicitudId = parseInt(match[1]);
        } else {
          // Intento 3: Buscar cualquier número
          match = notificacion.descripcion.match(/\d+/);
          if (match) {
            solicitudId = parseInt(match[0]);
          }
        }
      }
      
      console.log('Solicitud ID extraído:', solicitudId);
      
      if (!solicitudId) {
        toast.error('No se pudo identificar la solicitud. Mensaje: ' + notificacion.descripcion);
        return;
      }
      
      // Navegar a la página de solicitudes para editar
      window.location.href = `/admin/solicitudes-espacio?edit=${solicitudId}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Error al intentar modificar la solicitud');
    } finally {
      setProcesando(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAbrirModalRechazo = (notificacion: any) => {
    setNotificacionSeleccionada(notificacion);
    setMotivoRechazo('');
    setShowModalRechazo(true);
  };

  const handleConfirmarRechazo = async () => {
    if (!user?.id || !notificacionSeleccionada) return;
    
    // Validar que el motivo no esté vacío
    if (!motivoRechazo.trim()) {
      toast.error('⚠️ Debes proporcionar un motivo para rechazar la solicitud');
      return;
    }

    try {
      setProcesando(true);
      const notificacion = notificacionSeleccionada;
      
      // Extraer ID de solicitud del mensaje
      console.log('Notificación:', notificacion);
      console.log('Descripción:', notificacion.descripcion);
      
      // Intentar extraer ID de varias formas
      let solicitudId = 0;
      
      // Intento 1: Buscar "ID: numero"
      let match = notificacion.descripcion.match(/ID:\s*(\d+)/);
      if (match) {
        solicitudId = parseInt(match[1]);
      } else {
        // Intento 2: Buscar solo números al inicio
        match = notificacion.descripcion.match(/\((\d+)\)/);
        if (match) {
          solicitudId = parseInt(match[1]);
        } else {
          // Intento 3: Buscar cualquier número
          match = notificacion.descripcion.match(/\d+/);
          if (match) {
            solicitudId = parseInt(match[0]);
          }
        }
      }
      
      console.log('Solicitud ID extraído:', solicitudId);
      
      if (!solicitudId) {
        toast.error('No se pudo identificar la solicitud. Mensaje: ' + notificacion.descripcion);
        return;
      }
      
      await solicitudEspacioService.rechazar({
        solicitud_id: solicitudId,
        admin_id: user.id,
        comentario: motivoRechazo
      });
      
      // Marcar como leída para que se mueva a "Espacios"
      await marcarComoLeida(notificacion.id);
      await recargar();
      toast.success('✅ Solicitud rechazada correctamente');
      
      // Cerrar modal
      setShowModalRechazo(false);
      setMotivoRechazo('');
      setNotificacionSeleccionada(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error completo:', error);
      const errorMsg = error?.response?.data?.error || error?.message || 'Error desconocido';
      toast.error(`Error al rechazar: ${errorMsg}`);
    } finally {
      setProcesando(false);
    }
  };

  const getFacturaRoute = (notif: { titulo?: string; descripcion?: string; tipo?: string }) => {
    const tipo = (notif.tipo || '').toLowerCase();
    if (!['factura_etapa_actualizada', 'factura_devuelta'].includes(tipo)) return null;

    const raw = `${notif.titulo || ''} ${notif.descripcion || ''}`;
    
    // Intentar extraer el número de factura del mensaje (formato: FAC-YYYY-NNNN)
    let facturaId = null;
    const facturaMatch = raw.match(/FAC-\d{4}-\d{4}/);
    const numeroFactura = facturaMatch?.[0];
    
    // Si no encuentra el número, intentar buscar un ID numérico
    if (!numeroFactura) {
      const idMatch = raw.match(/factura\s+(\d+)|id[:\s]+(\d+)/i);
      facturaId = idMatch?.[1] || idMatch?.[2];
    }

    const rolNombre = (user?.rol?.nombre || '').trim().toLowerCase();
    if (rolNombre === 'proveedor' && (numeroFactura || facturaId)) {
      // Si tenemos el número de factura, buscar su ID en la base de datos
      // Por ahora, usamos el ID si lo encontramos, o navegamos a mis-facturas
      if (facturaId) {
        return `/financiero/proveedor/mis-facturas/${facturaId}`;
      } else if (numeroFactura) {
        // Si solo tenemos el número, navegamos a mis-facturas para que el usuario lo busque
        return `/financiero/proveedor/mis-facturas`;
      }
    }

    return null;
  };

  return {
    navigate, procesando, showModalRechazo, setShowModalRechazo, motivoRechazo, setMotivoRechazo,
    setNotificacionSeleccionada, filterTab, setFilterTab, marcarComoLeida, marcarTodasComoLeidas,
    filteredNotificaciones, stats, isLoading, paginaActual, totalPaginas, totalNotificaciones, cambiarPagina,
    busqueda, setBusqueda, filtroTiempo, setFiltroTiempo, filtroPrioridad, setFiltroPrioridad,
    handleAprobarSolicitud, handleModificarSolicitud, handleAbrirModalRechazo, handleConfirmarRechazo, getFacturaRoute,
  };
}
