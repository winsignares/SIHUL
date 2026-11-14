import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { usePublicPrestamo } from '../hooks/usePublicPrestamo';
import { MensajeExito } from '../components/publicPrestamo/MensajeExito';
import { FormularioSolicitud } from '../components/publicPrestamo/FormularioSolicitud';
import { MisSolicitudes } from '../components/publicPrestamo/MisSolicitudes';

export default function PublicPrestamo() {
    const publicPrestamo = usePublicPrestamo();

    if (publicPrestamo.loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-yellow-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
            >
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-slate-900 dark:text-slate-100 mb-2">
                        Solicitud de Préstamo de Espacios
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Complete el formulario para solicitar el préstamo de un espacio físico
                    </p>
                </div>


                <MensajeExito {...publicPrestamo} />

                <FormularioSolicitud {...publicPrestamo} />

                <MisSolicitudes {...publicPrestamo} />
            </motion.div>
        </div>
    );
}
