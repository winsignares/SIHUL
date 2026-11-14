import { usePublicConsultaHorarioPagina } from '../hooks/usePublicConsultaHorarioPagina';
import { EncabezadoConsultaHorario } from '../components/consultaHorario/EncabezadoConsultaHorario';
import { FiltrosConsultaHorario } from '../components/consultaHorario/FiltrosConsultaHorario';
import { ContenidoConsultaHorario } from '../components/consultaHorario/ContenidoConsultaHorario';
import { DialogoHorarioGrupo } from '../components/consultaHorario/DialogoHorarioGrupo';
import { DialogoHorarioDocente } from '../components/consultaHorario/DialogoHorarioDocente';
import { Toaster } from '../../../components/ui/sonner';

export default function PublicConsultaHorario() {
  const gestion = usePublicConsultaHorarioPagina();

  return (
    <div className={`${gestion.isMobile ? 'p-4' : 'p-8'} space-y-6 overflow-y-auto max-h-screen`}>
      <EncabezadoConsultaHorario {...gestion} />

      <FiltrosConsultaHorario {...gestion} />

      <ContenidoConsultaHorario {...gestion} />

      <DialogoHorarioGrupo {...gestion} />

      <DialogoHorarioDocente {...gestion} />

      <Toaster />
    </div>
  );
}
