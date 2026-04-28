import type { DocumentoAdjunto } from '../../core.models';

export interface DocumentoRequeridoRadicacion {
  tipo: string;
  label: string;
}

export type TipoDocKeywordsMap = Record<string, string[]>;

export type DocsPorFacturaMap = Record<number, DocumentoAdjunto[]>;
