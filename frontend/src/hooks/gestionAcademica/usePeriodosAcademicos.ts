import { useState, useEffect } from 'react';
import { periodoService, type PeriodoAcademico } from '../../services/periodos/periodoAPI';
import { useNotification } from '../../share/notificationBanner';

export interface PeriodoUI {
    id?: number;
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
    activo: boolean;
    estado: 'Activo' | 'Próximo' | 'Finalizado';
    programasActivos: number;
    horariosRegistrados: number;
}

export function usePeriodosAcademicos() {
    const { notification, showNotification } = useNotification();

    const [loading, setLoading] = useState(false);
    const [periodos, setPeriodos] = useState<PeriodoUI[]>([]);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showCopyDialog, setShowCopyDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const [periodoForm, setPeriodoForm] = useState({
        nombre: '',
        fecha_inicio: '',
        fecha_fin: ''
    });

    const [periodoACopiar, setPeriodoACopiar] = useState<PeriodoUI | null>(null);
    const [periodoAEditar, setPeriodoAEditar] = useState<PeriodoUI | null>(null);
    const [periodoAEliminar, setPeriodoAEliminar] = useState<PeriodoUI | null>(null);

    const loadPeriodos = async () => {
        try {
            setLoading(true);
            const response = await periodoService.listarPeriodos();
            
            // Mapear de API a UI
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            
            // Primero, encontrar cuál período debería estar activo (el que está en el rango actual)
            let periodoActivoEnRango: PeriodoAcademico | null = null;
            for (const p of response.periodos) {
                const inicio = new Date(p.fecha_inicio + 'T00:00:00');
                const fin = new Date(p.fecha_fin + 'T23:59:59');
                if (inicio <= now && fin >= now) {
                    periodoActivoEnRango = p;
                    break;
                }
            }
            
            const periodosUI: PeriodoUI[] = response.periodos.map(p => {
                // Determinar estado basado en fechas
                let estado: 'Activo' | 'Próximo' | 'Finalizado' = 'Finalizado';
                
                // Parsear fechas como locales (no UTC)
                const inicio = new Date(p.fecha_inicio + 'T00:00:00');
                const fin = new Date(p.fecha_fin + 'T23:59:59'); // Fin del día

                // Solo el período que está en el rango actual es Activo
                if (periodoActivoEnRango && p.id === periodoActivoEnRango.id) {
                    estado = 'Activo';
                } else if (inicio > now) {
                    estado = 'Próximo';
                } else if (fin < now) {
                    estado = 'Finalizado';
                } else {
                    estado = 'Finalizado';
                }

                return {
                    id: p.id,
                    nombre: p.nombre,
                    fecha_inicio: p.fecha_inicio,
                    fecha_fin: p.fecha_fin,
                    activo: p.activo,
                    estado,
                    programasActivos: p.programas_activos || 0,
                    horariosRegistrados: p.horarios_registrados || 0
                };
            });
            
            setPeriodos(periodosUI);
        } catch (error) {
            showNotification(
                `Error al cargar periodos: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    const periodosOrdenados = [...periodos].sort((a, b) => {
        return new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime();
    });

    const periodoActivo = periodos.find(p => p.estado === 'Activo');

    const calcularSiguientePeriodo = (nombreActual: string): string => {
        const match = nombreActual.match(/(\d{4})-(\d+)/);
        if (match) {
            const anio = parseInt(match[1]);
            const semestre = parseInt(match[2]);
            if (semestre === 1) {
                return `${anio}-2`;
            } else {
                return `${anio + 1}-1`;
            }
        }
        return '';
    };

    const handleOpenCreateDialog = () => {
        setPeriodoForm({
            nombre: '',
            fecha_inicio: '',
            fecha_fin: ''
        });
        setShowCreateDialog(true);
    };

    const handleCreatePeriodo = async () => {
        if (!periodoForm.nombre.trim()) {
            showNotification('El nombre del periodo es obligatorio', 'error');
            return;
        }
        if (!periodoForm.fecha_inicio) {
            showNotification('La fecha de inicio es obligatoria', 'error');
            return;
        }
        if (!periodoForm.fecha_fin) {
            showNotification('La fecha de fin es obligatoria', 'error');
            return;
        }

        if (new Date(periodoForm.fecha_fin) <= new Date(periodoForm.fecha_inicio)) {
            showNotification('La fecha de fin debe ser posterior a la fecha de inicio', 'error');
            return;
        }

        if (periodos.some(p => p.nombre === periodoForm.nombre.trim())) {
            showNotification('Ya existe un periodo con ese nombre', 'error');
            return;
        }

        // Validar que no haya períodos con fechas solapadas
        const fechaInicio = new Date(periodoForm.fecha_inicio + 'T00:00:00');
        const fechaFin = new Date(periodoForm.fecha_fin + 'T00:00:00');
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // Validar solapamiento de fechas
        const tieneSolapamiento = periodos.some(p => {
            const pInicio = new Date(p.fecha_inicio + 'T00:00:00');
            const pFin = new Date(p.fecha_fin + 'T00:00:00');
            // Verificar que no haya solapamiento y que las fechas no sean iguales
            return (fechaInicio <= pFin && fechaFin >= pInicio);
        });

        if (tieneSolapamiento) {
            showNotification('Las fechas del período no se pueden mezclar con otro período existente', 'error');
            return;
        }

        // Validar que si está dentro de la fecha actual, no haya otro activo
        const estaEnFechaActual = fechaInicio <= now && fechaFin >= now;
        if (estaEnFechaActual && periodos.some(p => p.estado === 'Activo')) {
            showNotification('Ya existe un período activo. Solo puede haber uno activo. Modifica las fechas del período existente.', 'error');
            return;
        }

        // Validar que no se cree un período completamente pasado
        if (fechaFin < now) {
            showNotification('No se puede crear un período completamente pasado', 'error');
            return;
        }

        try {
            setLoading(true);
            // Determinar si debe ser activo basado en las fechas
            const debeSerActivo = estaEnFechaActual;
            
            await periodoService.crearPeriodo({
                nombre: periodoForm.nombre.trim(),
                fecha_inicio: periodoForm.fecha_inicio,
                fecha_fin: periodoForm.fecha_fin,
                activo: debeSerActivo
            });

            await loadPeriodos();
            setShowCreateDialog(false);
            showNotification('✅ Periodo creado exitosamente', 'success');
        } catch (error) {
            showNotification(
                `Error al crear periodo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEditDialog = (periodo: PeriodoUI) => {
        setPeriodoAEditar(periodo);
        setPeriodoForm({
            nombre: periodo.nombre,
            fecha_inicio: periodo.fecha_inicio,
            fecha_fin: periodo.fecha_fin
        });
        setShowEditDialog(true);
    };

    const handleEditPeriodo = async () => {
        if (!periodoAEditar || !periodoAEditar.id) return;

        if (!periodoForm.nombre.trim()) {
            showNotification('El nombre del periodo es obligatorio', 'error');
            return;
        }
        if (!periodoForm.fecha_inicio) {
            showNotification('La fecha de inicio es obligatoria', 'error');
            return;
        }
        if (!periodoForm.fecha_fin) {
            showNotification('La fecha de fin es obligatoria', 'error');
            return;
        }

        if (new Date(periodoForm.fecha_fin) <= new Date(periodoForm.fecha_inicio)) {
            showNotification('La fecha de fin debe ser posterior a la fecha de inicio', 'error');
            return;
        }

        const fechaInicio = new Date(periodoForm.fecha_inicio + 'T00:00:00');
        const fechaFin = new Date(periodoForm.fecha_fin + 'T00:00:00');
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // Validar solapamiento de fechas (excluyendo el período actual)
        const tieneSolapamiento = periodos.some(p => {
            if (p.id === periodoAEditar.id) return false; // Excluir el período que se está editando
            const pInicio = new Date(p.fecha_inicio + 'T00:00:00');
            const pFin = new Date(p.fecha_fin + 'T00:00:00');
            return (fechaInicio <= pFin && fechaFin >= pInicio);
        });

        if (tieneSolapamiento) {
            showNotification('Las fechas del período se solapan con otro período existente', 'error');
            return;
        }

        try {
            setLoading(true);
            // Determinar si debe ser activo basado en las fechas
            const estaEnFechaActual = fechaInicio <= now && fechaFin >= now;
            const debeSerActivo = estaEnFechaActual;
            
            await periodoService.actualizarPeriodo({
                id: periodoAEditar.id,
                nombre: periodoForm.nombre.trim(),
                fecha_inicio: periodoForm.fecha_inicio,
                fecha_fin: periodoForm.fecha_fin,
                activo: debeSerActivo
            });

            await loadPeriodos();
            setShowEditDialog(false);
            setPeriodoAEditar(null);
            showNotification('✅ Periodo actualizado correctamente', 'success');
        } catch (error) {
            showNotification(
                `Error al actualizar periodo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCopyDialog = (periodo: PeriodoUI) => {
        setPeriodoACopiar(periodo);
        const siguienteNombre = calcularSiguientePeriodo(periodo.nombre);
        setPeriodoForm({
            nombre: siguienteNombre,
            fecha_inicio: '',
            fecha_fin: ''
        });
        setShowCopyDialog(true);
    };

    const handleCopyPeriodo = async () => {
        if (!periodoACopiar || !periodoACopiar.id) return;

        if (!periodoForm.nombre.trim()) {
            showNotification('El nombre del periodo es obligatorio', 'error');
            return;
        }
        if (!periodoForm.fecha_inicio) {
            showNotification('La fecha de inicio es obligatoria', 'error');
            return;
        }
        if (!periodoForm.fecha_fin) {
            showNotification('La fecha de fin es obligatoria', 'error');
            return;
        }

        if (new Date(periodoForm.fecha_fin) <= new Date(periodoForm.fecha_inicio)) {
            showNotification('La fecha de fin debe ser posterior a la fecha de inicio', 'error');
            return;
        }

        if (periodos.some(p => p.nombre === periodoForm.nombre.trim())) {
            showNotification('Ya existe un periodo con ese nombre', 'error');
            return;
        }

        const fechaInicio = new Date(periodoForm.fecha_inicio + 'T00:00:00');
        const fechaFin = new Date(periodoForm.fecha_fin + 'T00:00:00');
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // Validar solapamiento de fechas
        const tieneSolapamiento = periodos.some(p => {
            const pInicio = new Date(p.fecha_inicio + 'T00:00:00');
            const pFin = new Date(p.fecha_fin + 'T00:00:00');
            return (fechaInicio <= pFin && fechaFin >= pInicio);
        });

        if (tieneSolapamiento) {
            showNotification('Las fechas del período se solapan con otro período existente', 'error');
            return;
        }

        // Validar que si está dentro de la fecha actual, no haya otro activo
        const estaEnFechaActual = fechaInicio <= now && fechaFin >= now;
        if (estaEnFechaActual && periodos.some(p => p.estado === 'Activo')) {
            showNotification('Ya existe un período activo. Solo puede haber uno activo. Modifica las fechas del período existente.', 'error');
            return;
        }

        // Validar que no se cree un período completamente pasado
        if (fechaFin < now) {
            showNotification('No se puede crear un período completamente pasado', 'error');
            return;
        }

        try {
            setLoading(true);
            // Al copiar, NUNCA debe ser activo automáticamente
            // Solo será activo si está en el rango de fechas actual Y no hay otro activo
            // Pero como estamos copiando, asumimos que es futuro (Próximo)
            const debeSerActivo = false; // Siempre false al copiar
            
            const resultado = await periodoService.copiarPeriodo(
                periodoACopiar.id,
                {
                    nombre: periodoForm.nombre.trim(),
                    fecha_inicio: periodoForm.fecha_inicio,
                    fecha_fin: periodoForm.fecha_fin,
                    activo: debeSerActivo
                }
            );

            await loadPeriodos();
            setShowCopyDialog(false);
            setPeriodoACopiar(null);
            showNotification(
                `✅ Periodo creado exitosamente. ${resultado.grupos_actualizados} grupos trasladados`,
                'success'
            );
        } catch (error) {
            showNotification(
                `Error al copiar periodo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDeleteDialog = (periodo: PeriodoUI) => {
        if (periodo.estado === 'Activo') {
            showNotification('No se puede eliminar el periodo activo', 'error');
            return;
        }
        setPeriodoAEliminar(periodo);
        setShowDeleteDialog(true);
    };

    const handleDeletePeriodo = async () => {
        if (!periodoAEliminar || !periodoAEliminar.id) return;

        try {
            setLoading(true);
            await periodoService.eliminarPeriodo(periodoAEliminar.id);

            await loadPeriodos();
            setShowDeleteDialog(false);
            setPeriodoAEliminar(null);
            showNotification('✅ Periodo eliminado exitosamente', 'success');
        } catch (error) {
            showNotification(
                `Error al eliminar periodo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPeriodos();
    }, []);

    return {
        loading,
        periodos,
        periodosOrdenados,
        periodoActivo,
        showCreateDialog, setShowCreateDialog,
        showEditDialog, setShowEditDialog,
        showCopyDialog, setShowCopyDialog,
        showDeleteDialog, setShowDeleteDialog,
        periodoForm, setPeriodoForm,
        periodoACopiar,
        periodoAEditar,
        periodoAEliminar,
        handleOpenCreateDialog,
        handleCreatePeriodo,
        handleOpenEditDialog,
        handleEditPeriodo,
        handleOpenCopyDialog,
        handleCopyPeriodo,
        handleOpenDeleteDialog,
        handleDeletePeriodo,
        notification
    };
}
