import { useMisPendientesFuncionario } from '../../hooks/funcionario/useMisPendientesFuncionario';
import { EncabezadoMisPendientes } from '../../components/funcionario/misPendientes/EncabezadoMisPendientes';
import { ResumenMisPendientes } from '../../components/funcionario/misPendientes/ResumenMisPendientes';
import { TablaMisPendientes } from '../../components/funcionario/misPendientes/TablaMisPendientes';
import { DetalleFacturaMisPendientes } from '../../components/funcionario/misPendientes/DetalleFacturaMisPendientes';
import { CargandoDetallePendientes } from '../../components/funcionario/misPendientes/CargandoDetallePendientes';
import { DialogoRechazarPendiente } from '../../components/funcionario/misPendientes/DialogoRechazarPendiente';


export default function MisPendientes() {
  const gestion = useMisPendientesFuncionario();

  return (
    <div className="space-y-6">
      <EncabezadoMisPendientes />

      <ResumenMisPendientes {...gestion} />

      <TablaMisPendientes {...gestion} />

      <DetalleFacturaMisPendientes {...gestion} />

      <CargandoDetallePendientes {...gestion} />

      <DialogoRechazarPendiente {...gestion} />

    </div>
  );
}
