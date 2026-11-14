import { Button } from '../../../components/ui/button';
import { Plus } from 'lucide-react';
import { useEspaciosFisicos } from '../hooks/useEspaciosFisicos';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { DialogoTipoEspacio } from '../components/espaciosFisicos/DialogoTipoEspacio';
import { FiltrosEspacios } from '../components/espaciosFisicos/FiltrosEspacios';
import { TablaEspacios } from '../components/espaciosFisicos/TablaEspacios';
import { PaginacionEspacios } from '../components/espaciosFisicos/PaginacionEspacios';
import { DialogoCrearEspacio } from '../components/espaciosFisicos/DialogoCrearEspacio';
import { DialogoEditarEspacio } from '../components/espaciosFisicos/DialogoEditarEspacio';
import { DialogoEliminarEspacio } from '../components/espaciosFisicos/DialogoEliminarEspacio';

export default function EspaciosFisicos() {
  const isMobile = useIsMobile();
  const espaciosFisicos = useEspaciosFisicos();
  const { puedeCrearEspacios, puedeCrearTipos, setShowCreateTipoDialog, setShowCreateDialog } = espaciosFisicos;

  return (
    <div className={`${isMobile ? 'p-4' : 'p-8'} space-y-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-slate-900 dark:text-slate-100 text-lg font-semibold">Gestión de Espacios Físicos</h2>
        </div>
        <div className="flex gap-2">
          {puedeCrearTipos && (
            <Button
              onClick={() => setShowCreateTipoDialog(true)}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Tipo
            </Button>
          )}
          {puedeCrearEspacios && (
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Espacio
            </Button>
          )}
        </div>
      </div>

      {/* ==================== MODAL: CREAR TIPO DE ESPACIO ==================== */}
      <DialogoTipoEspacio {...espaciosFisicos} />

      {/* Filtros */}
      <FiltrosEspacios {...espaciosFisicos} isMobile={isMobile} />

      {/* Tabla */}
      <TablaEspacios {...espaciosFisicos} />

      <PaginacionEspacios {...espaciosFisicos} />

      {/* ==================== MODAL: CREAR ESPACIO ==================== */}
      <DialogoCrearEspacio {...espaciosFisicos} />

      {/* ==================== MODAL: EDITAR ESPACIO ==================== */}
      <DialogoEditarEspacio {...espaciosFisicos} />

      {/* ==================== MODAL: ELIMINAR ESPACIO ==================== */}
      <DialogoEliminarEspacio {...espaciosFisicos} />
    </div>
  );
}
