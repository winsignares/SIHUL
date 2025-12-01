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
            const periodosUI: PeriodoUI[] = response.periodos.map(p => {
                // Determinar estado basado en fechas y activo
                let estado: 'Activo' | 'Próximo' | 'Finalizado' = 'Finalizado';
                const now = new Date();
                
                // Parsear fechas como locales (no UTC) agregando 'T00:00:00'
                const inicio = new Date(p.fecha_inicio + 'T00:00:00');
                const fin = new Date(p.fecha_fin + 'T00:00:00');

                if (p.activo) {
                    estado = 'Activo';
                } else if (inicio > now) {
                    estado = 'Próximo';
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

        try {
            setLoading(true);
            await periodoService.crearPeriodo({
                nombre: periodoForm.nombre.trim(),
                fecha_inicio: periodoForm.fecha_inicio,
                fecha_fin: periodoForm.fecha_fin,
                activo: false // Por defecto no activo (Próximo)
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

        try {
            setLoading(true);
            await periodoService.actualizarPeriodo({
                id: periodoAEditar.id,
                nombre: periodoForm.nombre.trim(),
                fecha_inicio: periodoForm.fecha_inicio,
                fecha_fin: periodoForm.fecha_fin,
                activo: periodoAEditar.activo
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
        if (!periodoACopiar) return;

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

        try {
            setLoading(true);
            await periodoService.crearPeriodo({
                nombre: periodoForm.nombre.trim(),
                fecha_inicio: periodoForm.fecha_inicio,
                fecha_fin: periodoForm.fecha_fin,
                activo: false
            });

            await loadPeriodos();
            setShowCopyDialog(false);
            setPeriodoACopiar(null);
            showNotification('✅ Periodo copiado exitosamente', 'success');
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
