import { Navigate, Route } from 'react-router-dom';
import { PublicLayout } from '../PublicLayout';
import {
  AsistentePublicoEmbebido,
  AsistentesVirtuales,
  ConsultaEspacios,
  PublicConsultaHorario,
  PublicDashboard,
  PublicPrestamo,
} from '../paginas';

/** Enlace público de una seccional al asistente virtual: sin menú ni sesión. */
export const rutasAsistentePublico = () => (
  <>
    <Route path="/asistente" element={<AsistentePublicoEmbebido />} />
    <Route path="/asistente/:seccional" element={<AsistentePublicoEmbebido />} />
  </>
);

/** Consultas públicas (con o sin sesión), tras la verificación de acceso. */
export const rutasPublicas = () => (
  <Route path="/public" element={<PublicLayout />}>
    <Route index element={<Navigate to="/public/dashboard" replace />} />
    <Route path="dashboard" element={<PublicDashboard />} />
    <Route path="consulta-horario" element={<PublicConsultaHorario />} />
    <Route path="disponibilidad-espacios" element={<ConsultaEspacios />} />
    <Route path="prestamo" element={<PublicPrestamo />} />
    <Route path="asistente-virtual" element={<AsistentesVirtuales />} />
    <Route path="espacios" element={<Navigate to="/public/dashboard" replace />} />
    <Route path="*" element={<Navigate to="/public/dashboard" replace />} />
  </Route>
);
