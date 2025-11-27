import { useState, useEffect } from 'react';
import { db } from '../../services/database';
import { useNotification } from '../../share/notificationBanner';
import type { PeriodoAcademico } from '../../models/models';

export interface PeriodoUI extends PeriodoAcademico {
    tipo: 'Regular' | 'Intersemestral' | 'Verano';
    estado: 'Activo' | 'Próximo' | 'Finalizado';
    programasActivos: number;
}

export function usePeriodosAcademicos() {
    const { notification, showNotification } = useNotification();

    const [periodos, setPeriodos] = useState<PeriodoUI[]>([]);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showCopyDialog, setShowCopyDialog] = useState(false);

    const [periodoForm, setPeriodoForm] = useState({
        nombre: '',
        tipo: 'Regular' as 'Regular' | 'Intersemestral' | 'Verano',
        fechaInicio: '',
        fechaFin: ''
    });

    const [periodoACopiar, setPeriodoACopiar] = useState<PeriodoUI | null>(null);
    const [periodoAEditar, setPeriodoAEditar] = useState<PeriodoUI | null>(null);

    useEffect(() => {
        loadPeriodos();
    }, []);

    const loadPeriodos = () => {
        const periodosDB = db.getPeriodos();

        // Si no hay periodos en la BD, cargar datos iniciales de prueba (como en el componente original)
        if (periodosDB.length === 0) {
            const initialPeriodos: PeriodoUI[] = [
                { id: '1', codigo: '2025-1', nombre: '2025-1', fechaInicio: '2025-01-15', fechaFin: '2025-05-30', tipo: 'Regular', estado: 'Activo', activo: true, programasActivos: 18, fechaCreacion: new Date().toISOString() },
                { id: '3', codigo: '2025-2', nombre: '2025-2', fechaInicio: '2025-08-01', fechaFin: '2025-12-15', tipo: 'Regular', estado: 'Próximo', activo: false, programasActivos: 0, fechaCreacion: new Date().toISOString() },
                { id: '2', codigo: '2024-2', nombre: '2024-2', fechaInicio: '2024-08-01', fechaFin: '2024-12-15', tipo: 'Regular', estado: 'Finalizado', activo: false, programasActivos: 16, fechaCreacion: new Date().toISOString() },
                { id: '5', codigo: '2024-1', nombre: '2024-1', fechaInicio: '2024-01-15', fechaFin: '2024-05-30', tipo: 'Regular', estado: 'Finalizado', activo: false, programasActivos: 15, fechaCreacion: new Date().toISOString() },
                { id: '4', codigo: '2024-Verano', nombre: '2024-Verano', fechaInicio: '2024-06-10', fechaFin: '2024-07-20', tipo: 'Verano', estado: 'Finalizado', activo: false, programasActivos: 8, fechaCreacion: new Date().toISOString() }
            ];

            // Guardar en DB simulada
            initialPeriodos.forEach(p => {
                // Mapear a PeriodoAcademico para guardar en DB (perdiendo campos extra si DB no los soporta, pero localStorage es flexible)
                // En este caso, guardamos el objeto completo en localStorage aunque la interfaz diga lo contrario
                db.createPeriodo(p);
            });
            setPeriodos(initialPeriodos);
        } else {
            // Mapear de DB a UI
            const periodosUI = periodosDB.map(p => {
                // Determinar estado basado en fechas y activo
                let estado: 'Activo' | 'Próximo' | 'Finalizado' = 'Finalizado';
                const now = new Date();
                const inicio = new Date(p.fechaInicio);
                const fin = new Date(p.fechaFin);

                if (p.activo) {
                    estado = 'Activo';
                } else if (inicio > now) {
                    estado = 'Próximo';
                } else {
                    estado = 'Finalizado';
                }

                return {
                    ...p,
                    tipo: (p as any).tipo || 'Regular', // Recuperar tipo si se guardó, o default
                    estado,
                    programasActivos: (p as any).programasActivos || Math.floor(Math.random() * 20) // Mock si no existe
                } as PeriodoUI;
            });
            setPeriodos(periodosUI);
        }
    };

    const periodosOrdenados = [...periodos].sort((a, b) => {
        return new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime();
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
            tipo: 'Regular',
            fechaInicio: '',
            fechaFin: ''
        });
        setShowCreateDialog(true);
    };

    const handleCreatePeriodo = () => {
        if (!periodoForm.nombre.trim()) {
            showNotification('El nombre del periodo es obligatorio', 'error');
            return;
        }
        if (!periodoForm.fechaInicio) {
            showNotification('La fecha de inicio es obligatoria', 'error');
            return;
        }
        if (!periodoForm.fechaFin) {
            showNotification('La fecha de fin es obligatoria', 'error');
            return;
        }

        if (new Date(periodoForm.fechaFin) <= new Date(periodoForm.fechaInicio)) {
            showNotification('La fecha de fin debe ser posterior a la fecha de inicio', 'error');
            return;
        }

        if (periodos.some(p => p.nombre === periodoForm.nombre.trim())) {
            showNotification('Ya existe un periodo con ese nombre', 'error');
            return;
        }

        const nuevoPeriodo: any = {
            nombre: periodoForm.nombre.trim(),
            codigo: periodoForm.nombre.trim(), // Usamos nombre como código por ahora
            tipo: periodoForm.tipo,
            fechaInicio: periodoForm.fechaInicio,
            fechaFin: periodoForm.fechaFin,
            activo: false, // Por defecto no activo (Próximo)
            programasActivos: 0,
            fechaCreacion: new Date().toISOString()
        };

        db.createPeriodo(nuevoPeriodo);
        loadPeriodos(); // Recargar para obtener el ID generado y estado actualizado
        setShowCreateDialog(false);

        showNotification('✅ Periodo creado exitosamente', 'success');
    };

    const handleOpenEditDialog = (periodo: PeriodoUI) => {
        if (periodo.estado !== 'Próximo') {
            showNotification('Solo se pueden editar periodos con estado "Próximo"', 'error');
            return;
        }

        setPeriodoAEditar(periodo);
        setPeriodoForm({
            nombre: periodo.nombre,
            tipo: periodo.tipo,
            fechaInicio: periodo.fechaInicio,
            fechaFin: periodo.fechaFin
        });
        setShowEditDialog(true);
    };

    const handleEditPeriodo = () => {
        if (!periodoAEditar) return;

        if (!periodoForm.nombre.trim()) {
            showNotification('El nombre del periodo es obligatorio', 'error');
            return;
        }
        if (!periodoForm.fechaInicio) {
            showNotification('La fecha de inicio es obligatoria', 'error');
            return;
        }
        if (!periodoForm.fechaFin) {
            showNotification('La fecha de fin es obligatoria', 'error');
            return;
        }

        if (new Date(periodoForm.fechaFin) <= new Date(periodoForm.fechaInicio)) {
            showNotification('La fecha de fin debe ser posterior a la fecha de inicio', 'error');
            return;
        }

        const updates: any = {
            nombre: periodoForm.nombre.trim(),
            codigo: periodoForm.nombre.trim(),
            tipo: periodoForm.tipo,
            fechaInicio: periodoForm.fechaInicio,
            fechaFin: periodoForm.fechaFin
        };

        db.updatePeriodo(periodoAEditar.id, updates);
        loadPeriodos();
        setShowEditDialog(false);
        setPeriodoAEditar(null);

        showNotification('✅ Periodo actualizado correctamente', 'success');
    };

    const handleOpenCopyDialog = (periodo: PeriodoUI) => {
        setPeriodoACopiar(periodo);
        const siguienteNombre = calcularSiguientePeriodo(periodo.nombre);
        setPeriodoForm({
            nombre: siguienteNombre,
            tipo: periodo.tipo,
            fechaInicio: '',
            fechaFin: ''
        });
        setShowCopyDialog(true);
    };

    const handleCopyPeriodo = () => {
        if (!periodoACopiar) return;

        if (!periodoForm.nombre.trim()) {
            showNotification('El nombre del periodo es obligatorio', 'error');
            return;
        }
        if (!periodoForm.fechaInicio) {
            showNotification('La fecha de inicio es obligatoria', 'error');
            return;
        }
        if (!periodoForm.fechaFin) {
            showNotification('La fecha de fin es obligatoria', 'error');
            return;
        }

        if (new Date(periodoForm.fechaFin) <= new Date(periodoForm.fechaInicio)) {
            showNotification('La fecha de fin debe ser posterior a la fecha de inicio', 'error');
            return;
        }

        if (periodos.some(p => p.nombre === periodoForm.nombre.trim())) {
            showNotification('Ya existe un periodo con ese nombre', 'error');
            return;
        }

        const nuevoPeriodo: any = {
            nombre: periodoForm.nombre.trim(),
            codigo: periodoForm.nombre.trim(),
            tipo: periodoForm.tipo,
            fechaInicio: periodoForm.fechaInicio,
            fechaFin: periodoForm.fechaFin,
            activo: false,
            programasActivos: 0,
            fechaCreacion: new Date().toISOString()
        };

        db.createPeriodo(nuevoPeriodo);
        loadPeriodos();
        setShowCopyDialog(false);
        setPeriodoACopiar(null);

        showNotification('✅ Periodo copiado exitosamente', 'success');
    };

    return {
        periodos,
        periodosOrdenados,
        periodoActivo,
        showCreateDialog, setShowCreateDialog,
        showEditDialog, setShowEditDialog,
        showCopyDialog, setShowCopyDialog,
        periodoForm, setPeriodoForm,
        periodoACopiar,
        periodoAEditar,
        handleOpenCreateDialog,
        handleCreatePeriodo,
        handleOpenEditDialog,
        handleEditPeriodo,
        handleOpenCopyDialog,
        handleCopyPeriodo,
        notification
    };
}
