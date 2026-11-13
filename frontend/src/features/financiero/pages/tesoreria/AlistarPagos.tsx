import { useAlistarPagos } from '../../hooks/tesoreria/useAlistarPagos';
import { EncabezadoAlistarPagos } from '../../components/tesoreria/alistarPagos/EncabezadoAlistarPagos';
import { FiltrosAlistarPagos } from '../../components/tesoreria/alistarPagos/FiltrosAlistarPagos';
import { TablaAlistarPagos } from '../../components/tesoreria/alistarPagos/TablaAlistarPagos';
import { DialogoAlistarPago } from '../../components/tesoreria/alistarPagos/DialogoAlistarPago';
import { DialogoRechazarAlistamiento } from '../../components/tesoreria/alistarPagos/DialogoRechazarAlistamiento';
import { DetalleFacturaAlistarPagos } from '../../components/tesoreria/alistarPagos/DetalleFacturaAlistarPagos';


export default function AlistarPagos() {
  const gestion = useAlistarPagos();

  return (
    <>
      <div className="space-y-6">
        <EncabezadoAlistarPagos />

        <FiltrosAlistarPagos {...gestion} />

        <TablaAlistarPagos {...gestion} />
      </div>

      <DialogoAlistarPago {...gestion} />

      <DialogoRechazarAlistamiento {...gestion} />

      <DetalleFacturaAlistarPagos {...gestion} />

    </>
  );
}
