import { TableCell, TableRow } from '../../share/table';
import { Loading } from './Loading';

interface FilaVaciaTablaProps {
  colSpan: number;
  /** Mientras la lista se está cargando se muestra el indicador en vez del mensaje de vacío */
  cargando?: boolean;
  mensajeCargando?: string;
  mensajeVacio: string;
}

/** Fila única de una tabla sin datos: indicador de carga mientras llegan, o el mensaje de que no hay. */
export function FilaVaciaTabla({ colSpan, cargando = false, mensajeCargando = 'Cargando...', mensajeVacio }: FilaVaciaTablaProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-8 text-center text-slate-500 dark:text-slate-400">
        {cargando ? <Loading compact message={mensajeCargando} /> : mensajeVacio}
      </TableCell>
    </TableRow>
  );
}

export default FilaVaciaTabla;
