import { useAdminFinancieroHome } from '../../hooks/admin_financiero/useAdminFinancieroHome';
import { EncabezadoAdminHome } from '../../components/admin_financiero/home/EncabezadoAdminHome';
import { EstadoCargaAdminHome } from '../../components/admin_financiero/home/EstadoCargaAdminHome';
import { SeguimientoAdminHome } from '../../components/admin_financiero/home/SeguimientoAdminHome';
import type { AdminFinancieroHomeProps } from '../../hooks/admin_financiero/adminFinancieroHomeUtils';

export default function AdminFinancieroHomeReal({ onNavigate }: AdminFinancieroHomeProps) {
  const gestion = useAdminFinancieroHome({ onNavigate });

  return (
    <div className="space-y-6">
      <EncabezadoAdminHome {...gestion} />

      <EstadoCargaAdminHome {...gestion} />

      <SeguimientoAdminHome {...gestion} />

    </div>
  );
}
