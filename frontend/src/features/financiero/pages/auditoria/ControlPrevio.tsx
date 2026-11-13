import { useControlPrevio } from '../../hooks/auditoria/useControlPrevio';
import { EncabezadoControlPrevio } from '../../components/controlPrevio/EncabezadoControlPrevio';
import { ResumenControlPrevio } from '../../components/controlPrevio/ResumenControlPrevio';
import { FiltrosControlPrevio } from '../../components/controlPrevio/FiltrosControlPrevio';
import { TablaControlPrevio } from '../../components/controlPrevio/TablaControlPrevio';
import { DialogoAprobarControlPrevio } from '../../components/controlPrevio/DialogoAprobarControlPrevio';
import { DialogoRechazarControlPrevio } from '../../components/controlPrevio/DialogoRechazarControlPrevio';
import { DetalleFacturaControlPrevio } from '../../components/controlPrevio/DetalleFacturaControlPrevio';


export default function ControlPrevio() {
  const gestion = useControlPrevio();

  return (
    <>
      <div className="space-y-6">
        <EncabezadoControlPrevio />

        <ResumenControlPrevio />

        <FiltrosControlPrevio {...gestion} />

        <TablaControlPrevio {...gestion} />
      </div>

      <DialogoAprobarControlPrevio {...gestion} />

      <DialogoRechazarControlPrevio {...gestion} />

      <DetalleFacturaControlPrevio {...gestion} />

    </>
  );
}
