import { useMisFacturas } from '../../hooks/proveedor/useMisFacturas';
import { EncabezadoMisFacturas } from '../../components/proveedor/misFacturas/EncabezadoMisFacturas';
import { ResumenMisFacturas } from '../../components/proveedor/misFacturas/ResumenMisFacturas';
import { FiltrosMisFacturas } from '../../components/proveedor/misFacturas/FiltrosMisFacturas';
import { ErrorMisFacturas } from '../../components/proveedor/misFacturas/ErrorMisFacturas';
import { ListaMisFacturas } from '../../components/proveedor/misFacturas/ListaMisFacturas';
import { PaginacionMisFacturas } from '../../components/proveedor/misFacturas/PaginacionMisFacturas';
import { DialogoDocumentosFactura } from '../../components/proveedor/misFacturas/DialogoDocumentosFactura';
import { AlertCircle } from 'lucide-react';
import type { MisFacturasProps } from '../../models/proveedor';

export default function MisFacturas({ miProveedor }: MisFacturasProps) {
  const gestion = useMisFacturas({ miProveedor });

  if (!miProveedor) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <AlertCircle className="text-slate-400" size={48} />
        <p className="text-slate-600 dark:text-slate-400 text-center">
          No se encontró tu perfil de proveedor. Completa el proceso de identificación primero.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EncabezadoMisFacturas {...gestion} />

      <ResumenMisFacturas {...gestion} />

      <FiltrosMisFacturas {...gestion} />

      <ErrorMisFacturas {...gestion} />

      <ListaMisFacturas {...gestion} />

      <PaginacionMisFacturas {...gestion} />

      <DialogoDocumentosFactura {...gestion} />

    </div>
  );
}
