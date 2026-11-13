import { useGestionProveedores } from '../../hooks/admin_financiero/useGestionProveedores';
import { EncabezadoProveedores } from '../../components/gestionProveedores/EncabezadoProveedores';
import { TarjetaProveedores } from '../../components/gestionProveedores/TarjetaProveedores';
import { DialogoProveedor } from '../../components/gestionProveedores/DialogoProveedor';

export default function GestionProveedoresReal() {
  const gestion = useGestionProveedores();

  return (
    <div className="space-y-6">
      <EncabezadoProveedores />

      <TarjetaProveedores {...gestion} />

      <DialogoProveedor {...gestion} />
    </div>
  );
}
