import { useConfiguracionFinanciera } from '../../hooks/admin_financiero/useConfiguracionFinanciera';
import { EncabezadoConfiguracion } from '../../components/admin_financiero/configuracion/EncabezadoConfiguracion';
import { ResumenConfiguracion } from '../../components/admin_financiero/configuracion/ResumenConfiguracion';
import { BusquedaConfiguracion } from '../../components/admin_financiero/configuracion/BusquedaConfiguracion';
import { ParametrosPorCategoria } from '../../components/admin_financiero/configuracion/ParametrosPorCategoria';
import { BarraGuardarConfiguracion } from '../../components/admin_financiero/configuracion/BarraGuardarConfiguracion';
import { NotaConfiguracion } from '../../components/admin_financiero/configuracion/NotaConfiguracion';


export default function ConfiguracionReal() {
  const gestion = useConfiguracionFinanciera();

  return (
    <div className="space-y-6 pb-20">
      <EncabezadoConfiguracion {...gestion} />

      <ResumenConfiguracion {...gestion} />

      <BusquedaConfiguracion {...gestion} />

      <ParametrosPorCategoria {...gestion} />

      <BarraGuardarConfiguracion {...gestion} />

      <NotaConfiguracion />

    </div>
  );
}
