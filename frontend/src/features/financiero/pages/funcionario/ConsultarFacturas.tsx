import { useConsultarFacturas } from '../../hooks/funcionario/useConsultarFacturas';
import { EncabezadoConsultarFacturas } from '../../components/funcionario/consultarFacturas/EncabezadoConsultarFacturas';
import { AvisoCambiosEstado } from '../../components/funcionario/consultarFacturas/AvisoCambiosEstado';
import { FiltrosConsultarFacturas } from '../../components/funcionario/consultarFacturas/FiltrosConsultarFacturas';
import { TablaConsultarFacturas } from '../../components/funcionario/consultarFacturas/TablaConsultarFacturas';
import { DetalleFacturaConsultar } from '../../components/funcionario/consultarFacturas/DetalleFacturaConsultar';
import { CargandoDetalleConsultar } from '../../components/funcionario/consultarFacturas/CargandoDetalleConsultar';


export default function ConsultarFacturas() {
  const gestion = useConsultarFacturas();

  return (
    <div className="space-y-6">
      <EncabezadoConsultarFacturas />

      <AvisoCambiosEstado {...gestion} />

      <FiltrosConsultarFacturas {...gestion} />

      <TablaConsultarFacturas {...gestion} />

      <DetalleFacturaConsultar {...gestion} />

      <CargandoDetalleConsultar {...gestion} />

    </div>
  );
}
