import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { normalizeRole } from '../../context/roleUtils';
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

const MAX_PDF_SIZE_BYTES = 15 * 1024 * 1024;

const validarDocumentoPdf = (file: File): string | null => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
        return 'Solo se permiten documentos en formato PDF.';
    }
    if (file.size > MAX_PDF_SIZE_BYTES) {
        return 'El documento no puede superar los 15 MB.';
    }
    return null;
};

export function useGestionChatbots() {
    const { user } = useAuth();
    const [chatbots, setChatbots] = useState<ChatbotAgente[]>([]);
    const [sedesDisponibles, setSedesDisponibles] = useState<string[]>([]);
    const [documentos, setDocumentos] = useState<ChatbotDocumento[]>([]);

    const [loadingChatbots, setLoadingChatbots] = useState(true);
    const [loadingDocumentos, setLoadingDocumentos] = useState(true);
    const [loadingSeccional, setLoadingSeccional] = useState(true);
    const [savingChatbot, setSavingChatbot] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [accionId, setAccionId] = useState<number | null>(null);

    const [dialogChatbotOpen, setDialogChatbotOpen] = useState(false);
    const [editingChatbotId, setEditingChatbotId] = useState<number | null>(null);
    const [form, setForm] = useState<ChatbotFormState>(emptyForm);

    const [filtroChatbotId, setFiltroChatbotId] = useState<string>('all');
    const [busquedaDocumento, setBusquedaDocumento] = useState('');
    const [uploadChatbotId, setUploadChatbotId] = useState<string>('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadInputKey, setUploadInputKey] = useState(0);
    const [documentoActualizar, setDocumentoActualizar] = useState<ChatbotDocumento | null>(null);
    const [archivoActualizacion, setArchivoActualizacion] = useState<File | null>(null);
    const [actualizacionChatbotId, setActualizacionChatbotId] = useState('');

    const normalizarSeccional = useCallback((value?: string | null) => (
        (value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
    ), []);

    const seccionalUsuario = useMemo(() => {
        const sede = user?.sede;
        return normalizarSeccional(sede?.seccional_ciudad || sede?.ciudad || sede?.nombre);
    }, [normalizarSeccional, user?.sede]);

    const seccionalValida = Boolean(
        seccionalUsuario && sedesDisponibles.includes(seccionalUsuario)
    );
    const puedeGestionarChatbots = seccionalUsuario === 'barranquilla'
        && normalizeRole(user?.rol?.nombre) === 'admin';

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
        setLoadingSeccional(true);
        try {
            const data = await chatbotAdminAPI.listarSedes();
            setSedesDisponibles(data.map(normalizarSeccional));
        } catch (error) {
            toast.error(getErrorMessage(error, 'No se pudieron cargar las sedes.'));
        } finally {
            setLoadingSeccional(false);
        }
    }, [normalizarSeccional]);

    const cargarDocumentos = useCallback(async () => {
        if (!seccionalValida) {
            setDocumentos([]);
            setLoadingDocumentos(false);
            return;
        }

        setLoadingDocumentos(true);
        try {
            const data = await chatbotAdminAPI.listarDocumentos({
                chatbot_id: filtroChatbotId !== 'all' ? Number(filtroChatbotId) : undefined,
                sede: seccionalUsuario,
                limit: 200,
            });
            // Defensa adicional en cliente: nunca renderizar documentos de otra seccional,
            // incluso si el servicio remoto respondiera datos fuera del filtro solicitado.
            setDocumentos(data.filter((documento) => normalizarSeccional(documento.sede) === seccionalUsuario));
        } catch (error) {
            toast.error(getErrorMessage(error, 'No se pudieron cargar los documentos.'));
        } finally {
            setLoadingDocumentos(false);
        }
    }, [filtroChatbotId, normalizarSeccional, seccionalUsuario, seccionalValida]);

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

    const documentosFiltrados = useMemo(() => {
        const termino = busquedaDocumento.trim().toLowerCase();
        if (!termino) return documentos;
        return documentos.filter((documento) => {
            const chatbot = documento.chatbot_id ? chatbotsPorId[documento.chatbot_id]?.nombre : '';
            return documento.filename.toLowerCase().includes(termino)
                || chatbot?.toLowerCase().includes(termino);
        });
    }, [busquedaDocumento, chatbotsPorId, documentos]);

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
        if (!seccionalValida) {
            toast.error('Tu usuario no tiene una seccional válida asignada.');
            return;
        }
        if (!uploadChatbotId || !uploadFile) {
            toast.error('Selecciona el chatbot y el archivo a subir.');
            return;
        }
        const errorArchivo = validarDocumentoPdf(uploadFile);
        if (errorArchivo) {
            toast.error(errorArchivo);
            return;
        }

        setUploading(true);
        try {
            await chatbotAdminAPI.subirDocumento({
                chatbot_id: Number(uploadChatbotId),
                sede: seccionalUsuario,
                file: uploadFile,
            });
            toast.success('Documento subido y procesado correctamente.');
            setUploadFile(null);
            setUploadInputKey((value) => value + 1);
            await cargarDocumentos();
        } catch (error) {
            toast.error(getErrorMessage(error, 'No fue posible subir el documento.'));
        } finally {
            setUploading(false);
        }
    };

    const seleccionarArchivoCarga = (file: File | null) => {
        if (!file) {
            setUploadFile(null);
            return;
        }
        const errorArchivo = validarDocumentoPdf(file);
        if (errorArchivo) {
            toast.error(errorArchivo);
            setUploadFile(null);
            setUploadInputKey((value) => value + 1);
            return;
        }
        setUploadFile(file);
    };

    const abrirActualizacionDocumento = (documento: ChatbotDocumento) => {
        setDocumentoActualizar(documento);
        setArchivoActualizacion(null);
        setActualizacionChatbotId(documento.chatbot_id ? String(documento.chatbot_id) : '');
    };

    const cerrarActualizacionDocumento = () => {
        if (!uploading) {
            setDocumentoActualizar(null);
            setArchivoActualizacion(null);
            setActualizacionChatbotId('');
        }
    };

    const actualizarDocumento = async () => {
        if (!documentoActualizar || !archivoActualizacion || !actualizacionChatbotId || !seccionalValida) {
            toast.error('Selecciona el chatbot y el nuevo archivo para actualizar el documento.');
            return;
        }
        const errorArchivo = validarDocumentoPdf(archivoActualizacion);
        if (errorArchivo) {
            toast.error(errorArchivo);
            return;
        }

        setUploading(true);
        let nuevoDocumentoCargado = false;
        try {
            await chatbotAdminAPI.subirDocumento({
                chatbot_id: Number(actualizacionChatbotId),
                sede: seccionalUsuario,
                file: archivoActualizacion,
            });
            nuevoDocumentoCargado = true;
            await chatbotAdminAPI.eliminarDocumento(documentoActualizar.id);
            toast.success('Documento actualizado y procesado correctamente.');
            setDocumentoActualizar(null);
            setArchivoActualizacion(null);
            setActualizacionChatbotId('');
            await cargarDocumentos();
        } catch (error) {
            if (nuevoDocumentoCargado) {
                toast.warning('El archivo nuevo se cargó, pero no fue posible retirar la versión anterior.');
                await cargarDocumentos();
            } else {
                toast.error(getErrorMessage(error, 'No fue posible actualizar el documento.'));
            }
        } finally {
            setUploading(false);
        }
    };

    const seleccionarArchivoActualizacion = (file: File | null) => {
        if (!file) {
            setArchivoActualizacion(null);
            return;
        }
        const errorArchivo = validarDocumentoPdf(file);
        if (errorArchivo) {
            toast.error(errorArchivo);
            setArchivoActualizacion(null);
            return;
        }
        setArchivoActualizacion(file);
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
        documentos,
        documentosFiltrados,
        seccionalUsuario,
        seccionalValida,
        puedeGestionarChatbots,
        loadingChatbots,
        loadingDocumentos,
        loadingSeccional,
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
        busquedaDocumento,
        setBusquedaDocumento,

        uploadChatbotId,
        setUploadChatbotId,
        uploadFile,
        seleccionarArchivoCarga,
        uploadInputKey,
        subirDocumento,
        documentoActualizar,
        archivoActualizacion,
        seleccionarArchivoActualizacion,
        actualizacionChatbotId,
        setActualizacionChatbotId,
        abrirActualizacionDocumento,
        cerrarActualizacionDocumento,
        actualizarDocumento,
        eliminarDocumento,
    };
}
