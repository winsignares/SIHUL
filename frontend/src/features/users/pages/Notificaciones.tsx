import { useNotificacionesPagina } from '../hooks/useNotificacionesPagina';
import { EncabezadoNotificaciones } from '../components/notificaciones/EncabezadoNotificaciones';
import { EstadisticasNotificaciones } from '../components/notificaciones/EstadisticasNotificaciones';
import { PestanasNotificaciones } from '../components/notificaciones/PestanasNotificaciones';
import { PaginacionNotificaciones } from '../components/notificaciones/PaginacionNotificaciones';
import { DialogoRechazoSolicitud } from '../components/notificaciones/DialogoRechazoSolicitud';

interface NotificacionesProps {
  onNotificacionesChange?: (count: number) => void;
}

export default function Notificaciones({ onNotificacionesChange }: NotificacionesProps) {
  const gestion = useNotificacionesPagina(onNotificacionesChange);

  return (
    <div className="p-8 space-y-6">
      <EncabezadoNotificaciones {...gestion} />

      <EstadisticasNotificaciones {...gestion} />

      <PestanasNotificaciones {...gestion} />

      {gestion.totalPaginas > 1 && <PaginacionNotificaciones {...gestion} />}

      <DialogoRechazoSolicitud {...gestion} />
    </div>
  );
}
