import { useState, type ReactNode } from 'react';
import { Card, CardContent } from './card';
import { Button } from './button';
import { Filter, ChevronDown, X } from 'lucide-react';
import { cn } from './utils';

interface HorarioFiltersCardProps {
  children: ReactNode;
  activeCount: number;
  onClear?: () => void;
  accentClassName?: string;
  defaultOpen?: boolean;
  actions?: ReactNode;
}

export function HorarioFiltersCard({
  children,
  activeCount,
  onClear,
  accentClassName = 'text-red-600',
  defaultOpen = true,
  actions,
}: HorarioFiltersCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className="border-slate-200 shadow-sm py-0 gap-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors rounded-t-xl"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Filter className={cn('w-4 h-4', accentClassName)} />
          Filtros
          {activeCount > 0 && (
            <span className={cn('rounded-full bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5')}>
              {activeCount} activo{activeCount > 1 ? 's' : ''}
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          {activeCount > 0 && onClear && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onClear();
                }
              }}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-600"
            >
              <X className="w-3.5 h-3.5" />
              Limpiar
            </span>
          )}
          <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {open && (
        <CardContent className="px-4 pb-4 pt-0 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-3">
            {children}
          </div>
          {actions && <div className="flex gap-2 pt-1">{actions}</div>}
        </CardContent>
      )}
    </Card>
  );
}

export function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1 min-w-0">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      {children}
    </div>
  );
}
