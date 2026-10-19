import { BookOpen, Bot, DoorOpen, Headphones, Trophy, type LucideIcon } from 'lucide-react';
import type { AnexoChatbot } from './chatbot';
export type ChatbotTipo = 'normativo' | 'investigativo';

// Debe coincidir con Agente.TIPO_CHOICES (backend/chatbot/models.py) y los perfiles del
// servicio RAG (chatbot/app/core/profiles.py).
export const CHATBOT_TIPOS: { value: ChatbotTipo; label: string; descripcion: string }[] = [
    {
        value: 'normativo',
        label: 'Normativo',
        descripcion: 'Reglamentos, manuales y procedimientos: respuestas breves y cercanas, con una cita de la fuente principal.',
    },
    {
        value: 'investigativo',
        label: 'Investigativo',
        descripcion: 'Monografías, tesis y artículos: tono académico, cita el documento y la página de cada dato (en PDF), reconoce capítulos y apartados numerados y no hace inferencias.',
    },
];

export const MAX_INSTRUCCIONES_ADICIONALES = 2000;

// Documentos por chatbot y sede. Debe coincidir con los perfiles del servicio RAG
// (chatbot/app/core/profiles.py) y con Agente.limite_documentos en Django.
export const MIN_DOCUMENTOS = 1;
export const MAX_DOCUMENTOS = 10;
export const maxDocumentosPorDefecto = (tipo?: ChatbotTipo): number => (tipo === 'investigativo' ? 5 : 10);
export const limiteDocumentos = (chatbot?: { max_documentos?: number | null; tipo?: ChatbotTipo }): number =>
    chatbot?.max_documentos || maxDocumentosPorDefecto(chatbot?.tipo);

export interface ChatbotAgente {
    id: number;
    nombre: string;
    subtitulo?: string | null;
    descripcion: string;
    icono?: string;
    color?: string;
    bg_gradient?: string;
    activo: boolean;
    endpoint_url?: string;
    mensaje_bienvenida: string;
    orden?: number;
    tipo?: ChatbotTipo;
    instrucciones_adicionales?: string;
    max_documentos?: number | null;
}

export type ChatbotAgentePayload = Omit<ChatbotAgente, 'id'>;

export interface ChatbotDocumento {
    id: number;
    filename: string;
    chatbot_id: number | null;
    sede: string;
    prioridad?: number | null;
    created_at: string;
}

export interface SubirDocumentoChatbotPayload {
    chatbot_id: number;
    sede: string;
    file: File;
    replace_document_id?: number;
}

// Anexos (documentos de soporte) de las preguntas-respuestas. Debe coincidir con
// FORMATOS_ANEXO y CHATBOT_ANEXO_* del backend (backend/chatbot/anexos.py, settings.py).
export const ANEXO_EXTENSIONES = ['pdf', 'doc', 'docx', 'xls', 'xlsx'] as const;
export const ANEXO_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const ANEXO_MAX_MB = 15;
export const ANEXO_MAX_POR_RESPUESTA = 5;

/** Pregunta | respuesta oficial de un chatbot en una seccional, con sus anexos. */
export interface PreguntaRespuestaChatbot {
    id: number;
    agente: number;
    agente_nombre: string;
    sede: string;
    pregunta: string;
    respuesta: string;
    activo: boolean;
    creado: string;
    actualizado: string;
    anexos: AnexoChatbot[];
}

export interface GuardarPreguntaRespuestaPayload {
    agente: number;
    sede?: string;
    pregunta: string;
    respuesta: string;
    activo: boolean;
    anexosNuevos: File[];
    anexosEliminar?: number[];
}

// Íconos que la aplicación sabe dibujar; debe coincidir con `iconMap` de
// hooks/chatbot/useAsistentesVirtuales.ts (el valor es el nombre guardado en Agente.icono).
export const CHATBOT_ICONOS: { value: string; label: string; Icon: LucideIcon }[] = [
    { value: 'Bot', label: 'Robot', Icon: Bot },
    { value: 'BookOpen', label: 'Libro', Icon: BookOpen },
    { value: 'DoorOpen', label: 'Puerta', Icon: DoorOpen },
    { value: 'Trophy', label: 'Trofeo', Icon: Trophy },
    { value: 'Headphones', label: 'Audífonos', Icon: Headphones },
];
