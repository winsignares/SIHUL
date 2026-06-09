export interface FacturaServicioItem {
  index?: number;
  cantidad?: string;
  servicio?: string;
  unitario?: string;
  subtotal?: string;
  ivaPorcentaje?: string;
  ivaValor?: string;
  total?: string;
  extraInfo?: string[];
  rawLine: string;
}

export interface ParsedFacturaDescripcion {
  items: FacturaServicioItem[];
  remainingText?: string;
}

const NUMBERED_LINE_REGEX = /^\s*(\d+)\.\s*(.+)$/;

const sanitizeValue = (value: string | undefined) => value?.trim() || undefined;

export function parseFacturaDescripcion(descripcion?: string | null): ParsedFacturaDescripcion {
  if (!descripcion || !descripcion.trim()) {
    return { items: [] };
  }

  const items: FacturaServicioItem[] = [];
  const leftovers: string[] = [];

  const lines = descripcion
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  lines.forEach((line) => {
    const match = line.match(NUMBERED_LINE_REGEX);
    const payload = match ? match[2] : line;
    const index = match ? Number(match[1]) : undefined;

    const segments = payload.split('|').map((segment) => segment.trim()).filter(Boolean);
    if (segments.length === 0) {
      leftovers.push(line);
      return;
    }

    const firstSegment = segments.shift() ?? '';
    let cantidad: string | undefined;
    let servicio: string | undefined = firstSegment;

    const qtyMatch = firstSegment.match(/^(\d+[\d.,]*)\s*x\s*(.+)$/i);
    if (qtyMatch) {
      cantidad = qtyMatch[1]?.trim();
      servicio = qtyMatch[2]?.trim();
    }

    const item: FacturaServicioItem = {
      index,
      cantidad: sanitizeValue(cantidad),
      servicio: sanitizeValue(servicio),
      rawLine: line,
      extraInfo: [],
    };

    segments.forEach((segment) => {
      const [labelRaw, ...rest] = segment.split(':');
      const label = labelRaw?.trim().toLowerCase();
      const value = sanitizeValue(rest.join(':'));

      if (!label || !value) {
        if (segment) item.extraInfo?.push(segment);
        return;
      }

      if (label.startsWith('unitario')) {
        item.unitario = value;
        return;
      }
      if (label.startsWith('subtotal')) {
        item.subtotal = value;
        return;
      }
      if (label.startsWith('total')) {
        item.total = value;
        return;
      }
      if (label.startsWith('iva')) {
        const pctMatch = labelRaw.match(/iva\s*([0-9]+)%?/i);
        if (pctMatch?.[1]) {
          item.ivaPorcentaje = pctMatch[1];
        }
        item.ivaValor = value;
        return;
      }

      item.extraInfo?.push(segment);
    });

    if (!item.servicio) {
      leftovers.push(line);
      return;
    }

    if (item.extraInfo && item.extraInfo.length === 0) {
      delete item.extraInfo;
    }

    items.push(item);
  });

  return {
    items,
    remainingText: leftovers.length > 0 ? leftovers.join('\n') : undefined,
  };
}
