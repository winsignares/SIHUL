import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
    chatbotAdminAPI,
    type ChatbotAgente,
    type ChatbotAgentePayload,
    type ChatbotDocumento,
} from '../../services/chatbot/chatbotAdminAPI';

export type ChatbotFormState = {
    nombre: string;
    subtitulo: string;
    descripcion: string;
    icono: string;
    color: string;
    bg_gradient: string;
    activo: boolean;
    mensaje_bienvenida: string;
    orden: number;
};

// El modelo Agente conserva endpoint_url por compatibilidad histórica (webhook de n8n),
// pero ya no se usa: las preguntas se enrutan siempre al servicio RAG interno (FastAPI + apikey de OpenAI).
// Se envía un valor fijo válido para satisfacer la validación del modelo sin exponerlo en el formulario.
const LEGACY_ENDPOINT_URL = 'http://chatbot:8001/api/v1/chat/ask';

const emptyForm: ChatbotFormState = {
    nombre: '',
    subtitulo: '',
    descripcion: '',
    icono: 'Bot',
    color: 'blue',
    bg_gradient: 'from-blue-500 via-blue-600 to-indigo-600',
    activo: true,
    mensaje_bienvenida: '',
    orden: 0,
};

const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

export function useGestionChatbots() {
    const [chatbots, setChatbots] = useState<ChatbotAgente[]>([]);
    const [sedes, setSedes] = useState<string[]>([]);
    const [documentos, setDocumentos] = useState<ChatbotDocumento[]>([]);

    const [loadingChatbots, setLoadingChatbots] = useState(true);
    const [loadingDocumentos, setLoadingDocumentos] = useState(false);
    const [savingChatbot, setSavingChatbot] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [accionId, setAccionId] = useState<number | null>(null);

    const [dialogChatbotOpen, setDialogChatbotOpen] = useState(false);
    const [editingChatbotId, setEditingChatbotId] = useState<number | null>(null);
    const [form, setForm] = useState<ChatbotFormState>(emptyForm);

    const [filtroChatbotId, setFiltroChatbotId] = useState<string>('all');
    const [filtroSede, setFiltroSede] = useState<string>('all');

    const [uploadChatbotId, setUploadChatbotId] = useState<string>('');
    const [uploadSede, setUploadSede] = useState<string>('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);

    const cargarChatbots = useCallback(async () => {
        setLoadingChatbots(true);
        try {
            const data = await chatbotAdminAPI.listarChatbots();
            setChatbots(data);
        } catch (error) {
            toast.error(getErrorMessage(error, 'No se pudieron cargar los chatbots.'));
        } finally {
            setLoadingChatbots(false);
        }
    }, []);

    const cargarSedes = useCallback(async () => {
        try {
            const data = await chatbotAdminAPI.listarSedes();
            setSedes(data);
        } catch (error) {
            toast.error(getErrorMessage(error, 'No se pudieron cargar las sedes.'));
        }
    }, []);

    const cargarDocumentos = useCallback(async () => {
        setLoadingDocumentos(true);
        try {
            const data = await chatbotAdminAPI.listarDocumentos({
                chatbot_id: filtroChatbotId !== 'all' ? Number(filtroChatbotId) : undefined,
                sede: filtroSede !== 'all' ? filtroSede : undefined,
                limit: 200,
            });
            setDocumentos(data);
        } catch (error) {
            toast.error(getErrorMessage(error, 'No se pudieron cargar los documentos.'));
        } finally {
            setLoadingDocumentos(false);
        }
    }, [filtroChatbotId, filtroSede]);

    useEffect(() => {
        void cargarChatbots();
        void cargarSedes();
    }, [cargarChatbots, cargarSedes]);

    useEffect(() => {
        void cargarDocumentos();
    }, [cargarDocumentos]);

    const chatbotsPorId = useMemo(
        () => Object.fromEntries(chatbots.map((c) => [c.id, c])),
        [chatbots]
    );

    const abrirNuevoChatbot = () => {
        setEditingChatbotId(null);
        setForm({ ...emptyForm });
        setDialogChatbotOpen(true);
    };

    const abrirEdicionChatbot = (chatbot: ChatbotAgente) => {
        setEditingChatbotId(chatbot.id);
        setForm({
            nombre: chatbot.nombre || '',
            subtitulo: chatbot.subtitulo || '',
            descripcion: chatbot.descripcion || '',
            icono: chatbot.icono || 'Bot',
            color: chatbot.color || 'blue',
            bg_gradient: chatbot.bg_gradient || 'from-blue-500 via-blue-600 to-indigo-600',
            activo: chatbot.activo ?? true,
            mensaje_bienvenida: chatbot.mensaje_bienvenida || '',
            orden: chatbot.orden ?? 0,
        });
        setDialogChatbotOpen(true);
    };

    const guardarChatbot = async () => {
        if (!form.nombre.trim() || !form.descripcion.trim() || !form.mensaje_bienvenida.trim()) {
            toast.error('Nombre, descripción y mensaje de bienvenida son obligatorios.');
            return;
        }

        setSavingChatbot(true);
        try {
            const payload: Partial<ChatbotAgentePayload> = {
                nombre: form.nombre.trim(),
                subtitulo: form.subtitulo.trim() || undefined,
                descripcion: form.descripcion.trim(),
                icono: form.icono.trim() || 'Bot',
                color: form.color.trim() || 'blue',
                bg_gradient: form.bg_gradient.trim() || 'from-blue-500 via-blue-600 to-indigo-600',
                activo: form.activo,
                mensaje_bienvenida: form.mensaje_bienvenida.trim(),
                orden: form.orden,
                endpoint_url: editingChatbotId ? undefined : LEGACY_ENDPOINT_URL,
            };

            if (editingChatbotId) {
                await chatbotAdminAPI.actualizarChatbot(editingChatbotId, payload);
                toast.success('Chatbot actualizado correctamente.');
            } else {
                await chatbotAdminAPI.crearChatbot(payload);
                toast.success('Chatbot creado correctamente.');
            }

            setDialogChatbotOpen(false);
            await cargarChatbots();
        } catch (error) {
            toast.error(getErrorMessage(error, 'No fue posible guardar el chatbot.'));
        } finally {
            setSavingChatbot(false);
        }
    };

    const alternarActivoChatbot = async (chatbot: ChatbotAgente) => {
        setAccionId(chatbot.id);
        try {
            await chatbotAdminAPI.actualizarChatbot(chatbot.id, { activo: !chatbot.activo });
            toast.success(`Chatbot ${chatbot.activo ? 'desactivado' : 'activado'} correctamente.`);
            await cargarChatbots();
        } catch (error) {
            toast.error(getErrorMessage(error, 'No fue posible cambiar el estado del chatbot.'));
        } finally {
            setAccionId(null);
        }
    };

    const eliminarChatbot = async (chatbot: ChatbotAgente) => {
        const confirmar = window.confirm(
            `¿Eliminar el chatbot "${chatbot.nombre}"? Sus documentos y conversaciones quedarán huérfanos.`
        );
        if (!confirmar) return;

        setAccionId(chatbot.id);
        try {
            await chatbotAdminAPI.eliminarChatbot(chatbot.id);
            toast.success('Chatbot eliminado correctamente.');
            await cargarChatbots();
            if (filtroChatbotId === String(chatbot.id)) {
                setFiltroChatbotId('all');
            }
        } catch (error) {
            toast.error(getErrorMessage(error, 'No fue posible eliminar el chatbot.'));
        } finally {
            setAccionId(null);
        }
    };

    const subirDocumento = async () => {
        if (!uploadChatbotId || !uploadSede || !uploadFile) {
            toast.error('Selecciona el chatbot, la sede y el archivo a subir.');
            return;
        }

        setUploading(true);
        try {
            await chatbotAdminAPI.subirDocumento({
                chatbot_id: Number(uploadChatbotId),
                sede: uploadSede,
                file: uploadFile,
            });
            toast.success('Documento subido y procesado correctamente.');
            setUploadFile(null);
            await cargarDocumentos();
        } catch (error) {
            toast.error(getErrorMessage(error, 'No fue posible subir el documento.'));
        } finally {
            setUploading(false);
        }
    };

    const eliminarDocumento = async (documento: ChatbotDocumento) => {
        const confirmar = window.confirm(`¿Eliminar el documento "${documento.filename}"?`);
        if (!confirmar) return;

        setAccionId(documento.id);
        try {
            await chatbotAdminAPI.eliminarDocumento(documento.id);
            toast.success('Documento eliminado correctamente.');
            await cargarDocumentos();
        } catch (error) {
            toast.error(getErrorMessage(error, 'No fue posible eliminar el documento.'));
        } finally {
            setAccionId(null);
        }
    };

    return {
        chatbots,
        chatbotsPorId,
        sedes,
        documentos,
        loadingChatbots,
        loadingDocumentos,
        savingChatbot,
        uploading,
        accionId,

        dialogChatbotOpen,
        setDialogChatbotOpen,
        editingChatbotId,
        form,
        setForm,
        abrirNuevoChatbot,
        abrirEdicionChatbot,
        guardarChatbot,
        alternarActivoChatbot,
        eliminarChatbot,

        filtroChatbotId,
        setFiltroChatbotId,
        filtroSede,
        setFiltroSede,

        uploadChatbotId,
        setUploadChatbotId,
        uploadSede,
        setUploadSede,
        uploadFile,
        setUploadFile,
        subirDocumento,
        eliminarDocumento,
    };
}
