import { useConsultaEspaciosPagina } from '../hooks/useConsultaEspaciosPagina';
import { EncabezadoConsulta } from '../components/consulta/EncabezadoConsulta';
import { EstadisticasConsulta } from '../components/consulta/EstadisticasConsulta';
import { BarraVistaConsulta } from '../components/consulta/BarraVistaConsulta';
import { FiltrosConsulta } from '../components/consulta/FiltrosConsulta';
import { VistasConsulta } from '../components/consulta/VistasConsulta';
import { DialogosConsulta } from '../components/consulta/DialogosConsulta';

export default function ConsultaEspacios() {
  const gestion = useConsultaEspaciosPagina();

  return (
    <div className={`${gestion.isMobile ? 'p-4' : 'p-8'} space-y-6`}>
      <EncabezadoConsulta {...gestion} />

      <EstadisticasConsulta {...gestion} />

      <BarraVistaConsulta {...gestion} />

      <FiltrosConsulta {...gestion} />

      <VistasConsulta {...gestion} />

      <DialogosConsulta {...gestion} />
    </div>
  );
}
