import { motion } from 'framer-motion';
import { Card, CardContent } from '../../../../components/ui/card';

/** Indicadores del control previo. */
export function ResumenControlPrevio() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
      <Card className="border-0 shadow-lg bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-700">
            Alcance de auditoría: revisar causación contable, soportes y distribución del rubro. No revisa disponibilidad presupuestal.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
