import { Loader2 } from 'lucide-react';
import { cn } from '../../share/utils';

interface LoadingProps {
  message?: string;
  className?: string;
  fullPage?: boolean;
  compact?: boolean;
}

export function Loading({
  message = 'Cargando datos...',
  className,
  fullPage = false,
  compact = false,
}: LoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        'flex items-center justify-center text-slate-600 dark:text-slate-300',
        fullPage && 'min-h-screen bg-slate-50/80 dark:bg-slate-950/80',
        compact ? 'gap-2 py-2 text-sm' : 'flex-col gap-3 py-8',
        className,
      )}
    >
      <Loader2
        aria-hidden="true"
        className={cn(
          'animate-spin text-blue-600 dark:text-blue-400',
          compact ? 'h-4 w-4' : 'h-8 w-8',
        )}
      />
      <span>{message}</span>
    </div>
  );
}

export default Loading;
