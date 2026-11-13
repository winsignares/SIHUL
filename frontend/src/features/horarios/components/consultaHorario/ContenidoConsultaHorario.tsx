import { motion } from 'motion/react';
import { HorariosPorDocente } from './HorariosPorDocente';
import { HorariosPorPrograma } from './HorariosPorPrograma';
import type { usePublicConsultaHorarioPagina } from '../../hooks/usePublicConsultaHorarioPagina';

type Gestion = ReturnType<typeof usePublicConsultaHorarioPagina>;

/** Horarios por docente o por programa, según el tipo de consulta. */
export function ContenidoConsultaHorario(gestion: Gestion) {
  return (
    <motion.div
      key={gestion.tipoConsulta}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {gestion.tipoConsulta === 'horarios-docente' ? <HorariosPorDocente {...gestion} /> : <HorariosPorPrograma {...gestion} />}
    </motion.div>
  );
}
