import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import type { usePublicPrestamo } from '../../hooks/usePublicPrestamo';

type PublicPrestamo = ReturnType<typeof usePublicPrestamo>;

/** Opciones de repetición de la solicitud (periodicidad y fin). */
export function RepeticionSolicitud({
    repeatOption,
    setRepeatOption,
    repeatOptions,
    intervalo,
    setIntervalo,
    intervaloMaximoPeriodo,
    errors,
    customPeriod,
    setCustomPeriod,
    diasSemana,
    toggleDiaSemana,
    finRepeticionTipo,
    setFinRepeticionTipo,
    finRepeticionFecha,
    setFinRepeticionFecha,
    finRepeticionMaxFecha,
    finRepeticionOcurrencias,
    setFinRepeticionOcurrencias,
    ocurrenciasMaximoPeriodo,
    recurrenceSummary
}: Pick<PublicPrestamo, 'repeatOption' | 'setRepeatOption' | 'repeatOptions' | 'intervalo' | 'setIntervalo' | 'intervaloMaximoPeriodo' | 'errors' | 'customPeriod' | 'setCustomPeriod' | 'diasSemana' | 'toggleDiaSemana' | 'finRepeticionTipo' | 'setFinRepeticionTipo' | 'finRepeticionFecha' | 'setFinRepeticionFecha' | 'finRepeticionMaxFecha' | 'finRepeticionOcurrencias' | 'setFinRepeticionOcurrencias' | 'ocurrenciasMaximoPeriodo' | 'recurrenceSummary'>) {
    const diasSemanaLabels = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    return (
            <div className="space-y-3 border rounded-lg p-4 bg-slate-50 dark:bg-slate-900/30">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Repetición</label>
                <Select value={repeatOption}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onValueChange={(v: any) => setRepeatOption(v)}>
                    <SelectTrigger>
                        <SelectValue placeholder="No se repite" />
                    </SelectTrigger>
                    <SelectContent>
                        {repeatOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {repeatOption === 'custom' && (
                    <div className="space-y-3 border rounded-md p-3 bg-white dark:bg-slate-900/40">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>Repetir cada</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    max={intervaloMaximoPeriodo ?? undefined}
                                    value={intervalo}
                                    onChange={(e) => {
                                        const maxValue = intervaloMaximoPeriodo ?? Infinity;
                                        setIntervalo(Math.max(1, Math.min(maxValue, Number(e.target.value) || 1)));
                                    }}
                                />
                                {intervaloMaximoPeriodo != null && (
                                    <p className="text-xs text-slate-500">
                                        Máximo {intervaloMaximoPeriodo} por lo que resta del periodo académico.
                                    </p>
                                )}
                                {errors.recurrencia_intervalo && (
                                    <p className="text-xs text-red-600 dark:text-red-400">{errors.recurrencia_intervalo}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label>Periodo</Label>
                                <Select value={customPeriod}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onValueChange={(v: any) => setCustomPeriod(v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Periodo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="day">Día</SelectItem>
                                        <SelectItem value="week">Semana</SelectItem>
                                        <SelectItem value="month">Mes</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {customPeriod === 'week' && (
                            <div className="space-y-1">
                                <Label>Se repite los días</Label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {diasSemanaLabels.map((label, idx) => {
                                        const selected = diasSemana.includes(idx);
                                        return (
                                            <button
                                                key={label}
                                                type="button"
                                                onClick={() => toggleDiaSemana(idx)}
                                                className={`px-2 py-1 rounded-md border text-xs text-left ${selected
                                                    ? 'bg-red-100 border-red-300 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-200'
                                                    : 'bg-white border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                                {errors.recurrencia_dias_semana && (
                                    <p className="text-xs text-red-600 dark:text-red-400">{errors.recurrencia_dias_semana}</p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {repeatOption !== 'none' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border rounded-md p-3 bg-white dark:bg-slate-900/40">
                        <div className="space-y-1">
                            <Label>Finaliza</Label>
                            <Select value={finRepeticionTipo}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onValueChange={(v: any) => setFinRepeticionTipo(v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Nunca" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="never">Nunca</SelectItem>
                                    <SelectItem value="until_date">En una fecha</SelectItem>
                                    <SelectItem value="count">Después de N repeticiones</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {finRepeticionTipo === 'until_date' && (
                            <div className="space-y-1">
                                <Label>Fecha fin</Label>
                                <Input
                                    type="date"
                                    max={finRepeticionMaxFecha ?? undefined}
                                    value={finRepeticionFecha}
                                    onChange={(e) => {
                                        const value = finRepeticionMaxFecha && e.target.value > finRepeticionMaxFecha
                                            ? finRepeticionMaxFecha
                                            : e.target.value;
                                        setFinRepeticionFecha(value);
                                    }}
                                />
                                {finRepeticionMaxFecha && (
                                    <p className="text-xs text-slate-500">
                                        El periodo académico finaliza el {new Date(`${finRepeticionMaxFecha}T00:00:00`).toLocaleDateString('es-CO')}.
                                    </p>
                                )}
                                {errors.recurrencia_fin_fecha && (
                                    <p className="text-xs text-red-600 dark:text-red-400">{errors.recurrencia_fin_fecha}</p>
                                )}
                            </div>
                        )}

                        {finRepeticionTipo === 'count' && (
                            <div className="space-y-1">
                                <Label>N repeticiones</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    max={ocurrenciasMaximoPeriodo ?? undefined}
                                    value={finRepeticionOcurrencias}
                                    onChange={(e) => {
                                        let value: number | '' = Number(e.target.value) || '';
                                        if (ocurrenciasMaximoPeriodo != null && value !== '' && value > ocurrenciasMaximoPeriodo) {
                                            value = ocurrenciasMaximoPeriodo;
                                        }
                                        setFinRepeticionOcurrencias(value);
                                    }}
                                />
                                {ocurrenciasMaximoPeriodo != null && (
                                    <p className="text-xs text-slate-500">
                                        Máximo {ocurrenciasMaximoPeriodo} repeticiones dentro del periodo académico.
                                    </p>
                                )}
                                {errors.recurrencia_fin_ocurrencias && (
                                    <p className="text-xs text-red-600 dark:text-red-400">{errors.recurrencia_fin_ocurrencias}</p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <p className="text-xs text-slate-600 dark:text-slate-400">{recurrenceSummary}</p>
            </div>
    );
}
