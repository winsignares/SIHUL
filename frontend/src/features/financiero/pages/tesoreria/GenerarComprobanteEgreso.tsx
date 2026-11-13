import { useGenerarComprobanteEgreso } from '../../hooks/tesoreria/useGenerarComprobanteEgreso';
import { EncabezadoComprobanteEgreso } from '../../components/tesoreria/generarComprobanteEgreso/EncabezadoComprobanteEgreso';
import { FiltrosComprobanteEgreso } from '../../components/tesoreria/generarComprobanteEgreso/FiltrosComprobanteEgreso';
import { TablaComprobanteEgreso } from '../../components/tesoreria/generarComprobanteEgreso/TablaComprobanteEgreso';
import { DetalleFacturaComprobanteEgreso } from '../../components/tesoreria/generarComprobanteEgreso/DetalleFacturaComprobanteEgreso';


export default function GenerarComprobanteEgreso() {
  const gestion = useGenerarComprobanteEgreso();

  return (
    <>
      <div className="space-y-6">
        <EncabezadoComprobanteEgreso />

        <FiltrosComprobanteEgreso {...gestion} />

        <TablaComprobanteEgreso {...gestion} />
      </div>

      <DetalleFacturaComprobanteEgreso {...gestion} />

    </>
  );
}
