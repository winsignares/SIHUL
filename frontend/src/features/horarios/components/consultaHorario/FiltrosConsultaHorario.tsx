import { Button } from '../../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Download, FileSpreadsheet } from 'lucide-react';
import type { usePublicConsultaHorarioPagina } from '../../hooks/usePublicConsultaHorarioPagina';

type Gestion = ReturnType<typeof usePublicConsultaHorarioPagina>;

/** Tipo de consulta y botones de descarga. */
export function FiltrosConsultaHorario({ tipoConsulta, setTipoConsulta, exportarPDF, exportarExcel }: Pick<Gestion, 'tipoConsulta' | 'setTipoConsulta' | 'exportarPDF' | 'exportarExcel'>) {
  return (
    <div className="flex items-center gap-4">
      <Select value={tipoConsulta} onValueChange={setTipoConsulta}>
        <SelectTrigger className="w-[300px]">
          <SelectValue placeholder="Tipo de consulta" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="horarios-programa">Horarios por Programa</SelectItem>
          <SelectItem value="horarios-docente">Horarios por Docente</SelectItem>
        </SelectContent>
      </Select>
      <Button
        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
        onClick={exportarPDF}
      >
        <Download className="w-4 h-4 mr-2" />
        Descargar PDF
      </Button>
      <Button
        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
        onClick={exportarExcel}
      >
        <FileSpreadsheet className="w-4 h-4 mr-2" />
        Descargar Excel
      </Button>
    </div>
  );
}
