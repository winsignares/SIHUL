import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from '../../../../components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import type { usePublicPrestamo } from '../../hooks/usePublicPrestamo';

type PublicPrestamo = ReturnType<typeof usePublicPrestamo>;

/** Aviso de solicitud enviada. */
export function MensajeExito({
    showSuccess,
    successMessage,
    setShowSuccess
}: Pick<PublicPrestamo, 'showSuccess' | 'successMessage' | 'setShowSuccess'>) {
    return (
        <AnimatePresence>
            {showSuccess && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mb-6"
                >
                    <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="text-green-900 dark:text-green-100 font-semibold mb-1">
                                        ¡Solicitud Enviada!
                                    </h3>
                                    <p className="text-green-700 dark:text-green-300 text-sm">
                                        {successMessage}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowSuccess(false)}
                                    className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                                >
                                    ×
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
