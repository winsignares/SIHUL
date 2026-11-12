import { Badge } from '../../../../components/ui/badge';

/** Insignia con el estado de una solicitud de préstamo. */
export const getEstadoBadge = (estado: string) => {
  switch (estado) {
    case 'pendiente':
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendiente</Badge>;
    case 'aprobado':
      return <Badge className="bg-green-100 text-green-800 border-green-300">Aprobado</Badge>;
    case 'rechazado':
      return <Badge className="bg-red-100 text-red-800 border-red-300">Rechazado</Badge>;
    default:
      return null;
  }
};
