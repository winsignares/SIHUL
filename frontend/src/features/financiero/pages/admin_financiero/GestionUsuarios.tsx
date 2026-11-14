import { useGestionUsuariosFinanciero } from '../../hooks/admin_financiero/useGestionUsuariosFinanciero';
import { EncabezadoUsuarios } from '../../components/gestionUsuarios/EncabezadoUsuarios';
import { TarjetaUsuarios } from '../../components/gestionUsuarios/TarjetaUsuarios';
import { DialogoNuevoUsuario } from '../../components/gestionUsuarios/DialogoNuevoUsuario';
import { DialogoEditarUsuario } from '../../components/gestionUsuarios/DialogoEditarUsuario';

export default function GestionUsuariosReal() {
  const gestion = useGestionUsuariosFinanciero();

  return (
    <div className="space-y-6">
      <EncabezadoUsuarios />

      <TarjetaUsuarios {...gestion} />

      <DialogoNuevoUsuario {...gestion} />

      <DialogoEditarUsuario {...gestion} />
    </div>
  );
}
