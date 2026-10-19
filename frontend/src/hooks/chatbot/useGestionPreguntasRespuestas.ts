import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { chatbotAdminAPI, type ChatbotAgente, type PreguntaRespuestaChatbot } from '../../services/chatbot/chatbotAdminAPI';
import { ANEXO_EXTENSIONES, ANEXO_MAX_MB, ANEXO_MAX_POR_RESPUESTA } from '../../models/chatbot/chatbotAdmin.model';

export type PreguntaRespuestaForm = {
    agente: string;
    pregunta: string;
    respuesta: string;
    activo: boolean;
};

const formVacio: PreguntaRespuestaForm = { agente: '', pregunta: '', respuesta: '', activo: true };

// apiClient lanza un objeto { message, status } (no una instancia de Error)
const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error) return error.message;
    if (error && typeof error === 'object' && 'message' in error) {
        const { message } = error as { message: unknown };
        if (typeof message === 'string' && message) return message;
    }
    return fallback;
};

/** Misma regla que el backend (validar_anexo): Word, PDF o Excel de hasta ANEXO_MAX_MB. */
export const validarAnexo = (file: File): string | null => {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!(ANEXO_EXTENSIONES as readonly string[]).includes(extension)) {
        return `«${file.name}»: solo se permiten Word (.doc, .docx), PDF (.pdf) y Excel (.xls, .xlsx).`;
    }
    if (file.size === 0) return `«${file.name}» está vacío.`;
    if (file.size > ANEXO_MAX_MB * 1024 * 1024) return `«${file.name}» supera el máximo de ${ANEXO_MAX_MB} MB.`;
    return null;
};

/**
 * Preguntas-respuestas oficiales de los chatbots de la seccional del usuario, con sus
 * anexos (documentos de soporte que el chatbot entrega para descargar).
 */
export function useGestionPreguntasRespuestas({ seccional, seccionalValida, chatbots }: {
    seccional: string;
    seccionalValida: boolean;
    chatbots: ChatbotAgente[];
}) {
    const [items, setItems] = useState<PreguntaRespuestaChatbot[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroChatbotId, setFiltroChatbotId] = useState('all');
    const [busqueda, setBusqueda] = useState('');
    const [accionId, setAccionId] = useState<number | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editando, setEditando] = useState<PreguntaRespuestaChatbot | null>(null);
    const [form, setForm] = useState<PreguntaRespuestaForm>(formVacio);
    const [anexosNuevos, setAnexosNuevos] = useState<File[]>([]);
    const [anexosEliminar, setAnexosEliminar] = useState<number[]>([]);
    const [inputKey, setInputKey] = useState(0);
    const [saving, setSaving] = useState(false);

    const cargar = useCallback(async () => {
        if (!seccionalValida) {
            setItems([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            setItems(await chatbotAdminAPI.listarPreguntasRespuestas({ sede: seccional }));
        } catch (error) {
            toast.error(getErrorMessage(error, 'No se pudieron cargar las preguntas y respuestas.'));
        } finally {
            setLoading(false);
        }
    }, [seccional, seccionalValida]);

    useEffect(() => {
        void cargar();
    }, [cargar]);

    const itemsFiltrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();
        return items.filter((item) => (
            (filtroChatbotId === 'all' || item.agente === Number(filtroChatbotId))
            && (!termino
                || item.pregunta.toLowerCase().includes(termino)
                || item.respuesta.toLowerCase().includes(termino)
                || item.anexos.some((anexo) => anexo.nombre.toLowerCase().includes(termino)))
        ));
    }, [busqueda, filtroChatbotId, items]);

    const chatbotsActivos = useMemo(() => chatbots.filter((chatbot) => chatbot.activo), [chatbots]);

    const anexosConservados = (editando?.anexos ?? []).filter((anexo) => !anexosEliminar.includes(anexo.id));
    const totalAnexos = anexosConservados.length + anexosNuevos.length;

    const reiniciarDialogo = (item: PreguntaRespuestaChatbot | null) => {
        setEditando(item);
        setForm(item
            ? { agente: String(item.agente), pregunta: item.pregunta, respuesta: item.respuesta, activo: item.activo }
            : { ...formVacio, agente: filtroChatbotId !== 'all' ? filtroChatbotId : '' });
        setAnexosNuevos([]);
        setAnexosEliminar([]);
        setInputKey((value) => value + 1);
    };

    const abrirNueva = () => {
        reiniciarDialogo(null);
        setDialogOpen(true);
    };

    const abrirEdicion = (item: PreguntaRespuestaChatbot) => {
        reiniciarDialogo(item);
        setDialogOpen(true);
    };

    const cerrarDialogo = () => {
        if (!saving) setDialogOpen(false);
    };

    const agregarArchivos = (files: FileList | null) => {
        const seleccion = Array.from(files ?? []);
        setInputKey((value) => value + 1); // permite volver a elegir el mismo archivo
        if (!seleccion.length) return;
        const validos: File[] = [];
        for (const file of seleccion) {
            const error = validarAnexo(file);
            if (error) {
                toast.error(error);
            } else {
                validos.push(file);
            }
        }
        const cupo = ANEXO_MAX_POR_RESPUESTA - totalAnexos;
        if (validos.length > cupo) {
            toast.error(`Cada respuesta admite máximo ${ANEXO_MAX_POR_RESPUESTA} anexos.`);
        }
        if (cupo > 0) setAnexosNuevos((prev) => [...prev, ...validos.slice(0, cupo)]);
    };

    const quitarArchivoNuevo = (index: number) => {
        setAnexosNuevos((prev) => prev.filter((_, i) => i !== index));
    };

    const alternarEliminarAnexo = (id: number) => {
        setAnexosEliminar((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const guardar = async () => {
        if (!seccionalValida) {
            toast.error('Tu usuario no tiene una seccional válida asignada.');
            return;
        }
        if (!form.agente || !form.pregunta.trim() || !form.respuesta.trim()) {
            toast.error('Chatbot, pregunta y respuesta son obligatorios.');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                agente: Number(form.agente),
                pregunta: form.pregunta.trim(),
                respuesta: form.respuesta.trim(),
                activo: form.activo,
                anexosNuevos,
            };
            if (editando) {
                await chatbotAdminAPI.actualizarPreguntaRespuesta(editando.id, { ...payload, anexosEliminar });
                toast.success('Pregunta y respuesta actualizadas.');
            } else {
                await chatbotAdminAPI.crearPreguntaRespuesta({ ...payload, sede: seccional });
                toast.success('Pregunta y respuesta registradas.');
            }
            setDialogOpen(false);
            await cargar();
        } catch (error) {
            toast.error(getErrorMessage(error, 'No fue posible guardar la pregunta y respuesta.'));
        } finally {
            setSaving(false);
        }
    };

    const alternarActivo = async (item: PreguntaRespuestaChatbot) => {
        setAccionId(item.id);
        try {
            await chatbotAdminAPI.actualizarPreguntaRespuesta(item.id, {
                agente: item.agente,
                pregunta: item.pregunta,
                respuesta: item.respuesta,
                activo: !item.activo,
                anexosNuevos: [],
            });
            toast.success(item.activo ? 'Pregunta desactivada.' : 'Pregunta activada.');
            await cargar();
        } catch (error) {
            toast.error(getErrorMessage(error, 'No fue posible cambiar el estado.'));
        } finally {
            setAccionId(null);
        }
    };

    const eliminar = async (item: PreguntaRespuestaChatbot) => {
        const confirmar = window.confirm(
            `¿Eliminar la pregunta "${item.pregunta.slice(0, 80)}"${item.anexos.length ? ` y sus ${item.anexos.length} anexo(s)` : ''}?`
        );
        if (!confirmar) return;
        setAccionId(item.id);
        try {
            await chatbotAdminAPI.eliminarPreguntaRespuesta(item.id);
            toast.success('Pregunta y respuesta eliminadas.');
            await cargar();
        } catch (error) {
            toast.error(getErrorMessage(error, 'No fue posible eliminar la pregunta y respuesta.'));
        } finally {
            setAccionId(null);
        }
    };

    return {
        items,
        itemsFiltrados,
        loading,
        chatbotsActivos,
        filtroChatbotId,
        setFiltroChatbotId,
        busqueda,
        setBusqueda,
        accionId,
        dialogOpen,
        editando,
        form,
        setForm,
        anexosNuevos,
        anexosEliminar,
        anexosConservados,
        totalAnexos,
        inputKey,
        saving,
        abrirNueva,
        abrirEdicion,
        cerrarDialogo,
        agregarArchivos,
        quitarArchivoNuevo,
        alternarEliminarAnexo,
        guardar,
        alternarActivo,
        eliminar,
    };
}
