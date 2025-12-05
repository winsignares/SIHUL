import { useState, useEffect } from 'react';
import { prestamosPublicAPI, type SolicitudPrestamoPublico, type TipoActividadAPI, type EspacioDisponibleAPI } from '../../services/prestamos/prestamosPublicAPI';
import { sedeService, type Sede } from '../../services/sedes/sedeAPI';

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

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validarFormulario()) {
            return;
        }

        setSubmitting(true);
        try {
            const response = await prestamosPublicAPI.crearSolicitud(formData as SolicitudPrestamoPublico);
            
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
            setSedeSeleccionada(0);
            setEspaciosDisponibles([]);
            
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
        setShowSuccess
    };
}
