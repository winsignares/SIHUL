import * as React from 'react';
import { CalendarDays } from 'lucide-react';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { cn } from './utils';

function parseLocalDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function formatLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplay(iso: string): string {
  const date = parseLocalDate(iso);
  if (!date) return '';
  return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

export interface DatePickerFieldProps {
  /** Fecha en formato YYYY-MM-DD, igual que un <input type="date"> */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  title?: string;
  disabled?: boolean;
}

/**
 * Selector de fecha propio (Popover + Calendar de react-day-picker) con la
 * semana empezando en lunes (weekStartsOn=1). Reemplaza <input type="date">
 * porque el calendario nativo del navegador no permite controlar el orden
 * de los dias de la semana (depende del idioma del sistema operativo).
 */
export function DatePickerField({
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
  className,
  title,
  disabled
}: DatePickerFieldProps) {
  const [open, setOpen] = React.useState(false);
  const selected = parseLocalDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          type="button"
          disabled={disabled}
          title={title}
          className={cn(
            'justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarDays className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{value ? formatDisplay(value) : placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          weekStartsOn={1}
          selected={selected}
          defaultMonth={selected}
          onSelect={(date?: Date) => {
            if (date) {
              onChange(formatLocalISO(date));
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
