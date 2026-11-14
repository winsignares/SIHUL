import { useRegistrarPagoAplicado } from '../../hooks/tesoreria/useRegistrarPagoAplicado';
import { EncabezadoRegistrarPago } from '../../components/tesoreria/registrarPagoAplicado/EncabezadoRegistrarPago';
import { FiltrosRegistrarPago } from '../../components/tesoreria/registrarPagoAplicado/FiltrosRegistrarPago';
import { TablaRegistrarPago } from '../../components/tesoreria/registrarPagoAplicado/TablaRegistrarPago';
import { DialogoRegistrarPago } from '../../components/tesoreria/registrarPagoAplicado/DialogoRegistrarPago';
import { DetalleFacturaRegistrarPago } from '../../components/tesoreria/registrarPagoAplicado/DetalleFacturaRegistrarPago';


export default function RegistrarPagoAplicado() {
  const gestion = useRegistrarPagoAplicado();

  return (
    <>
      <div className="space-y-6">
        <EncabezadoRegistrarPago />

        <FiltrosRegistrarPago {...gestion} />

        <TablaRegistrarPago {...gestion} />
      </div>

      <DialogoRegistrarPago {...gestion} />

      <DetalleFacturaRegistrarPago {...gestion} />

    </>
  );
}
