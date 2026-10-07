import { Fragment, type ReactNode } from 'react';

export type AbrirCita = (archivo: string, pagina?: number) => void;

// «(nombre.pdf)», «(nombre.pdf, p. 36)» o «(nombre.pdf, p. 2; p. 3)»: la cita que el
// perfil investigativo pone tras cada afirmación. Solo se enlazan los PDF.
const CITA = /\(([^()\n]+?\.pdf)((?:\s*[,;]\s*p\.\s*\d+)*)\)/gi;
const PAGINA = /p\.\s*(\d+)/gi;

const claseEnlace =
    'font-medium text-red-700 underline decoration-dotted underline-offset-2 hover:text-red-900 dark:text-red-300 dark:hover:text-red-200';

/** Texto de un mensaje del bot en el que cada cita a un PDF es un enlace que abre su vista previa. */
export function MensajeConCitas({ texto, onAbrir }: { texto: string; onAbrir?: AbrirCita }) {
    if (!onAbrir) return <>{texto}</>;

    const partes: ReactNode[] = [];
    let ultimo = 0;
    let n = 0;
    for (const m of texto.matchAll(CITA)) {
        const inicio = m.index ?? 0;
        partes.push(texto.slice(ultimo, inicio));
        const archivo = m[1].trim();
        const paginas = [...m[2].matchAll(PAGINA)].map((p) => Number(p[1]));
        partes.push(
            <Fragment key={n++}>
                (
                <button type="button" className={claseEnlace} onClick={() => onAbrir(archivo, paginas[0])}>
                    {archivo}
                </button>
                {paginas.map((pagina, i) => (
                    <Fragment key={i}>
                        {i === 0 ? ', ' : '; '}
                        <button type="button" className={claseEnlace} onClick={() => onAbrir(archivo, pagina)}>
                            p. {pagina}
                        </button>
                    </Fragment>
                ))}
                )
            </Fragment>
        );
        ultimo = inicio + m[0].length;
    }
    partes.push(texto.slice(ultimo));
    return <>{partes}</>;
}
