import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Badge } from '../../share/badge';
import { Input } from '../../share/input';
import { chatbotAdminAPI, type ChatbotResponsable } from '../../services/chatbot/chatbotAdminAPI';

const mostrarSeccional = (value?: string | null) => (value ?? 'sin seccional').replaceAll('_', ' ');

interface Props {
    value: ChatbotResponsable[];
    onChange: (responsables: ChatbotResponsable[]) => void;
}

/**
 * Personas encargadas de cargar la documentación de un chatbot. Se buscan por nombre o correo
 * y se agregan como chips; al guardar el chatbot se guardan con él. La seccional con la que
 * suben sale del usuario de cada una, no se elige aquí.
 */
export function ResponsablesSelector({ value, onChange }: Props) {
    const [texto, setTexto] = useState('');
    const [resultados, setResultados] = useState<ChatbotResponsable[]>([]);
    const [buscando, setBuscando] = useState(false);

    useEffect(() => {
        const consulta = texto.trim();
        if (consulta.length < 2) {
            setResultados([]);
            return undefined;
        }
        let cancelado = false;
        const temporizador = window.setTimeout(async () => {
            setBuscando(true);
            try {
                const encontrados = await chatbotAdminAPI.buscarResponsables(consulta);
                if (!cancelado) setResultados(encontrados);
            } catch {
                if (!cancelado) setResultados([]);
            } finally {
                if (!cancelado) setBuscando(false);
            }
        }, 300);
        return () => {
            cancelado = true;
            window.clearTimeout(temporizador);
        };
    }, [texto]);

    const yaAsignados = new Set(value.map((persona) => persona.id));
    const disponibles = resultados.filter((persona) => !yaAsignados.has(persona.id));

    const agregar = (persona: ChatbotResponsable) => {
        onChange([...value, persona]);
        setTexto('');
        setResultados([]);
    };

    return (
        <div className="space-y-2">
            {value.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {value.map((persona) => (
                        <Badge key={persona.id} variant="outline" className="flex items-center gap-1 py-1 pl-2 pr-1 font-normal">
                            <span title={persona.correo}>{persona.nombre}</span>
                            <span className="text-[10px] capitalize text-slate-500">· {mostrarSeccional(persona.seccional)}</span>
                            <button
                                type="button"
                                aria-label={`Quitar a ${persona.nombre}`}
                                className="rounded p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                                onClick={() => onChange(value.filter((otra) => otra.id !== persona.id))}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                    className="pl-9"
                    placeholder="Buscar por nombre o correo para agregar..."
                    value={texto}
                    onChange={(event) => setTexto(event.target.value)}
                />
            </div>
            {texto.trim().length >= 2 && (
                <div className="max-h-44 overflow-y-auto rounded-md border bg-white text-sm shadow-sm">
                    {buscando && <p className="px-3 py-2 text-slate-500">Buscando...</p>}
                    {!buscando && disponibles.length === 0 && (
                        <p className="px-3 py-2 text-slate-500">Sin resultados. Solo aparecen usuarios activos con seccional asignada.</p>
                    )}
                    {disponibles.map((persona) => (
                        <button
                            key={persona.id}
                            type="button"
                            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-slate-50"
                            onClick={() => agregar(persona)}
                        >
                            <span><span className="font-medium text-slate-800">{persona.nombre}</span> <span className="text-xs text-slate-500">{persona.correo}</span></span>
                            <span className="text-xs capitalize text-slate-500">{mostrarSeccional(persona.seccional)}</span>
                        </button>
                    ))}
                </div>
            )}
            <p className="text-xs text-slate-500">
                Estas personas podrán subir documentos y preguntas-respuestas <strong>solo a este chatbot</strong>, siempre de la seccional de su propio usuario.
            </p>
        </div>
    );
}
