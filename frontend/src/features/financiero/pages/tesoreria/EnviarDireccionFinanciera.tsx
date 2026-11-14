import { useEnviarDireccionFinanciera } from '../../hooks/tesoreria/useEnviarDireccionFinanciera';
import { EncabezadoEnviarDireccion } from '../../components/tesoreria/enviarDireccionFinanciera/EncabezadoEnviarDireccion';
import { FiltrosEnviarDireccion } from '../../components/tesoreria/enviarDireccionFinanciera/FiltrosEnviarDireccion';
import { TablaEnviarDireccion } from '../../components/tesoreria/enviarDireccionFinanciera/TablaEnviarDireccion';
import { DialogoEnviarDireccion } from '../../components/tesoreria/enviarDireccionFinanciera/DialogoEnviarDireccion';
import { DialogoRechazarEnvio } from '../../components/tesoreria/enviarDireccionFinanciera/DialogoRechazarEnvio';
import { DetalleFacturaEnviarDireccion } from '../../components/tesoreria/enviarDireccionFinanciera/DetalleFacturaEnviarDireccion';


export default function EnviarDireccionFinanciera() {
  const gestion = useEnviarDireccionFinanciera();

  return (
    <>
      <div className="space-y-6">
        <EncabezadoEnviarDireccion />

        <FiltrosEnviarDireccion {...gestion} />

        <TablaEnviarDireccion {...gestion} />
      </div>

      <DialogoEnviarDireccion {...gestion} />

      <DialogoRechazarEnvio {...gestion} />

      <DetalleFacturaEnviarDireccion {...gestion} />

    </>
  );
}
