import { useState, useEffect } from 'react';
import type { Asistente } from '../../../../models/index';

/** Preguntas sugeridas del asistente activo: hasta 4, que se rotan cada 10 segundos si hay más. */
export function useRotacionPreguntas(asistenteActivo: Asistente | null) {
    const [preguntasRotadas, setPreguntasRotadas] = useState<string[]>([]);

    useEffect(() => {
        if (!asistenteActivo?.preguntasRapidas?.length) {
            setPreguntasRotadas([]);
            return;
        }

        const rotarPreguntas = () => {
            const todas = asistenteActivo.preguntasRapidas;
            // Si hay 4 o menos, mostrar todas sin rotar
            if (todas.length <= 4) {
                setPreguntasRotadas(todas);
                return;
            }

            // Mezclar y tomar 4 aleatorias
            const shuffled = [...todas].sort(() => 0.5 - Math.random());
            setPreguntasRotadas(shuffled.slice(0, 4));
        };

        rotarPreguntas(); // Carga inicial

        // Rotar cada 10 segundos
        const interval = setInterval(rotarPreguntas, 10000);

        return () => clearInterval(interval);
    }, [asistenteActivo]);

    return preguntasRotadas;
}
