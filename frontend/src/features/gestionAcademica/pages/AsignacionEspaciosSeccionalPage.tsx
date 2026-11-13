import { useAsignacionEspaciosSeccionalPagina } from '../hooks/useAsignacionEspaciosSeccionalPagina';
import { EncabezadoAsignacion } from '../components/asignacionEspacios/EncabezadoAsignacion';
import { MensajesAsignacion } from '../components/asignacionEspacios/MensajesAsignacion';
import { FiltrosAsignacion } from '../components/asignacionEspacios/FiltrosAsignacion';
import { HorariosAsignacion } from '../components/asignacionEspacios/HorariosAsignacion';
import { DialogoAsignarEspacio } from '../components/asignacionEspacios/DialogoAsignarEspacio';


export default function AsignacionEspaciosSeccionalPage() {
  const gestion = useAsignacionEspaciosSeccionalPagina();

  return (
    <div className={`${gestion.isMobile ? 'p-4' : 'p-8'} space-y-6`}>
      <EncabezadoAsignacion />

      <MensajesAsignacion {...gestion} />

      <FiltrosAsignacion {...gestion} />

      <HorariosAsignacion {...gestion} />

      <DialogoAsignarEspacio {...gestion} />

    </div>
  );
}
