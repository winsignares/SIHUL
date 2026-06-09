interface SlaIndicatorProps {
  dias?: number | null;
  objetivo?: number | null;
  className?: string;
  compact?: boolean;
}

export function SlaIndicator({ dias, objetivo, className, compact = false }: SlaIndicatorProps) {
  const diasValue = Math.max(0, Number(dias || 0));
  const objetivoValue = Number.isFinite(Number(objetivo)) && Number(objetivo) > 0 ? Number(objetivo) : null;
  const classes = ['inline-flex items-center gap-1 font-semibold text-slate-700', compact ? 'text-sm' : 'text-xs', className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes}>
      <span>{diasValue}d</span>
      <span className="text-slate-400">/</span>
      <span className={objetivoValue ? 'text-slate-700' : 'text-slate-400'}>
        {objetivoValue ? `${objetivoValue}d` : 'SLA'}
      </span>
    </span>
  );
}
