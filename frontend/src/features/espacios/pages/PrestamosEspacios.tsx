import { usePrestamosEspaciosPagina } from '../hooks/usePrestamosEspaciosPagina';
import { EncabezadoPrestamos } from '../components/prestamos/EncabezadoPrestamos';
import { EstadisticasPrestamos } from '../components/prestamos/EstadisticasPrestamos';
import { FiltrosPrestamos } from '../components/prestamos/FiltrosPrestamos';
import { ListaPrestamos } from '../components/prestamos/ListaPrestamos';
import { CuadriculaPrestamos } from '../components/prestamos/CuadriculaPrestamos';
import { DetalleSolicitudCuadricula } from '../components/prestamos/DetalleSolicitudCuadricula';
import { PaginacionPrestamos } from '../components/prestamos/PaginacionPrestamos';

export default function PrestamosEspacios() {
  const gestion = usePrestamosEspaciosPagina();

  return (
    <div className={`${gestion.isMobile ? 'p-4' : 'p-8'} space-y-6`}>
      <EncabezadoPrestamos />

      <EstadisticasPrestamos {...gestion} />

      <FiltrosPrestamos {...gestion} />

      <ListaPrestamos {...gestion} />

      <CuadriculaPrestamos {...gestion} />

      <DetalleSolicitudCuadricula {...gestion} />

      <PaginacionPrestamos {...gestion} />
    </div>
  );
}
