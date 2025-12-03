import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Gift, Bot } from 'lucide-react';
import { publicServices } from '../../services/publicServices';

export interface QuickAccessItem {
  id: string;
  label: string;
  description: string;
  icon: any;
  gradient: string;
  bgGradient: string;
  badge: string;
  route: string;
}

export function usePublicDashboard() {
  const navigate = useNavigate();

  const quickAccessItems: QuickAccessItem[] = [
    {
      id: 'horario',
      label: 'Consulta de Horario',
      description: 'Visualiza horarios disponibles',
      icon: Clock,
      gradient: 'from-blue-500 to-cyan-600',
      bgGradient: 'from-blue-50 to-cyan-50',
      badge: 'Próximamente',
      route: '/public/consulta-horario'
    },
    {
      id: 'disponibilidad',
      label: 'Disponibilidad de Espacios',
      description: 'Espacios libres en tiempo real',
      icon: MapPin,
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50',
      badge: 'Próximamente',
      route: '/public/disponibilidad-espacios'
    },
    {
      id: 'prestamo',
      label: 'Solicitud de Préstamo',
      description: 'Solicita préstamo de recursos',
      icon: Gift,
      gradient: 'from-amber-500 to-orange-600',
      bgGradient: 'from-amber-50 to-orange-50',
      badge: 'Próximamente',
      route: '/public/prestamo'
    },
    {
      id: 'asistente',
      label: 'Asistente Virtual',
      description: 'Soporte automático disponible',
      icon: Bot,
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-50 to-pink-50',
      badge: 'Próximamente',
      route: '/public/asistente-virtual'
    }
  ];

  const handleNavigateToService = async (route: string, serviceId: string) => {
    try {
      // Llamar al servicio correspondiente si es necesario
      switch (serviceId) {
        case 'horario':
          await publicServices.consultaHorario();
          break;
        case 'disponibilidad':
          await publicServices.disponibilidadEspacios();
          break;
        case 'prestamo':
          await publicServices.prestamo();
          break;
        case 'asistente':
          await publicServices.asistenteVirtual();
          break;
      }
      
      // Navegar a la ruta
      navigate(route);
    } catch (error) {
      console.error('Error al acceder al servicio:', error);
      // Aún así navegar a la ruta incluso si hay error
      navigate(route);
    }
  };

  return {
    quickAccessItems,
    handleNavigateToService
  };
}
