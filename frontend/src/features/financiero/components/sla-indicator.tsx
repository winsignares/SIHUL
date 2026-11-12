interface SlaIndicatorProps {
  dias?: number | null;
  objetivo?: number | null;
  className?: string;
  compact?: boolean;
}

export function SlaIndicator({ dias, objetivo, className, compact = false }: SlaIndicatorProps) {
  const diasValue = Math.max(0, Number(dias || 0));
  const objetivoValue = Number.isFinite(Number(objetivo)) && Number(objetivo) > 0 ? Number(objetivo) : null;

  if (!objetivoValue) {
    const classes = ['inline-flex items-center gap-1 font-semibold text-slate-700', compact ? 'text-sm' : 'text-xs', className]
      .filter(Boolean)
      .join(' ');
    return (
      <span className={classes}>
        <span>{diasValue}d</span>
        <span className="text-slate-400">/</span>
        <span className="text-slate-400">SLA</span>
      </span>
    );
  }

  const restantes = objetivoValue - diasValue;
  const porcentajeUsado = Math.min(100, Math.round((diasValue / objetivoValue) * 100));
  const porcentajeRestante = 100 - porcentajeUsado;

  let barColor: string;
  let textColor: string;
  let icon: string | null = null;

  if (porcentajeRestante <= 0) {
    barColor = 'bg-red-500';
    textColor = 'text-red-600 font-bold';
    icon = '⚠';
  } else if (porcentajeRestante <= 25) {
    barColor = 'bg-red-400';
    textColor = 'text-red-600 font-semibold';
    icon = '⚠';
  } else if (porcentajeRestante <= 50) {
    barColor = 'bg-yellow-400';
    textColor = 'text-yellow-700 font-semibold';
    icon = null;
  } else {
    barColor = 'bg-green-400';
    textColor = 'text-green-700';
    icon = null;
  }

  const containerClass = ['flex flex-col gap-0.5 min-w-[90px]', className].filter(Boolean).join(' ');

  return (
    <div className={containerClass} title={`${diasValue} días transcurridos de ${objetivoValue} días límite. ${restantes > 0 ? `Faltan ${restantes} días.` : `Vencido hace ${Math.abs(restantes)} días.`}`}>
      <div className="flex items-center justify-between gap-1">
        <span className={['text-xs', textColor].join(' ')}>
          {icon && <span className="mr-0.5">{icon}</span>}
          {diasValue}d
        </span>
        <span className="text-[10px] text-slate-400">
          {`/ ${objetivoValue}d`}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
        <div
          className={['h-full rounded-full transition-all', barColor].join(' ')}
          style={{ width: `${porcentajeUsado}%` }}
        />
      </div>
    </div>
  );
}
