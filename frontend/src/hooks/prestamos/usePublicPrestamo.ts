import { useState, useEffect } from 'react';
import {
    prestamosPublicAPI,
    type SolicitudPrestamoPublico,
    type TipoActividadAPI,
    type EspacioDisponibleAPI,
    type PrestamoPublicoItem
} from '../../services/prestamos/prestamosPublicAPI';
import { sedeService, type Sede } from '../../services/sedes/sedeAPI';

type RepeatQuickOption =
    | 'none'
    | 'daily'
    | 'weekly_current'
    | 'monthly_ordinal_weekday'
    | 'monthly_last_weekday'
    | 'yearly_date'
    | 'custom';

type CustomPeriod = 'day' | 'week' | 'month' | 'year';

const WEEKDAY_NAMES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const MONTH_NAMES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const getWeekdayMondayIndex = (dateStr?: string): number => {
    if (!dateStr) return 0;
    const jsDay = new Date(`${dateStr}T00:00:00`).getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
};

const getOrdinalWeekdayText = (dateStr?: string): string => {
    if (!dateStr) return 'primer lunes';
    const date = new Date(`${dateStr}T00:00:00`);
    const day = date.getDate();
    const ordinalNum = Math.floor((day - 1) / 7) + 1;
    const ordinals = ['primer', 'segundo', 'tercer', 'cuarto', 'quinto'];
    const weekdayName = WEEKDAY_NAMES[getWeekdayMondayIndex(dateStr)];
    return `${ordinals[Math.min(ordinalNum - 1, 4)]} ${weekdayName}`;
};

const isLastWeekdayOfMonth = (dateStr?: string): boolean => {
    if (!dateStr) return false;
    const date = new Date(`${dateStr}T00:00:00`);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return date.getDate() + 7 > lastDay;
};

export function usePublicPrestamo() {
    // Estado del formulario
    const [formData, setFormData] = useState<Partial<SolicitudPrestamoPublico>>({
        nombre_completo: '',
        correo_institucional: '',
        telefono: '',
        identificacion: '',
        espacio_id: 0,
        tipo_actividad_id: 0,
        fecha: '',
        hora_inicio: '',
        hora_fin: '',
        motivo: '',
        asistentes: 1
    });

    const [repeatOption, setRepeatOption] = useState<RepeatQuickOption>('none');
    const [customPeriod, setCustomPeriod] = useState<CustomPeriod>('week');
    const [intervalo, setIntervalo] = useState(1);
    const [diasSemana, setDiasSemana] = useState<number[]>([]);
    const [finRepeticionTipo, setFinRepeticionTipo] = useState<'never' | 'until_date' | 'count'>('never');
    const [finRepeticionFecha, setFinRepeticionFecha] = useState('');
    const [finRepeticionOcurrencias, setFinRepeticionOcurrencias] = useState<number | ''>('');

    // Estados de UI
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Datos de catálogos
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [tiposActividad, setTiposActividad] = useState<TipoActividadAPI[]>([]);
    const [espaciosDisponibles, setEspaciosDisponibles] = useState<EspacioDisponibleAPI[]>([]);
    const [sedeSeleccionada, setSedeSeleccionada] = useState<number>(0);
    const [loadingEspacios, setLoadingEspacios] = useState(false);

    // Estado CRUD solicitudes públicas
    const [misSolicitudes, setMisSolicitudes] = useState<PrestamoPublicoItem[]>([]);
    const [loadingSolicitudes, setLoadingSolicitudes] = useState(false);
    const [consultaCredenciales, setConsultaCredenciales] = useState({
        identificacion: '',
        correo: ''
    });
    const [modoEdicion, setModoEdicion] = useState(false);
    const [solicitudEditando, setSolicitudEditando] = useState<PrestamoPublicoItem | null>(null);

    // Cargar catálogos iniciales
    useEffect(() => {
        cargarCatalogos();
    }, []);

    const cargarCatalogos = async () => {
        setLoading(true);
        try {
            const [sedesResponse, tiposResponse] = await Promise.all([
                sedeService.listarSedes(),
                prestamosPublicAPI.listarTiposActividad()
            ]);
            
            setSedes(sedesResponse.sedes);
            setTiposActividad(tiposResponse.tipos_actividad);
        } catch (error) {
            console.error('Error al cargar catálogos:', error);
        } finally {
            setLoading(false);
        }
    };

    // Cargar espacios disponibles cuando cambien fecha, hora o sede
    useEffect(() => {
        if (formData.fecha && formData.hora_inicio && formData.hora_fin) {
            cargarEspaciosDisponibles();
        } else {
            setEspaciosDisponibles([]);
        }
    }, [formData.fecha, formData.hora_inicio, formData.hora_fin, sedeSeleccionada]);

    const cargarEspaciosDisponibles = async () => {
        if (!formData.fecha || !formData.hora_inicio || !formData.hora_fin) return;

        // Validar que hora_fin sea mayor que hora_inicio
        if (formData.hora_inicio && formData.hora_fin && formData.hora_inicio >= formData.hora_fin) {
            setErrors(prev => ({
                ...prev,
                hora_fin: 'La hora de fin debe ser posterior a la hora de inicio'
            }));
            setEspaciosDisponibles([]);
            return;
        }

        setLoadingEspacios(true);
        try {
            const response = await prestamosPublicAPI.listarEspaciosDisponibles(
                formData.fecha,
                formData.hora_inicio,
                formData.hora_fin,
                sedeSeleccionada
            );
            setEspaciosDisponibles(response.espacios);
            
            // Limpiar selección de espacio si ya no está disponible
            if (formData.espacio_id && formData.espacio_id > 0 && !response.espacios.some(e => e.id === formData.espacio_id)) {
                setFormData(prev => ({ ...prev, espacio_id: 0 }));
            }
        } catch (error) {
            console.error('Error al cargar espacios:', error);
            setEspaciosDisponibles([]);
        } finally {
            setLoadingEspacios(false);
        }
    };

    const toggleDiaSemana = (dayIndex: number) => {
        setDiasSemana((prev) => {
            const exists = prev.includes(dayIndex);
            return exists ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex].sort((a, b) => a - b);
        });
    };

    const repeatOptions = (() => {
        const weekdayName = WEEKDAY_NAMES[getWeekdayMondayIndex(formData.fecha)] || 'lunes';
        const yearlyText = formData.fecha
            ? (() => {
                const date = new Date(`${formData.fecha}T00:00:00`);
                return `${date.getDate()} de ${MONTH_NAMES[date.getMonth()]}`;
            })()
            : 'la fecha seleccionada';

        const monthlyOrdinal = getOrdinalWeekdayText(formData.fecha);
        const monthlyLast = `último ${weekdayName}`;

        return [
            { value: 'none' as const, label: 'No se repite' },
            { value: 'daily' as const, label: 'Cada día' },
            { value: 'weekly_current' as const, label: `Cada semana el ${weekdayName}` },
            { value: 'monthly_ordinal_weekday' as const, label: `Cada mes el ${monthlyOrdinal}` },
            { value: 'monthly_last_weekday' as const, label: `Cada mes el ${monthlyLast}` },
            { value: 'yearly_date' as const, label: `Anualmente el ${yearlyText}` },
            { value: 'custom' as const, label: 'Personalizar' },
        ];
    })();

    const recurrenceSummary = (() => {
        const date = formData.fecha ? new Date(`${formData.fecha}T00:00:00`) : null;
        const weekdayName = WEEKDAY_NAMES[getWeekdayMondayIndex(formData.fecha)] || 'lunes';
        const yearlyText = date ? `${date.getDate()} de ${MONTH_NAMES[date.getMonth()]}` : 'fecha seleccionada';

        const getFinishText = () => {
            if (finRepeticionTipo === 'until_date' && finRepeticionFecha) {
                return ` hasta el ${new Date(`${finRepeticionFecha}T00:00:00`).toLocaleDateString('es-CO')}`;
            }
            if (finRepeticionTipo === 'count' && finRepeticionOcurrencias) {
                return ` durante ${finRepeticionOcurrencias} repeticiones`;
            }
            return '';
        };

        if (repeatOption === 'none') return 'No se repetirá.';
        if (repeatOption === 'daily') return `Se repetirá cada día a la misma hora${getFinishText()}.`;
        if (repeatOption === 'weekly_current') return `Se repetirá cada semana los ${weekdayName}${getFinishText()}.`;
        if (repeatOption === 'monthly_ordinal_weekday') return `Se repetirá cada mes el ${getOrdinalWeekdayText(formData.fecha)}${getFinishText()}.`;
        if (repeatOption === 'monthly_last_weekday') return `Se repetirá cada mes el último ${weekdayName}${getFinishText()}.`;
        if (repeatOption === 'yearly_date') return `Se repetirá anualmente el ${yearlyText}${getFinishText()}.`;

        const periodText =
            customPeriod === 'day' ? 'día' :
            customPeriod === 'week' ? 'semana' :
            customPeriod === 'month' ? 'mes' : 'año';

        let detail = `Se repetirá cada ${intervalo} ${periodText}${intervalo > 1 ? 's' : ''}`;
        if (customPeriod === 'week' && diasSemana.length > 0) {
            detail += ` los ${diasSemana.map((d) => WEEKDAY_NAMES[d]).join(' y ')}`;
        }
        detail += getFinishText();
        return `${detail}.`;
    })();

    const buildRecurrencePayload = (): Partial<SolicitudPrestamoPublico> => {
        const baseEnd: Partial<SolicitudPrestamoPublico> = {
            fin_repeticion_tipo: finRepeticionTipo,
        };
        if (finRepeticionTipo === 'until_date' && finRepeticionFecha) {
            baseEnd.fin_repeticion_fecha = finRepeticionFecha;
        }
        if (finRepeticionTipo === 'count' && finRepeticionOcurrencias) {
            baseEnd.fin_repeticion_ocurrencias = Number(finRepeticionOcurrencias);
        }

        if (repeatOption === 'none') {
            return { es_recurrente: false };
        }

        if (repeatOption === 'daily') {
            return { es_recurrente: true, frecuencia: 'daily', intervalo: 1, ...baseEnd };
        }
        if (repeatOption === 'weekly_current') {
            return {
                es_recurrente: true,
                frecuencia: 'weekly',
                intervalo: 1,
                dias_semana: [getWeekdayMondayIndex(formData.fecha)],
                ...baseEnd,
            };
        }
        if (repeatOption === 'monthly_ordinal_weekday' || repeatOption === 'monthly_last_weekday') {
            // El backend actual no soporta patrón ordinal/último; se mapea a mensual simple.
            return { es_recurrente: true, frecuencia: 'monthly', intervalo: 1, ...baseEnd };
        }
        if (repeatOption === 'yearly_date') {
            return { es_recurrente: true, frecuencia: 'yearly', intervalo: 1, ...baseEnd };
        }

        const freq =
            customPeriod === 'day' ? 'daily' :
            customPeriod === 'week' ? 'weekly' :
            customPeriod === 'month' ? 'monthly' : 'yearly';

        return {
            es_recurrente: true,
            frecuencia: freq,
            intervalo: Math.max(1, intervalo),
            dias_semana: customPeriod === 'week' ? diasSemana : undefined,
            ...baseEnd,
        };
    };

    const handleChange = (field: keyof SolicitudPrestamoPublico, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Limpiar error del campo cuando el usuario empiece a escribir
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleSedeChange = (sedeId: number) => {
        setSedeSeleccionada(sedeId);
        // Limpiar selección de espacio cuando cambie la sede
        setFormData(prev => ({ ...prev, espacio_id: 0 }));
    };

    const cargarMisSolicitudes = async (identificacion?: string, correo?: string) => {
        const identificacionFinal = (identificacion ?? consultaCredenciales.identificacion).trim();
        const correoFinal = (correo ?? consultaCredenciales.correo).trim().toLowerCase();

        if (!identificacionFinal || !correoFinal) {
            setErrors(prev => ({
                ...prev,
                consulta: 'Debe ingresar identificación y correo para consultar solicitudes'
            }));
            return;
        }

        setLoadingSolicitudes(true);
        try {
            const response = await prestamosPublicAPI.listarMisSolicitudes(identificacionFinal, correoFinal);
            setMisSolicitudes(response.prestamos || []);
            setConsultaCredenciales({ identificacion: identificacionFinal, correo: correoFinal });
            setErrors(prev => {
                const next = { ...prev };
                delete next.consulta;
                return next;
            });
        } catch (error: any) {
            setErrors(prev => ({
                ...prev,
                consulta: error?.message || 'No fue posible consultar las solicitudes'
            }));
        } finally {
            setLoadingSolicitudes(false);
        }
    };

    const iniciarEdicionSolicitud = (solicitud: PrestamoPublicoItem) => {
        setModoEdicion(true);
        setSolicitudEditando({ ...solicitud });
    };

    const cancelarEdicionSolicitud = () => {
        setModoEdicion(false);
        setSolicitudEditando(null);
    };

    const guardarEdicionSolicitud = async () => {
        if (!solicitudEditando) return;

        try {
            setSubmitting(true);

            await prestamosPublicAPI.actualizarSolicitud({
                id: solicitudEditando.id,
                espacio_id: solicitudEditando.espacio_id,
                nombre_solicitante: solicitudEditando.usuario_nombre,
                correo_solicitante: solicitudEditando.usuario_correo,
                telefono_solicitante: solicitudEditando.telefono,
                identificacion_solicitante: solicitudEditando.identificacion,
                tipo_actividad_id: solicitudEditando.tipo_actividad_id,
                fecha: solicitudEditando.fecha,
                hora_inicio: solicitudEditando.hora_inicio,
                hora_fin: solicitudEditando.hora_fin,
                motivo: solicitudEditando.motivo,
                asistentes: solicitudEditando.asistentes,
                estado: solicitudEditando.estado
            });

            await cargarMisSolicitudes();
            cancelarEdicionSolicitud();
            setSuccessMessage('Solicitud actualizada correctamente');
            setShowSuccess(true);
        } catch (error: any) {
            setErrors(prev => ({
                ...prev,
                submit: error?.message || 'Error al actualizar la solicitud'
            }));
        } finally {
            setSubmitting(false);
        }
    };

    const eliminarSolicitud = async (id: number) => {
        try {
            setSubmitting(true);
            await prestamosPublicAPI.eliminarSolicitud(
                id,
                consultaCredenciales.identificacion,
                consultaCredenciales.correo
            );
            await cargarMisSolicitudes();
            setSuccessMessage('Solicitud eliminada correctamente');
            setShowSuccess(true);
        } catch (error: any) {
            setErrors(prev => ({
                ...prev,
                submit: error?.message || 'Error al eliminar la solicitud'
            }));
        } finally {
            setSubmitting(false);
        }
    };

    const validarFormulario = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Validar nombre completo
        if (!formData.nombre_completo || formData.nombre_completo.trim().length < 3) {
            newErrors.nombre_completo = 'El nombre completo es requerido (mínimo 3 caracteres)';
        }

        // Validar correo institucional
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.correo_institucional || !emailRegex.test(formData.correo_institucional)) {
            newErrors.correo_institucional = 'Ingrese un correo electrónico válido';
        } else if (!formData.correo_institucional.endsWith('@unilibre.edu.co') && 
                   !formData.correo_institucional.endsWith('@unilibrepereira.edu.co')) {
            newErrors.correo_institucional = 'Debe usar un correo institucional (@unilibre.edu.co o @unilibrepereira.edu.co)';
        }

        // Validar teléfono
        const telefonoLimpio = formData.telefono?.replace(/\s|-/g, '') || '';
        if (!telefonoLimpio || !/^\d{7,10}$/.test(telefonoLimpio)) {
            newErrors.telefono = 'Ingrese un teléfono válido (7-10 dígitos)';
        }

        // Validar identificación
        if (!formData.identificacion || formData.identificacion.trim().length < 5) {
            newErrors.identificacion = 'La identificación es requerida (mínimo 5 caracteres)';
        }

        // Validar espacio
        if (!formData.espacio_id || formData.espacio_id === 0) {
            newErrors.espacio_id = 'Debe seleccionar un espacio';
        }

        // Validar tipo de actividad
        if (!formData.tipo_actividad_id || formData.tipo_actividad_id === 0) {
            newErrors.tipo_actividad_id = 'Debe seleccionar un tipo de actividad';
        }

        // Validar fecha
        if (!formData.fecha) {
            newErrors.fecha = 'La fecha es requerida';
        } else {
            const fechaSeleccionada = new Date(formData.fecha);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            if (fechaSeleccionada < hoy) {
                newErrors.fecha = 'La fecha no puede ser anterior a hoy';
            }
        }

        // Validar horas
        if (!formData.hora_inicio) {
            newErrors.hora_inicio = 'La hora de inicio es requerida';
        }
        if (!formData.hora_fin) {
            newErrors.hora_fin = 'La hora de fin es requerida';
        }
        if (formData.hora_inicio && formData.hora_fin && formData.hora_inicio >= formData.hora_fin) {
            newErrors.hora_fin = 'La hora de fin debe ser posterior a la hora de inicio';
        }

        // Validar motivo
        if (!formData.motivo || formData.motivo.trim().length < 10) {
            newErrors.motivo = 'El motivo es requerido (mínimo 10 caracteres)';
        }

        // Validar asistentes
        if (!formData.asistentes || formData.asistentes < 1) {
            newErrors.asistentes = 'El número de asistentes debe ser al menos 1';
        }

        if (repeatOption === 'custom') {
            if (intervalo < 1) {
                newErrors.recurrencia_intervalo = 'El intervalo debe ser mayor o igual a 1';
            }
            if (customPeriod === 'week' && diasSemana.length < 1) {
                newErrors.recurrencia_dias_semana = 'Seleccione al menos un día de la semana';
            }
        }

        if (finRepeticionTipo === 'until_date' && !finRepeticionFecha) {
            newErrors.recurrencia_fin_fecha = 'Debe seleccionar fecha de finalización';
        }
        if (finRepeticionTipo === 'count' && (!finRepeticionOcurrencias || Number(finRepeticionOcurrencias) < 1)) {
            newErrors.recurrencia_fin_ocurrencias = 'Debe indicar un número de repeticiones mayor que 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validarFormulario()) {
            return;
        }

        setSubmitting(true);
        try {
            const recurrencePayload = buildRecurrencePayload();
            const response = await prestamosPublicAPI.crearSolicitud({
                ...(formData as SolicitudPrestamoPublico),
                ...recurrencePayload,
            });
            
            setSuccessMessage(response.message);
            setShowSuccess(true);
            
            // Limpiar formulario
            setFormData({
                nombre_completo: '',
                correo_institucional: '',
                telefono: '',
                identificacion: '',
                espacio_id: 0,
                tipo_actividad_id: 0,
                fecha: '',
                hora_inicio: '',
                hora_fin: '',
                motivo: '',
                asistentes: 1
            });
            setRepeatOption('none');
            setCustomPeriod('week');
            setIntervalo(1);
            setDiasSemana([]);
            setFinRepeticionTipo('never');
            setFinRepeticionFecha('');
            setFinRepeticionOcurrencias('');
            setSedeSeleccionada(0);
            setEspaciosDisponibles([]);
            setConsultaCredenciales({
                identificacion: formData.identificacion || '',
                correo: formData.correo_institucional || ''
            });
            await cargarMisSolicitudes(formData.identificacion || '', formData.correo_institucional || '');
            
            // Ocultar mensaje de éxito después de 5 segundos
            setTimeout(() => {
                setShowSuccess(false);
            }, 5000);
            
        } catch (error: any) {
            console.error('Error al enviar solicitud:', error);
            const errorMessage = error?.message || 'Error al enviar la solicitud. Por favor, intente nuevamente.';
            setErrors({ submit: errorMessage });
        } finally {
            setSubmitting(false);
        }
    };

    return {
        formData,
        loading,
        submitting,
        errors,
        showSuccess,
        successMessage,
        sedes,
        tiposActividad,
        espaciosDisponibles,
        sedeSeleccionada,
        loadingEspacios,
        handleChange,
        handleSedeChange,
        handleSubmit,
        setShowSuccess,
        misSolicitudes,
        loadingSolicitudes,
        consultaCredenciales,
        setConsultaCredenciales,
        cargarMisSolicitudes,
        modoEdicion,
        solicitudEditando,
        setSolicitudEditando,
        iniciarEdicionSolicitud,
        cancelarEdicionSolicitud,
        guardarEdicionSolicitud,
        eliminarSolicitud,
        repeatOption,
        setRepeatOption,
        customPeriod,
        setCustomPeriod,
        intervalo,
        setIntervalo,
        diasSemana,
        setDiasSemana,
        toggleDiaSemana,
        finRepeticionTipo,
        setFinRepeticionTipo,
        finRepeticionFecha,
        setFinRepeticionFecha,
        finRepeticionOcurrencias,
        setFinRepeticionOcurrencias,
        repeatOptions,
        recurrenceSummary
    };
}
